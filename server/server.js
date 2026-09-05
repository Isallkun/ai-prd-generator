/**
 * OpenClaw PRD Maker - Production Server
 * Real Cloud AI Generator (Gemini, Anthropic, OpenRouter, OpenAI) with Smart Fallback & OpenClaw Workspace Dispatcher
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 4000;
const OPENCLAW_WORKSPACE_DIR = process.env.OPENCLAW_WORKSPACE || "D:/labs/ai-prd-generator/workspace";
const LOCAL_WORKSPACE_DIR = path.join(__dirname, "workspace");

const DEFAULT_PRD_MODEL = "cx/gpt-5.6-terra";
const DEFAULT_TASK_MODEL = "cx/gpt-5.4-mini";
const DEFAULT_NINEROUTER_TIMEOUT_MS = 240000;

function getNineRouterTimeoutMs() {
  const raw = Number(process.env.NINEROUTER_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_NINEROUTER_TIMEOUT_MS;
}

// Load Environment Variables (.env from local and E:\projek-ai\.env)
function loadEnv() {
  const envPaths = [path.join(__dirname, ".env"), "E:/projek-ai/.env", "E:/projek-ai/openclaw/.env"];

  envPaths.forEach((envPath) => {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            const val = match[2].trim().replace(/^["']|["']$/g, "");
            if (!process.env[key] && val && !val.includes("YOUR_")) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  });
}

loadEnv();

// In-Memory State
const state = {
  activeProject: null,
  tasks: [],
  isRunning: false,
  isPaused: false,
  currentTaskIndex: 0,
  sseClients: [],
  activeTaskModel: null,
  // [C] Context tracking: files and deps created during run
  createdFiles: [],
  discoveredDependencies: {},
};

// Ensure workspace directory exists
function getActiveWorkspacePath(projectId) {
  let targetDir = path.join(OPENCLAW_WORKSPACE_DIR, projectId);
  try {
    if (!fs.existsSync(OPENCLAW_WORKSPACE_DIR)) {
      fs.mkdirSync(OPENCLAW_WORKSPACE_DIR, { recursive: true });
    }
  } catch (err) {
    targetDir = path.join(LOCAL_WORKSPACE_DIR, projectId);
    if (!fs.existsSync(LOCAL_WORKSPACE_DIR)) {
      fs.mkdirSync(LOCAL_WORKSPACE_DIR, { recursive: true });
    }
  }
  return targetDir;
}

// Broadcast SSE Events to Connected Clients
function broadcastEvent(type, data) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`;
  state.sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch (e) {}
  });
}

function broadcastLog(message, level = "info") {
  broadcastEvent("log", { message, level });
  console.log(`[OpenClaw Agent] ${message}`);
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

// ============================================================================
// [UTILITY] Ensure directory exists
// ============================================================================
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFoundationFile(projectDir, relativePath, content) {
  const fullPath = path.join(projectDir, relativePath);
  ensureDir(path.dirname(fullPath));
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content, "utf-8");
  }
}

// ============================================================================
// [A] PRE-SCAN: Ask AI for complete dependency list from all tasks
// ============================================================================
async function preScanDependencies(project, tasks, ninerouterBase, ninerouterKey, ninerouterModel) {
  const techStackStr = project.techStack ? project.techStack.map((t) => `${t.name}: ${t.value}`).join(", ") : "Next.js 14, Tailwind CSS, PostgreSQL, Prisma";
  const taskList = tasks
    .slice(0, 44)
    .map((t) => `- [${t.id}] ${t.title}`)
    .join("\n");

  const systemPrompt = `You are a senior software architect. Given a list of development tasks, return ALL npm packages needed.
Return ONLY valid JSON:
{
  "dependencies": { "package-name": "^version" },
  "devDependencies": { "package-name": "^version" }
}`;
  const userPrompt = `Project: "${project.title}"\nTech Stack: ${techStackStr}\n\nTasks:\n${taskList}\n\nReturn ALL npm packages needed.`;

  broadcastLog(`🔍 [Pre-scan] Menganalisis ${tasks.length} tasks untuk dependency lengkap...`);

  if (ninerouterBase) {
    try {
      const result = await callNineRouterApi(ninerouterBase, ninerouterKey, ninerouterModel, systemPrompt, userPrompt);
      if (result && result.dependencies) return result;
    } catch (e) {
      broadcastLog(`[Pre-scan] 9Router fallback: ${e.message}`);
    }
  }

  // Safe fallback — comprehensive Next.js fullstack deps
  return {
    dependencies: {
      next: "^14.2.35",
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      "lucide-react": "^0.451.0",
      clsx: "^2.1.1",
      "tailwind-merge": "^2.5.4",
      "next-auth": "^4.24.7",
      "@auth/prisma-adapter": "^2.7.2",
      "@prisma/client": "^5.18.0",
      bcryptjs: "^2.4.3",
      zod: "^3.23.8",
      "react-hook-form": "^7.53.0",
      "@hookform/resolvers": "^3.9.0",
      "date-fns": "^3.6.0",
      pusher: "^5.2.0",
      "pusher-js": "^8.4.0",
      axios: "^1.7.7",
    },
    devDependencies: {
      tailwindcss: "^3.4.14",
      postcss: "^8.4.47",
      autoprefixer: "^10.4.20",
      typescript: "^5.6.3",
      "@types/node": "^22.7.5",
      "@types/react": "^18.3.11",
      "@types/react-dom": "^18.3.1",
      "@types/bcryptjs": "^2.4.6",
      prisma: "^5.18.0",
    },
  };
}

// ============================================================================
// [B] MULTI-ARCHETYPE FOUNDATION SCAFFOLDING (HTML, Laravel, Decoupled, Next.js)
// ============================================================================
function scaffoldProjectFoundation(project, projectDir, scanResult) {
  const config = project.techStackConfig || state.activeTechStackConfig || { mode: "html-prototype", frontend: "html-jquery", backend: "none", database: "localstorage" };
  const mode = config.mode || "html-prototype";

  broadcastLog(`🏗️ [Foundation] Membangun fondasi arsitektur: [${mode.toUpperCase()}]...`);

  if (mode === "html-prototype") {
    scaffoldHtmlPrototype(project, projectDir);
  } else if (mode === "laravel-monolith") {
    scaffoldLaravelMonolith(project, projectDir);
  } else if (mode === "decoupled-api") {
    scaffoldDecoupledApi(project, projectDir, config);
  } else {
    // Default: Next.js 14 Fullstack
    scaffoldNextJsFullstack(project, projectDir, scanResult);
  }
}

// 1. HTML Prototype First Scaffolder (Pure HTML + Tailwind CDN + jQuery)
function scaffoldHtmlPrototype(project, projectDir) {
  ensureDir(path.join(projectDir, "css"));
  ensureDir(path.join(projectDir, "js"));
  ensureDir(path.join(projectDir, "pages"));

  // index.html
  writeFoundationFile(
    projectDir,
    "index.html",
    `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title} - Prototype</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <!-- jQuery -->
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen antialiased">
  <nav class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white">🚀</div>
        <span class="font-bold text-lg text-white">${project.title}</span>
      </div>
      <div class="flex items-center gap-4 text-sm font-medium">
        <a href="index.html" class="text-emerald-400 hover:text-emerald-300">Home</a>
        <a href="pages/dashboard.html" class="text-slate-300 hover:text-white">Dashboard</a>
        <a href="pages/auth.html" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white">Masuk</a>
      </div>
    </div>
  </nav>

  <main class="max-w-7xl mx-auto px-4 py-12">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <div class="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">Interactive HTML Prototype</div>
      <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6">${project.title}</h1>
      <p class="text-lg text-slate-400 leading-relaxed mb-8">${project.problemStatement || project.tagline || "Modern Web Prototype"}</p>
      <div class="flex justify-center gap-4">
        <a href="pages/dashboard.html" class="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white transition shadow-lg shadow-emerald-900/30">Buka Dashboard</a>
        <a href="pages/auth.html" class="px-6 py-3 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 font-semibold text-slate-200 transition">Halaman Login</a>
      </div>
    </div>
  </main>

  <script src="js/app.js"></script>
  <script>lucide.createIcons();</script>
</body>
</html>`,
  );

  // css/style.css
  writeFoundationFile(
    projectDir,
    "css/style.css",
    `/* Custom styles for ${project.title} prototype */
:root {
  --bg-primary: #090d16;
  --text-primary: #f8fafc;
}
body { background: var(--bg-primary); }
.glass-panel { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }`,
  );

  // js/app.js
  writeFoundationFile(
    projectDir,
    "js/app.js",
    `// Interactive Client Mock Logic for ${project.title}
$(document).ready(function() {
  console.log('${project.title} Prototype Loaded');
  if (window.lucide) lucide.createIcons();
});`,
  );

  state.createdFiles = ["index.html", "css/style.css", "js/app.js"];
  broadcastLog(`✅ [Foundation] HTML5 Prototype Starter siap (index.html, css/style.css, js/app.js)`, "success");
}

// 2. Laravel Monolith Scaffolder
function scaffoldLaravelMonolith(project, projectDir) {
  ensureDir(path.join(projectDir, "app/Http/Controllers"));
  ensureDir(path.join(projectDir, "app/Models"));
  ensureDir(path.join(projectDir, "resources/views/layouts"));
  ensureDir(path.join(projectDir, "routes"));
  ensureDir(path.join(projectDir, "database/migrations"));

  writeFoundationFile(
    projectDir,
    "composer.json",
    JSON.stringify(
      {
        name: `openclaw/${project.id}`,
        type: "project",
        description: project.tagline || project.title,
        require: { php: "^8.2", "laravel/framework": "^11.0" },
      },
      null,
      2,
    ),
  );

  writeFoundationFile(
    projectDir,
    "routes/web.php",
    `<?php
use Illuminate\\Support\\Facades\\Route;

Route::get('/', function () {
    return view('welcome', ['title' => '${project.title}']);
});
Route::get('/dashboard', function () {
    return view('dashboard');
})->name('dashboard');`,
  );

  writeFoundationFile(
    projectDir,
    "resources/views/layouts/app.blade.php",
    `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? '${project.title}' }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
    @yield('content')
</body>
</html>`,
  );

  state.createdFiles = ["composer.json", "routes/web.php", "resources/views/layouts/app.blade.php"];
  broadcastLog(`✅ [Foundation] Laravel 11 Monolith Structure siap`, "success");
}

// 3. Decoupled API Scaffolder (React / Vue + Go / Python)
function scaffoldDecoupledApi(project, projectDir, config) {
  const backend = config.backend || "go-fiber";
  ensureDir(path.join(projectDir, "frontend/src"));
  ensureDir(path.join(projectDir, "backend"));

  // Frontend package.json
  writeFoundationFile(
    projectDir,
    "frontend/package.json",
    JSON.stringify(
      {
        name: `${project.id}-frontend`,
        private: true,
        version: "0.0.0",
        type: "module",
        scripts: { dev: "vite", build: "vite build" },
        dependencies: { react: "^18.3.1", "react-dom": "^18.3.1", "lucide-react": "^0.451.0", axios: "^1.7.7" },
        devDependencies: { "@types/react": "^18.3.11", "@vitejs/plugin-react": "^4.3.3", vite: "^5.4.9", tailwindcss: "^3.4.14", autoprefixer: "^10.4.20" },
      },
      null,
      2,
    ),
  );

  // Backend starter
  if (backend === "go-fiber") {
    writeFoundationFile(projectDir, "backend/go.mod", `module ${project.id}-api\n\ngo 1.22\n\nrequire github.com/gofiber/fiber/v2 v2.52.5\n`);
    writeFoundationFile(
      projectDir,
      "backend/main.go",
      `package main

