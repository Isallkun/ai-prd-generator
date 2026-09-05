'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Requiring the module must NOT start the HTTP listener.
const serverModule = require('../server.js');

const {
  parseNineRouterContent,
  callNineRouterApi,
  getNineRouterTimeoutMs,
  DEFAULT_NINEROUTER_TIMEOUT_MS,
  DEFAULT_PRD_MODEL,
  DEFAULT_TASK_MODEL,
  server
} = serverModule;

function chatJson(content, extra = {}) {
  return JSON.stringify({
    id: 'chatcmpl-1',
    choices: [{ index: 0, message: { role: 'assistant', content, ...extra } }]
  });
}

function sseChunk(delta, extra = {}) {
  return `data: ${JSON.stringify({
    choices: [{ index: 0, delta: { content: delta, ...extra } }]
  })}`;
}

// Boots a throwaway upstream that answers /v1/chat/completions with `body`.
// Returns { base, headers, close } — headers captured from the last request.
function startStubUpstream(body, statusHeaders = { 'Content-Type': 'application/json' }) {
  const captured = { headers: null, body: null };
  const stub = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      captured.headers = req.headers;
      captured.body = raw;
      res.writeHead(200, statusHeaders);
      res.end(body);
    });
  });
  return new Promise((resolve) => {
    stub.listen(0, '127.0.0.1', () => {
      const { port } = stub.address();
      resolve({
        base: `http://127.0.0.1:${port}/v1`,
        captured,
        close: () => new Promise((done) => stub.close(done))
      });
    });
  });
}

test('module is requirable without listening', () => {
  assert.equal(typeof server.listen, 'function');
  assert.equal(server.listening, false);
});

test('exports safe Hermes default models', () => {
  assert.equal(DEFAULT_PRD_MODEL, 'cx/gpt-5.6-terra');
  assert.equal(DEFAULT_TASK_MODEL, 'cx/gpt-5.4-mini');
});

test('parses a plain OpenAI-compatible JSON response', () => {
  const raw = chatJson('{"ok":true}');
  assert.equal(parseNineRouterContent(raw), '{"ok":true}');
});

test('parses JSON concatenated with a trailing data: [DONE] terminator', () => {
  const raw = `${chatJson('{"ok":true}')}\n\ndata: [DONE]\n\n`;
  assert.equal(parseNineRouterContent(raw), '{"ok":true}');
});

test('parses JSON concatenated with an inline data: [DONE] on the same line', () => {
  // Given Hermes emits the terminator with no separating newline.
  const raw = `${chatJson('{"ok":true}')}data: [DONE]`;
  assert.equal(parseNineRouterContent(raw), '{"ok":true}');
});

test('parses JSON with an inline data: [DONE] plus trailing whitespace', () => {
  const raw = `${chatJson('{"ok":true}')}  data: [DONE]  \n\n`;
  assert.equal(parseNineRouterContent(raw), '{"ok":true}');
});

test('does not strip data: [DONE] that lives inside the JSON payload text', () => {
  // Given the terminator appears as assistant content, not as a real terminator.
  const text = 'trailer looks like data: [DONE]';
  const raw = chatJson(text);
  assert.equal(parseNineRouterContent(raw), text);
});

test('parses a true SSE stream and concatenates deltas', () => {
  const raw = [sseChunk('{"ok"'), sseChunk(':true}'), 'data: [DONE]', ''].join('\n\n');
  assert.equal(parseNineRouterContent(raw), '{"ok":true}');
});

test('does not treat JSON whose content mentions data: as SSE', () => {
  // Given a normal JSON body whose assistant text literally contains "data:" lines.
  const text = 'Log excerpt:\ndata: not-a-stream\ndata: [DONE]\nend';
  const raw = chatJson(text);
  // Then the whole JSON body wins and the text survives verbatim.
  assert.equal(parseNineRouterContent(raw), text);
});

test('ignores reasoning_content and returns only content', () => {
  const raw = chatJson('{"ok":true}', { reasoning_content: 'SHOULD NOT LEAK' });
  const parsed = parseNineRouterContent(raw);
  assert.equal(parsed, '{"ok":true}');
  assert.ok(!parsed.includes('SHOULD NOT LEAK'));
});

