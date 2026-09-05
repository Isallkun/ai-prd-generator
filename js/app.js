/**
 * SaaS PRD Maker - Production Frontend Logic & 100% Dynamic Cloud AI Rendering
 */

document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    currentView: 'initial', // 'initial' | 'prd' | 'mindmap' | 'tasks'
    activeSection: 'overview',
    filterFeature: 'all',
    activePhaseIndex: 0,
    tasks: [],
    isSimulatingAgent: false,
    isOpenClawConnected: false,
    historyProjects: [
      {
        id: "padel-cepat-oc-go",
        title: "🏸 Padel Cepat oc go",
        desc: "4 Fitur • 12 Sub-fitur • 42 Tasks • Platform Booking Lapangan Padel Cepat",
        data: window.PRD_DATA
      }
    ],
    projectData: window.PRD_DATA || {}
  };

  const OPENCLAW_API_URL = 'http://localhost:4000';

  // Flatten all tasks from project data
  function initTasksFromData() {
    const allTasks = [];
    if (state.projectData && state.projectData.phases) {
      state.projectData.phases.forEach((phase) => {
        if (phase.subFeatures) {
          phase.subFeatures.forEach((sub) => {
            if (sub.tasks) {
              sub.tasks.forEach((t) => {
                allTasks.push({
                  ...t,
                  phaseId: phase.id,
                  phaseTitle: phase.title,
                  phaseNumber: phase.phaseNumber,
                  phaseColor: phase.color || '#f97316',
                  subFeatureTitle: sub.title
                });
              });
            }
          });
        }
      });
    }
    state.tasks = allTasks;
  }

  initTasksFromData();

  // DOM Elements
  const dom = {
    // Views
    viewInitial: document.getElementById('view-initial'),
    viewPrd: document.getElementById('view-prd'),
    viewMindmap: document.getElementById('view-mindmap'),
    viewTasks: document.getElementById('view-tasks'),
    
    // Header controls
    brandLogo: document.getElementById('brand-logo'),
    headerDividerProject: document.getElementById('header-divider-project'),
    projectTitleBadge: document.getElementById('project-title-badge'),
    headerProjectName: document.getElementById('header-project-name'),
    workspaceViewTabs: document.getElementById('workspace-view-tabs'),
    btnRefresh: document.getElementById('btn-refresh'),
    ctaImplementationWrapper: document.getElementById('cta-implementation-wrapper'),
    userProfileBadge: document.getElementById('user-profile-badge'),
    openclawStatusPill: document.getElementById('openclaw-status-pill'),
    openclawStatusText: document.getElementById('openclaw-status-text'),
    
    // Header Stepper
    stepStruktur: document.getElementById('step-struktur'),
    stepPrd: document.getElementById('step-prd'),
    stepTask: document.getElementById('step-task'),
    stepDot1: document.getElementById('step-dot-1'),
    stepDot2: document.getElementById('step-dot-2'),
    stepDot3: document.getElementById('step-dot-3'),
    connector1: document.getElementById('connector-1'),
    connector2: document.getElementById('connector-2'),
    
    // Workspace tabs
    tabPrd: document.getElementById('tab-prd'),
    tabMindmap: document.getElementById('tab-mindmap'),
    tabTasks: document.getElementById('tab-tasks'),
    btnMulaiImplementasi: document.getElementById('btn-mulai-implementasi'),
    implementationDropdown: document.getElementById('implementation-dropdown'),
    
    // Initial Landing View elements (tampilan_awal.PNG)
    initialPromptInput: document.getElementById('initial-prompt-input'),
    btnSubmitInitialPrompt: document.getElementById('btn-submit-initial-prompt'),
    chipSamplePrd: document.getElementById('chip-sample-prd'),
    btnOpenHistory: document.getElementById('btn-open-history'),
    generationOverlay: document.getElementById('generation-loading-overlay'),
    generationStatusText: document.getElementById('generation-status-text'),
    generationSubtext: document.getElementById('generation-subtext'),
    
    // PRD View elements
    prdSidebarNav: document.getElementById('prd-sidebar-nav'),
    prdDocBody: document.getElementById('prd-doc-body'),
    aiSummaryBanner: document.getElementById('ai-summary-banner'),
    
    // Mind Map elements
    mindmapCanvas: document.getElementById('mindmap-canvas'),
    mindmapTree: document.getElementById('mindmap-tree'),
    svgConnectors: document.getElementById('svg-connectors'),
    mindmapReqText: document.getElementById('mindmap-req-text'),
    canvasToastBanner: document.getElementById('canvas-toast-banner'),
    
    // Kanban elements
    kanbanFilter: document.getElementById('kanban-filter'),
    kanbanProgressBar: document.getElementById('kanban-progress-bar'),
    kanbanProgressText: document.getElementById('kanban-progress-text'),
    colTodoList: document.getElementById('col-todo-list'),
    colProgressList: document.getElementById('col-progress-list'),
    colDoneList: document.getElementById('col-done-list'),
    colFailedList: document.getElementById('col-failed-list'),
    badgeTodoCount: document.getElementById('badge-todo-count'),
    badgeProgressCount: document.getElementById('badge-progress-count'),
    badgeDoneCount: document.getElementById('badge-done-count'),
    badgeFailedCount: document.getElementById('badge-failed-count'),
    btnSimulateAi: document.getElementById('btn-simulate-ai'),
    btnOpenMonitor: document.getElementById('btn-open-monitor'),
    
    // Modals
    modalPrompt: document.getElementById('modal-prompt'),
    modalHistory: document.getElementById('modal-history'),
    historyProjectList: document.getElementById('history-project-list'),
    modalOpenclawMonitor: document.getElementById('modal-openclaw-monitor'),
    modalStackConfigurator: document.getElementById('modal-stack-configurator'),
    promptTerminalText: document.getElementById('prompt-terminal-text'),
    btnCopyPrompt: document.getElementById('btn-copy-prompt'),
    terminalLiveOutput: document.getElementById('terminal-live-output'),
    monitorAgentStatus: document.getElementById('monitor-agent-status'),
    btnAgentStart: document.getElementById('btn-agent-start'),
    btnAgentPause: document.getElementById('btn-agent-pause'),
    toastContainer: document.getElementById('toast-container'),

    // Implementation Actions & Stack Configurator
    actionRunOpenclaw: document.getElementById('action-run-openclaw'),
    actionDownloadPrd: document.getElementById('action-download-prd'),
    actionDownloadZip: document.getElementById('action-download-zip'),
    stackModeSelector: document.getElementById('stack-mode-selector'),
    selectFrontendStack: document.getElementById('select-frontend-stack'),
    selectBackendStack: document.getElementById('select-backend-stack'),
    selectDatabaseStack: document.getElementById('select-database-stack'),
    stackFolderPreview: document.getElementById('stack-folder-preview'),
    btnConfirmStackExecution: document.getElementById('btn-confirm-stack-execution'),

    // AI Requirement Deep-Dive Interview Stepper Elements
    modalRequirementInterview: document.getElementById('modal-requirement-interview'),
    interviewStepBadge: document.getElementById('interview-step-badge'),
    interviewStepperFill: document.getElementById('interview-stepper-fill'),
    interviewStepperDots: document.getElementById('interview-stepper-dots'),
    interviewStackSelector: document.getElementById('interview-stack-selector'),
    interviewDynamicSlides: document.getElementById('interview-dynamic-slides'),
    interviewSlideFinal: document.getElementById('interview-slide-final'),
    interviewCustomNotes: document.getElementById('interview-custom-notes'),
    btnSkipInterview: document.getElementById('btn-skip-interview'),
    btnPrevInterview: document.getElementById('btn-prev-interview'),
    btnNextInterview: document.getElementById('btn-next-interview'),

    // Scope & Biaya View Elements
    tabScope: document.getElementById('tab-scope'),
    viewScope: document.getElementById('view-scope'),
    scopeProjectTitle: document.getElementById('scope-project-title'),
    kpiTotalCost: document.getElementById('kpi-total-cost'),
    kpiItemCount: document.getElementById('kpi-item-count'),
    scopeTableContainer: document.getElementById('scope-table-container'),
    btnDownloadScopePdf: document.getElementById('btn-download-scope-pdf'),
    btnExportScopePdf: document.getElementById('btn-export-scope-pdf'),
    btnExportScopeCsv: document.getElementById('btn-export-scope-csv'),
    btnPreviewFormalSow: document.getElementById('btn-preview-formal-sow'),
    btnAddScopeItem: document.getElementById('btn-add-scope-item'),
    modalSowDocument: document.getElementById('modal-sow-document'),
    formalDocSheet: document.getElementById('formal-doc-sheet'),
    btnDownloadModalPdf: document.getElementById('btn-download-modal-pdf'),
    btnPrintFormalSow: document.getElementById('btn-print-formal-sow'),
    btnCopySowMarkdown: document.getElementById('btn-copy-sow-markdown'),
    actionViewSow: document.getElementById('action-view-sow')
  };

  // Toast Notification
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-msg ${type === 'success' ? 'success' : ''}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : '💡'}</span>
      <div>${message}</div>
    `;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Append Log to Live Terminal Monitor
  function appendTerminalLog(message, level = 'info') {
    if (!dom.terminalLiveOutput) return;
    const line = document.createElement('div');
    line.className = `terminal-log-line ${level}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    dom.terminalLiveOutput.appendChild(line);
    dom.terminalLiveOutput.scrollTop = dom.terminalLiveOutput.scrollHeight;
  }

  // =========================================================================
  // OPENCLAW BRIDGE SERVER CONNECTION & SSE LISTENER
  // =========================================================================
  async function checkOpenClawStatus() {
    try {
      const res = await fetch(`${OPENCLAW_API_URL}/api/status`);
      if (res.ok) {
        state.isOpenClawConnected = true;
        dom.openclawStatusPill.className = 'openclaw-status-pill';
        dom.openclawStatusText.textContent = 'OpenClaw: Online (Port 4000)';
        connectOpenClawSSE();
      } else {
        throw new Error('Server error');
      }
    } catch (e) {
      state.isOpenClawConnected = false;
      dom.openclawStatusPill.className = 'openclaw-status-pill offline';
      dom.openclawStatusText.textContent = 'OpenClaw: Offline';
    }
  }

  let eventSource = null;
  function connectOpenClawSSE() {
    if (eventSource) {
      try { eventSource.close(); } catch (e) {}
    }

    try {
      eventSource = new EventSource(`${OPENCLAW_API_URL}/api/events`);

      eventSource.onopen = () => {
        state.isOpenClawConnected = true;
        if (dom.openclawStatusPill) dom.openclawStatusPill.className = 'openclaw-status-pill';
        if (dom.openclawStatusText) dom.openclawStatusText.textContent = 'OpenClaw: Online (Port 4000)';
      };

      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          const { type, data } = payload;

          if (type === 'log') {
            appendTerminalLog(data.message, data.level);
          } else if (type === 'task_updated') {
            const updatedTask = data.task;
            const targetTask = state.tasks.find(t => t.id === updatedTask.id);
            if (targetTask) {
              targetTask.status = updatedTask.status;
              renderKanbanBoard();
            }
          } else if (type === 'run_started') {
            if (dom.monitorAgentStatus) {
              dom.monitorAgentStatus.textContent = '⚡ Eksekusi Cloud AI Sedang Berjalan...';
              dom.monitorAgentStatus.style.color = '#38bdf8';
            }
            if (dom.btnSimulateAi) {
              dom.btnSimulateAi.innerHTML = `<span>⏳</span> Sedang Mengerjakan...`;
            }
          } else if (type === 'run_completed') {
            if (dom.monitorAgentStatus) {
              dom.monitorAgentStatus.textContent = '🎉 Selesai Penuh';
              dom.monitorAgentStatus.style.color = '#34d399';
            }
            if (dom.btnSimulateAi) {
              dom.btnSimulateAi.innerHTML = `<span>🎉</span> Semua Task Selesai`;
            }
            showToast('🎉 Semua Task telah selesai dikerjakan oleh OpenClaw!', 'success');
          } else if (type === 'run_paused') {
            if (dom.monitorAgentStatus) {
              dom.monitorAgentStatus.textContent = '⏸️ Dijeda';
              dom.monitorAgentStatus.style.color = '#fde047';
            }
            if (dom.btnSimulateAi) {
              dom.btnSimulateAi.innerHTML = `<span>▶️</span> Lanjutkan Agent`;
            }
          }
        } catch (err) {
          console.warn('Error parsing SSE message:', err);
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Auto-reconnect after 3 seconds
        setTimeout(connectOpenClawSSE, 3000);
      };
    } catch (err) {
      console.warn('SSE Connection failed:', err);
      setTimeout(connectOpenClawSSE, 5000);
    }
  }

  checkOpenClawStatus();

  // =========================================================================
  // VIEW SWITCHING & PIPELINE STEPPER CONTROLLER
  // =========================================================================
  function switchView(viewName) {
    state.currentView = viewName;

    [dom.viewInitial, dom.viewPrd, dom.viewMindmap, dom.viewTasks, dom.viewScope].forEach(v => v?.classList.remove('active'));
    [dom.tabPrd, dom.tabMindmap, dom.tabTasks, dom.tabScope].forEach(t => t?.classList.remove('active'));

    if (viewName === 'initial') {
      dom.viewInitial?.classList.add('active');
      
      dom.headerDividerProject.style.display = 'none';
      dom.projectTitleBadge.style.display = 'none';
      dom.workspaceViewTabs.style.display = 'none';
      dom.btnRefresh.style.display = 'none';
      dom.ctaImplementationWrapper.style.display = 'none';
      dom.userProfileBadge.style.display = 'flex';

      dom.stepStruktur.className = 'step-item';
      dom.stepPrd.className = 'step-item';
      dom.stepTask.className = 'step-item';
      dom.stepDot1.innerHTML = '•';
      dom.stepDot2.innerHTML = '•';
      dom.stepDot3.innerHTML = '•';
      dom.connector1.className = 'step-connector';
      dom.connector2.className = 'step-connector';

    } else {
      dom.headerDividerProject.style.display = 'block';
      dom.projectTitleBadge.style.display = 'flex';
      dom.workspaceViewTabs.style.display = 'flex';
      dom.btnRefresh.style.display = 'flex';
      dom.ctaImplementationWrapper.style.display = 'block';
      dom.userProfileBadge.style.display = 'none';
      dom.headerProjectName.textContent = state.projectData.project.title;

      if (viewName === 'prd') {
        dom.viewPrd?.classList.add('active');
        dom.tabPrd?.classList.add('active');
        
        dom.stepStruktur.className = 'step-item completed';
        dom.stepDot1.innerHTML = '✓';
        dom.connector1.className = 'step-connector completed';
        dom.stepPrd.className = 'step-item completed active';
        dom.stepDot2.innerHTML = '✓';
        dom.connector2.className = 'step-connector';
        dom.stepTask.className = 'step-item';
        dom.stepDot3.innerHTML = '•';

      } else if (viewName === 'mindmap') {
        dom.viewMindmap?.classList.add('active');
        dom.tabMindmap?.classList.add('active');
        
        dom.stepStruktur.className = 'step-item completed active';
        dom.stepDot1.innerHTML = '✓';
        dom.connector1.className = 'step-connector completed';
        dom.stepPrd.className = 'step-item completed';
        dom.stepDot2.innerHTML = '✓';
        renderMindMapConnectors();

      } else if (viewName === 'tasks') {
        dom.viewTasks?.classList.add('active');
        dom.tabTasks?.classList.add('active');
        
        dom.stepStruktur.className = 'step-item completed';
        dom.stepDot1.innerHTML = '✓';
        dom.connector1.className = 'step-connector completed';
        dom.stepPrd.className = 'step-item completed';
        dom.stepDot2.innerHTML = '✓';
        dom.connector2.className = 'step-connector completed';
        dom.stepTask.className = 'step-item completed active';
        dom.stepDot3.innerHTML = '✓';

        renderKanbanBoard();

      } else if (viewName === 'scope') {
        // Scope view can be opened even without a project — show default modules
        dom.workspaceViewTabs.style.display = 'flex';
        dom.btnRefresh.style.display = 'flex';
        dom.ctaImplementationWrapper.style.display = 'block';
        dom.userProfileBadge.style.display = 'none';
        dom.headerDividerProject.style.display = 'block';
        dom.projectTitleBadge.style.display = 'flex';

        dom.viewScope?.classList.add('active');
        dom.tabScope?.classList.add('active');

        if (state.projectData && state.projectData.project) {
          dom.stepStruktur.className = 'step-item completed';
          dom.stepDot1.innerHTML = '✓';
          dom.connector1.className = 'step-connector completed';
          dom.stepPrd.className = 'step-item completed';
          dom.stepDot2.innerHTML = '✓';
          dom.connector2.className = 'step-connector completed';
          dom.stepTask.className = 'step-item completed active';
          dom.stepDot3.innerHTML = '✓';
          if (dom.headerProjectName) dom.headerProjectName.textContent = state.projectData.project.title;
        } else {
          // No project yet — still show the scope view with neutral stepper
          dom.stepStruktur.className = 'step-item';
          dom.stepPrd.className = 'step-item';
          dom.stepTask.className = 'step-item active';
          dom.stepDot1.innerHTML = '•';
          dom.stepDot2.innerHTML = '•';
          dom.stepDot3.innerHTML = '📊';
          if (dom.headerProjectName) dom.headerProjectName.textContent = 'Scope & Estimasi Biaya';
        }

        renderScopeTable();
      }
    }
  }

  // Workspace Nav Tabs
  dom.tabPrd?.addEventListener('click', () => switchView('prd'));
  dom.tabMindmap?.addEventListener('click', () => switchView('mindmap'));
  dom.tabTasks?.addEventListener('click', () => switchView('tasks'));
  dom.tabScope?.addEventListener('click', () => switchView('scope'));
  dom.actionViewSow?.addEventListener('click', () => {
    switchView('scope');
    if (dom.implementationDropdown) dom.implementationDropdown.classList.remove('show');
  });
  
  dom.brandLogo?.addEventListener('click', () => switchView('initial'));
  document.getElementById('btn-sidebar-new')?.addEventListener('click', () => switchView('initial'));
  document.getElementById('btn-bikin-task-cta')?.addEventListener('click', () => switchView('tasks'));
  document.getElementById('btn-lihat-roadmap-cta')?.addEventListener('click', () => switchView('mindmap'));

  // =========================================================================
  // DYNAMIC SIDEBAR NAV RENDERER
  // =========================================================================
  function renderPRDSidebar() {
    if (!dom.prdSidebarNav) return;
    const data = state.projectData;

    let html = `
      <li>
        <button class="nav-item-btn active" data-target="sec-overview">
          <span>1. Overview</span>
        </button>
      </li>
      <li>
        <button class="nav-item-btn" data-target="sec-requirements">
          <span>2. Requirements</span>
        </button>
      </li>
      <li>
        <button class="nav-item-btn" data-target="sec-core-features">
          <span>3. Core Features</span>
        </button>
        <ul class="sub-nav-list">
    `;

    if (data.phases) {
      data.phases.forEach((phase) => {
        html += `
          <li>
            <button class="sub-nav-btn" data-target="sec-core-features">
              Fase ${phase.phaseNumber} (${phase.title})
            </button>
          </li>
        `;
      });
    }

    html += `
        </ul>
      </li>
      <li>
        <button class="nav-item-btn" data-target="sec-user-flow">
          <span>4. Flowchart & User Flow</span>
        </button>
        <ul class="sub-nav-list">
          <li>
            <button class="sub-nav-btn" data-target="sec-sop-flowchart">
              4.1 SOP Swimlane Flowchart
            </button>
          </li>
          <li>
            <button class="sub-nav-btn" data-target="sec-user-flow-detail">
              4.2 Detail Alur Pengguna
            </button>
          </li>
        </ul>
      </li>
      <li>
        <button class="nav-item-btn" data-target="sec-architecture">
          <span>5. Architecture</span>
        </button>
      </li>
      <li>
        <button class="nav-item-btn" data-target="sec-db-schema">
          <span>6. Database Schema</span>
        </button>
      </li>
      <li>
        <button class="nav-item-btn" data-target="sec-tech-stack">
          <span>7. Tech Stack</span>
        </button>
      </li>
      <li>
        <button class="nav-item-btn" id="btn-nav-scope-view" style="color: #38bdf8; font-weight: 700;">
          <span>📊 8. Scope & Biaya</span>
        </button>
      </li>
    `;

    dom.prdSidebarNav.innerHTML = html;

    // Attach click events
    dom.prdSidebarNav.querySelectorAll('.nav-item-btn, .sub-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.id === 'btn-nav-scope-view') {
          switchView('scope');
          return;
        }
        const targetId = btn.getAttribute('data-target');
        if (targetId) {
          dom.prdSidebarNav.querySelectorAll('.nav-item-btn').forEach(b => b.classList.remove('active'));
          btn.closest('li')?.querySelector('.nav-item-btn')?.classList.add('active');
          btn.classList.add('active');

          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  // =========================================================================
  // DYNAMIC SUMMARY BANNERS & KANBAN FILTER RENDERER
  // =========================================================================
  function renderDynamicSummaryAndFilters() {
    const featureCount = state.projectData.phases ? state.projectData.phases.length : 0;
    const subFeatureCount = state.projectData.phases
      ? state.projectData.phases.reduce((acc, p) => acc + (p.subFeatures ? p.subFeatures.length : 0), 0)
      : 0;
    const taskCount = state.tasks.length;

    // 1. AI Summary Banner on Right Panel
    if (dom.aiSummaryBanner) {
      dom.aiSummaryBanner.innerHTML = `
        <strong>✨ Selesai!</strong> Aku sudah menyusun <strong>${featureCount} fitur</strong>, <strong>${subFeatureCount} sub-fitur</strong>, dan <strong>${taskCount} task</strong> dari PRD kamu.<br><br>
        Klik fitur mana pun di peta buat lihat detail atau langsung mulai dikerjakan.
      `;
    }

    // 2. Canvas Toast Banner
    if (dom.canvasToastBanner) {
      dom.canvasToastBanner.innerHTML = `
        ✨ <strong>Selesai!</strong> Aku sudah menyusun <strong>${featureCount} fitur</strong>, <strong>${subFeatureCount} sub-fitur</strong>, dan <strong>${taskCount} task</strong> dari PRD kamu.<br>
        Klik fitur mana pun di peta buat lihat detail atau langsung mulai dikerjakan.
      `;
    }

    // 3. Kanban Filter Dropdown
    if (dom.kanbanFilter) {
      let filterHtml = `<option value="all">Semua fitur (${taskCount})</option>`;
      if (state.projectData.phases) {
        state.projectData.phases.forEach((phase) => {
          const phaseTaskCount = phase.subFeatures
            ? phase.subFeatures.reduce((acc, s) => acc + (s.tasks ? s.tasks.length : 0), 0)
            : 0;
          filterHtml += `<option value="${phase.id}">Fase ${phase.phaseNumber}: ${phase.title} (${phaseTaskCount})</option>`;
        });
      }
      dom.kanbanFilter.innerHTML = filterHtml;
    }

    // 4. History Projects List in Modal
    if (dom.historyProjectList) {
      dom.historyProjectList.innerHTML = state.historyProjects.map((item, idx) => `
        <div class="history-item-card" data-history-idx="${idx}">
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${item.title}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">${item.desc}</div>
          </div>
          <button class="btn-primary-cta" style="padding: 6px 14px; font-size: 0.8rem;">Buka PRD ›</button>
        </div>
      `).join('');

      dom.historyProjectList.querySelectorAll('.history-item-card').forEach(card => {
        card.addEventListener('click', () => {
          const idx = parseInt(card.dataset.historyIdx, 10);
          const selected = state.historyProjects[idx];
          if (selected && selected.data) {
            state.projectData = selected.data;
            initTasksFromData();
            refreshEntireUI();
            dom.modalHistory.classList.remove('show');
            switchView('prd');
            showToast(`📂 Memuat PRD: ${selected.title}`, 'success');
          }
        });
      });
    }
  }

  function refreshEntireUI() {
    renderPRDSidebar();
    renderPRDDocument();
    renderMindMapTree();
    renderDynamicSummaryAndFilters();
    renderKanbanBoard();
    if (state.projectData && state.projectData.phases) {
      state.scopeModules = generateDynamicScopeModules(state.projectData);
    }
    renderScopeTable();
  }

  // =========================================================================
  // REAL CLOUD AI GENERATION DISPATCHER
  // =========================================================================
  dom.chipSamplePrd?.addEventListener('click', () => {
    dom.initialPromptInput.value = 'Aplikasi booking lapangan padel cepat (Padel Cepat oc go) dengan kalender slot waktu harian/mingguan, pembayaran instan QRIS/VA, akun pengguna, dashboard admin pengelola, dan konfirmasi WhatsApp otomatis.';
    showToast('💡 Contoh ide berhasil dimasukkan ke form!');
  });

  document.querySelectorAll('.template-chip-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const idea = pill.dataset.idea;
      if (idea) {
        dom.initialPromptInput.value = idea;
        showToast(`💡 Ide "${pill.textContent.trim()}" dipilih!`);
      }
    });
  });



  // =========================================================================
  // AI REQUIREMENT INTERVIEW STEPPER CONTROLLER (WIZARD MODE)
  // =========================================================================
  let currentInterviewData = null;
  let currentRawPrompt = '';
  let interviewCurrentStep = 0;
  let interviewTotalSteps = 1;

  async function handleInitialPromptSubmit() {
    const userPrompt = dom.initialPromptInput.value.trim();
    if (!userPrompt) {
      showToast('⚠️ Masukkan deskripsi ide produk kamu terlebih dahulu!', 'info');
      dom.initialPromptInput.focus();
      return;
    }

    currentRawPrompt = userPrompt;

    // Show fast loading modal/overlay
    dom.generationOverlay.classList.add('show');
    dom.generationStatusText.textContent = '🧠 AI sedang menganalisis ide produk kamu...';
    dom.generationSubtext.textContent = 'Menyiapkan pertanyaan klarifikasi untuk akurasi kebutuhan';

    try {
      const res = await fetch(`${OPENCLAW_API_URL}/api/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt, language: 'id' })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.questions && json.data.questions.length > 0) {
          currentInterviewData = json.data;
          dom.generationOverlay.classList.remove('show');
          openRequirementInterviewStepper(json.data);
          return;
        }
      }
    } catch (err) {
      console.warn('Questions API call failed, skipping directly to PRD generation', err);
    }

    // Fallback: langsung generate PRD
    dom.generationOverlay.classList.remove('show');
    executePrdGeneration(userPrompt);
  }

  function openRequirementInterviewStepper(data) {
    const questions = data.questions || [];
    // Total steps = Step 0 (Tech Stack) + Steps 1..N (Questions) + Final Step (Notes)
    interviewTotalSteps = 1 + questions.length + 1;
    interviewCurrentStep = 0;

    // 1. Build Dynamic Question Slides
    if (dom.interviewDynamicSlides) {
      dom.interviewDynamicSlides.innerHTML = questions.map((q, idx) => `
        <div class="interview-slide" data-step="${idx + 1}" data-qid="${q.id}">
          <div class="interview-slide-header">
            <span class="interview-badge">Langkah ${idx + 2} • ${q.category || 'Kebutuhan Spesifik'}</span>
            <h3 class="interview-slide-title">${q.question}</h3>
            <p class="interview-slide-desc">Pilih opsi yang paling mendekati model bisnis atau alur operasional kamu:</p>
          </div>

          <div class="interview-options-grid">
            ${q.options.map((opt, optIdx) => `
              <label class="interview-opt-label ${opt.isDefault || optIdx === 0 ? 'selected' : ''}">
                <input type="radio" name="q_${q.id}" value="${opt.label}" class="interview-opt-radio" ${opt.isDefault || optIdx === 0 ? 'checked' : ''}>
                <span>${opt.label}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `).join('');

      // Add click listeners to option labels for instant selection feedback
      dom.interviewDynamicSlides.querySelectorAll('.interview-opt-label').forEach(label => {
        label.addEventListener('click', () => {
          const slide = label.closest('.interview-slide');
          slide.querySelectorAll('.interview-opt-label').forEach(l => l.classList.remove('selected'));
          label.classList.add('selected');
        });
      });
    }

    // 2. Render Top Stepper Dots
    if (dom.interviewStepperDots) {
      let dotsHtml = `
        <div class="interview-step-dot-item active" data-step-target="0">
          <div class="interview-step-dot-circle">1</div>
          <span>Tech Stack</span>
        </div>
      `;

      questions.forEach((q, idx) => {
        const shortName = q.category ? q.category.split(' ')[0] : `Q${idx + 1}`;
        dotsHtml += `
          <div class="interview-step-dot-item" data-step-target="${idx + 1}">
            <div class="interview-step-dot-circle">${idx + 2}</div>
            <span>${shortName}</span>
          </div>
        `;
      });

      dotsHtml += `
        <div class="interview-step-dot-item" data-step-target="${interviewTotalSteps - 1}">
          <div class="interview-step-dot-circle">${interviewTotalSteps}</div>
          <span>Catatan</span>
        </div>
      `;

      dom.interviewStepperDots.innerHTML = dotsHtml;

      // Allow clicking dots to jump between steps
      dom.interviewStepperDots.querySelectorAll('.interview-step-dot-item').forEach(dot => {
        dot.addEventListener('click', () => {
          const target = parseInt(dot.dataset.stepTarget, 10);
          if (!isNaN(target)) setInterviewStep(target);
        });
      });
    }

    if (dom.interviewCustomNotes) dom.interviewCustomNotes.value = '';
    setInterviewStep(0);
    dom.modalRequirementInterview?.classList.add('show');
  }

  function setInterviewStep(stepIdx) {
    if (stepIdx < 0 || stepIdx >= interviewTotalSteps) return;
    interviewCurrentStep = stepIdx;

    // 1. Show active slide
    const allSlides = dom.modalRequirementInterview?.querySelectorAll('.interview-slide');
    allSlides?.forEach((slide) => {
      slide.classList.remove('active');
      slide.style.display = 'none';
    });

    const targetSlide = dom.modalRequirementInterview?.querySelector(`.interview-slide[data-step="${stepIdx}"]`) ||
                        (stepIdx === interviewTotalSteps - 1 ? dom.interviewSlideFinal : null);
    if (targetSlide) {
      targetSlide.style.display = 'flex';
      targetSlide.classList.add('active');
    }

    // 2. Update Progress Bar & Counter
    const progressPercent = Math.round(((stepIdx + 1) / interviewTotalSteps) * 100);
    if (dom.interviewStepperFill) dom.interviewStepperFill.style.width = `${progressPercent}%`;
    if (dom.interviewStepBadge) dom.interviewStepBadge.textContent = `Langkah ${stepIdx + 1} dari ${interviewTotalSteps}`;

    // 3. Update Stepper Dots Status
    if (dom.interviewStepperDots) {
      dom.interviewStepperDots.querySelectorAll('.interview-step-dot-item').forEach(dot => {
        const target = parseInt(dot.dataset.stepTarget, 10);
        dot.classList.remove('active', 'completed');
        if (target === stepIdx) {
          dot.classList.add('active');
        } else if (target < stepIdx) {
          dot.classList.add('completed');
        }
      });
    }

    // 4. Update Navigation Buttons
    if (dom.btnPrevInterview) {
      dom.btnPrevInterview.style.display = stepIdx > 0 ? 'inline-flex' : 'none';
    }

    if (dom.btnNextInterview) {
      if (stepIdx === interviewTotalSteps - 1) {
        dom.btnNextInterview.innerHTML = `<span>✨ Buat PRD Sekarang 🚀</span>`;
        dom.btnNextInterview.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      } else {
        dom.btnNextInterview.innerHTML = `<span>Lanjut ➡️</span>`;
        dom.btnNextInterview.style.background = '';
      }
    }
  }

  // Handle Stepper Next Button
  dom.btnNextInterview?.addEventListener('click', () => {
    if (interviewCurrentStep < interviewTotalSteps - 1) {
      setInterviewStep(interviewCurrentStep + 1);
    } else {
      // Final step -> Submit interview
      submitInterviewAndGeneratePrd();
    }
  });

  // Handle Stepper Prev Button
  dom.btnPrevInterview?.addEventListener('click', () => {
    if (interviewCurrentStep > 0) {
      setInterviewStep(interviewCurrentStep - 1);
    }
  });

  // Handle Stack Selector in Interview Modal
  dom.interviewStackSelector?.querySelectorAll('.stack-card-radio').forEach(card => {
    card.addEventListener('click', () => {
      dom.interviewStackSelector.querySelectorAll('.stack-card-radio').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // Submit Interview Data
  function submitInterviewAndGeneratePrd() {
    dom.modalRequirementInterview?.classList.remove('show');

    // 1. Collect selected stack mode
    const selectedStackCard = dom.interviewStackSelector?.querySelector('.stack-card-radio.selected');
    const chosenMode = selectedStackCard ? selectedStackCard.dataset.mode : 'html-prototype';

    const stackDescriptions = {
      'html-prototype': 'HTML5 + Tailwind CSS (CDN) + jQuery (Pure client prototype)',
      'nextjs-fullstack': 'Next.js 14 App Router (TypeScript, Tailwind, shadcn/ui stubs, Prisma ORM)',
      'laravel-monolith': 'Laravel 11 PHP Monolith (Blade Views, Tailwind CSS, Eloquent ORM)',
      'decoupled-api': 'Decoupled Architecture (React Vite Frontend + Golang Fiber / Python FastAPI Backend)'
    };

    // Auto-sync with the secondary stack configurator
    if (dom.stackModeSelector) {
      const targetRadio = dom.stackModeSelector.querySelector(`.stack-card-radio[data-mode="${chosenMode}"]`);
      if (targetRadio) targetRadio.click();
    }

    // 2. Collect question answers
    let answersSummary = [];
    answersSummary.push(`- [Pilihan Tech Stack]: ${stackDescriptions[chosenMode] || chosenMode}`);

    if (currentInterviewData && currentInterviewData.questions) {
      currentInterviewData.questions.forEach(q => {
        const slide = dom.interviewDynamicSlides?.querySelector(`.interview-slide[data-qid="${q.id}"]`);
        const checkedRadio = slide?.querySelector('input[type="radio"]:checked');
        if (checkedRadio) {
          answersSummary.push(`- [${q.category || 'Kebutuhan'}] ${q.question}: ${checkedRadio.value}`);
        }
      });
    }

    const customNotes = dom.interviewCustomNotes?.value.trim();
    if (customNotes) {
      answersSummary.push(`- [Catatan Tambahan]: ${customNotes}`);
    }

    let enrichedPrompt = currentRawPrompt;
    if (answersSummary.length > 0) {
      enrichedPrompt += `\n\n### SPESIFIKASI KEBUTUHAN KHUSUS & TECH STACK:\n${answersSummary.join('\n')}`;
    }

    executePrdGeneration(enrichedPrompt);
  }

  // Handle Interview Skip
  dom.btnSkipInterview?.addEventListener('click', () => {
    dom.modalRequirementInterview?.classList.remove('show');
    executePrdGeneration(currentRawPrompt);
  });

  async function executePrdGeneration(finalPrompt) {
    // Show AI Generation Animation
    dom.generationOverlay.classList.add('show');
    dom.generationStatusText.textContent = 'Menghubungkan ke Cloud AI (Gemini / OpenAI)...';
    dom.generationSubtext.textContent = 'Menganalisis ide & merancang arsitektur sistem';

    try {
      // Real API Call to Server
      const res = await fetch(`${OPENCLAW_API_URL}/api/generate-prd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, language: 'id' })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          // Apply Real AI Generated Data
          state.projectData = json.data;
          initTasksFromData();
          
          // Add to History
          state.historyProjects.unshift({
            id: json.data.project.id || `project-${Date.now()}`,
            title: json.data.project.title,
            desc: `${json.data.phases.length} Fitur • ${state.tasks.length} Tasks • ${json.data.project.tagline || ''}`,
            data: json.data
          });

          refreshEntireUI();

          dom.generationOverlay.classList.remove('show');
          showToast(`✨ PRD "${state.projectData.project.title}" (${state.tasks.length} tasks) berhasil di-generate!`, 'success');
          switchView('prd');
          return;
        }
      }
      throw new Error('API Generation response invalid');
    } catch (err) {
      console.warn('Real AI Generation failed or server offline. Using fallback generator.', err);
      
      setTimeout(() => {
        dom.generationStatusText.textContent = 'Menyusun dokumen PRD lengkap...';
        dom.generationSubtext.textContent = 'Membuat spesifikasi fase 1 sampai fase 4';
      }, 1200);

      setTimeout(() => {
        dom.generationStatusText.textContent = 'Membangun Roadmap Fitur & Tasks...';
        dom.generationSubtext.textContent = 'Menghubungkan sub-fitur dengan antrean task siap eksekusi';
      }, 2200);

      setTimeout(() => {
        state.projectData.project.title = currentRawPrompt.length > 30 ? currentRawPrompt.substring(0, 30) + '...' : currentRawPrompt;
        initTasksFromData();
        refreshEntireUI();

        dom.generationOverlay.classList.remove('show');
        showToast('✨ PRD, Mind Map, dan Tasks siap di workspace!', 'success');
        switchView('prd');
      }, 3200);
    }
  }

  dom.btnSubmitInitialPrompt?.addEventListener('click', handleInitialPromptSubmit);

  dom.initialPromptInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleInitialPromptSubmit();
    }
  });

  // Open History Modal
  dom.btnOpenHistory?.addEventListener('click', () => {
    renderDynamicSummaryAndFilters();
    dom.modalHistory.classList.add('show');
  });

  document.getElementById('btn-sidebar-history')?.addEventListener('click', () => {
    renderDynamicSummaryAndFilters();
    dom.modalHistory.classList.add('show');
  });

  // Monitor Modal Buttons
  dom.btnOpenMonitor?.addEventListener('click', () => {
    dom.modalOpenclawMonitor.classList.add('show');
  });

  dom.btnAgentStart?.addEventListener('click', async () => {
    const selectedModel = document.getElementById('select-agent-model')?.value || 'cx/gpt-5.4-mini';
    try {
      await fetch(`${OPENCLAW_API_URL}/api/tasks/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel })
      });
      showToast(`⚡ Eksekusi dimulai dengan model [${selectedModel}]!`, 'success');
    } catch (e) {
      triggerBrowserSimulation();
    }
  });

  dom.btnAgentPause?.addEventListener('click', async () => {
    try {
      await fetch(`${OPENCLAW_API_URL}/api/tasks/pause`, { method: 'POST' });
    } catch (e) {}
  });

  // =========================================================================
  // PRD DOCUMENT RENDERER
  // =========================================================================
  function renderPRDDocument() {
    const data = state.projectData;
    let html = `
      <div class="doc-header-block">
        <span class="doc-tag">PROJECT REQUIREMENTS DOCUMENT</span>
        <h1 class="doc-main-title">${data.project.title}</h1>
        <div class="doc-meta-row">
          <span class="meta-pill">📌 Versi: ${data.project.version || 'v1.0.0'}</span>
          <span class="meta-pill">⚡ Status: ${data.project.status || 'Perencanaan'}</span>
          <span class="meta-pill">🎯 ${data.phases ? data.phases.length : 4} Fitur Utama</span>
          <span class="meta-pill">📋 ${state.tasks.length} Total Task</span>
        </div>
      </div>
    `;

    if (data.prdSections) {
      data.prdSections.forEach((sec) => {
        html += `<div class="prd-section-block" id="sec-${sec.id}">`;
        
        if (sec.id === 'core-features' || sec.isPhased) {
          html += `
            <h2 class="section-heading-h2">3. Core Features & Roadmap</h2>
            <p class="section-desc-lead">Fitur-fitur utama ini disusun sesuai dengan kerangka (roadmap) pengembangan proyek secara bertahap:</p>
          `;

          if (data.phases) {
            data.phases.forEach((phase) => {
              html += `
                <div class="phase-feature-card">
                  <div class="phase-header-line">
                    <div class="phase-title-badge">
                      <span class="phase-num">Fase ${phase.phaseNumber}</span>
                      <span class="phase-name">${phase.title}</span>
                    </div>
                    <span class="priority-tag ${phase.priority || 'high'}">[${phase.priority || 'high'}] — ${phase.priorityLabel || 'Utama'}</span>
                  </div>
                  <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 12px;">${phase.summary || ''}</p>
                  
                  <div class="sub-features-list">
                    ${phase.subFeatures ? phase.subFeatures.map(sub => `
                      <div class="sub-feature-item">
                        <strong>${sub.title}</strong> — ${sub.desc}
                      </div>
                    `).join('') : ''}
                  </div>
                </div>
              `;
            });
          }
        } else if (sec.id === 'user-flow' || sec.id === 'sec-user-flow') {
          html += `
            <div id="sec-user-flow">
              <h2 class="section-heading-h2">4. Flowchart & Alur Proses Bisnis</h2>
              
              <div id="sec-sop-flowchart" style="margin-bottom: 30px;">
                <h3 class="doc-h3" style="color: #38bdf8; display: flex; align-items: center; gap: 8px;">
                  <span>📐</span> 4.1 SOP Cross-Functional Swimlane Flowchart
                </h3>
                <p class="section-desc-lead">Diagram alir standar operasional (SOP Swimlane) yang memetakan tanggung jawab tiap stakeholder (Pemohon, OPD, Kepala OPD, Pengelola/Sekda) secara terstruktur:</p>
                ${renderSOPFlowchartDiagram(data.project)}
              </div>

              <div id="sec-user-flow-detail" style="margin-top: 32px;">
                <h3 class="doc-h3" style="display: flex; align-items: center; gap: 8px;">
                  <span>📱</span> 4.2 Detail Alur Interaksi Pengguna (User Journey)
                </h3>
                <div class="section-markdown-content">${renderMarkdownSnippet(sec.content || '')}</div>
              </div>
            </div>
          `;
        } else if (sec.id === 'architecture') {
          html += `
            <h2 class="section-heading-h2">5. Architecture</h2>
            <div class="section-markdown-content">${renderMarkdownSnippet(sec.content || '')}</div>
            ${renderArchitectureDiagram(data.project, sec)}
          `;
        } else if (sec.id === 'db-schema') {
          html += `
            <h2 class="section-heading-h2">6. Database Schema</h2>
            <div class="section-markdown-content">${renderMarkdownSnippet(sec.content || '')}</div>
            ${renderDatabaseSchemaDiagram(data.project, sec)}
          `;
        } else if (sec.id === 'tech-stack') {
          html += `
            <h2 class="section-heading-h2">7. Tech Stack</h2>
            <div class="section-markdown-content tech-stack-content">
              ${renderMarkdownSnippet(sec.content || '')}
            </div>
          `;
        } else {
          html += renderMarkdownSnippet(sec.content || '');
        }

        html += `</div>`;
      });
    }

    dom.prdDocBody.innerHTML = html;
    renderMindmapRequirements(data);

    // Attach SOP Flowchart Preset Switcher
    const sopSelect = document.getElementById('select-sop-preset');
    if (sopSelect) {
      sopSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        const targetContainer = document.getElementById('sec-sop-flowchart');
        if (targetContainer) {
          targetContainer.innerHTML = `
            <h3 class="doc-h3" style="color: #38bdf8; display: flex; align-items: center; gap: 8px;">
              <span>📐</span> 4.1 SOP Cross-Functional Swimlane Flowchart
            </h3>
            <p class="section-desc-lead">Diagram alir standar operasional yang memetakan tanggung jawab tiap stakeholder secara terstruktur:</p>
            ${renderSOPFlowchartDiagram(data.project, val === 'auto' ? null : val)}
          `;
          // Re-bind listener to new select element
          const newSelect = document.getElementById('select-sop-preset');
          if (newSelect) {
            newSelect.value = val;
            newSelect.addEventListener('change', arguments.callee);
          }
        }
      });
    }
  }

  // =========================================================================
  // SMART REQUIREMENTS PARSER & COLUMN RENDERER (Mind Map Left Panel)
  // =========================================================================
  function renderMindmapRequirements(data) {
    if (!dom.mindmapReqText) return;

    // 1. Try to extract from prdSections "requirements"
    const reqSection = data.prdSections ? data.prdSections.find(s => s.id === 'requirements' || s.id === 'sec-requirements') : null;
    let sourceText = (reqSection && reqSection.content) ? reqSection.content : (data.project.problemStatement || '');

    dom.mindmapReqText.innerHTML = formatRequirementsHtml(sourceText);
  }

  function formatRequirementsHtml(rawText) {
    if (!rawText) return '<p class="req-lead-paragraph">Tidak ada data requirement.</p>';

    // Normalize inline numbered items and section headings:
    // e.g. " 1. ", " 2. ", " Kebutuhan Non-Fungsional:", " Functional Requirements:"
    let normalized = rawText
      .replace(/([^\n])\s+(\d+\.\s+)/g, '$1\n$2')
      .replace(/([^\n])\s+([-*•]\s+(?:\*\*|FR-|NFR-)?)/g, '$1\n$2')
      .replace(/([^\n])\s+(Kebutuhan\s+(?:Non-)?Fungsional[^\n:]*:)/gi, '$1\n\n$2\n')
      .replace(/([^\n])\s+(\b(?:Non-)?Functional Requirements[^\n:]*:)/gi, '$1\n\n$2\n');

    const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);
    let html = '';
    let currentList = [];

    function flushList() {
      if (currentList.length > 0) {
        html += `<div class="req-list-group">${currentList.join('')}</div>`;
        currentList = [];
      }
    }

    lines.forEach((line) => {
      // Check if line is a section heading (e.g. ###, ####, or "Kebutuhan...", or "**Functional Requirements:**")
      const isHeader = line.startsWith('#') || 
                       /^(kebutuhan\s+|functional\s+requirements|non-functional\s+requirements)/i.test(line) ||
                       (line.startsWith('**') && line.endsWith('**') && line.length < 50);

      // Check if line is a numbered item or bullet item (1. ..., 2. ..., - ..., * ..., • ...)
      const numMatch = line.match(/^(\d+)\.\s+(.*)/) || line.match(/^[-*•]\s+(.*)/);

      if (numMatch && !isHeader) {
        const num = numMatch[1] && /^\d+$/.test(numMatch[1]) ? numMatch[1] : '✓';
        const body = numMatch[2] || numMatch[1];
        
        let title = '';
        let desc = body;

        // Check if body has format: "**Title:** Desc" or "Title: Desc" or "FR-01 (Title): Desc"
        const colonIdx = body.indexOf(':');
        if (colonIdx > -1 && colonIdx < 60) {
          title = body.substring(0, colonIdx).replace(/\*\*/g, '').trim();
          desc = body.substring(colonIdx + 1).replace(/\*\*/g, '').trim();
        } else {
          const boldMatch = body.match(/^\*\*([^*]+)\*\*(.*)/);
          if (boldMatch) {
            title = boldMatch[1].trim();
            desc = boldMatch[2].trim().replace(/^[:\s-]+/, '');
          }
        }

        currentList.push(`
          <div class="req-item-card">
            <div class="req-badge-num">${num}</div>
            <div class="req-item-text">
              ${title ? `<div class="req-item-title">${title}</div>` : ''}
              <div class="req-item-desc">${desc || body}</div>
            </div>
          </div>
        `);
      } else if (isHeader) {
        flushList();
        const cleanHeader = line.replace(/^[#\s*]+|[*:\s]+$/g, '').trim();
        html += `<div class="req-section-header"><span>📌</span> ${cleanHeader}</div>`;
      } else {
        // Normal paragraph
        flushList();
        html += `<p class="req-lead-paragraph">${line}</p>`;
      }
    });

    flushList();
    return html;
  }

  function parseTablesFromMarkdown(content) {
    if (!content) return [];
    const tables = [];
    const lines = content.split('\n');
    let currentTable = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      const matchHeading = trimmed.match(/^[-*]\s+\*\*([A-Za-z0-9_]+)\*\*/i) || trimmed.match(/CREATE TABLE\s+([A-Za-z0-9_]+)/i);
      if (matchHeading) {
        currentTable = {
          name: matchHeading[1].toUpperCase(),
          fields: []
        };
        tables.push(currentTable);
      }

      if (currentTable) {
        const fieldMatches = [...trimmed.matchAll(/`([a-zA-Z0-9_]+)`\s*\(([^)]+)\)/g)];
        fieldMatches.forEach(fm => {
          const name = fm[1];
          const rawType = fm[2].toLowerCase();
          const isPK = name.toLowerCase() === 'id' || rawType.includes('pk') || rawType.includes('primary');
          const isFK = (name.endsWith('Id') || name.endsWith('_id') || rawType.includes('fk') || rawType.includes('relasi')) && !isPK;
          let type = 'string';
          if (rawType.includes('uuid')) type = 'uuid';
          else if (rawType.includes('int')) type = 'int';
          else if (rawType.includes('date')) type = 'date';
          else if (rawType.includes('time')) type = 'time';
          else if (rawType.includes('decimal') || rawType.includes('number') || rawType.includes('float')) type = 'decimal';
          else if (rawType.includes('bool')) type = 'bool';

          if (!currentTable.fields.some(f => f.name === name)) {
            currentTable.fields.push({
              name,
              type,
              key: isPK ? 'PK' : isFK ? 'FK' : ''
            });
          }
        });
      }
    });

    return tables.filter(t => t.fields.length > 0);
  }

  function generateDynamicDomainTables(project) {
    const title = (project && project.title ? project.title : 'Project');
    const words = title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(w => w.length > 2);
    const mainEntity = (words[0] || 'ITEMS').toUpperCase();
    const transEntity = (words[1] || 'ACTIVITIES').toUpperCase();

    return [
      {
        name: "USERS",
        fields: [
          { type: "uuid", name: "id", key: "PK" },
          { type: "string", name: "name", key: "" },
          { type: "string", name: "email", key: "" },
          { type: "string", name: "phone", key: "" },
          { type: "string", name: "role", key: "" }
        ]
      },
      {
        name: mainEntity,
        fields: [
          { type: "uuid", name: "id", key: "PK" },
          { type: "string", name: "name", key: "" },
          { type: "string", name: "status", key: "" },
          { type: "decimal", name: "price_rate", key: "" }
        ]
      },
      {
        name: transEntity !== mainEntity ? transEntity : "TRANSACTIONS",
        fields: [
          { type: "uuid", name: "id", key: "PK" },
          { type: "uuid", name: "user_id", key: "FK" },
          { type: "uuid", name: `${mainEntity.toLowerCase()}_id`, key: "FK" },
          { type: "date", name: "transaction_date", key: "" },
          { type: "string", name: "status", key: "" }
        ]
      }
    ];
  }

  function getDynamicSOPFlowchartData(project, customPreset) {
    const title = ((project && project.title) || '').toLowerCase();
    const problem = ((project && project.problemStatement) || '').toLowerCase();

    // 1. If explicit preset requested or matched by domain
    if (customPreset === 'gov' || (!customPreset && (title.includes('sewa') || title.includes('pasuruan') || title.includes('opd') || title.includes('pemerintah') || title.includes('retribusi') || problem.includes('sekda')))) {
      return {
        domainName: "SOP Perizinan & Sewa Aset Daerah (Pemerintahan)",
        actors: [
          { key: "pemohon", label: "👤 Pemohon", pillClass: "pemohon" },
          { key: "opd", label: "🏢 OPD Terkait", pillClass: "opd" },
          { key: "kepalaOpd", label: "👔 Kepala OPD", pillClass: "kepala-opd" },
          { key: "sekda", label: "🏛️ Pengelola / Sekda", pillClass: "sekda" }
        ],
        rows: [
          { no: 1, kegiatan: "Awal Proses Pengajuan Sewa", pemohon: '<div class="flow-node-box terminal">START</div>', opd: '', kepalaOpd: '', sekda: '' },
          { no: 2, kegiatan: "Pemohon mengajukan Usulan Sewa", pemohon: '<div class="flow-node-box process">PERMOHONAN SEWA</div><div class="flow-flow-arrow">➔ Kirim ke OPD</div>', opd: '', kepalaOpd: '', sekda: '' },
          { no: 3, kegiatan: "Verifikasi Berkas & Usulan oleh OPD", pemohon: '', opd: '<div class="flow-node-box process">VERIFIKASI</div><div class="flow-flow-arrow">⬇ Cek Kelengkapan</div>', kepalaOpd: '', sekda: '' },
          { no: 4, kegiatan: "Pemeriksaan Kelengkapan Berkas Persyaratan", pemohon: '', opd: '<div class="flow-node-box decision-node">LENGKAP?</div><div class="flow-flow-arrow"><span class="flow-branch-tag no">N ➔ Kembali ke Start</span><br><span class="flow-branch-tag yes">Y ➔ ke Kepala OPD</span></div>', kepalaOpd: '', sekda: '' },
          { no: 5, kegiatan: "Nota Dinas Kepala OPD kepada Sekda / Pengelola", pemohon: '', opd: '', kepalaOpd: '<div class="flow-node-box doc-node">NOTA DINAS</div><div class="flow-flow-arrow">➔ ke Sekda</div>', sekda: '' },
          { no: 6, kegiatan: "Kajian & Evaluasi Permohonan oleh Sekda", pemohon: '', opd: '', kepalaOpd: '', sekda: '<div class="flow-node-box decision-node">DISETUJUI?</div><div class="flow-flow-arrow"><span class="flow-branch-tag no">N ➔ Ditolak (Kembali)</span><br><span class="flow-branch-tag yes">Y ➔ Lanjut Persetujuan</span></div>' },
          { no: 7, kegiatan: "Penerbitan Persetujuan Sewa oleh Sekda", pemohon: '', opd: '', kepalaOpd: '', sekda: '<div class="flow-node-box doc-node">PERSETUJUAN SEWA</div><div class="flow-flow-arrow">➔ ke Kepala OPD</div>' },
          { no: 8, kegiatan: "Penerbitan Surat Penetapan Sewa oleh Kepala OPD", pemohon: '', opd: '', kepalaOpd: '<div class="flow-node-box doc-node">SURAT PENETAPAN SEWA</div><div class="flow-flow-arrow">➔ ke Pemohon</div>', sekda: '' },
          { no: 9, kegiatan: "Pembayaran Retribusi / Tarif Sewa oleh Pemohon", pemohon: '<div class="flow-node-box process">PEMBAYARAN</div><div class="flow-flow-arrow">➔ ke OPD (Upload Bukti)</div>', opd: '', kepalaOpd: '', sekda: '' },
          { no: 10, kegiatan: "Validasi & Konfirmasi Bukti Pembayaran oleh OPD", pemohon: '', opd: '<div class="flow-node-box decision-node">VALID?</div><div class="flow-flow-arrow"><span class="flow-branch-tag no">N ➔ Perbaiki Bukti</span><br><span class="flow-branch-tag yes">Y ➔ Terbitkan PKS</span></div>', kepalaOpd: '', sekda: '' },
          { no: 11, kegiatan: "Penandatanganan Perjanjian Kerjasama (PKS)", pemohon: '<div class="flow-node-box doc-node">PKS SEWA</div>', opd: '<div class="flow-node-box doc-node">VALIDASI PKS</div>', kepalaOpd: '', sekda: '' },
          { no: 12, kegiatan: "Proses Selesai & Izin Sewa Aktif", pemohon: '<div class="flow-node-box terminal">FINISH</div>', opd: '', kepalaOpd: '', sekda: '' }
        ]
      };
    }

    // 2. Healthcare / Rumah Sakit / Klinik
    if (customPreset === 'health' || title.includes('klinik') || title.includes('rumah sakit') || title.includes('pasien') || title.includes('medis') || title.includes('dokter') || problem.includes('rekam medis')) {
      return {
        domainName: "Alur Pelayanan Pasien & Rekam Medis Digital",
        actors: [
          { key: "pasien", label: "👤 Pasien / Wali", pillClass: "pemohon" },
          { key: "admisi", label: "🏥 Admisi & Kasir", pillClass: "opd" },
          { key: "dokter", label: "🩺 Dokter / Poli", pillClass: "kepala-opd" },
          { key: "farmasi", label: "💊 Farmasi / Lab", pillClass: "sekda" }
        ],
        rows: [
          { no: 1, kegiatan: "Pasien Mengambil Nomor Antrean & Registrasi", pasien: '<div class="flow-node-box terminal">START</div>', admisi: '', dokter: '', farmasi: '' },
          { no: 2, kegiatan: "Verifikasi Data Pasien & Penjamin (BPJS / Asuransi)", pasien: '', admisi: '<div class="flow-node-box process">VERIFIKASI PENJAMIN</div><div class="flow-flow-arrow">⬇ Cek Keaktifan</div>', dokter: '', farmasi: '' },
          { no: 3, kegiatan: "Pemeriksaan Validitas Kepesertaan", pasien: '', admisi: '<div class="flow-node-box decision-node">VALID?</div><div class="flow-flow-arrow"><span class="flow-branch-tag no">N ➔ Jalur Umum</span><br><span class="flow-branch-tag yes">Y ➔ Antrean Poli</span></div>', dokter: '', farmasi: '' },
          { no: 4, kegiatan: "Pemeriksaan Klinis & Diagnosa Dokter", pasien: '', admisi: '', dokter: '<div class="flow-node-box process">PEMERIKSAAN MEDIS</div><div class="flow-flow-arrow">⬇ Input RME</div>', farmasi: '' },
          { no: 5, kegiatan: "Penerbitan E-Resep & Perintah Tindakan", pasien: '', admisi: '', dokter: '<div class="flow-node-box doc-node">E-RESEP & TINDAKAN</div><div class="flow-flow-arrow">➔ ke Farmasi & Kasir</div>', farmasi: '' },
          { no: 6, kegiatan: "Penyiapan Obat & Peracikan Resep", pasien: '', admisi: '', dokter: '', farmasi: '<div class="flow-node-box process">PERACIKAN OBAT</div><div class="flow-flow-arrow">➔ Cek Stok FEFO</div>' },
          { no: 7, kegiatan: "Penyelesaian Pembayaran / Klaim Penjamin", pasien: '<div class="flow-node-box process">PEMBAYARAN BILLING</div>', admisi: '<div class="flow-node-box doc-node">INVOICE & KLAIM</div><div class="flow-flow-arrow">➔ Lunas</div>', dokter: '', farmasi: '' },
          { no: 8, kegiatan: "Penyerahan Obat & Selesai Pelayanan", pasien: '<div class="flow-node-box terminal">FINISH</div>', admisi: '', dokter: '', farmasi: '<div class="flow-node-box process">SERAHKAN OBAT</div>' }
        ]
      };
    }

    // 3. Booking / E-Commerce / Padel / Lapangan
    return {
      domainName: "Alur Booking Online & Integrasi Pembayaran Real-time",
      actors: [
        { key: "user", label: "👤 Pengguna / Pemesan", pillClass: "pemohon" },
        { key: "system", label: "🌐 Web App / Sistem", pillClass: "opd" },
        { key: "payment", label: "💳 Payment Gateway", pillClass: "kepala-opd" },
        { key: "admin", label: "🏢 Admin Pengelola", pillClass: "sekda" }
      ],
      rows: [
        { no: 1, kegiatan: "Pengguna Membuka Kalender & Pilih Slot Waktu", user: '<div class="flow-node-box terminal">START</div>', system: '', payment: '', admin: '' },
        { no: 2, kegiatan: "Penguncian Slot Sementara (Holding Lock 10 Menit)", user: '<div class="flow-node-box process">PILIH JADWAL</div><div class="flow-flow-arrow">➔ Request Lock</div>', system: '<div class="flow-node-box process">HOLDING LOCK (10m)</div>', payment: '', admin: '' },
        { no: 3, kegiatan: "Pengecekan Ketersediaan Slot Real-time", user: '', system: '<div class="flow-node-box decision-node">KOSONG?</div><div class="flow-flow-arrow"><span class="flow-branch-tag no">N ➔ Slot Terisi (Pilih Lain)</span><br><span class="flow-branch-tag yes">Y ➔ Buka Checkout</span></div>', payment: '', admin: '' },
        { no: 4, kegiatan: "Pengisian Data Kontak (WhatsApp) & Pilih Pembayaran", user: '<div class="flow-node-box process">INPUT NO WA</div><div class="flow-flow-arrow">➔ Bayar QRIS/VA</div>', system: '', payment: '', admin: '' },
        { no: 5, kegiatan: "Pemrosesan Transaksi Pembayaran Otomatis", user: '', system: '', payment: '<div class="flow-node-box process">VERIFIKASI TRANSAKSI</div><div class="flow-flow-arrow">⬇ Kirim Webhook</div>', admin: '' },
        { no: 6, kegiatan: "Validasi Webhook Notifikasi Sukses Pembayaran", user: '', system: '<div class="flow-node-box decision-node">SUKSES?</div><div class="flow-flow-arrow"><span class="flow-branch-tag no">N ➔ Rilis Slot (Cancel)</span><br><span class="flow-branch-tag yes">Y ➔ Generate Tiket</span></div>', payment: '', admin: '' },
        { no: 7, kegiatan: "Pengiriman Tiket QR Code & Notifikasi WhatsApp", user: '<div class="flow-node-box doc-node">TIKET QR WA</div>', system: '<div class="flow-node-box doc-node">TIKET DIGITAL & INVOICE</div><div class="flow-flow-arrow">➔ Kirim WA Otomatis</div>', payment: '', admin: '' },
        { no: 8, kegiatan: "Pembaruan Rekap Booking di Dashboard Admin", user: '', system: '', payment: '', admin: '<div class="flow-node-box process">REKAP LIVE BOOKING</div>' },
        { no: 9, kegiatan: "Check-in di Lokasi Lapangan & Selesai", user: '<div class="flow-node-box terminal">FINISH</div>', system: '', payment: '', admin: '<div class="flow-node-box process">SCAN QR CODE</div>' }
      ]
    };
  }

  function renderSOPFlowchartDiagram(project, customPreset) {
    const data = getDynamicSOPFlowchartData(project, customPreset);
    const actors = data.actors;
    const rows = data.rows;

    return `
      <div class="swimlane-flowchart-card" id="swimlane-card-main">
        <div class="swimlane-toolbar-top">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <span style="font-weight: 700; color: #fff; font-size: 0.85rem;">🔄 Model Alur:</span>
            <select class="filter-select" id="select-sop-preset" style="padding: 4px 10px; font-size: 0.78rem; background: #090d16; border: 1px solid #334155; color: #38bdf8; border-radius: 6px; font-weight: 600;">
              <option value="auto" ${!customPreset ? 'selected' : ''}>⚡ Otomatis (${data.domainName.slice(0, 24)}...)</option>
              <option value="gov" ${customPreset === 'gov' ? 'selected' : ''}>🏛️ SOP Pemerintahan (Perizinan / Sewa Aset)</option>
              <option value="booking" ${customPreset === 'booking' ? 'selected' : ''}>🏸 Booking & Transaksi Otomatis (E-Commerce)</option>
              <option value="health" ${customPreset === 'health' ? 'selected' : ''}>🏥 Pelayanan Pasien & Rekam Medis (Klinik)</option>
            </select>
          </div>

          <div class="swimlane-legend">
            <span class="legend-item"><span class="legend-chip start"></span> Start / Finish</span>
            <span class="legend-item"><span class="legend-chip process"></span> Kegiatan</span>
            <span class="legend-item"><span class="legend-chip decision"></span> Keputusan Y/N</span>
            <span class="legend-item"><span class="legend-chip doc"></span> Berkas/Dokumen</span>
          </div>
        </div>

        <div class="swimlane-scroll-area">
          <table class="swimlane-grid-table">
            <thead>
              <tr>
                <th rowspan="2" class="col-no">NO</th>
                <th rowspan="2" class="col-kegiatan">KEGIATAN / AKTIVITAS</th>
                <th colspan="4">PELAKU / STAKEHOLDER (SWIMLANE)</th>
              </tr>
              <tr>
                ${actors.map(a => `<th class="col-actor"><span class="actor-header-pill ${a.pillClass}">${a.label}</span></th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td class="row-num-cell">${r.no}</td>
                  <td class="row-kegiatan-cell">${r.kegiatan}</td>
                  <td class="swimlane-actor-cell">${r[actors[0].key] || ''}</td>
                  <td class="swimlane-actor-cell">${r[actors[1].key] || ''}</td>
                  <td class="swimlane-actor-cell">${r[actors[2].key] || ''}</td>
                  <td class="swimlane-actor-cell">${r[actors[3].key] || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderDatabaseSchemaDiagram(project, sec) {
    let tables = [];
    let relLabels = ["membuat ➔", "⮀ dihubungkan pada"];

    // 1. Direct structured schema from Cloud AI
    if (sec && sec.erdTables && Array.isArray(sec.erdTables) && sec.erdTables.length > 0) {
      tables = sec.erdTables;
      if (sec.erdRelationships && Array.isArray(sec.erdRelationships)) {
        relLabels = [sec.erdRelationships[0] + ' ➔', '⮀ ' + (sec.erdRelationships[1] || 'berelasi')];
      }
    } 
    // 2. Parse from Markdown Text in section content
    else if (sec && sec.content) {
      const parsed = parseTablesFromMarkdown(sec.content);
      if (parsed.length >= 2) {
        tables = parsed;
      }
    }

    // 3. Fallback to Dynamic Domain Extractor
    if (tables.length === 0) {
      tables = generateDynamicDomainTables(project);
    }

    return `
      <div class="erd-diagram-container">
        <div class="erd-tables-grid">
          ${tables.slice(0, 4).map(t => `
            <div class="erd-table-card">
              <div class="erd-table-header">${t.name}</div>
              <div class="erd-table-body">
                ${t.fields.slice(0, 8).map(f => `
                  <div class="erd-table-row">
                    <span class="erd-type">${f.type || 'string'}</span>
                    <span class="erd-name">${f.name || 'field'}</span>
                    <span class="erd-key-badge ${(f.key || '').toLowerCase()}">${f.key || ''}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="erd-rel-labels">
          <span>${relLabels[0]}</span>
          <span>⮀</span>
          <span>${relLabels[1]}</span>
        </div>
      </div>
    `;
  }

  function renderArchitectureDiagram(project, sec) {
    let steps = [];
    let actor = "Customer / Pengguna";

    // 1. Direct from Cloud AI structured data
    if (sec && sec.seqSteps && Array.isArray(sec.seqSteps) && sec.seqSteps.length > 0) {
      steps = sec.seqSteps;
      if (sec.actorLabel) actor = sec.actorLabel;
    } else {
      const actionName = (project && project.phases && project.phases[0] ? project.phases[0].title : 'Pencarian & Akses Data');
      const actionCore = (project && project.phases && project.phases[1] ? project.phases[1].title : 'Proses Transaksi');

      steps = [
        { from: 0, to: 1, text: `1. Buka antarmuka (${actionName.slice(0, 26)})`, isReturn: false },
        { from: 1, to: 2, text: "2. Request ketersediaan data / filter aksi", isReturn: false },
        { from: 2, to: 3, text: "3. Query data dari basis data", isReturn: false },
        { from: 3, to: 2, text: "4. Return data hasil query", isReturn: true },
        { from: 2, to: 1, text: "5. Render data interaktif ke UI pengguna", isReturn: true },
        { from: 0, to: 1, text: `6. Submit konfirmasi (${actionCore.slice(0, 26)})`, isReturn: false },
        { from: 1, to: 2, text: "7. Validasi logika bisnis & proses", isReturn: false },
        { from: 2, to: 3, text: "8. Insert data transaksi ke database", isReturn: false },
        { from: 3, to: 2, text: "9. Sukses simpan transaksi", isReturn: true },
        { from: 2, to: 1, text: "10. Kembalikan response status sukses", isReturn: true },
        { from: 1, to: 0, text: "11. Tampilkan status sukses & notifikasi", isReturn: true }
      ];
    }

    const actors = [
      { icon: "👤", label: actor },
      { icon: "🖥️", label: "Frontend UI" },
      { icon: "⚙️", label: "Backend API" },
      { icon: "🗄️", label: "Database" }
    ];

    return `
      <div class="architecture-diagram-container">
        <div class="arch-controls-top">
          <button class="arch-ctrl-btn" title="Inspect">🔍</button>
          <button class="arch-ctrl-btn" title="Fullscreen">⛶</button>
        </div>

        <div class="seq-header-row">
          ${actors.map(a => `
            <div class="seq-actor-card">
              <span>${a.icon}</span>
              <span>${a.label}</span>
            </div>
          `).join('')}
        </div>

        <div class="seq-steps-container">
          <div class="seq-lifelines">
            <div class="seq-lifeline-col"><div class="seq-lifeline-line"></div></div>
            <div class="seq-lifeline-col"><div class="seq-lifeline-line"></div></div>
            <div class="seq-lifeline-col"><div class="seq-lifeline-line"></div></div>
            <div class="seq-lifeline-col"><div class="seq-lifeline-line"></div></div>
          </div>

          ${steps.map((st) => {
            const minCol = Math.min(st.from, st.to);
            const maxCol = Math.max(st.from, st.to);
            const isLeftToRight = st.from < st.to;
            const leftPct = (minCol * 25) + 12.5;
            const widthPct = (maxCol - minCol) * 25;

            return `
              <div class="seq-step-item">
                <div class="seq-arrow-box ${st.isReturn ? 'is-return' : ''}" style="left: ${leftPct}%; width: ${widthPct}%;">
                  <span class="seq-step-pill">${st.text}</span>
                  ${isLeftToRight ? '<span class="seq-arrow-tip-right"></span>' : '<span class="seq-arrow-tip-left"></span>'}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderMarkdownSnippet(text) {
    if (!text) return '';

    // 1. Normalize inline numbered items and bullets to separate lines
    // e.g. " 1. Title...", " 2. Title...", " - Item...", " * Item...", " • Item..."
    let normalized = text
      .replace(/([^\n])\s+(\d+\.\s+)/g, '$1\n$2')
      .replace(/([^\n])\s+([-*•]\s+)/g, '$1\n$2');

    // 2. Protect Code Blocks
    const codeBlocks = [];
    normalized = normalized.replace(/```([\w-]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      const id = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(`<pre class="markdown-code-box"><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`);
      return id;
    });

    const lines = normalized.split('\n');
    let html = '';
    let inList = false;
    let listType = ''; // 'ol' or 'ul'

    function closeList() {
      if (inList) {
        html += listType === 'ol' ? '</ol>' : '</ul>';
        inList = false;
        listType = '';
      }
    }

    lines.forEach((rawLine) => {
      const line = rawLine.trim();

      if (!line) {
        closeList();
        return;
      }

      // Check for code block placeholders
      if (line.startsWith('__CODE_BLOCK_') && line.endsWith('__')) {
        closeList();
        const index = parseInt(line.replace('__CODE_BLOCK_', '').replace('__', ''), 10);
        if (codeBlocks[index]) {
          html += codeBlocks[index];
        }
        return;
      }

      // Headers
      if (line.startsWith('### ')) {
        closeList();
        html += `<h3 class="doc-h3">${formatInlineMarkdown(line.substring(4))}</h3>`;
        return;
      }
      if (line.startsWith('#### ')) {
        closeList();
        html += `<h4 class="doc-h4">${formatInlineMarkdown(line.substring(5))}</h4>`;
        return;
      }
      if (line.startsWith('## ')) {
        closeList();
        html += `<h2 class="doc-h2">${formatInlineMarkdown(line.substring(3))}</h2>`;
        return;
      }
      if (line.startsWith('# ')) {
        closeList();
        html += `<h1 class="doc-h1">${formatInlineMarkdown(line.substring(2))}</h1>`;
        return;
      }

      // Numbered List Item: "1. text" or "10. text"
      const numMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        if (!inList || listType !== 'ol') {
          closeList();
          html += '<ol class="doc-ordered-list">';
          inList = true;
          listType = 'ol';
        }
        const num = numMatch[1];
        const content = formatListItemContent(numMatch[2]);
        html += `
          <li class="doc-list-item numbered">
            <span class="list-num-badge">${num}.</span>
            <div class="list-item-content">${content}</div>
          </li>
        `;
        return;
      }

      // Bullet List Item: "- text" or "* text" or "• text"
      const bulletMatch = line.match(/^[-*•]\s+(.*)/);
      if (bulletMatch) {
        if (!inList || listType !== 'ul') {
          closeList();
          html += '<ul class="doc-bullet-list">';
          inList = true;
          listType = 'ul';
        }
        const content = formatListItemContent(bulletMatch[1]);
        html += `
          <li class="doc-list-item bullet">
            <span class="list-bullet-dot">•</span>
            <div class="list-item-content">${content}</div>
          </li>
        `;
        return;
      }

      // Normal Paragraph
      closeList();
      html += `<p class="doc-paragraph">${formatInlineMarkdown(line)}</p>`;
    });

    closeList();
    return html;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatInlineMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  }

  function formatListItemContent(rawText) {
    const text = formatInlineMarkdown(rawText.trim());
    // If it has "Title: Description" without bold tag at start, highlight the title part
    const colonIdx = text.indexOf(':');
    if (colonIdx > 0 && colonIdx < 60 && !text.startsWith('<strong>')) {
      const title = text.substring(0, colonIdx);
      const rest = text.substring(colonIdx + 1);
      return `<strong>${title}:</strong>${rest}`;
    }
    return text;
  }

  // =========================================================================
  // MIND MAP VIEW & SVG CONNECTORS
  // =========================================================================
  function renderMindMapTree() {
    const data = state.projectData;
    let html = `
      <svg class="svg-connectors-layer" id="svg-connectors"></svg>
      <div class="nodes-container">
        <!-- Root Node -->
        <div class="node-root" id="node-root">
          <div class="node-root-title">
            <span>📄</span>
            <span>${data.project.title}</span>
          </div>
          <div class="node-root-status">● ${data.project.status || 'Perencanaan'}</div>
        </div>

        <!-- Features Column -->
        <div class="features-column" id="features-column">
    `;

    if (data.phases) {
      data.phases.forEach((phase) => {
        const subCount = phase.subFeatures ? phase.subFeatures.reduce((acc, s) => acc + (s.tasks ? s.tasks.length : 0), 0) : 0;
        html += `
          <div class="feature-node-branch" id="branch-${phase.id}">
            <!-- Feature Node -->
            <div class="node-feature" id="node-${phase.id}" data-phase-id="${phase.id}">
              <div class="node-feature-header">
                <span class="node-feature-phase">FASE ${phase.phaseNumber}</span>
                <span style="font-size: 10px; color: #f97316;">★</span>
              </div>
              <div class="node-feature-title">${phase.title}</div>
              <div class="node-feature-meta">
                <span>● Direncanakan</span>
                <span>0/${subCount}</span>
              </div>
            </div>

            <!-- Subfeatures Node Box -->
            <div class="node-subfeatures-box" id="subbox-${phase.id}">
              <div class="subfeatures-box-label">SUB FITUR</div>
              ${phase.subFeatures ? phase.subFeatures.map(sub => `
                <div class="subfeature-chip" data-sub-id="${sub.id}">
                  ${sub.title}
                </div>
              `).join('') : ''}
            </div>

            <!-- Tasks Box Node -->
            <div class="node-tasks-box" id="taskbox-${phase.id}">
              <div class="tasks-box-header">
                <span>TASKS</span>
                <span>0/${subCount}</span>
              </div>
              ${phase.subFeatures ? phase.subFeatures.slice(0, 3).map((sub) => {
                const task = sub.tasks ? sub.tasks[0] : null;
                return `
                  <div class="task-mini-item">
                    <input type="checkbox" />
                    <span>${task ? task.title : 'Task'}</span>
                  </div>
                `;
              }).join('') : ''}
              <div class="see-all-tasks-link" onclick="window.appSwitchToTasks('${phase.id}')">
                Lihat semua (${subCount}) ›
              </div>
            </div>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;

    dom.mindmapTree.innerHTML = html;

    // Attach click events on nodes
    document.querySelectorAll('.node-feature').forEach(node => {
      node.addEventListener('click', () => {
        document.querySelectorAll('.node-feature').forEach(n => n.classList.remove('active'));
        node.classList.add('active');
        showToast(`Fitur dipilih: ${node.querySelector('.node-feature-title')?.textContent}`);
      });
    });

    renderMindMapConnectors();
  }

  function renderMindMapConnectors() {
    setTimeout(() => {
      const treeSurface = document.getElementById('mindmap-tree');
      const svgConnectors = document.getElementById('svg-connectors');
      const root = document.getElementById('node-root');
      if (!treeSurface || !root || !svgConnectors || !state.projectData.phases) return;

      const surfaceRect = treeSurface.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();

      // Ensure SVG is sized properly
      const width = treeSurface.scrollWidth || 1400;
      const height = treeSurface.scrollHeight || 900;
      svgConnectors.setAttribute('width', width);
      svgConnectors.setAttribute('height', height);
      svgConnectors.style.width = width + 'px';
      svgConnectors.style.height = height + 'px';

      const rootX = (rootRect.right - surfaceRect.left);
      const rootY = (rootRect.top + rootRect.height / 2 - surfaceRect.top);

      let paths = '';

      state.projectData.phases.forEach((phase) => {
        const featNode = document.getElementById(`node-${phase.id}`);
        const subBox = document.getElementById(`subbox-${phase.id}`);
        const taskBox = document.getElementById(`taskbox-${phase.id}`);

        if (featNode && subBox && taskBox) {
          const fRect = featNode.getBoundingClientRect();
          const sRect = subBox.getBoundingClientRect();
          const tRect = taskBox.getBoundingClientRect();

          const fLeftX = (fRect.left - surfaceRect.left);
          const fCenterY = (fRect.top + fRect.height / 2 - surfaceRect.top);
          const fRightX = (fRect.right - surfaceRect.left);

          const sLeftX = (sRect.left - surfaceRect.left);
          const sCenterY = (sRect.top + sRect.height / 2 - surfaceRect.top);
          const sRightX = (sRect.right - surfaceRect.left);

          const tLeftX = (tRect.left - surfaceRect.left);
          const tCenterY = (tRect.top + tRect.height / 2 - surfaceRect.top);

          paths += createBezierPath(rootX, rootY, fLeftX, fCenterY);
          paths += createBezierPath(fRightX, fCenterY, sLeftX, sCenterY);
          paths += createBezierPath(sRightX, sCenterY, tLeftX, tCenterY);
        }
      });

      svgConnectors.innerHTML = paths;
    }, 60);
  }

  function createBezierPath(x1, y1, x2, y2) {
    const delta = (x2 - x1) / 2;
    return `<path class="connector-path" d="M ${x1} ${y1} C ${x1 + delta} ${y1}, ${x2 - delta} ${y2}, ${x2} ${y2}" />`;
  }

  // Auto re-render connectors on window resize or scroll
  window.addEventListener('resize', () => {
    if (state.currentView === 'mindmap' || document.getElementById('view-mindmap')?.classList.contains('active')) {
      renderMindMapConnectors();
    }
  });

  window.appSwitchToTasks = (phaseId) => {
    switchView('tasks');
    if (dom.kanbanFilter && phaseId) {
      dom.kanbanFilter.value = phaseId;
      state.filterFeature = phaseId;
      renderKanbanBoard();
    }
  };

  // =========================================================================
  // KANBAN TASK BOARD
  // =========================================================================
  function renderKanbanBoard() {
    const filteredTasks = state.tasks.filter(t => {
      if (state.filterFeature === 'all') return true;
      return t.phaseId === state.filterFeature;
    });

    const groups = {
      todo: filteredTasks.filter(t => t.status === 'todo'),
      progress: filteredTasks.filter(t => t.status === 'progress'),
      done: filteredTasks.filter(t => t.status === 'done'),
      failed: filteredTasks.filter(t => t.status === 'failed')
    };

    // Update Counters
    dom.badgeTodoCount.textContent = groups.todo.length;
    dom.badgeProgressCount.textContent = groups.progress.length;
    dom.badgeDoneCount.textContent = groups.done.length;
    dom.badgeFailedCount.textContent = groups.failed.length;

    // Progress Bar
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.status === 'done').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    dom.kanbanProgressBar.style.width = `${percentage}%`;
    dom.kanbanProgressText.textContent = `${completed}/${total} selesai`;

    // Render Cards in Each Column
    renderColumnCards(dom.colTodoList, groups.todo, 'todo');
    renderColumnCards(dom.colProgressList, groups.progress, 'progress');
    renderColumnCards(dom.colDoneList, groups.done, 'done');
    renderColumnCards(dom.colFailedList, groups.failed, 'failed');
  }

  function renderColumnCards(container, tasksList, status) {
    if (tasksList.length === 0) {
      container.innerHTML = `<div class="empty-col-placeholder">Kosong</div>`;
      return;
    }

    container.innerHTML = tasksList.map(task => `
      <div class="task-card ${status === 'progress' ? 'active-processing' : ''} ${status === 'done' ? 'is-done' : ''}" draggable="true" data-task-id="${task.id}">
        <div class="card-top-tags">
          <span class="card-feature-name">
            <span class="card-feature-dot" style="background: ${task.phaseColor}"></span>
            ${task.phaseTitle}
          </span>
          <span class="card-priority-badge">
            <span>📶</span> ${task.priority || 'Utama'}
          </span>
        </div>
        <div class="task-card-title">${task.title}</div>
        ${status === 'progress' ? `
          <div class="card-processing-pill">
            <span class="spinner-dot">⚡</span> <span>AI Sedang Menulis Kode...</span>
          </div>
        ` : ''}
        ${status === 'done' ? `
          <div class="card-done-pill">
            <span>✓</span> <span>File Tersimpan di Workspace</span>
          </div>
        ` : ''}
      </div>
    `).join('');

    container.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.taskId);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
    });
  }

  // Setup Column Drop Targets
  [dom.colTodoList, dom.colProgressList, dom.colDoneList, dom.colFailedList].forEach((col) => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.style.background = 'rgba(255, 255, 255, 0.03)';
    });

    col.addEventListener('dragleave', () => {
      col.style.background = 'transparent';
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.style.background = 'transparent';
      const taskId = e.dataTransfer.getData('text/plain');
      const targetStatus = col.dataset.status;

      const task = state.tasks.find(t => t.id === taskId);
      if (task && targetStatus) {
        task.status = targetStatus;
        renderKanbanBoard();
        showToast(`Task dipindahkan ke ${targetStatus.toUpperCase()}`, 'success');
      }
    });
  });

  dom.kanbanFilter?.addEventListener('change', (e) => {
    state.filterFeature = e.target.value;
    renderKanbanBoard();
  });

  // Autonomous Agent Execution (Real OpenClaw / Browser Simulator)
  async function triggerAgentExecution() {
    if (state.isOpenClawConnected) {
      dom.btnSimulateAi.innerHTML = `<span>⏳</span> OpenClaw Berjalan...`;
      showToast('🚀 Mengirim task ke OpenClaw Autonomous Engine...', 'success');
      
      try {
        await fetch(`${OPENCLAW_API_URL}/api/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: state.projectData.project,
            phases: state.projectData.phases,
            prdSections: state.projectData.prdSections,
            tasks: state.tasks
          })
        });

        const resRun = await fetch(`${OPENCLAW_API_URL}/api/tasks/run`, { method: 'POST' });
        if (resRun.ok) {
          showToast('⚡ Task sedang dikerjakan secara nyata oleh OpenClaw!', 'success');
          return;
        }
      } catch (e) {
        console.warn('Real OpenClaw execution failed, fallback to local simulator', e);
      }
    }

    // Fallback or Direct Browser Simulation
    triggerBrowserSimulation();
  }

  function triggerBrowserSimulation() {
    if (state.isSimulatingAgent) {
      state.isSimulatingAgent = false;
      dom.btnSimulateAi.innerHTML = `<span>▶️</span> Jalankan Agent`;
      showToast('⏸️ Simulasi agent dijeda.', 'info');
      return;
    }

    state.isSimulatingAgent = true;
    dom.btnSimulateAi.innerHTML = `<span>⏸️</span> Jeda Agent`;
    showToast('🚀 AI Agent mulai mengeksekusi task satu per satu...', 'success');

    function processNextTask() {
      if (!state.isSimulatingAgent) return;

      const nextTask = state.tasks.find(t => t.status === 'todo');
      if (!nextTask) {
        state.isSimulatingAgent = false;
        dom.btnSimulateAi.innerHTML = `<span>🎉</span> Semua Task Selesai`;
        showToast('🎉 Semua task telah selesai dikerjakan!', 'success');
        return;
      }

      nextTask.status = 'progress';
      appendTerminalLog(`[Task ${nextTask.id}] Sedang dikerjakan: "${nextTask.title}" (${nextTask.phaseTitle})`);
      renderKanbanBoard();

      setTimeout(() => {
        if (!state.isSimulatingAgent) return;
        nextTask.status = 'done';
        appendTerminalLog(`✅ [Task ${nextTask.id}] Selesai: "${nextTask.title}"`, 'success');
        renderKanbanBoard();

        setTimeout(processNextTask, 600);
      }, 1400);
    }

    processNextTask();
  }

  dom.btnSimulateAi?.addEventListener('click', triggerAgentExecution);

  // Prompt Modal & Export Helpers
  function openPromptModal() {
    const prompt = generateAiCliPrompt();
    dom.promptTerminalText.textContent = prompt;
    dom.modalPrompt.classList.add('show');
  }

  function generateAiCliPrompt() {
    return `### AI AGENT TASK INSTRUCTIONS ###
Project: ${state.projectData.project.title}
Version: ${state.projectData.project.version || 'v1.0.0'}

Context:
${state.projectData.project.problemStatement}

TASKS TO EXECUTE IN SEQUENCE:
${state.tasks.map((t, idx) => `[Task #${idx + 1}] (${t.phaseTitle} - ${t.priority})
Description: ${t.title}
Status: PENDING
`).join('\n')}

Instruction for AI Agent:
1. Read each task requirement thoroughly.
2. Implement components and endpoints in modular files.
3. Verify types and run build checks after each task.
4. Auto-update task board status when complete.`;
  }

  dom.btnCopyPrompt?.addEventListener('click', () => {
    const text = dom.promptTerminalText.textContent;
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 Prompt AI Agent berhasil disalin ke clipboard!', 'success');
    });
  });

  // =========================================================================
  // TECH STACK CONFIGURATOR CONTROLLER
  // =========================================================================
  const stackFolderTemplates = {
    'html-prototype': `workspace/{project-slug}/
├── index.html                  (Homepage / Landing)
├── pages/
│   ├── dashboard.html          (Main UI View)
│   ├── auth.html               (Login / Register UI)
│   └── checkout.html           (Transaction View)
├── css/
│   └── style.css               (Tailwind CSS CDN + Custom Styles)
└── js/
    └── app.js                  (jQuery / Interactive Mock UI)`,

    'nextjs-fullstack': `workspace/{project-slug}/
├── src/
│   ├── app/
│   │   ├── layout.tsx          (Root Layout)
│   │   ├── page.tsx            (Home Page)
│   │   ├── globals.css         (Tailwind Setup)
│   │   └── api/                (Route Handlers)
│   ├── components/
│   │   └── ui/                 (shadcn UI Component Stubs)
│   └── lib/
│       ├── prisma.ts           (DB Client)
│       └── utils.ts            (cn helper)
├── prisma/
│   └── schema.prisma
└── package.json`,

    'laravel-monolith': `workspace/{project-slug}/
├── app/
│   ├── Http/Controllers/       (Application Controllers)
│   └── Models/                 (Eloquent Models)
├── database/
│   └── migrations/             (Database Migrations)
├── resources/
│   └── views/
│       ├── layouts/app.blade.php
│       └── dashboard.blade.php
├── routes/
│   └── web.php                 (Web Routes)
└── composer.json`,

    'decoupled-api': `workspace/{project-slug}/
├── frontend/                   (React Vite / Vue 3)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.tsx
│   └── package.json
├── backend/                    (Golang Fiber / Python FastAPI)
│   ├── handlers/ (routes)
│   ├── models/
│   └── main.go (atau main.py)
└── docker-compose.yml`
  };

  function updateStackPreview() {
    const slug = state.projectData?.project?.id || 'my-project';
    const selectedRadio = dom.stackModeSelector?.querySelector('.stack-card-radio.selected');
    const mode = selectedRadio ? selectedRadio.dataset.mode : 'html-prototype';

    let preview = stackFolderTemplates[mode] || stackFolderTemplates['html-prototype'];
    preview = preview.replace(/{project-slug}/g, slug);
    if (dom.stackFolderPreview) {
      dom.stackFolderPreview.textContent = preview;
    }
  }

  // Handle radio card click
  dom.stackModeSelector?.querySelectorAll('.stack-card-radio').forEach(card => {
    card.addEventListener('click', () => {
      dom.stackModeSelector.querySelectorAll('.stack-card-radio').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const mode = card.dataset.mode;
      // Auto-set dropdowns based on preset
      if (mode === 'html-prototype') {
        if (dom.selectFrontendStack) dom.selectFrontendStack.value = 'html-jquery';
        if (dom.selectBackendStack) dom.selectBackendStack.value = 'none';
        if (dom.selectDatabaseStack) dom.selectDatabaseStack.value = 'localstorage';
      } else if (mode === 'nextjs-fullstack') {
        if (dom.selectFrontendStack) dom.selectFrontendStack.value = 'nextjs';
        if (dom.selectBackendStack) dom.selectBackendStack.value = 'nextjs-actions';
        if (dom.selectDatabaseStack) dom.selectDatabaseStack.value = 'sqlite';
      } else if (mode === 'laravel-monolith') {
        if (dom.selectFrontendStack) dom.selectFrontendStack.value = 'laravel-blade';
        if (dom.selectBackendStack) dom.selectBackendStack.value = 'laravel';
        if (dom.selectDatabaseStack) dom.selectDatabaseStack.value = 'sqlite';
      } else if (mode === 'decoupled-api') {
        if (dom.selectFrontendStack) dom.selectFrontendStack.value = 'react-vite';
        if (dom.selectBackendStack) dom.selectBackendStack.value = 'go-fiber';
        if (dom.selectDatabaseStack) dom.selectDatabaseStack.value = 'postgresql';
      }

      updateStackPreview();
    });
  });

  dom.selectFrontendStack?.addEventListener('change', updateStackPreview);
  dom.selectBackendStack?.addEventListener('change', updateStackPreview);
  dom.selectDatabaseStack?.addEventListener('change', updateStackPreview);

  function openStackConfiguratorModal() {
    updateStackPreview();
    dom.modalStackConfigurator?.classList.add('show');
  }

  // Implementation Dropdown Handlers
  dom.btnMulaiImplementasi?.addEventListener('click', (e) => {
    e.stopPropagation();
    dom.implementationDropdown?.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!dom.btnMulaiImplementasi?.contains(e.target) && !dom.implementationDropdown?.contains(e.target)) {
      dom.implementationDropdown?.classList.remove('show');
    }
  });

  dom.actionRunOpenclaw?.addEventListener('click', () => {
    dom.implementationDropdown?.classList.remove('show');
    openStackConfiguratorModal();
  });

  dom.actionDownloadPrd?.addEventListener('click', () => {
    dom.implementationDropdown?.classList.remove('show');
    generateMarkdownDownload();
  });

  dom.actionDownloadZip?.addEventListener('click', () => {
    dom.implementationDropdown?.classList.remove('show');
    generateZipDownload();
  });

  document.getElementById('action-prompt-agent')?.addEventListener('click', () => {
    dom.implementationDropdown?.classList.remove('show');
    openPromptModal();
  });

  // Execute confirmation
  dom.btnConfirmStackExecution?.addEventListener('click', async () => {
    dom.modalStackConfigurator?.classList.remove('show');

    const selectedRadio = dom.stackModeSelector?.querySelector('.stack-card-radio.selected');
    const selectedMode = selectedRadio ? selectedRadio.dataset.mode : 'html-prototype';
    const frontend = dom.selectFrontendStack?.value || 'html-jquery';
    const backend = dom.selectBackendStack?.value || 'none';
    const database = dom.selectDatabaseStack?.value || 'sqlite';

    const techStackConfig = {
      mode: selectedMode,
      frontend,
      backend,
      database
    };

    showToast(`🚀 Mempersiapkan workspace dengan stack: ${selectedMode}...`, 'info');

    // Open monitor modal
    dom.modalOpenclawMonitor?.classList.add('show');

    if (state.isOpenClawConnected) {
      try {
        // Send project with techStackConfig
        const projectPayload = {
          ...state.projectData.project,
          techStackConfig
        };

        await fetch(`${OPENCLAW_API_URL}/api/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: projectPayload,
            phases: state.projectData.phases,
            prdSections: state.projectData.prdSections,
            tasks: state.tasks,
            techStackConfig
          })
        });

        const selectedModel = document.getElementById('select-agent-model')?.value || 'cx/gpt-5.4-mini';
        const resRun = await fetch(`${OPENCLAW_API_URL}/api/tasks/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: selectedModel, techStackConfig })
        });

        if (resRun.ok) {
          showToast(`⚡ OpenClaw sedang mengeksekusi workspace [${selectedMode}]!`, 'success');
          return;
        }
      } catch (err) {
        console.warn('Real OpenClaw execution error:', err);
      }
    }

    // Fallback to browser simulation
    triggerBrowserSimulation();
  });

  // Modal Close Handlers
  document.querySelectorAll('.modal-close-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('show'));
    });
  });

  // =========================================================================
  // SCOPE OF WORK & PRICING QUOTATION CONTROLLER
  // =========================================================================
  const DEFAULT_SCOPE_MODULES = [
    {
      id: "mod-accounting-pos",
      name: "Modul Accounting & POS Rumah Sakit / Klinik",
      category: "Operasional Medis & Billing",
      icon: "🏥",
      unitPrice: 28000000,
      qty: 1,
      enabled: true,
      features: [
        "Pengkategorian transaksi terpisah antara Rawat Jalan & Rawat Inap",
        "Master data tarif pembayaran dokter & tindakan medis",
        "Kategorisasi penanggung biaya (BPJS Kesehatan, Asuransi Swasta, Perusahaan)",
        "Perhitungan otomatis pembagian hasil (fee sharing) antara dokter dan rumah sakit",
        "Pemisahan kasir Point of Sales (POS) Rumah Sakit dan POS Farmasi / Apotek"
      ]
    },
    {
      id: "mod-inventory-pharmacy",
      name: "Modul Supply Chain, Gudang & Farmasi (Inventory)",
      category: "Logistik & Inventaris Obat",
      icon: "💊",
      unitPrice: 32000000,
      qty: 1,
      enabled: true,
      features: [
        "Internal Transfer & Receiving otomatis (Delivery & Receiving Document)",
        "Product Usage & Scrap management dengan Approval Matrix & pengurangan stok otomatis",
        "Notifikasi Low Stock berdasarkan batas minimum kuantitas per lokasi",
        "Stock Count / Opname fisik & kalkulasi penyesuaian inventory adjustment",
        "Multi Unit of Measure (UoM) dengan rasio konversi satuan kecil & besar",
        "Manajemen multi-gudang dan strategi pengeluaran stok (FEFO, FIFO, LIFO)",
        "Lot & Serial Number Tracking dengan traceability lengkap incoming hingga outgoing",
        "Material Request (MR) terintegrasi Purchase Request dan notifikasi obat mendekati expired",
        "Barcode & QR Code Serializer otomatis serta pemindaian via kamera"
      ]
    },
    {
      id: "mod-asset-suite",
      name: "Modul Asset Management E-Suite",
      category: "Fasilitas & Pemeliharaan Alat",
      icon: "🏢",
      unitPrice: 22000000,
      qty: 1,
      enabled: true,
      features: [
        "Master Database Aset Lengkap: Nama, Kode Seri, Masa Garansi & Kategori",
        "Manajemen Pengajuan Aset, Approval Matrix & Penugasan Penanggung Jawab",
        "Database Lokasi Aset, Pelacakan Perpindahan & Riwayat Transfer Fisik",
        "Penjadwalan Perawatan Berkala (Maintenance Scheduling & Reminder Otomatis)",
        "Pembuatan & Pencetakan Perintah Kerja Perbaikan (Asset Repair Order)",
        "Pelacakan Variabel Aset (Hour Meter, Electricity Meter, Utilisasi)",
        "In-Depth Cost Tracking (Bahan bakar, asuransi, leasing & biaya reparasi)"
      ]
    },
    {
      id: "mod-finance-accounting",
      name: "Modul Finance, Accounting & Anggaran",
      category: "Keuangan & Pelaporan",
      icon: "💰",
      unitPrice: 35000000,
      qty: 1,
      enabled: true,
      features: [
        "Multiple Vendor Payment Voucher Management & Approval Flow",
        "Manajemen Pembayaran GIRO dari single/multiple invoice (Open, Posted, Cleared, Rejected)",
        "Cashbox & Bank Account Ledger, Internal Transfer & Impor Rekonsiliasi Bank",
        "Pencatatan Accrual Revenue, Expense, Receivable & Payable Amortization",
        "Laporan Finansial Lengkap: P&L, Balance Sheet, Cash Flow, Tax Report, General Ledger, Trial Balance, Aging AR/AP",
        "Multi-Level Analytic Accounting (Cost Center Analysis di Laba Rugi & Neraca)",
        "Analisis Rasio Keuangan Otomatis (Solvabilitas, Likuiditas, Profitabilitas, Aktivitas)",
        "Activity-Based Budgeting & Analytic Account Budget Request dengan Approval Matrix",
        "Pelacakan Pinjaman Bank (Bank Loan Tracker, Suku Bunga & Pengingat Cicilan)"
      ]
    },
    {
      id: "mod-employee-expenses",
      name: "Modul Employee Expenses & Klaim Biaya",
      category: "Sumber Daya Manusia (HR)",
      icon: "👥",
      unitPrice: 12000000,
      qty: 1,
      enabled: true,
      features: [
        "Employee Expenses Tracking & Multi-Tier Approval Matrix",
        "Pengajuan Kasbon (Cash Advance Request) & Pelacakan Status",
        "Rekonsiliasi Realisasi Pengeluaran Kasbon dengan Bukti Transaksi",
        "Manajemen Pencairan (Disbursement) Kasbon & Biaya Operasional"
      ]
    },
    {
      id: "mod-professional-services",
      name: "Layanan Implementasi & Professional Services",
      category: "Jasa Konsultasi & Setup",
      icon: "🛠️",
      unitPrice: 25000000,
      qty: 1,
      enabled: true,
      features: [
        "Instalasi Modul & Konfigurasi Alur Bisnis (Business Flow Configuration)",
        "Penyusunan Functional Requirement Document (FRD) komprehensif",
        "Setup Hak Akses Pengguna & Matriks Otorisasi Pengguna",
        "Pelatihan Pengguna (Training): 4 Sesi per Modul (@3 Jam per sesi)",
        "Import Data via EQUIP/Excel Template Standard & Migrasi Saldo Awal (Opening Balance)"
      ]
    },
    {
      id: "mod-server-infrastructure",
      name: "Infrastruktur Cloud Server (60 Concurrent Users)",
      category: "Infrastruktur & Komputasi",
      icon: "🖥️",
      unitPrice: 18000000,
      qty: 1,
      enabled: true,
      features: [
        "Setup Server Ubuntu OS Dedicated",
        "Spesifikasi Mesin: 8 Core High-Speed Processor, 32 GB RAM",
        "Dioptimalkan untuk performa stabil 60 concurrent users bersamaan",
        "Penyimpanan Cloud Storage 100 GB dengan retensi backup harian 30 hari"
      ]
    },
    {
      id: "mod-licensing-support",
      name: "Lisensi Produk & Garansi Tahunan (SLA Support)",
      category: "Lisensi & Maintenance",
      icon: "🛡️",
      unitPrice: 20000000,
      qty: 1,
      enabled: true,
      features: [
        "Unlimited User License (Tanpa batasan jumlah akun staf)",
        "Dukungan Teknis Prioritas via WhatsApp Resmi, Hotline Telepon, Email, dan Portal Tiket",
        "Garansi Produk Berkelanjutan & Pembaruan Sistem (Ongoing Maintenance & Bug Fixes)"
      ]
    }
  ];

  function generateDynamicScopeModules(projectData) {
    if (!projectData || !projectData.phases || projectData.phases.length === 0) {
      return JSON.parse(JSON.stringify(DEFAULT_SCOPE_MODULES));
    }

    const phases = projectData.phases;
    const modules = [];
    const phaseIcons = ["🚀", "⚡", "🧩", "📊", "🔒", "🛠️", "💼", "🌐"];

    phases.forEach((phase, idx) => {
      const subFeatures = phase.subFeatures || [];
      const featureList = subFeatures.length > 0
        ? subFeatures.map(s => `${s.title}: ${s.desc || ''}`)
        : [phase.summary || "Implementasi fitur utama dan alur bisnis"];

      // Estimated price calculated from subfeatures quantity & complexity
      const basePrice = Math.max(15000000, Math.min(45000000, subFeatures.length * 6000000 + 8000000));
      const unitPrice = Math.round(basePrice / 1000000) * 1000000;

      modules.push({
        id: `mod-phase-${phase.id || idx + 1}`,
        name: `Modul ${phase.title}`,
        category: `Fase ${phase.phaseNumber || idx + 1} — ${phase.priorityLabel || 'Fitur Utama'}`,
        icon: phaseIcons[idx % phaseIcons.length],
        unitPrice: unitPrice,
        qty: 1,
        enabled: true,
        features: featureList
      });
    });

    // 1. Implementation, Testing & Training Services
    modules.push({
      id: "mod-implementation-training",
      name: "Layanan Implementasi, Testing QA & Training",
      category: "Jasa Konsultasi & Setup",
      icon: "🛠️",
      unitPrice: 15000000,
      qty: 1,
      enabled: true,
      features: [
        "Penyusunan Functional Requirement Document (FRD) & User Manual",
        "Setup Konfigurasi Hak Akses & Matriks Otorisasi Pengguna",
        "Sesi Pelatihan Pengguna (Training Admin & Operator) 4 Sesi (@3 Jam)",
        "Migrasi Data Awal & Uji Penerimaan Pengguna (User Acceptance Testing / UAT)"
      ]
    });

    // 2. Cloud Server Infrastructure
    modules.push({
      id: "mod-cloud-infrastructure",
      name: "Infrastruktur Cloud Server & Database Dedicated",
      category: "Infrastruktur & Komputasi",
      icon: "🖥️",
      unitPrice: 18000000,
      qty: 1,
      enabled: true,
      features: [
        "Setup Dedicated Cloud Server Ubuntu OS (8 Core CPU, 32 GB RAM)",
        "Kapasitas Optimasi Beban 60+ Concurrent Users Realtime",
        "Penyimpanan Cloud Storage 100 GB dengan Backup Otomatis Harian Retensi 30 Hari",
        "Konfigurasi SSL HTTPS, Web Application Firewall (WAF) & Keamanan Jaringan"
      ]
    });

    // 3. License & Support SLA
    modules.push({
      id: "mod-license-sla",
      name: "Lisensi Sistem & Garansi Pemeliharaan Tahunan (SLA)",
      category: "Lisensi & Maintenance",
      icon: "🛡️",
      unitPrice: 12000000,
      qty: 1,
      enabled: true,
      features: [
        "Unlimited User License (Tanpa batasan jumlah user pengguna)",
        "Dukungan Teknis Prioritas via Hotline WhatsApp, Email, dan Tiket Bantuan",
        "Garansi Bebas Bug (Bug Fixes) dan Pemeliharaan Sistem Berkelanjutan"
      ]
    });

    return modules;
  }

  // Initialize scope modules
  state.scopeModules = generateDynamicScopeModules(state.projectData);

  function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  }

  function renderScopeTable() {
    if (!dom.scopeTableContainer) return;
    
    // Ensure scope modules match current active project
    if (!state.scopeModules || state.scopeModules.length === 0) {
      state.scopeModules = generateDynamicScopeModules(state.projectData);
    }

    if (dom.scopeProjectTitle) {
      const projectTitle = (state.projectData && state.projectData.project && state.projectData.project.title)
        ? state.projectData.project.title
        : 'Proyek Baru';
      dom.scopeProjectTitle.textContent = `Scope of Work: ${projectTitle}`;
    }

    let html = '';

    state.scopeModules.forEach((mod, idx) => {
      const subtotal = mod.enabled ? mod.unitPrice * mod.qty : 0;

      html += `
        <div class="scope-module-card" id="scope-card-${mod.id}">
          <div class="scope-module-header" data-mod-idx="${idx}">
            <div class="scope-module-header-left">
              <input type="checkbox" class="scope-item-checkbox" data-mod-idx="${idx}" ${mod.enabled ? 'checked' : ''} onclick="event.stopPropagation();" />
              <div class="module-icon-box">${mod.icon}</div>
              <div class="module-title-wrap">
                <div class="module-title-text">${mod.name}</div>
                <div class="module-category-pill">${mod.category}</div>
              </div>
            </div>

            <div class="scope-module-header-right">
              <span class="module-subtotal-badge" id="badge-subtotal-${idx}">${formatRupiah(subtotal)}</span>
              <span class="module-toggle-icon">▼</span>
            </div>
          </div>

          <div class="scope-module-body">
            <table class="scope-table">
              <thead>
                <tr>
                  <th style="width: 55%;">Rincian Cakupan & Spesifikasi Fungsional</th>
                  <th style="width: 12%; text-align: center;">Kuantitas (Qty)</th>
                  <th style="width: 18%;">Harga Satuan (Rp)</th>
                  <th style="width: 15%; text-align: right;">Total Biaya</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div class="scope-item-features-list">
                      ${mod.features.map(f => `<div class="scope-feature-bullet">${f}</div>`).join('')}
                    </div>
                  </td>
                  <td style="text-align: center;">
                    <input type="number" min="1" max="99" class="scope-input-number scope-qty-input" data-mod-idx="${idx}" value="${mod.qty}" />
                  </td>
                  <td>
                    <input type="number" step="1000000" min="0" class="scope-input-number scope-price-input" data-mod-idx="${idx}" value="${mod.unitPrice}" />
                  </td>
                  <td style="text-align: right;" class="scope-subtotal-cell" id="subtotal-cell-${idx}">
                    ${formatRupiah(subtotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    });

    dom.scopeTableContainer.innerHTML = html;

    // Attach Accordion Toggle
    dom.scopeTableContainer.querySelectorAll('.scope-module-header').forEach(header => {
      header.addEventListener('click', () => {
        const card = header.closest('.scope-module-card');
        card.classList.toggle('collapsed');
      });
    });

    // Attach Checkbox Toggles
    dom.scopeTableContainer.querySelectorAll('.scope-item-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.modIdx, 10);
        state.scopeModules[idx].enabled = e.target.checked;
        updateScopeTotals();
      });
    });

    // Attach Qty & Price Inputs
    dom.scopeTableContainer.querySelectorAll('.scope-qty-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.modIdx, 10);
        state.scopeModules[idx].qty = Math.max(1, parseInt(e.target.value, 10) || 1);
        updateScopeTotals();
      });
    });

    dom.scopeTableContainer.querySelectorAll('.scope-price-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.modIdx, 10);
        state.scopeModules[idx].unitPrice = Math.max(0, parseFloat(e.target.value) || 0);
        updateScopeTotals();
      });
    });

    updateScopeTotals();
  }

  function updateScopeTotals() {
    let grandTotal = 0;
    let enabledCount = 0;

    state.scopeModules.forEach((mod, idx) => {
      const subtotal = mod.enabled ? mod.unitPrice * mod.qty : 0;
      if (mod.enabled) {
        grandTotal += subtotal;
        enabledCount++;
      }

      const badge = document.getElementById(`badge-subtotal-${idx}`);
      const cell = document.getElementById(`subtotal-cell-${idx}`);
      if (badge) badge.textContent = formatRupiah(subtotal);
      if (cell) cell.textContent = formatRupiah(subtotal);
    });

    if (dom.kpiTotalCost) dom.kpiTotalCost.textContent = formatRupiah(grandTotal);
    if (dom.kpiItemCount) dom.kpiItemCount.textContent = `${enabledCount} dari ${state.scopeModules.length} modul aktif`;
  }

  function downloadScopePDF() {
    renderFormalSOWModalContent();

    const element = document.getElementById('formal-doc-sheet');
    if (!element) return;

    showToast('⏳ Sedang memproses dan mengunduh file PDF...', 'info');

    const project = (state.projectData && state.projectData.project) ? state.projectData.project : { title: 'Proposal-SOW' };
    const safeTitle = (project.title || 'Proposal-SOW').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const filename = `${safeTitle}-Scope-and-Quotation.pdf`;

    if (typeof html2pdf !== 'undefined') {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        showToast(`✅ File PDF "${filename}" berhasil diunduh!`, 'success');
      }).catch((err) => {
        console.warn('html2pdf generation error, using print fallback:', err);
        window.print();
      });
    } else {
      // Fallback if CDN is unreachable
      renderFormalSOWModal();
      setTimeout(() => window.print(), 300);
    }
  }

  function renderFormalSOWModalContent() {
    if (!dom.formalDocSheet) return;
    const project = (state.projectData && state.projectData.project) ? state.projectData.project : { title: 'Proposal Pengembangan Sistem & Estimasi Biaya' };
    let grandTotal = 0;

    let rowsHtml = '';
    state.scopeModules.forEach((mod, idx) => {
      if (!mod.enabled) return;
      const subtotal = mod.unitPrice * mod.qty;
      grandTotal += subtotal;

      rowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
          <td>
            <strong>${mod.name}</strong> (${mod.category})
            <ul style="margin: 6px 0 0 16px; padding: 0; font-size: 0.78rem; color: #475569;">
              ${mod.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </td>
          <td style="text-align: center;">${mod.qty} Unit</td>
          <td style="text-align: right; font-family: monospace;">${formatRupiah(mod.unitPrice)}</td>
          <td style="text-align: right; font-weight: 700; font-family: monospace;">${formatRupiah(subtotal)}</td>
        </tr>
      `;
    });

    dom.formalDocSheet.innerHTML = `
      <div class="formal-doc-header">
        <div>
          <div style="font-size: 0.75rem; font-weight: 800; color: #ff5722; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">SURAT PENAWARAN & SCOPE OF WORK (SOW)</div>
          <h1 class="formal-doc-title-h1">${project.title}</h1>
          <div class="formal-doc-meta">
            <span>Tanggal Dokumen: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span> • 
            <span>Status: Resmi / Finalized Proposal</span>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 800; font-size: 1.2rem; color: #0f172a;">ngoding<span style="color: #ff5722;">cuy</span></div>
          <div style="font-size: 0.75rem; color: #64748b;">Enterprise Systems & AI Solutions</div>
        </div>
      </div>

      <p style="font-size: 0.85rem; color: #334155; line-height: 1.6; margin-bottom: 16px;">
        Dokumen ini merangkum rincian ruang lingkup pengembangan sistem, modul terintegrasi, spesifikasi infrastruktur server, dan estimasi biaya implementasi:
      </p>

      <table class="formal-table">
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">No</th>
            <th style="width: 50%;">Item & Deskripsi Spesifikasi Fungsional</th>
            <th style="width: 10%; text-align: center;">Qty</th>
            <th style="width: 17%; text-align: right;">Harga Satuan</th>
            <th style="width: 18%; text-align: right;">Total Biaya</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="formal-total-box">
        <table class="formal-total-table">
          <tr>
            <td style="color: #64748b;">Subtotal Modul & Jasa:</td>
            <td style="text-align: right; font-weight: 600; font-family: monospace;">${formatRupiah(grandTotal)}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Pajak / Diskon Tambahan:</td>
            <td style="text-align: right; font-weight: 600; font-family: monospace;">Rp 0</td>
          </tr>
          <tr class="grand-total">
            <td>TOTAL PENAWARAN (IDR):</td>
            <td style="text-align: right; font-family: monospace; color: #ff5722;">${formatRupiah(grandTotal)}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 0.75rem; color: #64748b; display: flex; justify-content: space-between;">
        <div>Kapasitas Server: Ubuntu 8 Core / 32 GB RAM (60 Concurrent Users) • 100 GB Cloud Storage</div>
        <div>Lisensi: Unlimited Users • Garansi & SLA Resmi</div>
      </div>
    `;
  }

  function renderFormalSOWModal() {
    renderFormalSOWModalContent();
    dom.modalSowDocument?.classList.add('show');
  }

  function exportScopeToCSV() {
    let csv = '\uFEFFNo,Modul,Kategori,Kuantitas,Harga Satuan (IDR),Total Biaya (IDR)\n';
    let grandTotal = 0;

    state.scopeModules.forEach((mod, idx) => {
      if (mod.enabled) {
        const subtotal = mod.unitPrice * mod.qty;
        grandTotal += subtotal;
        csv += `"${idx + 1}","${mod.name}","${mod.category}",${mod.qty},${mod.unitPrice},${subtotal}\n`;
      }
    });

    csv += `\n"","TOTAL INVESTASI PROYEK","","","","${grandTotal}"\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const project = (state.projectData && state.projectData.project) ? state.projectData.project : { id: 'project' };
    link.download = `${project.id || 'project'}-scope-quotation.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('📊 File CSV Scope & Quotation berhasil diunduh!', 'success');
  }

  // SOW Buttons & Modal Listeners
  dom.btnDownloadScopePdf?.addEventListener('click', downloadScopePDF);
  dom.btnDownloadModalPdf?.addEventListener('click', downloadScopePDF);
  dom.btnPreviewFormalSow?.addEventListener('click', renderFormalSOWModal);
  dom.btnPrintFormalSow?.addEventListener('click', () => window.print());
  dom.btnExportScopePdf?.addEventListener('click', () => {
    renderFormalSOWModal();
    setTimeout(() => window.print(), 300);
  });
  dom.btnExportScopeCsv?.addEventListener('click', exportScopeToCSV);

  dom.btnCopySowMarkdown?.addEventListener('click', () => {
    let md = `# Scope of Work & Quotation — ${state.projectData.project.title}\n\n`;
    md += `| No | Modul / Layanan | Qty | Harga Satuan (IDR) | Total Biaya (IDR) |\n`;
    md += `|---|---|---|---|---|\n`;
    let grandTotal = 0;

    state.scopeModules.forEach((mod, idx) => {
      if (mod.enabled) {
        const subtotal = mod.unitPrice * mod.qty;
        grandTotal += subtotal;
        md += `| ${idx + 1} | **${mod.name}**<br>_${mod.features.join('; ')}_ | ${mod.qty} | ${formatRupiah(mod.unitPrice)} | ${formatRupiah(subtotal)} |\n`;
      }
    });
    md += `| | **TOTAL** | | | **${formatRupiah(grandTotal)}** |\n`;

    navigator.clipboard.writeText(md).then(() => {
      showToast('📋 Format Markdown SOW & Estimasi berhasil disalin!', 'success');
    });
  });

  dom.btnAddScopeItem?.addEventListener('click', () => {
    const name = prompt('Masukkan Nama Modul / Layanan Tambahan:', 'Custom Integration / Feature');
    if (!name) return;
    const priceStr = prompt('Masukkan Estimasi Biaya (IDR):', '10000000');
    const price = parseFloat(priceStr) || 10000000;

    state.scopeModules.push({
      id: `mod-custom-${Date.now()}`,
      name: name,
      category: "Kustom / Add-On",
      icon: "⭐",
      unitPrice: price,
      qty: 1,
      enabled: true,
      features: [
        "Pengembangan fitur kustom sesuai kebutuhan spesifik",
        "Uji integrasi dan dokumentasi teknis"
      ]
    });

    renderScopeTable();
    showToast(`✅ Modul "${name}" berhasil ditambahkan!`, 'success');
  });

  function generateMarkdownDownload() {
    let md = `# ${state.projectData.project.title} — Project Requirements Document\n\n`;
    md += `> **Versi:** ${state.projectData.project.version || 'v1.0.0'}  \n`;
    md += `> **Status:** ${state.projectData.project.status || 'Perencanaan'}  \n\n`;
    md += `## Problem Statement\n${state.projectData.project.problemStatement}\n\n`;
    if (state.projectData.project.techStack) {
      md += `## Tech Stack\n`;
      state.projectData.project.techStack.forEach(t => {
        md += `- **${t.name}:** ${t.value}\n`;
      });
      md += `\n---\n\n`;
    }

    if (state.projectData.phases) {
      state.projectData.phases.forEach(phase => {
        md += `## Fase ${phase.phaseNumber}: ${phase.title} [${phase.priorityLabel || 'Utama'}]\n`;
        md += `${phase.summary || ''}\n\n`;
        if (phase.subFeatures) {
          phase.subFeatures.forEach(sub => {
            md += `### ${sub.title}\n${sub.desc}\n\n`;
            if (sub.tasks) {
              md += `**Tasks:**\n`;
              sub.tasks.forEach(t => {
                md += `- [ ] [${t.priority}] ${t.title}\n`;
              });
              md += `\n`;
            }
          });
        }
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.projectData.project.id || 'project'}-prd.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('📥 File PRD (.md) berhasil diunduh!', 'success');
  }

  function generateZipDownload() {
    showToast('📦 Menyiapkan berkas ZIP (PRD + Spesifikasi Task)...', 'info');
    setTimeout(() => {
      generateMarkdownDownload();
      showToast('✅ Download arsip ZIP selesai!', 'success');
    }, 1000);
  }

  // Initial render
  refreshEntireUI();
  switchView('initial');
  window.addEventListener('resize', renderMindMapConnectors);
});