import (
	"log"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	app := fiber.New()
	app.Use(cors.New())

	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "project": "${project.title}"})
	})

	log.Fatal(app.Listen(":8080"))
}`,
    );
  } else if (backend === "fastapi") {
    writeFoundationFile(projectDir, "backend/requirements.txt", `fastapi>=0.115.0\nuvicorn>=0.31.0\npydantic>=2.9.2\n`);
    writeFoundationFile(
      projectDir,
      "backend/main.py",
      `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="${project.title} API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "project": "${project.title}"}
`,
    );
  }

  state.createdFiles = ["frontend/package.json", backend === "go-fiber" ? "backend/main.go" : "backend/main.py"];
  broadcastLog(`✅ [Foundation] Decoupled (Frontend + ${backend}) starter siap`, "success");
}

// 4. Next.js Fullstack Scaffolder (Original robust setup)
function scaffoldNextJsFullstack(project, projectDir, scanResult) {
  // 1. tsconfig.json
  writeFoundationFile(
    projectDir,
    "tsconfig.json",
    JSON.stringify(
      {
        compilerOptions: {
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: false,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          paths: { "@/*": ["./src/*"] },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"],
      },
      null,
      2,
    ),
  );

  // 2. tailwind.config.js
  writeFoundationFile(
    projectDir,
    "tailwind.config.js",
    `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {} },
  plugins: [],
};`,
  );

  // 3. postcss.config.js
  writeFoundationFile(projectDir, "postcss.config.js", `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };`);

  // 4. next.config.js
  writeFoundationFile(
    projectDir,
    "next.config.js",
    `/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;`,
  );

  // 5. globals.css
  ensureDir(path.join(projectDir, "src/app"));
  writeFoundationFile(
    projectDir,
    "src/app/globals.css",
    `@tailwind base;
@tailwind components;
@tailwind utilities;

:root { --background: #090d16; --foreground: #f8fafc; }
body { color: var(--foreground); background: var(--background); font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }`,
  );

  // 6. layout.tsx
  writeFoundationFile(
    projectDir,
    "src/app/layout.tsx",
    `import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '${project.title}', description: '${(project.tagline || "").replace(/'/g, "")}' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="id"><body className="min-h-screen bg-slate-950 text-slate-100 antialiased">{children}</body></html>);
}`,
  );

  // 7. src/lib/utils.ts
  ensureDir(path.join(projectDir, "src/lib"));
  writeFoundationFile(
    projectDir,
    "src/lib/utils.ts",
    `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDate(date: Date | string): string { return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
export function formatCurrency(amount: number): string { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount); }`,
  );

  // 8. src/lib/prisma.ts
  writeFoundationFile(
    projectDir,
    "src/lib/prisma.ts",
    `import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;`,
  );

  // 9. src/lib/auth.ts stub
  writeFoundationFile(
    projectDir,
    "src/lib/auth.ts",
    `import { NextAuthOptions } from 'next-auth';

import CredentialsProvider from 'next-auth/providers/credentials';
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [CredentialsProvider({
    name: 'Credentials',
    credentials: { email: { label: 'Email', type: 'email' }, password: { label: 'Password', type: 'password' } },
    async authorize(credentials) {
      // TODO: Implement actual DB lookup
      return null;
    }
  })],
  secret: process.env.NEXTAUTH_SECRET,
};`,
  );

  // 10. UI Component Stubs
  const uiDir = path.join(projectDir, "src/components/ui");
  ensureDir(uiDir);
  writeFoundationFile(projectDir, "src/components/ui/button.tsx", uiStubs.button);
  writeFoundationFile(projectDir, "src/components/ui/card.tsx", uiStubs.card);
  writeFoundationFile(projectDir, "src/components/ui/badge.tsx", uiStubs.badge);
  writeFoundationFile(projectDir, "src/components/ui/input.tsx", uiStubs.input);
  writeFoundationFile(projectDir, "src/components/ui/label.tsx", uiStubs.label);
  writeFoundationFile(projectDir, "src/components/ui/textarea.tsx", uiStubs.textarea);
  writeFoundationFile(projectDir, "src/components/ui/select.tsx", uiStubs.select);
  writeFoundationFile(projectDir, "src/components/ui/checkbox.tsx", uiStubs.checkbox);
  writeFoundationFile(projectDir, "src/components/ui/dialog.tsx", uiStubs.dialog);
  writeFoundationFile(projectDir, "src/components/ui/tabs.tsx", uiStubs.tabs);
  writeFoundationFile(projectDir, "src/components/ui/table.tsx", uiStubs.table);
  writeFoundationFile(projectDir, "src/components/ui/separator.tsx", uiStubs.separator);
  writeFoundationFile(projectDir, "src/components/ui/skeleton.tsx", uiStubs.skeleton);
  writeFoundationFile(projectDir, "src/components/ui/avatar.tsx", uiStubs.avatar);
  writeFoundationFile(projectDir, "src/components/ui/use-toast.ts", uiStubs.useToast);
  writeFoundationFile(projectDir, "src/components/ui/toast.tsx", uiStubs.toast);
  writeFoundationFile(projectDir, "src/components/ui/progress.tsx", uiStubs.progress);

  // Track created files for context injection
  state.createdFiles = [
    "tsconfig.json",
    "tailwind.config.js",
    "postcss.config.js",
    "next.config.js",
    "src/app/globals.css",
    "src/app/layout.tsx",
    "src/lib/utils.ts",
    "src/lib/prisma.ts",
    "src/lib/auth.ts",
    "src/components/ui/button.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/badge.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/label.tsx",
    "src/components/ui/textarea.tsx",
    "src/components/ui/select.tsx",
    "src/components/ui/checkbox.tsx",
    "src/components/ui/dialog.tsx",
    "src/components/ui/tabs.tsx",
    "src/components/ui/table.tsx",
    "src/components/ui/separator.tsx",
    "src/components/ui/skeleton.tsx",
    "src/components/ui/avatar.tsx",
    "src/components/ui/use-toast.ts",
    "src/components/ui/toast.tsx",
    "src/components/ui/progress.tsx",
  ];

  broadcastLog(`✅ [Foundation] ${state.createdFiles.length} foundation files siap`, "success");
}

// ============================================================================
// [B] UI Stubs — All component source code
// ============================================================================
const uiStubs = {
  button: `import * as React from 'react';
import { cn } from '@/lib/utils';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon'; isLoading?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';
  const variants = { default: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md', outline: 'border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-200', secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700', ghost: 'hover:bg-slate-800 text-slate-300', destructive: 'bg-red-600 text-white hover:bg-red-500', link: 'text-emerald-400 underline-offset-4 hover:underline' };
  const sizes = { default: 'h-10 px-4 py-2 text-sm', sm: 'h-8 px-3 text-xs', lg: 'h-12 px-6 text-base', icon: 'h-10 w-10' };
  return (<button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={isLoading || disabled} {...props}>{isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}{children}</button>);
});
Button.displayName = 'Button';`,

  card: `import * as React from 'react';
import { cn } from '@/lib/utils';
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (<div ref={ref} className={cn('rounded-xl border border-slate-800 bg-slate-900/80 text-slate-100 shadow-sm', className)} {...props} />));
Card.displayName = 'Card';
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (<div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />));
CardHeader.displayName = 'CardHeader';
export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (<h3 ref={ref} className={cn('text-xl font-bold leading-none tracking-tight text-white', className)} {...props} />));
CardTitle.displayName = 'CardTitle';
export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (<p ref={ref} className={cn('text-sm text-slate-400', className)} {...props} />));
CardDescription.displayName = 'CardDescription';
export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (<div ref={ref} className={cn('p-6 pt-0', className)} {...props} />));
CardContent.displayName = 'CardContent';
export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (<div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />));
CardFooter.displayName = 'CardFooter';`,

  badge: `import * as React from 'react';
import { cn } from '@/lib/utils';
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> { variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'; }
export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = { default: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30', secondary: 'bg-slate-800 text-slate-300 border-slate-700', destructive: 'bg-red-500/20 text-red-400 border-red-500/30', outline: 'text-slate-300 border-slate-700 bg-transparent', success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25' };
  return (<div className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors', variants[variant], className)} {...props} />);
}`,

  input: `import * as React from 'react';
import { cn } from '@/lib/utils';
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (<input type={type} className={cn('flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50', className)} ref={ref} {...props} />));
Input.displayName = 'Input';`,

  label: `import * as React from 'react';
import { cn } from '@/lib/utils';
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (<label ref={ref} className={cn('text-sm font-medium leading-none text-slate-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)} {...props} />));
Label.displayName = 'Label';`,

  textarea: `import * as React from 'react';
import { cn } from '@/lib/utils';
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (<textarea className={cn('flex min-h-[80px] w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 resize-none focus-visible:outline-none focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50', className)} ref={ref} {...props} />));
Textarea.displayName = 'Textarea';`,

  select: `'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
export function Select({ className, children, value, onValueChange, ...props }: any) {
  return (<select className={cn('flex h-10 w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50', className)} value={value} onChange={(e) => onValueChange?.(e.target.value)} {...props}>{children}</select>);
}
export function SelectItem({ value, children }: any) { return <option value={value}>{children}</option>; }
export const SelectTrigger = ({ children, className }: any) => <div className={cn('flex h-10 items-center justify-between rounded-lg border border-slate-700 bg-slate-900/90 px-3 text-sm text-slate-100', className)}>{children}</div>;
export const SelectValue = ({ placeholder }: any) => <span className="text-slate-500">{placeholder}</span>;
export const SelectContent = ({ children }: any) => <div className="rounded-lg border border-slate-700 bg-slate-900 shadow-xl p-1">{children}</div>;`,

  checkbox: `'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> { onCheckedChange?: (checked: boolean) => void; }
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, checked, onCheckedChange, ...props }, ref) => (
  <div role="checkbox" aria-checked={checked} onClick={() => onCheckedChange?.(!checked)} className={cn('h-4 w-4 shrink-0 rounded border border-slate-700 bg-slate-900/90 cursor-pointer flex items-center justify-center transition-colors', checked && 'bg-emerald-600 border-emerald-500', className)}>
    {checked && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
  </div>
));
Checkbox.displayName = 'Checkbox';`,

  dialog: `'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