test('ignores reasoning_content deltas in an SSE stream', () => {
  const raw = [
    `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: 'SHOULD NOT LEAK' } }] })}`,
    sseChunk('{"ok":true}'),
    'data: [DONE]'
  ].join('\n\n');
  assert.equal(parseNineRouterContent(raw), '{"ok":true}');
});

test('returns empty string for junk that merely mentions data:', () => {
  assert.equal(parseNineRouterContent('upstream exploded near data: whatever'), '');
  assert.equal(parseNineRouterContent(''), '');
});

test('timeout defaults to 240000 and honors NINEROUTER_TIMEOUT_MS', (t) => {
  assert.equal(DEFAULT_NINEROUTER_TIMEOUT_MS, 240000);

  const original = process.env.NINEROUTER_TIMEOUT_MS;
  t.after(() => {
    if (original === undefined) delete process.env.NINEROUTER_TIMEOUT_MS;
    else process.env.NINEROUTER_TIMEOUT_MS = original;
  });

  delete process.env.NINEROUTER_TIMEOUT_MS;
  assert.equal(getNineRouterTimeoutMs(), 240000);

  process.env.NINEROUTER_TIMEOUT_MS = '5000';
  assert.equal(getNineRouterTimeoutMs(), 5000);

  process.env.NINEROUTER_TIMEOUT_MS = 'not-a-number';
  assert.equal(getNineRouterTimeoutMs(), 240000);
});

test('callNineRouterApi resolves JSON for a plain JSON upstream response', async () => {
  const upstream = await startStubUpstream(chatJson('```json\n{"ok":true}\n```'));
  try {
    const result = await callNineRouterApi(upstream.base, 'real-key', 'cx/gpt-5.4-mini', 'sys', 'user');
    assert.deepEqual(result, { ok: true });
    assert.equal(upstream.captured.headers.authorization, 'Bearer real-key');
    assert.equal(JSON.parse(upstream.captured.body).model, 'cx/gpt-5.4-mini');
  } finally {
    await upstream.close();
  }
});

test('callNineRouterApi resolves JSON followed by data: [DONE] (local Hermes shape)', async () => {
  const upstream = await startStubUpstream(`${chatJson('{"ok":true}')}\ndata: [DONE]\n`);
  try {
    const result = await callNineRouterApi(upstream.base, '', '', 'sys', 'user');
    assert.deepEqual(result, { ok: true });
  } finally {
    await upstream.close();
  }
});

test('callNineRouterApi resolves a true SSE upstream response', async () => {
  const body = [sseChunk('{"ok"'), sseChunk(':true}'), 'data: [DONE]', ''].join('\n\n');
  const upstream = await startStubUpstream(body, { 'Content-Type': 'text/event-stream' });
  try {
    const result = await callNineRouterApi(upstream.base, 'real-key', 'cx/gpt-5.6-terra', 'sys', 'user');
    assert.deepEqual(result, { ok: true });
  } finally {
    await upstream.close();
  }
});

test('callNineRouterApi sends no fake sk-9router key when none is configured', async () => {
  const upstream = await startStubUpstream(chatJson('{"ok":true}'));
  try {
    await callNineRouterApi(upstream.base, undefined, 'cx/gpt-5.4-mini', 'sys', 'user');
    const auth = upstream.captured.headers.authorization;
    assert.equal(auth, undefined, 'no Authorization header should be sent without a key');
  } finally {
    await upstream.close();
  }
});

test('callNineRouterApi defaults the model to the PRD default', async () => {
  const upstream = await startStubUpstream(chatJson('{"ok":true}'));
  try {
    await callNineRouterApi(upstream.base, 'real-key', '', 'sys', 'user');
    assert.equal(JSON.parse(upstream.captured.body).model, DEFAULT_PRD_MODEL);
  } finally {
    await upstream.close();
  }
});

test('callNineRouterApi rejects when the upstream returns no usable content', async () => {
  const upstream = await startStubUpstream('upstream exploded near data: whatever');
  try {
    await assert.rejects(
      () => callNineRouterApi(upstream.base, 'real-key', 'cx/gpt-5.4-mini', 'sys', 'user'),
      /empty or invalid/i
    );
  } finally {
    await upstream.close();
  }
});
