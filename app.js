(() => {
  "use strict";

  const STORAGE_KEY = "conteudo-os-web-v4";
  const AREAS = ["Central Elegibilidades", "UGC", "Perfil pessoal", "On Drop", "Administrativo", "Pessoal"];
  const ROUTES = {
    today: { title: "Hoje", eyebrow: "PAINEL DO DIA", template: "todayTemplate" },
    create: { title: "Criar", eyebrow: "ESTÚDIO DE CONTEÚDO", template: "createTemplate" },
    projects: { title: "Projetos", eyebrow: "CENTRAL DE ORGANIZAÇÃO", template: "projectsTemplate" },
    calendar: { title: "Calendário", eyebrow: "PLANEJAMENTO", template: "calendarTemplate" },
    insights: { title: "Insights", eyebrow: "PERFORMANCE", template: "insightsTemplate" }
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const now = new Date();
  const toISODate = date => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const addDays = days => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return toISODate(d);
  };
  const parseDate = value => value ? new Date(`${value}T12:00:00`) : null;
  const formatDate = (value, options = { day: "2-digit", month: "short" }) => {
    const d = typeof value === "string"
      ? (value.includes("T") ? new Date(value) : parseDate(value))
      : new Date(value);
    if (!d || Number.isNaN(d.getTime())) return "Sem prazo";
    return new Intl.DateTimeFormat("pt-BR", options).format(d);
  };
  const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const clamp = value => Math.min(Math.max(Number(value) || 0, 0), 5);

  function seedState() {
    return {
      version: 1,
      settings: { generationMode: "demo", backendUrl: "http://127.0.0.1:8787" },
      briefingDraft: null,
      tasks: [
        { id: uid(), title: "Finalizar roteiro UGC da campanha de skincare", notes: "Validar alegações permitidas antes de gravar.", area: "UGC", dueDate: addDays(0), estimatedMinutes: 70, energy: "Alta", consequence: 5, revenueImpact: 5, strategicImpact: 4, blocksOthers: true, completed: false, createdAt: new Date().toISOString() },
        { id: uid(), title: "Separar três pautas esportivas para a On Drop", notes: "Priorizar assuntos que ainda tenham relevância amanhã.", area: "On Drop", dueDate: addDays(1), estimatedMinutes: 35, energy: "Média", consequence: 2, revenueImpact: 0, strategicImpact: 4, blocksOthers: false, completed: false, createdAt: new Date().toISOString() },
        { id: uid(), title: "Responder proposta comercial da marca", notes: "Confirmar escopo, direitos de uso e prazo de pagamento.", area: "UGC", dueDate: addDays(0), estimatedMinutes: 15, energy: "Baixa", consequence: 4, revenueImpact: 5, strategicImpact: 3, blocksOthers: false, completed: false, createdAt: new Date().toISOString() },
        { id: uid(), title: "Criar capa para o próximo Reels", notes: "Aplicar identidade marrom e rosa.", area: "Perfil pessoal", dueDate: addDays(3), estimatedMinutes: 25, energy: "Baixa", consequence: 1, revenueImpact: 0, strategicImpact: 3, blocksOthers: false, completed: false, createdAt: new Date().toISOString() },
        { id: uid(), title: "Organizar notas fiscais e pagamentos pendentes", notes: "Revisar vencimentos dos próximos sete dias.", area: "Administrativo", dueDate: addDays(2), estimatedMinutes: 40, energy: "Média", consequence: 4, revenueImpact: 4, strategicImpact: 2, blocksOthers: false, completed: false, createdAt: new Date().toISOString() }
      ],
      projects: [
        { id: uid(), name: "Campanha UGC — Skincare", area: "UGC", status: "Em andamento", priority: 1, dueDate: addDays(3), createdAt: new Date().toISOString() },
        { id: uid(), name: "Calendário editorial do perfil", area: "Perfil pessoal", status: "Planejado", priority: 2, dueDate: addDays(8), createdAt: new Date().toISOString() },
        { id: uid(), name: "Crescimento On Drop", area: "On Drop", status: "Em andamento", priority: 2, dueDate: addDays(15), createdAt: new Date().toISOString() },
        { id: uid(), name: "Materiais comerciais — Central", area: "Central Elegibilidades", status: "Aguardando terceiro", priority: 1, dueDate: addDays(4), createdAt: new Date().toISOString() },
        { id: uid(), name: "Atualização do portfólio", area: "UGC", status: "Planejado", priority: 2, dueDate: addDays(12), createdAt: new Date().toISOString() }
      ],
      scripts: [],
      metrics: [
        { id: uid(), contentTitle: "Review de protetor solar", platform: "Instagram Reels", publishedAt: addDays(-6), views: 8420, retentionPercent: 68.4, clicks: 312, conversions: 19, hook: "Eu parei de escolher protetor solar só pelo FPS." },
        { id: uid(), contentTitle: "Look Pinterest vs realidade", platform: "Instagram Reels", publishedAt: addDays(-12), views: 5190, retentionPercent: 54.2, clicks: 96, conversions: 4, hook: "Será que esse look do Pinterest funciona na vida real?" }
      ]
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedState();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.projects)) return seedState();
      return { ...seedState(), ...parsed, settings: { ...seedState().settings, ...(parsed.settings || {}) } };
    } catch {
      return seedState();
    }
  }

  let state = loadState();
  let route = location.hash.replace("#", "") || "today";
  if (!ROUTES[route]) route = "today";
  let projectAreaFilter = "Todas";
  let calendarCursor = new Date(now.getFullYear(), now.getMonth(), 1);
  let brandAssetSession = { names: [], palette: [], previews: [] };

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function priorityScore(task) {
    let score = clamp(task.consequence) * 10;
    score += clamp(task.revenueImpact) * 6;
    score += clamp(task.strategicImpact) * 5;
    score += task.blocksOthers ? 12 : 0;
    if (task.dueDate) {
      const start = parseDate(toISODate(new Date()));
      const due = parseDate(task.dueDate);
      const days = Math.round((due - start) / 86400000);
      if (days < 0) score += 35;
      else if (days === 0) score += 30;
      else if (days === 1) score += 24;
      else if (days <= 3) score += 16;
      else if (days <= 7) score += 8;
    }
    if (Number(task.estimatedMinutes) <= 15) score += 3;
    if (Number(task.estimatedMinutes) > 180) score -= 4;
    return score;
  }

  function daysUntil(date) {
    if (!date) return null;
    return Math.round((parseDate(date) - parseDate(toISODate(new Date()))) / 86400000);
  }

  function dueLabel(date) {
    const days = daysUntil(date);
    if (days === null) return "Sem prazo";
    if (days < 0) return `${Math.abs(days)}d atrasada`;
    if (days === 0) return "Hoje";
    if (days === 1) return "Amanhã";
    return formatDate(date);
  }

  function populateAreaSelect(select, includeAll = false) {
    select.innerHTML = `${includeAll ? '<option>Todas</option>' : ""}${AREAS.map(area => `<option>${escapeHTML(area)}</option>`).join("")}`;
  }

  function setRoute(nextRoute) {
    route = ROUTES[nextRoute] ? nextRoute : "today";
    location.hash = route;
    render();
    document.querySelector(".sidebar")?.classList.remove("open");
  }

  function render() {
    const config = ROUTES[route];
    $("#pageTitle").textContent = config.title;
    $("#pageEyebrow").textContent = config.eyebrow;
    $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.route === route));
    const content = $("#pageContent");
    content.innerHTML = "";
    content.append($("#" + config.template).content.cloneNode(true));
    updateModeBadge();
    if (route === "today") renderToday();
    if (route === "create") renderCreate();
    if (route === "projects") renderProjects();
    if (route === "calendar") renderCalendar();
    if (route === "insights") renderInsights();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function updateModeBadge() {
    const badge = $("#modeBadge");
    badge.textContent = state.settings.generationMode === "backend" ? "IA via backend" : "Modo demonstração";
  }

  function renderToday() {
    $("#newTaskBtn").addEventListener("click", openTaskModal);
    const open = state.tasks.filter(task => !task.completed).sort((a, b) => priorityScore(b) - priorityScore(a));
    const dueToday = open.filter(task => task.dueDate === toISODate(new Date())).length;
    const overdue = open.filter(task => daysUntil(task.dueDate) < 0).length;
    const minutes = open.slice(0, 3).reduce((sum, task) => sum + Number(task.estimatedMinutes || 0), 0);
    $("#todayStats").innerHTML = [
      statCard("Tarefas abertas", open.length, "Todas as áreas"),
      statCard("Para hoje", dueToday, overdue ? `${overdue} atrasada(s)` : "Nenhuma atrasada"),
      statCard("Foco sugerido", `${Math.round(minutes / 60 * 10) / 10}h`, "3 prioridades"),
      statCard("Projetos ativos", state.projects.filter(p => p.status !== "Concluído").length, "Em andamento e planejados")
    ].join("");

    const plan = { main: open[0], important: open.slice(1, 3), overflow: open.slice(3) };
    $("#capacityBadge").textContent = plan.overflow.length ? `${plan.overflow.length} fora da capacidade` : "Capacidade equilibrada";
    const planRoot = $("#dailyPlan");
    if (!plan.main) {
      planRoot.innerHTML = emptyState("Nenhuma tarefa aberta", "Adicione uma próxima ação para montar seu plano.");
    } else {
      planRoot.innerHTML = [planItem(plan.main, 1, true), ...plan.important.map((task, index) => planItem(task, index + 2, false))].join("") +
        (plan.overflow.length ? `<div class="empty-state" style="margin-top:14px"><strong>Não tente fazer tudo hoje.</strong><p>${plan.overflow.length} tarefa(s) permanecem na fila e podem ser replanejadas.</p></div>` : "");
      $$("[data-complete-task]", planRoot).forEach(button => button.addEventListener("click", () => toggleTask(button.dataset.completeTask)));
    }

    const upcoming = open.filter(t => t.dueDate).sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate)).slice(0, 6);
    $("#upcomingDeadlines").innerHTML = upcoming.length ? upcoming.map(task => `<div class="deadline-item"><div><strong>${escapeHTML(task.title)}</strong><span>${escapeHTML(task.area)}</span></div><span class="deadline-date">${escapeHTML(dueLabel(task.dueDate))}</span></div>`).join("") : emptyState("Sem prazos", "Nenhum prazo foi definido.");

    const filter = $("#taskAreaFilter");
    populateAreaSelect(filter, true);
    filter.addEventListener("change", () => renderTaskList(filter.value));
    renderTaskList("Todas");
  }

  function statCard(label, value, detail) {
    return `<div class="stat-card"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong><small>${escapeHTML(detail)}</small></div>`;
  }

  function planItem(task, rank, isMain) {
    return `<article class="plan-block ${isMain ? "main" : ""}">
      <div class="plan-rank">${rank}</div>
      <div class="plan-content"><strong>${escapeHTML(task.title)}</strong><div class="meta-row"><span class="chip">${escapeHTML(task.area)}</span><span>${escapeHTML(task.energy)} energia</span><span>${task.estimatedMinutes} min</span><span>${escapeHTML(dueLabel(task.dueDate))}</span><span class="chip score-chip">Prioridade ${priorityScore(task)}</span></div></div>
      <button class="complete-button" data-complete-task="${task.id}">Concluir</button>
    </article>`;
  }

  function renderTaskList(area) {
    const root = $("#taskList");
    if (!root) return;
    const tasks = state.tasks.filter(task => area === "Todas" || task.area === area).sort((a, b) => Number(a.completed) - Number(b.completed) || priorityScore(b) - priorityScore(a));
    root.innerHTML = tasks.length ? tasks.map(task => `<div class="task-row ${task.completed ? "completed" : ""}">
      <input class="task-check" type="checkbox" ${task.completed ? "checked" : ""} data-task-check="${task.id}" aria-label="Concluir tarefa" />
      <div><div class="task-title">${escapeHTML(task.title)}</div><div class="meta-row"><span class="chip">${escapeHTML(task.area)}</span><span>${escapeHTML(dueLabel(task.dueDate))}</span><span>${task.estimatedMinutes} min</span><span>Score ${priorityScore(task)}</span></div></div>
      <div class="task-actions"><button class="mini-button" data-delete-task="${task.id}" title="Excluir">×</button></div>
    </div>`).join("") : emptyState("Nenhuma tarefa", "Não existem tarefas neste filtro.");
    $$("[data-task-check]", root).forEach(input => input.addEventListener("change", () => toggleTask(input.dataset.taskCheck)));
    $$("[data-delete-task]", root).forEach(button => button.addEventListener("click", () => deleteTask(button.dataset.deleteTask)));
  }

  function toggleTask(id) {
    const task = state.tasks.find(item => item.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveState();
    render();
    showToast(task.completed ? "Tarefa concluída." : "Tarefa reaberta.");
  }

  function deleteTask(id) {
    if (!confirm("Excluir esta tarefa?")) return;
    state.tasks = state.tasks.filter(item => item.id !== id);
    saveState();
    render();
    showToast("Tarefa excluída.");
  }

  function openTaskModal(prefill = {}) {
    openModal("taskModalTemplate", root => {
      const form = $("#taskForm", root);
      populateAreaSelect(form.elements.area);
      form.elements.area.value = prefill.area || "UGC";
      form.elements.dueDate.value = prefill.dueDate || "";
      form.elements.title.value = prefill.title || "";
      form.addEventListener("submit", event => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        state.tasks.push({
          id: uid(), title: data.title.trim(), notes: data.notes.trim(), area: data.area,
          dueDate: data.dueDate || null, estimatedMinutes: Number(data.estimatedMinutes), energy: data.energy,
          consequence: Number(data.consequence), revenueImpact: Number(data.revenueImpact), strategicImpact: Number(data.strategicImpact),
          blocksOthers: form.elements.blocksOthers.checked, completed: false, createdAt: new Date().toISOString()
        });
        saveState();
        closeModal();
        render();
        showToast("Tarefa adicionada ao sistema.");
      });
    });
  }

  function renderCreate() {
    const form = $("#briefingForm");
    const draft = state.briefingDraft;
    brandAssetSession = {
      names: Array.isArray(draft?.brandAssetNames) ? draft.brandAssetNames : [],
      palette: Array.isArray(draft?.brandPalette) ? draft.brandPalette : [],
      previews: []
    };
    if (draft) fillForm(form, draft);
    renderBrandAssetPreview();

    const fileInput = form.elements.brandAssetFiles;
    fileInput?.addEventListener("change", async () => {
      const files = [...fileInput.files].slice(0, 4);
      if (fileInput.files.length > 4) showToast("Foram consideradas apenas as quatro primeiras imagens.");
      brandAssetSession = await analyzeBrandFiles(files);
      renderBrandAssetPreview();
    });

    $("#loadBriefingExampleBtn").addEventListener("click", () => {
      fillForm(form, briefingExample());
      brandAssetSession = { names: [], palette: ["#7A3F2E", "#D89B63", "#F2E2C4"], previews: [] };
      renderBrandAssetPreview();
      showToast("Exemplo carregado. Agora clique em “Criar roteiro”.");
    });
    $("#generateScriptTopBtn").addEventListener("click", () => form.requestSubmit());
    $("#saveBriefingBtn").addEventListener("click", () => {
      state.briefingDraft = formToObject(form);
      saveState();
      showToast("Rascunho salvo neste navegador.");
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const briefing = formToObject(form);
      const missing = validateBriefing(briefing);
      if (missing.length) {
        showToast(`Preencha: ${missing.join(", ")}.`);
        return;
      }
      state.briefingDraft = briefing;
      saveState();
      await generateScript(briefing);
    });

    renderScriptHistory();
    if (state.scripts[0]) renderScript(state.scripts[0]);
  }

  function formToObject(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    return {
      ...data,
      durationSeconds: Number(data.durationSeconds || 45),
      niche: data.product || "",
      platform: "Instagram Reels",
      mainDesire: "",
      productQuestions: "",
      sensation: "",
      purchaseMotive: "",
      objection: "",
      proofAvailable: "",
      authorityProof: "",
      restrictions: data.receivedBriefing || "",
      brandAssetNames: brandAssetSession.names,
      brandPalette: brandAssetSession.palette,
      firstPersonBody: true
    };
  }

  function fillForm(form, values) {
    Object.entries(values || {}).forEach(([key, value]) => {
      if (["brandAssetNames", "brandPalette"].includes(key)) return;
      const field = form.elements[key];
      if (field && field.type !== "file") field.value = value ?? "";
    });
  }

  function validateBriefing(briefing) {
    const missing = [];
    if (!briefing.brand?.trim()) missing.push("Marca");
    if (!briefing.product?.trim()) missing.push("Produto");
    if (!briefing.objective?.trim()) missing.push("Objetivo");
    if (!briefing.targetAudience?.trim()) missing.push("Público");
    if (!briefing.mainPain?.trim()) missing.push("Problema ou desejo");
    if (!briefing.differentiator?.trim()) missing.push("Diferenciais");
    return missing;
  }

  function briefingExample() {
    return {
      brand: "Caldaria da Vila",
      product: "Caldo artesanal de mandioquinha com frango",
      objective: "Gerar vendas",
      distribution: "Orgânico e mídia paga",
      format: "Deixar o aplicativo escolher",
      durationSeconds: 45,
      targetAudience: "Pessoas que amam caldos, chegam cansadas em casa e querem um jantar prático e gostoso.",
      mainPain: "Chegar em casa cansada, não querer cozinhar e ter medo de pedir uma refeição sem graça.",
      differentiator: "Sabor caseiro, textura cremosa, porção bem servida e praticidade para pedir.",
      receivedBriefing: "Criar um vídeo natural que gere vontade de pedir. Mostrar textura, porção e primeira reação. Não afirmar que é o melhor caldo da cidade.",
      hookPreference: "Escolher automaticamente",
      includeBRoll: "Automático",
      ctaType: "Escolher automaticamente",
      offerDetails: "",
      brandLinks: "",
      brandVisualNotes: "Comunicação acolhedora, apetitosa e informal, com tons quentes."
    };
  }

  async function analyzeBrandFiles(files) {
    if (!files.length) return { names: [], palette: [], previews: [] };
    const names = files.map(file => file.name);
    const previews = [];
    const colors = [];
    for (const file of files) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        previews.push({ name: file.name, dataUrl });
        const palette = await extractPalette(dataUrl);
        colors.push(...palette);
      } catch { /* arquivo ignorado */ }
    }
    return { names, previews, palette: uniqueColors(colors).slice(0, 6) };
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function extractPalette(dataUrl) {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 80;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, size, size);
        const pixels = ctx.getImageData(0, 0, size, size).data;
        const buckets = new Map();
        for (let i = 0; i < pixels.length; i += 20) {
          const alpha = pixels[i + 3];
          if (alpha < 180) continue;
          let r = Math.round(pixels[i] / 32) * 32;
          let g = Math.round(pixels[i + 1] / 32) * 32;
          let b = Math.round(pixels[i + 2] / 32) * 32;
          if (r > 240 && g > 240 && b > 240) continue;
          if (r < 20 && g < 20 && b < 20) continue;
          r = Math.min(255, r); g = Math.min(255, g); b = Math.min(255, b);
          const key = `${r},${g},${b}`;
          buckets.set(key, (buckets.get(key) || 0) + 1);
        }
        const palette = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([rgb]) => {
          const [r, g, b] = rgb.split(",").map(Number);
          return `#${[r, g, b].map(value => value.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
        });
        resolve(palette);
      };
      image.onerror = () => resolve([]);
      image.src = dataUrl;
    });
  }

  function uniqueColors(colors) {
    const unique = [];
    for (const color of colors) if (color && !unique.includes(color)) unique.push(color);
    return unique;
  }

  function renderBrandAssetPreview() {
    const root = $("#brandAssetPreview");
    if (!root) return;
    if (!brandAssetSession.names.length && !brandAssetSession.palette.length) {
      root.innerHTML = '<div class="empty-state">Nenhum print analisado.</div>';
      return;
    }
    const images = brandAssetSession.previews.map(item => `<figure class="brand-thumb"><img src="${item.dataUrl}" alt="${escapeHTML(item.name)}"><figcaption>${escapeHTML(item.name)}</figcaption></figure>`).join("");
    const namesOnly = !images ? brandAssetSession.names.map(name => `<span class="chip">${escapeHTML(name)}</span>`).join("") : "";
    const swatches = brandAssetSession.palette.map(color => `<span class="color-swatch" title="${color}" style="--swatch:${color}"><i></i>${color}</span>`).join("");
    root.innerHTML = `<div class="brand-thumbs">${images}</div><div class="meta-row">${namesOnly}</div><div class="palette-row">${swatches}</div>`;
  }

  function analyzeBriefingDraft(briefing) {
    const engine = window.UGCEngine.generate(briefing);
    const questions = engine.briefingQuestions;
    const status = $("#briefingAnalysisStatus");
    const preview = $("#briefingQuestionsPreview");
    status.textContent = questions.length ? `${questions.length} ponto(s) precisam ser confirmados.` : "Briefing suficientemente completo para gerar a primeira versão.";
    preview.innerHTML = questions.length
      ? `<div class="analysis-result"><strong>Perguntas antes de gravar</strong><ul>${questions.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul></div>`
      : '<div class="analysis-result success"><strong>Briefing completo</strong><p>O sistema não encontrou lacunas críticas. Ainda assim, revise as alegações e a oferta com a marca.</p></div>';
  }

  function analyzeBrandReferences(briefing) {
    const reading = window.UGCEngine.generate(briefing).brandReading;
    const status = $("#brandAnalysisStatus");
    const preview = $("#brandAnalysisPreview");
    status.textContent = reading.sources.length ? `${reading.sources.length} referência(s) registrada(s).` : "Adicione ao menos um link, print ou descrição da comunicação.";
    preview.innerHTML = `<div class="analysis-result"><strong>Leitura aplicada ao roteiro</strong><p>${escapeHTML(reading.visualIdentitySummary)}</p><p>${escapeHTML(reading.communicationStyle)}</p><p class="scene-detail">${escapeHTML(reading.limitation)}</p>${reading.palette.length ? `<div class="palette-row">${reading.palette.map(color => `<span class="color-swatch" style="--swatch:${color}"><i></i>${color}</span>`).join("")}</div>` : ""}</div>`;
  }

  async function generateScript(briefing) {
    const preview = $("#scriptPreview");
    preview.innerHTML = `<div class="loading-state"><div class="spinner"></div><h3>Construindo o roteiro</h3><p>Analisando gancho, produto, marca, cenas, prova e CTA...</p></div>`;
    try {
      let response;
      if (state.settings.generationMode === "backend") {
        const base = state.settings.backendUrl.replace(/\/$/, "");
        const result = await fetch(`${base}/v1/scripts/generate`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ briefing })
        });
        const payload = await result.json().catch(() => ({}));
        if (!result.ok) throw new Error(payload.error || "O backend não respondeu corretamente.");
        response = payload.version === "4.0" ? payload : window.UGCEngine.generate(briefing);
      } else {
        await new Promise(resolve => setTimeout(resolve, 550));
        response = window.UGCEngine.generate(briefing);
      }
      const script = { id: uid(), briefing, response, selectedHookIndex: 0, createdAt: new Date().toISOString() };
      state.scripts.unshift(script);
      state.scripts = state.scripts.slice(0, 30);
      saveState();
      renderScript(script);
      renderScriptHistory();
      showToast("Roteiro pronto gerado e salvo.");
    } catch (error) {
      preview.innerHTML = `<div class="empty-state large"><div class="empty-icon">!</div><h3>Não foi possível gerar</h3><p>${escapeHTML(error.message)}</p><button class="primary-button" id="fallbackDemoBtn">Usar modo demonstração</button></div>`;
      $("#fallbackDemoBtn")?.addEventListener("click", () => {
        state.settings.generationMode = "demo";
        saveState(); updateModeBadge(); generateScript(briefing);
      });
    }
  }

  function normalizeHook(hook) {
    return {
      type: hook?.type || "Textual",
      text: hook?.text || hook?.spokenLine || "",
      spokenLine: hook?.spokenLine || "",
      onScreenText: hook?.onScreenText || "",
      recordSteps: Array.isArray(hook?.recordSteps) ? hook.recordSteps : [],
      bRoll: hook?.bRoll || "",
      cutAfter: hook?.cutAfter || ""
    };
  }

  function renderSteps(steps) {
    return `<ol class="record-steps">${(steps || []).map(step => `<li>${escapeHTML(step)}</li>`).join("")}</ol>`;
  }

  function renderScript(script) {
    const root = $("#scriptPreview");
    if (!root || !script?.response) return;
    const r = script.response;
    const hooks = (r.hooks || []).map(normalizeHook);
    const selectedIndex = Number.isInteger(script.selectedHookIndex) ? script.selectedHookIndex : Number(r.selectedHookIndex || 0);
    script.selectedHookIndex = Math.min(Math.max(selectedIndex, 0), Math.max(hooks.length - 1, 0));
    const selected = hooks[script.selectedHookIndex] || hooks[0];

    root.innerHTML = `
      <div class="script-header practical-script-header">
        <div>
          <p class="eyebrow">ROTEIRO PRONTO PARA GRAVAR</p>
          <h3>${escapeHTML(script.briefing.brand)} — ${escapeHTML(script.briefing.product)}</h3>
          <div class="meta-row"><span class="chip">${escapeHTML(r.recommendedFormat || "")}</span><span class="chip">${script.briefing.durationSeconds}s</span></div>
        </div>
        <button class="mini-button" id="copyFullScriptBtn">Copiar tudo</button>
      </div>

      <section class="practical-section hook-picker-section">
        <div class="practical-section-title">
          <div><span class="step-number">1</span><div><h4>Escolha a abertura</h4><p>Clique em A, B ou C. A Cena 1 será alterada imediatamente.</p></div></div>
          <span class="selected-confirmation">Gancho ${String.fromCharCode(65 + script.selectedHookIndex)} aplicado</span>
        </div>
        <div class="hook-choice-grid">
          ${hooks.map((hook, index) => `
            <button class="hook-choice ${index === script.selectedHookIndex ? "selected" : ""}" data-hook-index="${index}">
              <div class="hook-choice-top"><span class="hook-letter">${String.fromCharCode(65 + index)}</span><span class="chip">${escapeHTML(hook.type)}</span>${index === script.selectedHookIndex ? '<span class="selected-label">APLICADO</span>' : ''}</div>
              <strong>${escapeHTML(hook.spokenLine || hook.text)}</strong>
              <small>${escapeHTML(hook.onScreenText ? `Texto na tela: ${hook.onScreenText}` : "Sem texto obrigatório")}</small>
            </button>`).join("")}
        </div>
      </section>

      <section class="practical-section">
        <div class="practical-section-title">
          <div><span class="step-number">2</span><div><h4>Grave cena por cena</h4><p>Siga os passos na ordem. Não há explicação teórica no meio do roteiro.</p></div></div>
        </div>
        <div class="practical-scenes">
          ${(r.scenes || []).map(scene => `
            <article class="practical-scene-card ${scene.number === 1 ? "active-hook-scene" : ""}">
              <header><div><span>CENA ${scene.number}</span><h5>${escapeHTML(scene.element || "")}</h5></div><strong>${escapeHTML(scene.seconds || "")}</strong></header>
              <div class="scene-practical-block speak-block"><span>FALE</span><p>“${escapeHTML(scene.spokenLine || "Sem fala nesta ação.")}”</p></div>
              <div class="scene-practical-block"><span>GRAVE ASSIM</span>${renderSteps(scene.recordSteps)}</div>
              ${scene.screenText ? `<div class="scene-practical-row"><span>TEXTO NA TELA</span><strong>${escapeHTML(scene.screenText)}</strong></div>` : ""}
              ${scene.bRoll && !/não grave b-roll/i.test(scene.bRoll) ? `<div class="scene-practical-row subtle-row"><span>B-ROLL</span><p>${escapeHTML(scene.bRoll)}</p></div>` : ""}
              <div class="scene-practical-row subtle-row"><span>FINAL DA CENA</span><p>${escapeHTML(scene.cutAfter || "Corte ao terminar a ação.")}</p></div>
            </article>`).join("")}
        </div>
      </section>

      <section class="practical-section delivery-grid-section">
        <div class="practical-section-title">
          <div><span class="step-number">3</span><div><h4>Finalize a publicação</h4><p>CTA, legenda, capa e visual já preparados.</p></div></div>
        </div>
        <div class="practical-delivery-grid">
          <article class="delivery-card"><span>CTA</span>${copyRow(r.primaryCTA)}</article>
          <article class="delivery-card"><span>LEGENDA</span>${copyRow(r.caption)}</article>
          <article class="delivery-card"><span>CAPA</span><strong>${escapeHTML(r.coverIdeas?.[0]?.title || r.coverTitle || "")}</strong><p>${escapeHTML(r.coverIdeas?.[0]?.photo || "")}</p></article>
          <article class="delivery-card"><span>ROUPA</span><strong>${escapeHTML(r.stylingIdeas?.outfit || "")}</strong><p>${escapeHTML(r.stylingIdeas?.accessories || "")}</p></article>
        </div>
      </section>

      <details class="internal-details">
        <summary>Ver informações estratégicas extras</summary>
        <div class="internal-details-content">
          <p><strong>Diferenciais:</strong> ${escapeHTML(r.mandatoryAnswers?.differentials || "")}</p>
          <p><strong>Dúvidas consideradas:</strong> ${escapeHTML((r.mandatoryAnswers?.possibleQuestions || []).join(" · "))}</p>
          <p><strong>Motivo de compra:</strong> ${escapeHTML(r.mandatoryAnswers?.purchaseMotive || "")}</p>
          <p><strong>Objeção processada:</strong> ${escapeHTML(r.mandatoryAnswers?.objection || "")}</p>
          <p><strong>Base interna carregada:</strong> ${Number(r.internalLibrary?.audioHooks || 0)} ganchos auditivos, ${Number(r.internalLibrary?.visualFamilies || 0)} famílias visuais, ${Number(r.internalLibrary?.ctas || 0)} CTAs e ${Number(r.internalLibrary?.formats || 0)} formatos.</p>
        </div>
      </details>

      <div class="form-actions practical-result-actions">
        <button class="secondary-button" id="createTasksFromScriptBtn">Criar tarefas de produção</button>
        <button class="primary-button" id="copyFullScriptBottomBtn">Copiar roteiro</button>
      </div>`;

    $$('[data-hook-index]', root).forEach(button => button.addEventListener("click", () => {
      const index = Number(button.dataset.hookIndex);
      script.selectedHookIndex = index;
      if (window.UGCEngine?.applyHook) window.UGCEngine.applyHook(script.response, index);
      else {
        script.response.selectedHookIndex = index;
        script.response.selectedHook = hooks[index]?.text || "";
      }
      saveState();
      renderScript(script);
      showToast(`Gancho ${String.fromCharCode(65 + index)} aplicado à Cena 1.`);
    }));

    $$('[data-copy-text]', root).forEach(button => button.addEventListener("click", () => copyText(decodeURIComponent(button.dataset.copyText))));
    $("#copyFullScriptBtn", root)?.addEventListener("click", () => copyText(scriptToPlainText(script)));
    $("#copyFullScriptBottomBtn", root)?.addEventListener("click", () => copyText(scriptToPlainText(script)));
    $("#createTasksFromScriptBtn", root)?.addEventListener("click", () => createTasksFromScript(script));
  }

  function copyRow(text) {
    const safe = String(text ?? "");
    return `<div class="copy-row"><p>${escapeHTML(safe)}</p><button class="mini-button" data-copy-text="${encodeURIComponent(safe)}">Copiar</button></div>`;
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const area = document.createElement("textarea"); area.value = text; document.body.append(area); area.select(); document.execCommand("copy"); area.remove();
    }
    showToast("Texto copiado.");
  }

  function scriptToPlainText(script) {
    const r = script.response;
    return [
      `${script.briefing.brand} — ${script.briefing.product}`,
      `Formato: ${r.recommendedFormat || ""}`,
      "",
      ...(r.scenes || []).flatMap(scene => [
        `CENA ${scene.number} — ${scene.element || ""} (${scene.seconds || ""})`,
        `FALE: ${scene.spokenLine || "Sem fala."}`,
        `GRAVE ASSIM: ${(scene.recordSteps || []).map((step, i) => `${i + 1}. ${step}`).join(" ")}`,
        scene.screenText ? `TEXTO NA TELA: ${scene.screenText}` : "",
        scene.bRoll ? `B-ROLL: ${scene.bRoll}` : "",
        `FINAL DA CENA: ${scene.cutAfter || ""}`,
        ""
      ].filter(Boolean)),
      `CTA: ${r.primaryCTA || ""}`,
      "",
      `LEGENDA: ${r.caption || ""}`,
      "",
      `CAPA: ${r.coverIdeas?.[0]?.title || r.coverTitle || ""} — ${r.coverIdeas?.[0]?.photo || ""}`,
      "",
      `ROUPA: ${r.stylingIdeas?.outfit || ""}`,
      `ACESSÓRIOS: ${r.stylingIdeas?.accessories || ""}`
    ].join("\n");
  }

  function createTasksFromScript(script) {
    const tasks = [
      ["Revisar briefing, dúvidas e alegações", 25, "Média"],
      ["Escolher gancho e versão A/B", 20, "Média"],
      ["Separar roupa, acessórios, cenário e produto", 35, "Baixa"],
      ["Gravar falas e takes principais", 75, "Alta"],
      ["Gravar B-roll selecionado", 45, "Média"],
      ["Editar, legendar e criar capa", 120, "Alta"],
      ["Revisar CTA e enviar para aprovação", 35, "Média"]
    ];
    tasks.forEach(([title, minutes, energy], index) => state.tasks.push({
      id: uid(), title: `${title} — ${script.briefing.brand}`, notes: script.briefing.product, area: "UGC",
      dueDate: addDays(index < 2 ? 1 : index < 5 ? 2 : 3), estimatedMinutes: minutes, energy,
      consequence: index >= 5 ? 5 : 3, revenueImpact: 4, strategicImpact: 4, blocksOthers: index < 4,
      completed: false, createdAt: new Date().toISOString()
    }));
    saveState(); showToast("Sete tarefas foram adicionadas ao planejamento.");
  }

  function renderScriptHistory() {
    const root = $("#scriptHistory");
    if (!root) return;
    root.innerHTML = state.scripts.length ? state.scripts.map(script => `<div class="history-item"><div><strong>${escapeHTML(script.briefing.brand)} — ${escapeHTML(script.briefing.product)}</strong><div class="meta-row"><span>${formatDate(script.createdAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span><span class="chip">${escapeHTML(script.briefing.platform)}</span><span class="chip">v${escapeHTML(script.response?.version || "1")}</span></div></div><div class="task-actions"><button class="mini-button" data-open-script="${script.id}">Abrir</button><button class="mini-button" data-delete-script="${script.id}">×</button></div></div>`).join("") : emptyState("Nenhum roteiro salvo", "Os roteiros gerados aparecerão aqui.");
    $$('[data-open-script]', root).forEach(button => button.addEventListener("click", () => renderScript(state.scripts.find(s => s.id === button.dataset.openScript))));
    $$('[data-delete-script]', root).forEach(button => button.addEventListener("click", () => {
      if (!confirm("Excluir este roteiro?")) return;
      state.scripts = state.scripts.filter(s => s.id !== button.dataset.deleteScript);
      saveState(); render(); showToast("Roteiro excluído.");
    }));
  }

  function renderProjects() {
    $("#newProjectBtn").addEventListener("click", openProjectModal);
    const filters = ["Todas", ...AREAS];
    $("#projectFilters").innerHTML = filters.map(area => `<button class="filter-button ${area === projectAreaFilter ? "active" : ""}" data-project-filter="${escapeHTML(area)}">${escapeHTML(area)}</button>`).join("");
    $$("[data-project-filter]").forEach(button => button.addEventListener("click", () => { projectAreaFilter = button.dataset.projectFilter; renderProjects(); }));
    const selected = state.projects.filter(project => projectAreaFilter === "Todas" || project.area === projectAreaFilter);
    const columns = [
      { title: "Planejamento", states: ["Ideia", "Planejado"] },
      { title: "Em andamento", states: ["Em andamento"] },
      { title: "Aguardando", states: ["Aguardando terceiro", "Pausado"] },
      { title: "Concluído", states: ["Concluído"] }
    ];
    $("#projectBoard").innerHTML = columns.map(column => {
      const items = selected.filter(project => column.states.includes(project.status));
      return `<section class="project-column"><div class="project-column-head"><h3>${column.title}</h3><span class="project-count">${items.length}</span></div>${items.length ? items.map(projectCard).join("") : '<div class="empty-state">Nenhum projeto</div>'}</section>`;
    }).join("");
    $$("[data-project-next]").forEach(button => button.addEventListener("click", () => advanceProject(button.dataset.projectNext)));
    $$("[data-project-delete]").forEach(button => button.addEventListener("click", () => deleteProject(button.dataset.projectDelete)));
  }

  function projectCard(project) {
    return `<article class="project-card"><span class="chip">${escapeHTML(project.area)}</span><h4>${escapeHTML(project.name)}</h4><div class="meta-row"><span><i class="priority-dot priority-${project.priority}"></i>Prioridade ${project.priority}</span><span>${escapeHTML(dueLabel(project.dueDate))}</span></div><div class="project-card-footer"><button class="mini-button" data-project-next="${project.id}">Avançar</button><button class="mini-button" data-project-delete="${project.id}">×</button></div></article>`;
  }

  function openProjectModal() {
    openModal("projectModalTemplate", root => {
      const form = $("#projectForm", root);
      populateAreaSelect(form.elements.area);
      form.addEventListener("submit", event => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        state.projects.push({ id: uid(), name: data.name.trim(), area: data.area, status: data.status, priority: Number(data.priority), dueDate: data.dueDate || null, createdAt: new Date().toISOString() });
        saveState(); closeModal(); render(); showToast("Projeto criado.");
      });
    });
  }

  function advanceProject(id) {
    const project = state.projects.find(p => p.id === id);
    if (!project) return;
    const order = ["Ideia", "Planejado", "Em andamento", "Aguardando terceiro", "Concluído"];
    const current = order.indexOf(project.status);
    project.status = order[Math.min(current + 1, order.length - 1)];
    saveState(); renderProjects(); showToast(`Projeto movido para ${project.status}.`);
  }

  function deleteProject(id) {
    if (!confirm("Excluir este projeto?")) return;
    state.projects = state.projects.filter(p => p.id !== id);
    saveState(); renderProjects(); showToast("Projeto excluído.");
  }

  function renderCalendar() {
    $("#calendarNewTaskBtn").addEventListener("click", openTaskModal);
    $("#prevMonthBtn").addEventListener("click", () => { calendarCursor.setMonth(calendarCursor.getMonth() - 1); renderCalendarGrid(); });
    $("#nextMonthBtn").addEventListener("click", () => { calendarCursor.setMonth(calendarCursor.getMonth() + 1); renderCalendarGrid(); });
    renderCalendarGrid();
  }

  function renderCalendarGrid() {
    const title = $("#calendarMonthTitle");
    const grid = $("#calendarGrid");
    if (!title || !grid) return;
    title.textContent = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(calendarCursor);
    const year = calendarCursor.getFullYear();
    const month = calendarCursor.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(start); date.setDate(start.getDate() + i);
      const iso = toISODate(date);
      const events = state.tasks.filter(task => task.dueDate === iso && !task.completed).sort((a, b) => priorityScore(b) - priorityScore(a));
      const isToday = iso === toISODate(new Date());
      const outside = date.getMonth() !== month;
      cells.push(`<div class="calendar-day ${outside ? "outside" : ""} ${isToday ? "today" : ""}" data-calendar-date="${iso}"><span class="day-number">${date.getDate()}</span>${events.slice(0, 3).map(event => `<span class="calendar-event ${priorityScore(event) >= 80 ? "high" : ""}" title="${escapeHTML(event.title)}">${escapeHTML(event.title)}</span>`).join("")}${events.length > 3 ? `<span class="calendar-event">+${events.length - 3} tarefa(s)</span>` : ""}</div>`);
    }
    grid.innerHTML = cells.join("");
    $$("[data-calendar-date]", grid).forEach(day => day.addEventListener("dblclick", () => openTaskModal({ dueDate: day.dataset.calendarDate })));
  }

  function renderInsights() {
    $("#newMetricBtn").addEventListener("click", openMetricModal);
    const metrics = state.metrics;
    const views = metrics.reduce((sum, m) => sum + Number(m.views || 0), 0);
    const clicks = metrics.reduce((sum, m) => sum + Number(m.clicks || 0), 0);
    const conversions = metrics.reduce((sum, m) => sum + Number(m.conversions || 0), 0);
    const avgRetention = metrics.length ? metrics.reduce((sum, m) => sum + Number(m.retentionPercent || 0), 0) / metrics.length : 0;
    $("#insightStats").innerHTML = [
      statCard("Conteúdos analisados", metrics.length, "Base pessoal"),
      statCard("Visualizações", views.toLocaleString("pt-BR"), "Total registrado"),
      statCard("Retenção média", `${avgRetention.toFixed(1)}%`, "Comparar por formato"),
      statCard("Conversões", conversions.toLocaleString("pt-BR"), clicks ? `${(conversions / clicks * 100).toFixed(1)}% dos cliques` : "Sem cliques")
    ].join("");
    $("#metricsTable").innerHTML = metrics.length ? `<table class="metrics-table"><thead><tr><th>Conteúdo</th><th>Plataforma</th><th>Views</th><th>Retenção</th><th>CTR</th><th>Conversões</th><th></th></tr></thead><tbody>${metrics.map(metric => `<tr><td><strong>${escapeHTML(metric.contentTitle)}</strong><br><small>${formatDate(metric.publishedAt)}</small></td><td>${escapeHTML(metric.platform)}</td><td>${Number(metric.views).toLocaleString("pt-BR")}</td><td>${Number(metric.retentionPercent).toFixed(1)}%</td><td>${metric.views ? (metric.clicks / metric.views * 100).toFixed(1) : "0.0"}%</td><td>${Number(metric.conversions).toLocaleString("pt-BR")}</td><td><button class="mini-button" data-delete-metric="${metric.id}">×</button></td></tr>`).join("")}</tbody></table>` : emptyState("Sem métricas", "Registre o desempenho dos conteúdos publicados.");
    $$("[data-delete-metric]").forEach(button => button.addEventListener("click", () => {
      if (!confirm("Excluir este resultado?")) return;
      state.metrics = state.metrics.filter(m => m.id !== button.dataset.deleteMetric); saveState(); render();
    }));
    $("#insightRecommendations").innerHTML = buildRecommendations(metrics).map(item => `<div class="recommendation"><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.text)}</p></div>`).join("");
  }

  function buildRecommendations(metrics) {
    if (!metrics.length) return [{ title: "Comece pela base", text: "Registre pelo menos três conteúdos antes de comparar formatos ou ganchos." }];
    const bestRetention = [...metrics].sort((a, b) => b.retentionPercent - a.retentionPercent)[0];
    const bestCtr = [...metrics].sort((a, b) => (b.clicks / Math.max(b.views, 1)) - (a.clicks / Math.max(a.views, 1)))[0];
    return [
      { title: "Melhor retenção registrada", text: `“${bestRetention.contentTitle}” alcançou ${Number(bestRetention.retentionPercent).toFixed(1)}%. Reutilize a lógica do gancho, sem copiar o conteúdo.` },
      { title: "Melhor sinal de clique", text: `“${bestCtr.contentTitle}” teve CTR de ${(bestCtr.clicks / Math.max(bestCtr.views, 1) * 100).toFixed(1)}%. Compare CTA, oferta e nível de consciência do público.` },
      { title: "Nível de confiança", text: metrics.length < 5 ? "A amostra ainda é pequena. Trate estes dados como indicação inicial, não como regra." : "A base já permite identificar padrões iniciais, mas ainda requer comparação por nicho e formato." }
    ];
  }

  function openMetricModal() {
    openModal("metricModalTemplate", root => {
      const form = $("#metricForm", root);
      form.elements.publishedAt.value = toISODate(new Date());
      form.addEventListener("submit", event => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        state.metrics.unshift({ id: uid(), contentTitle: data.contentTitle.trim(), platform: data.platform, publishedAt: data.publishedAt || toISODate(new Date()), views: Number(data.views), retentionPercent: Number(data.retentionPercent), clicks: Number(data.clicks), conversions: Number(data.conversions), hook: data.hook.trim() });
        saveState(); closeModal(); render(); showToast("Resultado registrado.");
      });
    });
  }

  function openSettingsModal() {
    openModal("settingsModalTemplate", root => {
      const form = $("#settingsForm", root);
      form.elements.generationMode.value = state.settings.generationMode;
      form.elements.backendUrl.value = state.settings.backendUrl;
      form.addEventListener("submit", event => {
        event.preventDefault();
        state.settings = { generationMode: form.elements.generationMode.value, backendUrl: form.elements.backendUrl.value.trim() || "http://127.0.0.1:8787" };
        saveState(); closeModal(); updateModeBadge(); showToast("Configurações salvas.");
      });
    });
  }

  function openModal(templateId, setup) {
    const root = $("#modalRoot");
    root.innerHTML = "";
    root.append($("#" + templateId).content.cloneNode(true));
    $$(".modal-close", root).forEach(button => button.addEventListener("click", closeModal));
    $(".modal-backdrop", root).addEventListener("click", event => { if (event.target.classList.contains("modal-backdrop")) closeModal(); });
    document.addEventListener("keydown", escapeModal);
    setup?.(root);
    $("input,select,textarea", root)?.focus();
  }

  function closeModal() {
    $("#modalRoot").innerHTML = "";
    document.removeEventListener("keydown", escapeModal);
  }

  function escapeModal(event) { if (event.key === "Escape") closeModal(); }
  function emptyState(title, text) { return `<div class="empty-state"><strong>${escapeHTML(title)}</strong><p>${escapeHTML(text)}</p></div>`; }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `conteudo-os-backup-${toISODate(new Date())}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast("Backup exportado.");
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported.tasks) || !Array.isArray(imported.projects)) throw new Error();
        state = { ...seedState(), ...imported, settings: { ...seedState().settings, ...(imported.settings || {}) } };
        saveState(); render(); showToast("Backup importado.");
      } catch { showToast("Arquivo de backup inválido."); }
    };
    reader.readAsText(file);
  }

  function setupGlobalEvents() {
    $$(".nav-item").forEach(item => item.addEventListener("click", () => setRoute(item.dataset.route)));
    $("#mobileMenuBtn").addEventListener("click", () => $(".sidebar").classList.toggle("open"));
    $("#settingsBtn").addEventListener("click", openSettingsModal);
    $("#exportDataBtn").addEventListener("click", exportData);
    $("#importDataBtn").addEventListener("click", () => $("#importDataInput").click());
    $("#importDataInput").addEventListener("change", event => { if (event.target.files[0]) importData(event.target.files[0]); event.target.value = ""; });
    $("#resetDataBtn").addEventListener("click", () => {
      if (!confirm("Restaurar os dados de demonstração? Seus dados atuais serão substituídos.")) return;
      state = seedState(); saveState(); render(); showToast("Demonstração restaurada.");
    });
    window.addEventListener("hashchange", () => { const next = location.hash.replace("#", ""); if (ROUTES[next] && next !== route) { route = next; render(); } });
  }

  setupGlobalEvents();
  render();

  if (location.protocol.startsWith("http") && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
})();