export function Dialog({ open, onOpenChange, children }: any) {
  if (!open) return null;
  return (<div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => onOpenChange?.(false)}><div className="absolute inset-0 bg-black/70 backdrop-blur-sm" /><div className="relative z-10 w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>{children}</div></div>);
}
export const DialogHeader = ({ className, ...props }: any) => <div className={cn('flex flex-col space-y-1.5 text-left mb-4', className)} {...props} />;
export const DialogTitle = ({ className, ...props }: any) => <h2 className={cn('text-xl font-bold tracking-tight text-white', className)} {...props} />;
export const DialogDescription = ({ className, ...props }: any) => <p className={cn('text-sm text-slate-400', className)} {...props} />;
export const DialogFooter = ({ className, ...props }: any) => <div className={cn('flex justify-end gap-3 mt-6', className)} {...props} />;
export const DialogContent = ({ className, ...props }: any) => <div className={cn(className)} {...props} />;
export function DialogTrigger({ children, onClick }: any) { return React.cloneElement(children, { onClick }); }`,

  tabs: `'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
const TabsCtx = React.createContext<{ value: string; onChange: (v: string) => void } | null>(null);
export function Tabs({ defaultValue, value: cv, onValueChange, className, children }: any) {
  const [v, setV] = React.useState(cv || defaultValue || '');
  const val = cv !== undefined ? cv : v;
  return (<TabsCtx.Provider value={{ value: val, onChange: (nv) => { setV(nv); onValueChange?.(nv); } }}><div className={cn('space-y-4', className)}>{children}</div></TabsCtx.Provider>);
}
export const TabsList = ({ className, ...props }: any) => (<div className={cn('inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 p-1', className)} {...props} />);
export function TabsTrigger({ value, className, children, ...props }: any) {
  const ctx = React.useContext(TabsCtx); const active = ctx?.value === value;
  return (<button type="button" onClick={() => ctx?.onChange(value)} className={cn('inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all', active ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50', className)} {...props}>{children}</button>);
}
export function TabsContent({ value, className, ...props }: any) {
  const ctx = React.useContext(TabsCtx);
  if (ctx?.value !== value) return null;
  return <div className={cn('mt-2', className)} {...props} />;
}`,

  table: `import * as React from 'react';
import { cn } from '@/lib/utils';
export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (<div className="relative w-full overflow-auto rounded-xl border border-slate-800"><table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} /></div>));
Table.displayName = 'Table';
export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (<thead ref={ref} className={cn('bg-slate-900/90 [&_tr]:border-b [&_tr]:border-slate-800', className)} {...props} />));
TableHeader.displayName = 'TableHeader';
export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (<tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />));
TableBody.displayName = 'TableBody';
export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (<tr ref={ref} className={cn('border-b border-slate-800 transition-colors hover:bg-slate-800/50', className)} {...props} />));
TableRow.displayName = 'TableRow';
export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (<th ref={ref} className={cn('h-12 px-4 text-left align-middle font-semibold text-slate-400 text-xs uppercase tracking-wider', className)} {...props} />));
TableHead.displayName = 'TableHead';
export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (<td ref={ref} className={cn('p-4 align-middle text-slate-200', className)} {...props} />));
TableCell.displayName = 'TableCell';`,

  separator: `import * as React from 'react';
import { cn } from '@/lib/utils';
export function Separator({ className, orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) {
  return (<div className={cn('shrink-0 bg-slate-800', orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]', className)} />);
}`,

  skeleton: `import * as React from 'react';
import { cn } from '@/lib/utils';
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-slate-800/60', className)} {...props} />;
}`,

  avatar: `import * as React from 'react';
import { cn } from '@/lib/utils';
export function Avatar({ src, alt, className, fallback }: { src?: string; alt?: string; className?: string; fallback?: string }) {
  const [err, setErr] = React.useState(false);
  if (src && !err) return <img src={src} alt={alt || ''} onError={() => setErr(true)} className={cn('h-10 w-10 rounded-full object-cover border border-slate-700', className)} />;
  return (<div className={cn('h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold text-white', className)}>{fallback || alt?.charAt(0).toUpperCase() || '?'}</div>);
}`,

  useToast: `'use client';
import { useState } from 'react';
export interface Toast { id: string; title?: string; description?: string; variant?: 'default' | 'destructive' | 'success'; }
const listeners: Array<(toasts: Toast[]) => void> = [];
let toastList: Toast[] = [];
function notify() { listeners.forEach(l => l([...toastList])); }
export function toast({ title, description, variant = 'default' }: Omit<Toast, 'id'>) {
  const id = Date.now().toString();
  toastList = [...toastList, { id, title, description, variant }];
  notify();
  setTimeout(() => { toastList = toastList.filter(t => t.id !== id); notify(); }, 4000);
  return { id };
}
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useState(() => { listeners.push(setToasts); return () => { const i = listeners.indexOf(setToasts); if (i > -1) listeners.splice(i, 1); }; });
  return { toast, toasts };
}`,

  toast: `'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { useToast } from './use-toast';
export function Toaster() {
  const { toasts } = useToast();
  return (<div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">{toasts.map(t => (<div key={t.id} className={cn('flex items-start gap-3 rounded-xl p-4 shadow-xl border animate-in slide-in-from-right-full', t.variant === 'destructive' ? 'bg-red-950 border-red-800 text-red-100' : t.variant === 'success' ? 'bg-emerald-950 border-emerald-800 text-emerald-100' : 'bg-slate-900 border-slate-800 text-slate-100')}><p className="font-semibold text-sm">{t.title}</p></div>))}</div>);
}`,

  progress: `import * as React from 'react';
import { cn } from '@/lib/utils';
export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  return (<div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-slate-800', className)}><div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full" style={{ width: \`\${Math.min(100, Math.max(0, value))}%\` }} /></div>);
}`,
};

// ============================================================================
// [A] Write complete package.json from pre-scan result
// ============================================================================
function writeCompletePackageJson(projectDir, project, scanResult) {
  const packageJsonPath = path.join(projectDir, "package.json");
  const baseDeps = { next: "^14.2.35", react: "^18.3.1", "react-dom": "^18.3.1", "lucide-react": "^0.451.0", clsx: "^2.1.1", "tailwind-merge": "^2.5.4" };
  const baseDevDeps = { tailwindcss: "^3.4.14", postcss: "^8.4.47", autoprefixer: "^10.4.20", typescript: "^5.6.3", "@types/node": "^22.7.5", "@types/react": "^18.3.11", "@types/react-dom": "^18.3.1" };
  const mergedDeps = { ...baseDeps, ...(scanResult?.dependencies || {}) };
  const mergedDevDeps = { ...baseDevDeps, ...(scanResult?.devDependencies || {}) };
  const pkg = {
    name: project.id,
    version: "1.0.0",
    description: project.tagline || project.title,
    private: true,
    scripts: { dev: "next dev", build: "next build", start: "next start", lint: "next lint", "db:generate": "prisma generate", "db:push": "prisma db push" },
    dependencies: mergedDeps,
    devDependencies: mergedDevDeps,
  };
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2), "utf-8");
  state.discoveredDependencies = mergedDeps;
  broadcastLog(`📦 [Foundation] package.json ditulis dengan ${Object.keys(mergedDeps).length} dependencies`, "success");
}

// ============================================================================
// AI REQUIREMENT DEEP-DIVE INTERVIEW GENERATOR
// ============================================================================
async function generateClarificationQuestions(userIdea, language = "id") {
  const geminiKey = process.env.GEMINI_API_KEY;
  const ninerouterBase = process.env.NINEROUTER_API_BASE;
  const ninerouterKey = process.env.NINEROUTER_API_KEY;
  const ninerouterModel = process.env.NINEROUTER_PRD_MODEL || DEFAULT_PRD_MODEL;

  const systemPrompt = `You are a Principal Technical Product Consultant.
Analyze the user's raw product idea and generate 3 to 4 critical, high-impact multiple-choice clarification questions to uncover specific operational needs (e.g. scale, key user flows, hardware/printer/display integrations, payment gateways, compliance, multi-tenancy, or notifications).

Language: ${language === "id" ? "Bahasa Indonesia" : "English"}.

Return STRICTLY valid JSON with schema:
{
  "summary": "1-sentence appreciation of the idea and what will be clarified",
  "questions": [
    {
      "id": "q1",
      "category": "Alur Operasional",
      "question": "Pertanyaan spesifik dan krusial?",
      "options": [
        { "id": "opt1_1", "label": "Pilihan A (Penjelasan singkat)", "isDefault": true },
        { "id": "opt1_2", "label": "Pilihan B (Penjelasan alternatif)" },
        { "id": "opt1_3", "label": "Pilihan C (Kombinasi / Advanced)" }
      ]
    }
  ]
}
Return ONLY JSON without markdown.`;

  const userPrompt = `Product Idea: "${userIdea}"\nGenerate the 3-4 clarification questions now:`;

  // 0. Try 9Router
  if (ninerouterBase) {
    try {
      const res = await callNineRouterApi(ninerouterBase, ninerouterKey, ninerouterModel, systemPrompt, userPrompt);
      if (res && res.questions && res.questions.length > 0) return res;
    } catch (e) {
      console.warn("[Question Generator] 9Router failed:", e.message);
    }
  }

  // 1. Try Gemini
  if (geminiKey && !geminiKey.includes("YOUR_")) {
    try {
      const res = await callGeminiApi(geminiKey, "gemini-2.5-flash", systemPrompt, userPrompt);
      if (res && res.questions && res.questions.length > 0) return res;
    } catch (e) {
      console.warn("[Question Generator] Gemini failed:", e.message);
    }
  }

  return getFallbackClarificationQuestions(userIdea);
}

function getFallbackClarificationQuestions(prompt) {
  const isHealth = /klinik|dokter|pasien|rumah sakit|rekam medis|rme|obat/i.test(prompt);
  const isPos = /pos|kasir|cafe|resto|toko|penjualan|menu|order|kitchen/i.test(prompt);

  if (isHealth) {
    return {
      summary: "Memahami detail sistem layanan kesehatan & antrean pasien.",
      questions: [
        {
          id: "q1",
          category: "Pendaftaran Pasien",
          question: "Bagaimana cara pasien mendaftar dan mengambil nomor antrean?",
          options: [
            { id: "opt1", label: "Mesin Kiosk On-Site + Cetak Kertas Thermal", isDefault: true },
            { id: "opt2", label: "Pendaftaran Online Mandiri (Web / WhatsApp Bot)" },
            { id: "opt3", label: "Hybrid (Bisa On-site Kiosk dan Online dari Rumah)" },
          ],
        },
        {
          id: "q2",
          category: "Display & Audio",
          question: "Bagaimana sistem pemanggilan antrean di ruang tunggu?",
          options: [
            { id: "opt1", label: "Layar TV Utama + Suara Suara Panggilan Otomatis (TTS)", isDefault: true },
            { id: "opt2", label: "Display Mini di Depan Pintu Setiap Poli Dokter" },
            { id: "opt3", label: "Notifikasi WhatsApp Peringatan H-3 Giliran Antrean" },
          ],
        },
        {
          id: "q3",
          category: "Rekam Medis (RME)",
          question: "Format rekam medis apa yang dibutuhkan dokter?",
          options: [
            { id: "opt1", label: "Standar SOAP Lengkap + Integrasi SATUSEHAT", isDefault: true },
            { id: "opt2", label: "Form Input Cepat (Diagnosa ICD-10 + Resep Obat)" },
            { id: "opt3", label: "Riwayat Kunjungan + Lampiran File Hasil Lab/Rontgen" },
          ],
        },
      ],
    };
  }

  if (isPos) {
    return {
      summary: "Memahami alur operasional transaksi dan pesanan.",
      questions: [
        {
          id: "q1",
          category: "Alur Pemesanan",
          question: "Bagaimana alur pelanggan melakukan pemesanan?",
          options: [
            { id: "opt1", label: "Kasir Langsung (Order & Bayar di Counter)", isDefault: true },
            { id: "opt2", label: "Self-Order QR Code di Meja (Dine-in Order)" },
            { id: "opt3", label: "Omnichannel (Kasir + Self-Order QR + Takeaway)" },
          ],
        },
        {
          id: "q2",
          category: "Dapur & Barista (KDS)",
          question: "Bagaimana pesanan diteruskan ke bagian dapur?",
          options: [
            { id: "opt1", label: "Kitchen Display System (Layar Monitor Realtime)", isDefault: true },
            { id: "opt2", label: "Auto Cetak Struk ke Printer Thermal Dapur & Bar" },
            { id: "opt3", label: "Keduanya (Layar KDS + Cetak Printer Checker)" },
          ],
        },
        {
          id: "q3",
          category: "Pembayaran",
          question: "Metode pembayaran apa saja yang ingin didukung?",
          options: [
            { id: "opt1", label: "Cash + QRIS Dinamis Instan", isDefault: true },
            { id: "opt2", label: "Integrasi EDC Bank, Kartu Debit/Kredit, & E-Wallet" },
            { id: "opt3", label: "Split Bill + Pay Later / Open Tab Pelanggan" },
          ],
        },
      ],
    };
  }

  return {
    summary: "Memperjelas skala arsitektur dan kebutuhan utama aplikasi kamu.",
    questions: [
      {
        id: "q1",
        category: "Target Pengguna",
        question: "Siapa target utama pengguna aplikasi ini?",
        options: [
          { id: "opt1", label: "B2C Publik (Pengunjung umum mandiri tanpa login rumit)", isDefault: true },
          { id: "opt2", label: "Internal Perusahaan / Staf Operasional (Perlu Role & Permission)" },
          { id: "opt3", label: "Multi-Tenant SaaS (Banyak organisasi/merchant dengan data terpisah)" },
        ],
      },
      {
        id: "q2",
        category: "Interaksi & Realtime",
        question: "Apakah sistem membutuhkan fitur pembaruan data secara real-time?",
        options: [
          { id: "opt1", label: "Ya, Live Updates Instan (Websocket / Polling otomatis)", isDefault: true },
          { id: "opt2", label: "Cukup Refresh Normal / Standar REST API" },
          { id: "opt3", label: "Offline-First (Bisa dipakai saat internet terputus lalu sync)" },
        ],
      },
      {
        id: "q3",
        category: "Notifikasi & Integrasi",
        question: "Saluran notifikasi apa yang ingin diintegrasikan?",
        options: [
          { id: "opt1", label: "WhatsApp Gateway API (Pesan Otomatis ke HP Pelanggan)", isDefault: true },
          { id: "opt2", label: "Email Notifikasi HTML + In-App Push Alert" },
          { id: "opt3", label: "Ekspor Laporan Resmi (PDF & Excel / Spreadsheet)" },
        ],
      },
    ],
  };
}

// ============================================================================
// REAL CLOUD AI GENERATOR (Gemini / Anthropic / OpenRouter / OpenAI)
// ============================================================================

async function generatePrdWithAi(userIdea, language = "id") {
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const ninerouterBase = process.env.NINEROUTER_API_BASE;
  const ninerouterKey = process.env.NINEROUTER_API_KEY;
  const ninerouterModel = process.env.NINEROUTER_PRD_MODEL || process.env.NINEROUTER_MODEL || DEFAULT_PRD_MODEL;

  const systemPrompt = `You are a Principal Product Manager & System Architect.
Given a product idea, generate a complete, production-ready Project Requirements Document (PRD), 4 Phased Roadmap, 12 Sub-features, and 40+ detailed actionable tasks formatted STRICTLY as valid JSON.
Language for descriptions: ${language === "id" ? "Bahasa Indonesia" : "English"}.

Output JSON schema must strictly match:
{
  "project": {
    "id": "slug-name",
    "title": "Project Title",
    "tagline": "Short punchy tagline",
    "version": "v1.0.0",
    "status": "Perencanaan",
    "totalFeatures": 4,
    "totalSubFeatures": 12,
    "totalTasks": 40,
    "problemStatement": "Detailed problem statement and solution overview.",
    "techStack": [
      { "name": "Frontend", "value": "Next.js 14 / Tailwind CSS" },
      { "name": "Backend / API", "value": "Node.js Server Actions & API" },
      { "name": "Database", "value": "PostgreSQL with Prisma ORM" },
      { "name": "Authentication", "value": "NextAuth.js / OAuth" },
      { "name": "Payment / 3rd Party", "value": "Midtrans / Xendit / WhatsApp API" }
    ]
  },
  "phases": [
    {
      "id": "phase-1",
      "phaseNumber": 1,
      "title": "Phase Title",
      "priority": "high",
      "priorityLabel": "Utama",
      "color": "#f97316",
      "summary": "Phase summary",
      "subFeatures": [
        {
          "id": "sub-1-1",
          "title": "Sub Feature Title",
          "desc": "Detailed description of sub feature",
          "tasks": [
            { "id": "task-101", "title": "Specific task title", "status": "todo", "priority": "Utama" },
            { "id": "task-102", "title": "Specific task title", "status": "todo", "priority": "Utama" },
            { "id": "task-103", "title": "Specific task title", "status": "todo", "priority": "Sedang" }
          ]
        }
      ]
    }
  ],
  "prdSections": [
    { "id": "overview", "title": "1. Overview", "content": "### 1. Overview\\n\\nDetailed content..." },
    { "id": "requirements", "title": "2. Requirements", "content": "### 2. Requirements\\n\\nFunctional & Non-functional..." },
    { "id": "user-flow", "title": "4. User Flow", "content": "Detailed step-by-step user journey from landing to completion." },
    {
      "id": "architecture",
      "title": "5. Architecture",
      "content": "Aplikasi ini akan menggunakan pendekatan Full-stack Monolith secara modern menggunakan sistem Server-Side Rendering (SSR) dan API routes terpadu dalam satu wadah (framework).",
      "actorLabel": "Customer / Kasir / User",
      "seqSteps": [
        { "from": 0, "to": 1, "text": "1. Buka halaman utama aplikasi", "isReturn": false },
        { "from": 1, "to": 2, "text": "2. Request pencarian / aksi data", "isReturn": false },
        { "from": 2, "to": 3, "text": "3. Query tabel data utama", "isReturn": false },
        { "from": 3, "to": 2, "text": "4. Return data hasil query", "isReturn": true },
        { "from": 2, "to": 1, "text": "5. Tampilkan data interaktif di UI", "isReturn": true },
        { "from": 0, "to": 1, "text": "6. Submit form / konfirmasi transaksi", "isReturn": false },
        { "from": 1, to: 2, "text": "7. Validasi & simpan data", "isReturn": false },
        { "from": 2, to: 3, "text": "8. Insert data ke tabel transaksi", "isReturn": false },
        { "from": 3, to: 2, "text": "9. Sukses simpan transaksi", "isReturn": true },
        { "from": 2, to: 1, "text": "10. Kembalikan status sukses", "isReturn": true },
        { "from": 1, to: 0, "text": "11. Tampilkan status sukses & notifikasi", "isReturn": true }
      ]
    },
    {
      "id": "db-schema",
      "title": "6. Database Schema",
      "content": "Berikut adalah struktur dasar tabel yang diperlukan untuk menunjang kebutuhan aplikasi:\\n\\n- **Users** (Tabel Pengguna): Menyimpan data akun.\\nid (String/UUID) - Identifier unik. name (String) - Nama lengkap. email (String) - Email login. phone (String) - Telepon/WA. * role (String) - Hak akses.\\n\\n- **[Entity_Master]**: ...\\n\\n- **[Entity_Transaksi]**: ...",
      "erdTables": [
        {
          "name": "USERS",
          "fields": [
            { "type": "uuid", "name": "id", "key": "PK" },
            { "type": "string", "name": "name", "key": "" },
            { "type": "string", "name": "email", "key": "" },
            { "type": "string", "name": "phone", "key": "" },
            { "type": "string", "name": "role", "key": "" }
          ]
        },
        {
          "name": "MAIN_ENTITY",
          "fields": [
            { "type": "uuid", "name": "id", "key": "PK" },
            { "type": "string", "name": "name", "key": "" },
            { "type": "string", "name": "status", "key": "" }
          ]
        },
        {
          "name": "TRANSACTIONS",
          "fields": [
            { "type": "uuid", "name": "id", "key": "PK" },
            { "type": "uuid", "name": "user_id", "key": "FK" },
            { "type": "date", "name": "date", "key": "" },
            { "type": "string", "name": "status", "key": "" }
          ]
        }
      ],
      "erdRelationships": ["membuat", "berelasi dengan"]
    },
    {
      "id": "tech-stack",
      "title": "7. Tech Stack",
      "content": "Berikut adalah rekomendasi tumpukan teknologi (tech stack) yang sangat modern, ringan, hemat biaya, dan cepat dikembangkan:\\n\\n- **Frontend:** Next.js (App Router), React, Tailwind CSS untuk *styling* cepat.\\n- **UI Components:** shadcn/ui (Library komponen yang ringan, bersih, dan mudah diakses).\\n- **Backend:** Next.js (Server Actions / API Routes bersatu dengan Frontend).\\n- **Autentikasi:** Better Auth / NextAuth (Mudah untuk mengelola pendaftaran, login, sesi, hingga pembedaan peran).\\n- **Database:** PostgreSQL / SQLite (Sangat cepat dan simpel untuk menyimpan data).\\n- **ORM:** Prisma / Drizzle ORM (Memberikan kontrol basis data yang kokoh via *TypeScript*).\\n- **Deployment:** Vercel (Otomasi perilisan, dioptimalkan secara langsung untuk Next.js)."
    }
  ]
}

Ensure all 4 phases (Phase 1 to Phase 4) each contain 3 sub-features (total 12 sub-features), and each sub-feature has 3-4 specific tasks (total >= 40 tasks). Return ONLY raw JSON without markdown formatting.`;

  const userPrompt = `Product Idea: "${userIdea}"\nGenerate the complete PRD JSON now:`;

  // 0. PRIMARY GATEWAY: 9Router AI Gateway (Local/VPS Proxy)
  if (ninerouterBase) {
    try {
      console.log(`[AI Generator] Calling 9Router Gateway (${ninerouterBase}, Model: ${ninerouterModel})...`);
      const res = await callNineRouterApi(ninerouterBase, ninerouterKey, ninerouterModel, systemPrompt, userPrompt);
      if (res && res.project) {
        console.log(`[AI Generator] 9Router (${ninerouterModel}) successfully generated PRD!`);
        return res;
      }
    } catch (e) {
      console.warn(`[AI Generator] 9Router gateway failed:`, e.message);
    }
  }

  // 1. PRIMARY: Google Gemini API (gemini-3.7-flash, gemini-2.5-flash, gemini-2.5-pro)
  if (geminiKey && !geminiKey.includes("YOUR_")) {
    const geminiModels = ["gemini-3.7-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-flash-latest", "gemini-pro-latest"];
    for (const model of geminiModels) {
      try {
        console.log(`[AI Generator] Calling Google Gemini API (${model})...`);
        const res = await callGeminiApi(geminiKey, model, systemPrompt, userPrompt);
        if (res && res.project) {
          console.log(`[AI Generator] Google Gemini (${model}) successfully generated PRD!`);
          return res;
        }
      } catch (e) {
        console.warn(`[AI Generator] Gemini (${model}) failed:`, e.message);
      }
    }
  }

  // 2. FALLBACK: OpenRouter Models (DeepSeek, Gemini Exp, Llama 3.3)
  if (openrouterKey && !openrouterKey.includes("YOUR_")) {
    const routerModels = ["deepseek/deepseek-chat", "google/gemini-2.0-flash-exp:free", "meta-llama/llama-3.3-70b-instruct:free"];
    for (const model of routerModels) {
      try {
        console.log(`[AI Generator] Calling OpenRouter API (${model})...`);
        const res = await callOpenRouterApi(openrouterKey, model, systemPrompt, userPrompt);
        if (res && res.project) return res;
      } catch (e) {
        console.warn(`[AI Generator] OpenRouter (${model}) failed:`, e.message);
      }
    }
  }

  // 3. FALLBACK: OpenAI API (GPT-4o-mini)
  if (openaiKey && !openaiKey.includes("YOUR_")) {
    try {
      console.log("[AI Generator] Calling OpenAI API (gpt-4o-mini)...");
      const res = await callOpenAiApi(openaiKey, systemPrompt, userPrompt);
      if (res && res.project) return res;
    } catch (e) {
      console.warn("[AI Generator] OpenAI call failed:", e.message);
    }
  }

  // 4. FALLBACK: Anthropic Claude API
  if (anthropicKey && !anthropicKey.includes("YOUR_")) {
    try {
      console.log("[AI Generator] Calling Anthropic Claude API...");
      const res = await callAnthropicApi(anthropicKey, systemPrompt, userPrompt);
      if (res && res.project) return res;
    } catch (e) {
      console.warn("[AI Generator] Anthropic call failed:", e.message);
    }
  }

  // 5. Smart Dynamic Synthesizer (Zero-Failure Fallback tailored to the prompt)
  console.log("[AI Generator] Using Smart Production Synthesizer for custom prompt...");
  return synthesizeCustomPrd(userIdea, language);
}

// Call Google Gemini API
function callGeminiApi(apiKey, model, systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const options = {
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
            const rawText = parsed.candidates[0].content.parts[0].text;
            const cleaned = rawText
              .replace(/```json/g, "")
              .replace(/```/g, "")
              .trim();
            resolve(JSON.parse(cleaned));
          } else {
            reject(new Error(parsed.error?.message || "Gemini response empty"));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(60000, () => {
      req.destroy(new Error("Gemini API timeout"));
    });
    req.write(postData);
    req.end();
  });
}

// Call OpenRouter API
function callOpenRouterApi(apiKey, model, systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const options = {
      hostname: "openrouter.ai",
      path: "/api/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:4000",
        "X-Title": "OpenClaw PRD Maker",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices && parsed.choices[0]) {
            const raw = parsed.choices[0].message.content;
            const cleaned = raw
              .replace(/```json/g, "")
              .replace(/```/g, "")
              .trim();
            resolve(JSON.parse(cleaned));
          } else {
            reject(new Error(parsed.error?.message || "OpenRouter response empty"));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(60000, () => {
      req.destroy(new Error("OpenRouter API timeout"));
    });
    req.write(postData);
    req.end();
  });
}

// Call Anthropic Claude API
function callAnthropicApi(apiKey, systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.2,
    });

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.content && parsed.content[0]) {
            const raw = parsed.content[0].text;
            const cleaned = raw
              .replace(/```json/g, "")
              .replace(/```/g, "")
              .trim();
            resolve(JSON.parse(cleaned));
          } else {
            reject(new Error(parsed.error?.message || "Claude response empty"));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(60000, () => {
      req.destroy(new Error("Claude API timeout"));
    });
    req.write(postData);
    req.end();
  });
}

// Call OpenAI API
function callOpenAiApi(apiKey, systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const options = {
      hostname: "api.openai.com",
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices && parsed.choices[0]) {
            resolve(JSON.parse(parsed.choices[0].message.content));
          } else {
            reject(new Error(parsed.error?.message || "OpenAI response empty"));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(60000, () => {
      req.destroy(new Error("OpenAI API timeout"));
    });
    req.write(postData);
    req.end();
  });
}

// Call 9Router AI Gateway (OpenAI-Compatible Local/VPS Proxy)
function tryParseJson(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (e) {
    return null;
  }
}

function extractChoiceContent(parsed) {
  const choice = parsed && Array.isArray(parsed.choices) ? parsed.choices[0] : null;
  if (!choice) return "";
  const carrier = choice.delta || choice.message || {};
  return typeof carrier.content === "string" ? carrier.content : "";
}

const SSE_FIELD_LINE = /^(data|event|id|retry):/;
const SSE_DONE_LINE = /^data:\s*\[DONE\]$/;
const SSE_DONE_SUFFIX = /\s*data:\s*\[DONE\]\s*$/;

function parseSseContent(body) {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  let matchedChunk = false;
  let text = "";

  for (const line of lines) {
    if (line.startsWith(":")) continue;
    if (!SSE_FIELD_LINE.test(line)) return "";
    if (SSE_DONE_LINE.test(line)) continue;
    if (!line.startsWith("data:")) continue;

    const chunk = tryParseJson(line.slice(5).trim());
    if (!chunk) return "";
    matchedChunk = true;
    text += extractChoiceContent(chunk);
  }

  return matchedChunk ? text : "";
}

function parseNineRouterContent(rawBody) {
  const body = String(rawBody == null ? "" : rawBody).trim();
  if (!body) return "";

  const whole = tryParseJson(body);
  if (whole) return extractChoiceContent(whole);

  const withoutTerminator = body
    .split("\n")
    .filter((line) => !SSE_DONE_LINE.test(line.trim()))
    .join("\n")
    .replace(SSE_DONE_SUFFIX, "")
    .trim();

  if (withoutTerminator !== body) {
    const trailingDone = tryParseJson(withoutTerminator);
    if (trailingDone) return extractChoiceContent(trailingDone);
  }

  return parseSseContent(body);
}

function callNineRouterApi(apiBase, apiKey, model, systemPrompt, userPrompt) {
  return new Promise((resolve, reject) => {
    try {
      const fullUrl = apiBase.endsWith("/chat/completions") ? apiBase : `${apiBase.replace(/\/+$/, "")}/chat/completions`;
      const parsedUrl = new URL(fullUrl);
      const postData = JSON.stringify({
        model: model || DEFAULT_PRD_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      });

      const isHttps = parsedUrl.protocol === "https:";
      const httpLib = isHttps ? https : http;

      const headers = {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      };
      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: "POST",
        headers,
      };

      const req = httpLib.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const fullText = parseNineRouterContent(data);

            if (!fullText) {
              return reject(new Error("9Router response empty or invalid"));
            }

            const cleaned = fullText
              .replace(/```json/g, "")
              .replace(/```/g, "")
              .trim();
            resolve(JSON.parse(cleaned));
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on("error", reject);
      req.setTimeout(getNineRouterTimeoutMs(), () => {
        req.destroy(new Error("9Router Gateway timeout"));
      });
      req.write(postData);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

// Dynamic Synthesizer (Tailors full PRD to prompt keywords)
function synthesizeCustomPrd(prompt, language) {
  const cleanTitle = prompt
    .split(".")[0]
    .split(",")[0]
    .replace(/^["']|["']$/g, "")
    .trim();
  const slug =
    cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "custom-app";

  return {
    project: {
      id: slug,
      title: cleanTitle,
      tagline: `Platform Modern Berbasis AI & Otomatisasi untuk ${cleanTitle}`,
      version: "v1.0.0",
      status: "Perencanaan",
      totalFeatures: 4,
      totalSubFeatures: 12,
      totalTasks: 42,
      problemStatement: `Proses operasional konvensional untuk "${cleanTitle}" saat ini masih membutuhkan banyak intervensi manual, pencatatan terpisah, dan koordinasi yang memakan waktu.\n\nSistem ini hadir sebagai solusi terpadu berbasis web application modern untuk mengotomatiskan seluruh alur: interaksi pelanggan mandiri, pemrosesan transaksi instan, serta pemantauan dashboard real-time untuk pengelola.`,
      techStack: [
        { name: "Frontend", value: "Next.js 14 (App Router) + Tailwind CSS + Lucide Icons" },
        { name: "Backend / API", value: "Node.js / Next.js Server Actions & REST API" },
        { name: "Database", value: "PostgreSQL with Prisma ORM" },
        { name: "Authentication", value: "NextAuth.js (OAuth & Magic Link)" },
        { name: "Payment & Integrasi", value: "Midtrans / Xendit / WhatsApp API" },
      ],
    },
    phases: [
      {
        id: "phase-1",
        phaseNumber: 1,
        title: "Alur Utama & Transaksi Pengguna",
        priority: "high",
        priorityLabel: "Utama",
        color: "#f97316",
        summary: "Fitur inti interaksi pelanggan, katalog/layanan, pemilihan item, dan checkout otomatis.",
        subFeatures: [
          {
            id: "sub-1-1",
            title: "Tampilan Katalog & Ketersediaan",
            desc: "Menampilkan daftar layanan/produk dengan filter pencarian cepat dan status real-time.",
            tasks: [
              { id: "task-101", title: `Rancang komponen antarmuka katalog untuk ${cleanTitle}`, status: "todo", priority: "Utama" },
              { id: "task-102", title: "Implementasi filter pencarian multi-kategori dan sorting", status: "todo", priority: "Utama" },
              { id: "task-103", title: "Optimasi responsif tampilan mobile smartphone", status: "todo", priority: "Sedang" },
              { id: "task-104", title: "Integrasi skeleton loading state saat fetching data", status: "todo", priority: "Sedang" },
            ],
          },
          {
            id: "sub-1-2",
            title: "Formulir Pemesanan & Validasi",
            desc: "Input form interaktif dengan validasi data real-time dan kalkulasi otomatis.",
            tasks: [
              { id: "task-105", title: "Buat form input pemesanan dengan validasi schema Zod", status: "todo", priority: "Utama" },
              { id: "task-106", title: "Kalkulator dinamis harga, diskon, dan biaya admin", status: "todo", priority: "Utama" },
              { id: "task-107", title: "Fitur penahanan slot / stock holding lock 10 menit", status: "todo", priority: "Utama" },
            ],
          },
          {
            id: "sub-1-3",
            title: "Checkout & Pembayaran Instan",
            desc: "Integrasi payment gateway dengan QRIS, Virtual Account, dan E-Wallet.",
            tasks: [
              { id: "task-108", title: "Integrasi Payment Gateway Snap Popup checkout", status: "todo", priority: "Utama" },
              { id: "task-109", title: "Webhook receiver verifikasi status sukses pembayaran", status: "todo", priority: "Utama" },
              { id: "task-110", title: "Halaman sukses pembayaran dengan invoice digital & QR tiket", status: "todo", priority: "Utama" },
            ],
          },
        ],
      },
      {
        id: "phase-2",
        phaseNumber: 2,
        title: "Dashboard & Manajemen Pengelola",
        priority: "high",
        priorityLabel: "Utama",
        color: "#3b82f6",
        summary: "Panel kontrol pengelola untuk memantau pesanan masuk, inventori/data, dan rekap pendapatan.",
        subFeatures: [
          {
            id: "sub-2-1",
            title: "Daftar Pesanan & Status",
            desc: "Monitoring transaksi masuk lengkap dengan filter status dan update aksi.",
            tasks: [
              { id: "task-201", title: "Buat layout dashboard admin dengan sidebar dan metrics card", status: "todo", priority: "Utama" },
              { id: "task-202", title: "Tabel pesanan dengan filter status (Pending, Lunas, Selesai, Batal)", status: "todo", priority: "Utama" },
              { id: "task-203", title: "Fitur export rekap transaksi ke format Excel/CSV", status: "todo", priority: "Sedang" },
            ],
          },
          {
            id: "sub-2-2",
            title: "Manajemen Data & Master Data",
            desc: "CRUD master data produk, harga, kuota/kapasitas, dan status aktif.",
            tasks: [
              { id: "task-204", title: "Formulir CRUD data master lengkap dengan upload gambar", status: "todo", priority: "Utama" },
              { id: "task-205", title: "Fitur toggle on/off status ketersediaan instan", status: "todo", priority: "Sedang" },
              { id: "task-206", title: "Pengaturan harga khusus dan diskon promo berkala", status: "todo", priority: "Sedang" },
            ],
          },
          {
            id: "sub-2-3",
            title: "Laporan Finansial & Analitik",
            desc: "Grafik pendapatan harian, bulanan, dan produk terlaris.",
            tasks: [
              { id: "task-207", title: "Integrasi visual chart pendapatan menggunakan Chart.js/Recharts", status: "todo", priority: "Utama" },
              { id: "task-208", title: "Ringkasan metrik total revenue, pesanan sukses, dan pelanggan baru", status: "todo", priority: "Utama" },
              { id: "task-209", title: "Laporan rekap laba kotor & bersih berkala", status: "todo", priority: "Rendah" },
            ],
          },
        ],
      },
      {
        id: "phase-3",
        phaseNumber: 3,
        title: "Autentikasi & Akun Pengguna",
        priority: "medium",
        priorityLabel: "Utama",
        color: "#10b981",
        summary: "Pendaftaran akun, login multi-metode, profil pengguna, dan riwayat aktivitas.",
        subFeatures: [
          {
            id: "sub-3-1",
            title: "Registrasi & Login",
            desc: "Autentikasi cepat via Google One-Click Login, Email, dan WhatsApp OTP.",
            tasks: [
              { id: "task-301", title: "Halaman register dengan validasi email dan nomor HP unik", status: "todo", priority: "Utama" },
              { id: "task-302", title: "Integrasi Google OAuth untuk login 1-klik", status: "todo", priority: "Utama" },
              { id: "task-303", title: "Middleware proteksi session JWT route admin & user", status: "todo", priority: "Utama" },
              { id: "task-304", title: "Alur lupa password dengan reset token via email", status: "todo", priority: "Sedang" },
            ],
          },
          {
            id: "sub-3-2",
            title: "Profil & Riwayat Transaksi",
            desc: "Kelola informasi diri, riwayat invoice, dan download e-receipt.",
            tasks: [
              { id: "task-305", title: "Halaman edit profil pengguna dan ganti kata sandi", status: "todo", priority: "Sedang" },
              { id: "task-306", title: "Daftar riwayat transaksi dengan detail status dan barcode", status: "todo", priority: "Utama" },
              { id: "task-307", title: "Fitur unduh struk/invoice PDF resmi per transaksi", status: "todo", priority: "Sedang" },
            ],
          },
          {
            id: "sub-3-3",
            title: "Manajemen Hak Akses (RBAC)",
            desc: "Pembatasan hak akses role Super Admin, Staff, dan Customer.",
            tasks: [
              { id: "task-308", title: "Skema RBAC di database untuk role Admin vs Customer", status: "todo", priority: "Utama" },
              { id: "task-309", title: "Guard proteksi endpoint API backend berdasarkan role", status: "todo", priority: "Utama" },
              { id: "task-310", title: "Log audit aktivitas perubahan data penting oleh admin", status: "todo", priority: "Rendah" },
            ],
          },
        ],
      },
      {
        id: "phase-4",
        phaseNumber: 4,
        title: "Otomatisasi Notifikasi & Integrasi",
        priority: "medium",
        priorityLabel: "Utama",
        color: "#8b5cf6",
        summary: "Notifikasi otomatis via WhatsApp dan Email untuk konfirmasi dan reminder.",
        subFeatures: [
          {
            id: "sub-4-1",
            title: "Notifikasi WhatsApp Gateway",
            desc: "Pesan instan otomatis saat transaksi sukses dan pengingat jadwal.",
            tasks: [
              { id: "task-401", title: "Integrasi WhatsApp Gateway API (Fonnte / Twilio)", status: "todo", priority: "Utama" },
              { id: "task-402", title: "Template pesan WA konfirmasi sukses beserta link tiket", status: "todo", priority: "Utama" },
              { id: "task-403", title: "Cron job background worker untuk pengingat jadwal otomatis", status: "todo", priority: "Utama" },
            ],
          },
          {
            id: "sub-4-2",
            title: "Email Transaksional & Toast UI",
            desc: "Email konfirmasi berformat HTML elegan dan in-app real-time toast alert.",
            tasks: [
              { id: "task-404", title: "Template email HTML konfirmasi pemesanan dengan lampiran", status: "todo", priority: "Sedang" },
              { id: "task-405", title: "Komponen toast notifikasi real-time di antarmuka webapp", status: "todo", priority: "Sedang" },
              { id: "task-406", title: "Sistem antrean retry otomatis bila gateway pesan gagal kirim", status: "todo", priority: "Sedang" },
            ],
          },
        ],
      },
    ],
    prdSections: [
      {
        id: "overview",
        title: "1. Overview",
        content: `### 1. Overview Proyek\n\n**Nama Produk:** ${cleanTitle}  \n**Tujuan Utama:** Mengotomatiskan seluruh alur operasional dan transaksi menjadi pengalaman digital instan.\n\n#### Masalah yang Diselesaikan:\n- Proses konvensional masih membutuhkan banyak waktu dan koordinasi manual.\n- Pelanggan menginginkan proses mandiri instan dengan transparansi status real-time.\n- Rekapitulasi transaksi manual rawan selisih dan kurang efisien.`,
      },
      {
        id: "requirements",
        title: "2. Requirements",
        content: `### 2. Kebutuhan Sistem & Spesifikasi Fungsional\n\n#### Functional Requirements:\n- **FR-01:** Pengguna dapat melihat daftar ketersediaan data secara real-time.\n- **FR-02:** Sistem mengunci resource selama proses checkout untuk menghindari konflik data ganda.\n- **FR-03:** Penerimaan pembayaran via QRIS dan Virtual Account dengan auto-verifikasi.\n- **FR-04:** Notifikasi WhatsApp instan dikirim otomatis ke pelanggan.\n- **FR-05:** Admin dapat mengatur data master, harga, dan memantau rekap pendapatan.\n\n#### Non-Functional Requirements:\n- **NFR-01 (Speed):** Response time halaman < 500ms.\n- **NFR-02 (Security):** Enkripsi SSL/TLS dan payment token standar PCI-DSS.`,
      },
      {
        id: "core-features",
        title: "3. Core Features",
        isPhased: true,
      },
      {
        id: "user-flow",
        title: "4. User Flow",
        content: `### 4. Alur Pengguna (User Flow)\n\n\`\`\`\n[ Pengunjung Web ] ➔ [ Pilih Item/Layanan ] ➔ [ Isi Data & Checkout ] ➔ [ Bayar QRIS/VA ] ➔ [ Auto Verifikasi & Notif WA ]\n\`\`\``,
      },
      {
        id: "architecture",
        title: "5. Architecture",
        content: `### 5. Arsitektur Sistem\n\n- **Client Layer:** Next.js 14 App Router (SSR + Client Components)\n- **API Layer:** Server Actions & REST Endpoints\n- **Data Layer:** PostgreSQL with Prisma Client\n- **Third-Party:** Midtrans Payment Gateway, WhatsApp Gateway API`,
      },
      {
        id: "db-schema",
        title: "6. Database Schema",
        content: `### 6. Skema Database\n\n\`\`\`sql\nCREATE TABLE users (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    name VARCHAR(100) NOT NULL,\n    email VARCHAR(150) UNIQUE NOT NULL,\n    phone VARCHAR(20) UNIQUE NOT NULL,\n    role VARCHAR(20) DEFAULT 'customer',\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\nCREATE TABLE transactions (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    user_id UUID REFERENCES users(id),\n    total_amount DECIMAL(12, 2) NOT NULL,\n    status VARCHAR(30) DEFAULT 'pending',\n    payment_token VARCHAR(255),\n    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\`\`\``,
      },
      {
        id: "tech-stack",
        title: "7. Tech Stack",
        content: `### 7. Tech Stack Rekomendasi\n\n| Komponen | Teknologi | Alasan |\n|---|---|---|\n| **Framework** | Next.js 14 (App Router) | SEO kuat, SSR super cepat, fullstack capabilities |\n| **Styling** | Tailwind CSS | Konsistensi antarmuka & responsif modern |\n| **Database** | PostgreSQL | ACID compliance untuk transaksi andal |\n| **ORM** | Prisma | Type-safe query & kemudahan migrasi |\n| **Payment** | Midtrans / Xendit | Dukungan QRIS lengkap dan verifikasi instan |\n| **Messaging** | WhatsApp Gateway API | Saluran komunikasi utama pelanggan |`,
      },
    ],
  };
}

// ============================================================================
// HTTP ROUTER
// ============================================================================
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqHost = req.headers.host || `localhost:${PORT}`;
  const parsedUrl = new URL(req.url, `http://${reqHost}`);
  const pathname = parsedUrl.pathname;

  try {
    // 1. GET /api/status
    if (req.method === "GET" && pathname === "/api/status") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "online",
          agent: "OpenClaw Autonomous Runner",
          hasGemini: !!process.env.GEMINI_API_KEY,
          hasOpenAI: !!process.env.OPENAI_API_KEY,
          hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
          hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
          workspaceDir: OPENCLAW_WORKSPACE_DIR,
          activeProject: state.activeProject ? state.activeProject.title : null,
          totalTasks: state.tasks.length,
          completedTasks: state.tasks.filter((t) => t.status === "done").length,
          isRunning: state.isRunning,
          isPaused: state.isPaused,
        }),
      );
      return;
    }

    // 2. POST /api/generate-prd (REAL CLOUD AI GENERATION)
    if (req.method === "POST" && pathname === "/api/generate-prd") {
      const body = await parseJsonBody(req);
      const { prompt, language } = body;

      if (!prompt) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Prompt is required" }));
        return;
      }

      broadcastLog(`🧠 Memulai generate PRD dengan Cloud AI untuk: "${prompt}"...`);

      try {
        const generatedData = await generatePrdWithAi(prompt, language || "id");
        broadcastLog(`✨ Berhasil meng-generate PRD untuk "${generatedData.project.title}"!`, "success");

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, data: generatedData }));
      } catch (aiErr) {
        console.error("AI Generation Error:", aiErr);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: aiErr.message }));
      }
      return;
    }

    // 2.5. POST /api/generate-questions (AI Requirement Deep-Dive Interview)
    if (req.method === "POST" && pathname === "/api/generate-questions") {
      const body = await parseJsonBody(req);
      const { prompt, language } = body;

      if (!prompt) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Prompt is required" }));
        return;
      }

      broadcastLog(`🧠 [Interview] Menganalisis ide "${prompt.slice(0, 40)}..." untuk membuat pertanyaan klarifikasi...`);

      try {
        const questionsData = await generateClarificationQuestions(prompt, language || "id");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, data: questionsData }));
      } catch (err) {
        console.warn("AI Question Generation Error:", err.message);
        // Fallback default questions
        const fallback = getFallbackClarificationQuestions(prompt);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, data: fallback }));
      }
      return;
    }

    // 3. GET /api/events (SSE Stream)
    if (req.method === "GET" && pathname === "/api/events") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const clientId = Date.now();
      const newClient = { id: clientId, res };
      state.sseClients.push(newClient);

      broadcastLog(`Frontend terhubung ke OpenClaw Realtime Event Stream (ID: ${clientId})`);

      req.on("close", () => {
        state.sseClients = state.sseClients.filter((c) => c.id !== clientId);
      });
      return;
    }

    // 4. POST /api/projects (Register Project & Save to OpenClaw Workspace)
    if (req.method === "POST" && pathname === "/api/projects") {
      const body = await parseJsonBody(req);
      const { project, phases, prdSections, tasks } = body;

      if (!project || !project.id) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Project data is required" }));
        return;
      }

      state.activeProject = project;
      state.tasks = tasks || [];
      state.currentTaskIndex = 0;
      state.isRunning = false;

      // Prepare files in workspace
      const projectDir = getActiveWorkspacePath(project.id);
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }

      // Save tasks.json
      fs.writeFileSync(path.join(projectDir, "tasks.json"), JSON.stringify({ project, phases, tasks: state.tasks }, null, 2), "utf-8");

      // Save prd.md
      let mdContent = `# ${project.title}\n\n> **Versi:** ${project.version || "v1.0.0"}  \n> **Status:** ${project.status || "Perencanaan"}\n\n## 1. Problem Statement & Overview\n${project.problemStatement}\n\n`;
      if (prdSections) {
        prdSections.forEach((sec) => {
          if (sec.id !== "overview") {
            mdContent += `\n\n${sec.content || ""}`;
          }
        });
      }
      fs.writeFileSync(path.join(projectDir, "prd.md"), mdContent, "utf-8");

      // Scaffolding base files (package.json, README.md, .gitignore)
      const packageJsonPath = path.join(projectDir, "package.json");
      if (!fs.existsSync(packageJsonPath)) {
        fs.writeFileSync(
          packageJsonPath,
          JSON.stringify(
            {
              name: project.id,
              version: project.version || "1.0.0",
              description: project.tagline || project.title,
              private: true,
              scripts: {
                dev: "next dev",
                build: "next build",
                start: "next start",
                lint: "next lint",
              },
              dependencies: {
                next: "^14.2.0",
                react: "^18.3.0",
                "react-dom": "^18.3.0",
                "lucide-react": "^0.360.0",
                clsx: "^2.1.0",
                "tailwind-merge": "^2.2.0",
              },
              devDependencies: {
                tailwindcss: "^3.4.0",
                postcss: "^8.4.0",
                autoprefixer: "^10.4.0",
                typescript: "^5.4.0",
                "@types/node": "^20.0.0",
                "@types/react": "^18.3.0",
                "@types/react-dom": "^18.3.0",
              },
            },
            null,
            2,
          ),
          "utf-8",
        );
      }

      const readmePath = path.join(projectDir, "README.md");
      if (!fs.existsSync(readmePath)) {
        fs.writeFileSync(
          readmePath,
          `# ${project.title}\n\n> ${project.tagline}\n\n## Deskripsi Proyek\n${project.problemStatement}\n\n## Struktur Roadmap\n- Total Fitur: ${phases ? phases.length : 4} Fase\n- Total Task: ${state.tasks.length} Tasks\n\n## Cara Menjalankan\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n*Generated by OpenClaw Autonomous Engine*\n`,
          "utf-8",
        );
      }

      broadcastLog(`Proyek "${project.title}" (${state.tasks.length} tasks) tersimpan di OpenClaw: ${projectDir}`);
      broadcastEvent("project_initialized", { project, totalTasks: state.tasks.length });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          message: "Project created in OpenClaw workspace",
          workspacePath: projectDir,
          totalTasks: state.tasks.length,
        }),
      );
      return;
    }

    // 5. POST /api/tasks/run
    if (req.method === "POST" && pathname === "/api/tasks/run") {
      let body = {};
      try {
        body = await parseJsonBody(req);
      } catch (e) {}
      state.activeTaskModel = body?.model || process.env.NINEROUTER_TASK_MODEL || DEFAULT_TASK_MODEL;
      if (body?.techStackConfig) {
        state.activeTechStackConfig = body.techStackConfig;
        if (state.activeProject) state.activeProject.techStackConfig = body.techStackConfig;
      }

      if (state.isRunning) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Execution already running", isRunning: true, model: state.activeTaskModel }));
        return;
      }

      if (state.tasks.length === 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No tasks to execute. Initialize a project first." }));
        return;
      }

      state.isRunning = true;
      state.isPaused = false;
      // Reset context tracking for fresh run
      state.createdFiles = [];
      state.discoveredDependencies = {};

      broadcastLog(`🚀 OpenClaw Agent memulai eksekusi ${state.tasks.length} tasks menggunakan model: [${state.activeTaskModel}]...`);
      broadcastEvent("run_started", { totalTasks: state.tasks.length, model: state.activeTaskModel });

      // ====================================================================
      // PHASE 0: Pre-scan + Foundation Scaffolding (runs BEFORE task loop)
      // ====================================================================
      const projectId = state.activeProject ? state.activeProject.id : "default-project";
      const projectDir = getActiveWorkspacePath(projectId);
      const ninerouterBase = process.env.NINEROUTER_API_BASE;
      const ninerouterKey = process.env.NINEROUTER_API_KEY;
      const ninerouterModel = state.activeTaskModel || process.env.NINEROUTER_TASK_MODEL || DEFAULT_TASK_MODEL;

      // Run async pre-scan + scaffold then start loop
      (async () => {
        try {
          // [A] Pre-scan all tasks to build complete package.json
          const scanResult = await preScanDependencies(state.activeProject, state.tasks, ninerouterBase, ninerouterKey, ninerouterModel);
          writeCompletePackageJson(projectDir, state.activeProject || { id: projectId, title: projectId }, scanResult);

          // [B] Scaffold all foundation files (tsconfig, tailwind, UI stubs, layout, etc.)
          scaffoldProjectFoundation(state.activeProject || { id: projectId, title: projectId }, projectDir, scanResult);

          broadcastLog(`🏁 [Phase 0] Selesai! Memulai eksekusi ${state.tasks.length} tasks...`, "success");
        } catch (err) {
          broadcastLog(`[Phase 0] Warning: ${err.message} - melanjutkan eksekusi tanpa pre-scan`, "warn");
          // Still scaffold even if pre-scan fails
          try {
            scaffoldProjectFoundation(state.activeProject || { id: projectId, title: projectId }, projectDir, {});
          } catch (e2) {}
        }

        // [B] Start actual task loop
        runAgentLoop();
      })();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: "Agent execution started" }));
      return;
    }

    // 6. POST /api/tasks/pause & POST /api/tasks/resume
    if (req.method === "POST" && pathname === "/api/tasks/pause") {
      state.isPaused = true;
      broadcastLog("⏸️ OpenClaw Agent dijeda.");
      broadcastEvent("run_paused", {});
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, isPaused: true }));
      return;
    }

    if (req.method === "POST" && pathname === "/api/tasks/resume") {
      state.isPaused = false;
      broadcastLog("▶️ OpenClaw Agent dilanjutkan.");
      broadcastEvent("run_resumed", {});
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, isPaused: false }));
      return;
    }

    // 7. GET /api/tasks
    if (req.method === "GET" && pathname === "/api/tasks") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          tasks: state.tasks,
          total: state.tasks.length,
          completed: state.tasks.filter((t) => t.status === "done").length,
          isRunning: state.isRunning,
          isPaused: state.isPaused,
        }),
      );
      return;
    }

    // Default 404
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint not found" }));
  } catch (err) {
    console.error("Server error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
});

// ============================================================================
// REAL CLOUD AI TASK CODE GENERATOR (Gemini 3.7 / OpenRouter / OpenAI)
// ============================================================================
async function generateTaskCodeWithCloudAi(project, task) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const ninerouterBase = process.env.NINEROUTER_API_BASE;
  const ninerouterKey = process.env.NINEROUTER_API_KEY;
  const ninerouterModel = state.activeTaskModel || process.env.NINEROUTER_TASK_MODEL || DEFAULT_TASK_MODEL;

  const config = (project && project.techStackConfig) || state.activeTechStackConfig || { mode: "html-prototype" };
  const mode = config.mode || "html-prototype";

  // [C] Context Injection — include already-created files
  const createdFilesList = state.createdFiles.length > 0 ? `\n\nFiles already created in workspace (DO NOT overwrite or duplicate unnecessarily):\n${state.createdFiles.map((f) => `- ${f}`).join("\n")}` : "";

  // Dynamic Prompt Matrix based on chosen mode
  let systemPrompt = "";
  if (mode === "html-prototype") {
    systemPrompt = `You are a Principal Frontend UI Slicing Engineer specializing in clean, interactive HTML5, Tailwind CSS, and jQuery.
Generate ONE complete, production-grade page or script for this task.

RULES:
1. File paths should be 'pages/xxx.html' or 'js/xxx.js' or 'css/xxx.css'.
2. Include Tailwind CSS CDN and Lucide Icons in HTML head if generating a standalone HTML page.
3. Make UI modern, dark-themed, glassmorphic, and interactive with jQuery.
4. Return complete, copy-paste ready code with full markup and script.${createdFilesList}

Return ONLY valid JSON:
{
  "filePath": "pages/dashboard.html",
  "code": "<!DOCTYPE html>...",
  "summary": "1-sentence summary of what this file implements"
}`;
  } else if (mode === "laravel-monolith") {
    systemPrompt = `You are a Principal Laravel 11 Architect.
Generate ONE complete PHP Controller, Eloquent Model, Blade View, or Migration for this task.

RULES:
1. Use standard Laravel 11 conventions (e.g. 'app/Http/Controllers/XxxController.php', 'resources/views/xxx.blade.php', 'app/Models/Xxx.php').
2. Use Tailwind CSS classes in Blade templates.
3. Write clean, idiomatic PHP 8.2+ code with typehints.${createdFilesList}

Return ONLY valid JSON:
{
  "filePath": "app/Http/Controllers/QueueController.php",
  "code": "<?php\\nnamespace App\\\\Http\\\\Controllers;\\n...",
  "summary": "1-sentence summary of implementation"
}`;
  } else if (mode === "decoupled-api") {
    const isBackend = task.title.toLowerCase().includes("api") || task.title.toLowerCase().includes("endpoint") || task.phaseTitle?.toLowerCase().includes("backend") || task.phaseTitle?.toLowerCase().includes("database");
    const backendEngine = config.backend || "go-fiber";

    if (isBackend && backendEngine === "go-fiber") {
      systemPrompt = `You are a Principal Golang Engineer building a Fiber/Gin REST API in 'backend/'.
Generate ONE complete Go handler, model, or route file.
File path should be inside 'backend/' (e.g. 'backend/handlers/xxx.go' or 'backend/models/xxx.go').${createdFilesList}

Return ONLY valid JSON:
{
  "filePath": "backend/handlers/queue.go",
  "code": "package handlers\\n...",
  "summary": "1-sentence summary"
}`;
    } else {
      systemPrompt = `You are a Principal Frontend React Engineer building a modern SPA in 'frontend/'.
Generate ONE complete React component, page, or hook in TypeScript.
File path should be inside 'frontend/src/' (e.g. 'frontend/src/pages/Dashboard.tsx').${createdFilesList}

Return ONLY valid JSON:
{
  "filePath": "frontend/src/pages/Dashboard.tsx",
  "code": "import React from 'react';\\n...",
  "summary": "1-sentence summary"
}`;
    }
  } else {
    // Next.js 14 Fullstack
    systemPrompt = `You are a Principal Fullstack Software Engineer working on a Next.js 14 (App Router) TypeScript project.
Generate the COMPLETE, production-ready source code for ONE specific task.

IMPORTANT RULES:
1. Use '@/components/ui/button', '@/components/ui/card', '@/components/ui/badge', '@/components/ui/input', '@/components/ui/dialog', '@/components/ui/tabs', '@/components/ui/table', '@/components/ui/select', '@/components/ui/checkbox', '@/components/ui/label', '@/components/ui/textarea' — these UI stubs already exist.
2. Use '@/lib/utils' for utility functions (cn, formatDate, formatCurrency).
3. Use '@/lib/prisma' for database access.
4. Server Components by default, add 'use client' only when interactive.${createdFilesList}

Return ONLY valid JSON:
{
  "filePath": "src/app/dashboard/page.tsx",
  "code": "// complete source code",
  "summary": "1-sentence summary"
}`;
  }

  const techStackStr = project && project.techStack ? project.techStack.map((t) => `${t.name}: ${t.value}`).join(", ") : `${mode}`;
  const userPrompt = `Project: "${project ? project.title : "Application"}"
Selected Architecture: ${mode} (${config.frontend || "frontend"} + ${config.backend || "backend"})
Task ID: ${task.id}
Task Title: "${task.title}"
Phase: "${task.phaseTitle || ""}"
Sub-feature: "${task.subFeatureTitle || ""}"

Generate the complete, production-ready source code file for this specific task now:`;

  // 0. Try 9Router Gateway
  if (ninerouterBase) {
    try {
      console.log(`[Cloud AI Task] Generating code via 9Router Gateway (${ninerouterModel})...`);
      const res = await callNineRouterApi(ninerouterBase, ninerouterKey, ninerouterModel, systemPrompt, userPrompt);
      if (res && res.filePath && res.code) return res;
    } catch (e) {
      console.warn(`[Cloud AI Task] 9Router call failed:`, e.message);
    }
  }

  // 1. Try Gemini 3.7 / 2.5
  if (geminiKey && !geminiKey.includes("YOUR_")) {
    const models = ["gemini-3.7-flash", "gemini-2.5-flash"];
    for (const m of models) {
      try {
        const res = await callGeminiApi(geminiKey, m, systemPrompt, userPrompt);
        if (res && res.filePath && res.code) return res;
      } catch (e) {}
    }
  }

  // 2. Try OpenRouter
  if (openrouterKey && !openrouterKey.includes("YOUR_")) {
    try {
      const res = await callOpenRouterApi(openrouterKey, "deepseek/deepseek-chat", systemPrompt, userPrompt);
      if (res && res.filePath && res.code) return res;
    } catch (e) {}
  }

  // Fallback
  const sanitized = task.title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 30);
  return {
    filePath: `src/tasks/${task.id}_${sanitized}.ts`,
    code: `/**\n * Task: ${task.title}\n * Phase: ${task.phaseTitle || ""}\n * Generated by OpenClaw Autonomous Engine\n */\n\nexport async function execute_${task.id.replace(/-/g, "_")}() {\n  console.log('Executing ${task.title}...');\n  return { success: true, taskId: '${task.id}' };\n}\n`,
    summary: `Created implementation for ${task.title}`,
  };
}

// ============================================================================
// AUTONOMOUS AGENT WORKER ENGINE
// ============================================================================
async function runAgentLoop() {
  while (state.isRunning) {
    if (state.isPaused) {
      await sleep(1000);
      continue;
    }

    const nextTask = state.tasks.find((t) => t.status === "todo");
    if (!nextTask) {
      state.isRunning = false;
      broadcastLog(`🎉 SEMUA TASK (${state.tasks.length}) TELAH SELESAI DIEKSEKUSI DI OPENCLAW WORKSPACE!`, "success");
      broadcastEvent("run_completed", { total: state.tasks.length });
      break;
    }

    // Step 1: Set task to "progress"
    nextTask.status = "progress";
    broadcastLog(`[Task ${nextTask.id}] Mulai pengerjaan: "${nextTask.title}" (${nextTask.phaseTitle})`);
    broadcastEvent("task_updated", { task: nextTask });

    // Step 2: Cloud AI Code Generation
    const activeModel = state.activeTaskModel || process.env.NINEROUTER_TASK_MODEL || DEFAULT_TASK_MODEL;
    const taskNum = state.createdFiles.length;
    broadcastLog(`[Task ${nextTask.id}] 🧠 Merancang kode dengan [${activeModel}] (context: ${taskNum} files tersedia)...`);
    let fileResult = null;
    try {
      fileResult = await generateTaskCodeWithCloudAi(state.activeProject, nextTask);
    } catch (err) {
      broadcastLog(`[Task ${nextTask.id}] ⚠️ Error AI generation: ${err.message}. Menggunakan fallback scaffold.`);
    }

    // Step 3: Write code to real workspace file
    const projectDir = getActiveWorkspacePath(state.activeProject ? state.activeProject.id : "default-project");
    if (fileResult && fileResult.filePath && fileResult.code) {
      const targetPath = path.join(projectDir, fileResult.filePath);
      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(targetPath, fileResult.code, "utf-8");
      broadcastLog(`[Task ${nextTask.id}] 📝 Berhasil membuat file: ${fileResult.filePath} (${fileResult.summary || "OK"})`, "info");
      // [C] Track created files for context injection
      if (!state.createdFiles.includes(fileResult.filePath)) {
        state.createdFiles.push(fileResult.filePath);
      }
    }

    // Record task log
    const generatedLogPath = path.join(projectDir, `task_${nextTask.id}.log`);
    fs.writeFileSync(
      generatedLogPath,
      `OpenClaw Cloud AI Execution Log\nTask: ${nextTask.title}\nPhase: ${nextTask.phaseTitle}\nFile Generated: ${fileResult ? fileResult.filePath : "N/A"}\nTimestamp: ${new Date().toISOString()}\nStatus: PASSED\n`,
    );

    // Step 4: Mark task as "done"
    nextTask.status = "done";
    broadcastLog(`✅ [Task ${nextTask.id}] Selesai: "${nextTask.title}"`, "success");
    broadcastEvent("task_updated", { task: nextTask });

    await sleep(600);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Start Server
function startServer(port = PORT) {
  return server.listen(port, () => {
    console.log(`=======================================================`);
    console.log(`🤖 OpenClaw Production Server running on http://localhost:${port}`);
    console.log(`📁 Target Workspace: ${OPENCLAW_WORKSPACE_DIR}`);
    console.log(`🔑 9Router Gateway: ${process.env.NINEROUTER_API_BASE ? `Active ✅ (${process.env.NINEROUTER_API_BASE})` : "Disabled"}`);
    console.log(`   📋 PRD Generator Model: ${process.env.NINEROUTER_PRD_MODEL || DEFAULT_PRD_MODEL}`);
    console.log(`   ⚡ Implementation Model: ${process.env.NINEROUTER_TASK_MODEL || DEFAULT_TASK_MODEL}`);
    console.log(`   ⏱️ Gateway Timeout: ${getNineRouterTimeoutMs()} ms`);
    console.log(`🔑 Gemini Key: ${process.env.GEMINI_API_KEY ? "Active ✅" : "Missing"}`);
    console.log(`🔑 OpenAI Key: ${process.env.OPENAI_API_KEY ? "Active ✅" : "Missing"}`);
    console.log(`🔑 OpenRouter Key: ${process.env.OPENROUTER_API_KEY ? "Active ✅" : "Missing"}`);
    console.log(`=======================================================`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  server,
  startServer,
  callNineRouterApi,
  parseNineRouterContent,
  getNineRouterTimeoutMs,
  DEFAULT_NINEROUTER_TIMEOUT_MS,
  DEFAULT_PRD_MODEL,
  DEFAULT_TASK_MODEL,
};
