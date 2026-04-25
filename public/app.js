// ===== TNG Group Wallet — prototype client =====
// Single-file vanilla JS that talks to /api/v1 and the /ws WebSocket.

const API = "/api/v1";
const TOKEN_KEY = "tng_token";
const REFRESH_KEY = "tng_refresh";

const state = {
  token: localStorage.getItem(TOKEN_KEY),
  refresh: localStorage.getItem(REFRESH_KEY),
  me: null,
  pools: [],
  currentPool: null,
  poolFilter: "all",
  ws: null,
  wsSubscribed: new Set(),
};

// ---------- HTTP ----------
async function api(path, opts = {}) {
  const headers = { "content-type": "application/json", ...(opts.headers || {}) };
  if (state.token) headers.authorization = `Bearer ${state.token}`;
  const res = await fetch(API + path, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText;
    throw new Error(msg);
  }
  return data;
}

// ---------- formatters ----------
const fmtRM = (v) => {
  const n = Number(v ?? 0);
  return "RM " + n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const initials = (name) => (name || "?").split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();
const timeAgo = (iso) => {
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return Math.floor(sec/60) + "m ago";
  if (sec < 86400) return Math.floor(sec/3600) + "h ago";
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short" });
};

// ---------- toast ----------
function toast(msg, opts = {}) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast show" + (opts.error ? " error" : "");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = "toast"; }, 2400);
}

// ---------- screen routing ----------
const SCREENS = ["login", "home", "pools", "pool", "activity", "profile"];
function showScreen(name) {
  for (const s of SCREENS) {
    const el = document.getElementById("screen-" + s);
    if (!el) continue;
    if (s === name) {
      el.style.display = "flex";
      el.style.flexDirection = "column";
    } else {
      el.style.display = "none";
    }
  }
}

// ---------- modal ----------
function openModal(html) {
  const m = document.getElementById("modal-mount");
  m.innerHTML = `<div class="backdrop" onclick="if(event.target===this)App.closeModal()"><div class="sheet"><div class="handle"></div>${html}</div></div>`;
}
function closeModal() {
  document.getElementById("modal-mount").innerHTML = "";
}

// ---------- auth ----------
async function login() {
  const phone = document.getElementById("login-phone").value.trim();
  const pin = document.getElementById("login-pin").value.trim();
  const btn = document.getElementById("btn-login");
  btn.disabled = true;
  btn.textContent = "Logging in…";
  try {
    const r = await api("/auth/login", { method: "POST", body: { phone, pin } });
    state.token = r.accessToken;
    state.refresh = r.refreshToken;
    state.me = r.user;
    localStorage.setItem(TOKEN_KEY, r.accessToken);
    localStorage.setItem(REFRESH_KEY, r.refreshToken);
    await afterLogin();
  } catch (e) {
    toast(e.message, { error: true });
  } finally {
    btn.disabled = false;
    btn.textContent = "Log in";
  }
}

async function logout() {
  try { if (state.refresh) await api("/auth/logout", { method: "POST", body: { refreshToken: state.refresh } }); } catch {}
  state.token = null; state.refresh = null; state.me = null;
  localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(REFRESH_KEY);
  if (state.ws) { try { state.ws.close(); } catch {} state.ws = null; }
  showScreen("login");
}

async function afterLogin() {
  await loadMe();
  await loadPools();
  go("home");
  connectWs();
}

async function loadMe() {
  state.me = await api("/users/me");
}

async function loadPools() {
  const r = await api("/pools");
  state.pools = r.items || [];
}

// ---------- WebSocket (live updates) ----------
function connectWs() {
  if (!state.token) return;
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const url = `${proto}://${location.host}/ws?token=${encodeURIComponent(state.token)}`;
  try {
    const ws = new WebSocket(url);
    state.ws = ws;
    state.wsSubscribed.clear();
    ws.onopen = () => {
      // Re-subscribe to currently open pool, if any
      if (state.currentPool) wsSubscribe(state.currentPool.id);
    };
    ws.onmessage = (m) => {
      let evt; try { evt = JSON.parse(m.data); } catch { return; }
      handleWsEvent(evt);
    };
    ws.onclose = () => { state.ws = null; };
    ws.onerror = () => {};
  } catch (e) { console.warn("ws", e); }
}

function wsSubscribe(poolId) {
  if (!state.ws || state.ws.readyState !== 1) return;
  if (state.wsSubscribed.has(poolId)) return;
  state.ws.send(JSON.stringify({ action: "subscribe", poolId }));
  state.wsSubscribed.add(poolId);
}

function handleWsEvent(evt) {
  switch (evt.event) {
    case "balance_updated":
      if (state.currentPool) renderPoolDetail(state.currentPool.id);
      toast("Pool balance updated");
      break;
    case "vote_cast":
      if (state.currentPool) renderPoolDetail(state.currentPool.id);
      break;
    case "spend_request_created":
      if (state.currentPool) renderPoolDetail(state.currentPool.id);
      toast("New spend request");
      break;
    case "spend_request_resolved":
      toast(`Your request was ${evt.data?.status || "resolved"}`);
      break;
    case "member_joined":
    case "member_added":
    case "member_left":
    case "member_removed":
      if (state.currentPool) renderPoolDetail(state.currentPool.id);
      break;
  }
}

// ---------- screens ----------
function go(screen) {
  if (!state.token) { showScreen("login"); return; }
  if (screen === "home") renderHome();
  else if (screen === "pools") renderPoolsList();
  else if (screen === "activity") renderActivity();
  else if (screen === "profile") renderProfile();
  showScreen(screen);
}

async function renderHome() {
  document.getElementById("home-greeting").textContent = `Hi, ${state.me?.displayName || ""}!`;
  document.getElementById("home-balance").textContent = fmtRM(state.me?.mainBalance);
  await loadPools();
  const list = document.getElementById("home-pools");
  if (state.pools.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="icon">▦</div><div>No pools yet</div></div>`;
    return;
  }
  list.innerHTML = state.pools.slice(0, 4).map(poolCard).join("");
}

async function renderPoolsList() {
  await loadPools();
  document.querySelectorAll("#screen-pools .chip").forEach(c => {
    c.classList.toggle("active", c.dataset.filter === state.poolFilter);
    c.onclick = () => { state.poolFilter = c.dataset.filter; renderPoolsList(); };
  });
  const filtered = state.poolFilter === "all"
    ? state.pools
    : state.pools.filter(p => p.type === state.poolFilter);
  const list = document.getElementById("pools-list");
  list.innerHTML = filtered.length === 0
    ? `<div class="empty-state"><div class="icon">▦</div><div>No pools in this view</div></div>`
    : filtered.map(poolCard).join("");
}

function poolCard(p) {
  const target = p.targetAmount ? Number(p.targetAmount) : null;
  const cur = Number(p.currentBalance || 0);
  const pct = target && target > 0 ? Math.min(100, (cur / target) * 100) : 0;
  const memberAvatars = (p.members || []).slice(0, 4).map(m =>
    `<span class="avatar avatar-sm">${initials(m.user?.displayName)}</span>`
  ).join("");
  const overflow = (p.members?.length || 0) > 4 ? `<span class="avatar avatar-sm">+${p.members.length - 4}</span>` : "";
  const pendingDot = (p._count?.spendRequests || 0) > 0
    ? `<span class="dot-warn"></span>${p._count.spendRequests} pending`
    : "";
  return `
    <div class="card" onclick="App.openPool('${p.id}')" style="cursor:pointer;">
      <div class="row">
        <div class="grow">
          <div class="h2">${escapeHtml(p.name)}</div>
          <div class="small tertiary" style="margin-top:2px;">${p.type === "TRIP" ? "Trip Pool" : "Family Pool"}</div>
        </div>
        <div style="text-align:right;">
          <div class="amount-md">${fmtRM(p.currentBalance)}</div>
          ${target ? `<div class="small muted">of ${fmtRM(target)}</div>` : ""}
        </div>
      </div>
      ${target ? `<div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>` : ""}
      <div class="row" style="margin-top:12px;">
        <div class="avatar-stack">${memberAvatars}${overflow}</div>
        <div class="small tertiary">${pendingDot || `Updated ${timeAgo(p.updatedAt)}`}</div>
      </div>
    </div>
  `;
}

async function openPool(id) {
  state.currentPool = state.pools.find(p => p.id === id) || null;
  showScreen("pool");
  await renderPoolDetail(id);
  wsSubscribe(id);
}

async function renderPoolDetail(id) {
  try {
    const pool = await api(`/pools/${id}`);
    state.currentPool = pool;
    document.getElementById("pool-name").textContent = pool.name;
    document.getElementById("pool-type").textContent = pool.type === "TRIP" ? "Trip Pool" : "Family Pool";
    document.getElementById("pool-balance").textContent = fmtRM(pool.currentBalance);

    const target = pool.targetAmount ? Number(pool.targetAmount) : null;
    const pct = target && target > 0 ? Math.min(100, (Number(pool.currentBalance) / target) * 100) : 0;
    document.getElementById("pool-progress").innerHTML = target
      ? `<div class="small muted" style="margin-top:6px;">Target ${fmtRM(target)}</div>
         <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>`
      : "";

    // members
    const memberRows = (pool.members || []).map(m => `
      <div class="list-row">
        <span class="avatar">${initials(m.user?.displayName)}</span>
        <div class="grow">
          <div class="row-title">${escapeHtml(m.user?.displayName || "")}</div>
          <div class="row-sub">${m.role}${m.user?.phone ? " · " + m.user.phone : ""}</div>
        </div>
      </div>
    `).join("");
    document.getElementById("pool-members").innerHTML = memberRows || `<div class="muted small">No members yet</div>`;

    // pending spend requests + activity (parallel)
    const [spend, tx, analytics] = await Promise.all([
      api(`/pools/${id}/spend-requests?status=PENDING&limit=10`),
      api(`/pools/${id}/transactions?limit=10`),
      api(`/pools/${id}/analytics`).catch(() => null),
    ]);

    const pendingEl = document.getElementById("pool-spend-pending");
    if ((spend.items || []).length === 0) {
      pendingEl.innerHTML = `<div class="muted small" style="padding:8px 4px;">No pending requests.</div>`;
    } else {
      pendingEl.innerHTML = spend.items.map(srCard).join("");
    }

    document.getElementById("pool-activity").innerHTML = (tx.items || []).map(txRow).join("")
      || `<div class="muted small">No activity yet.</div>`;

    document.getElementById("pool-analytics").innerHTML = analytics ? analyticsBlock(analytics) : "";

    // ZK eligibility — Family pools only
    const zkSection = document.getElementById("pool-zk-section");
    if (pool.type === "FAMILY") {
      zkSection.style.display = "block";
      await renderZkSection(pool.id);
    } else {
      zkSection.style.display = "none";
    }
  } catch (e) {
    toast(e.message, { error: true });
  }
}

async function renderZkSection(poolId) {
  try {
    const [params, status] = await Promise.all([
      api(`/pools/${poolId}/zk/params`),
      api(`/pools/${poolId}/zk/status`),
    ]);
    const list = document.getElementById("pool-zk-list");
    list.innerHTML = (status.members || []).map((m) => {
      const me = m.userId === state.me?.id;
      const verified = m.zkVerified;
      return `
        <div class="zk-row">
          <span class="avatar">${initials(m.displayName)}</span>
          <div class="grow">
            <div class="row-title">${escapeHtml(m.displayName)}${me ? " (you)" : ""}</div>
            <div class="row-sub">${verified
              ? `Verified · ${m.zkVerifiedAt ? new Date(m.zkVerifiedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short" }) : ""}`
              : "Not yet verified"}</div>
          </div>
          <span class="shield ${verified ? "verified" : ""}" title="${verified ? "Verified" : "Unverified"}">${verified ? "✓" : "◌"}</span>
        </div>`;
    }).join("");

    const me = (status.members || []).find((m) => m.userId === state.me?.id);
    const actions = document.getElementById("pool-zk-actions");
    actions.innerHTML = me?.zkVerified
      ? `<div class="small muted">You're verified. Min contribution this pool: <strong>RM ${params.minContributionRM}</strong>.</div>`
      : `<button class="btn btn-primary btn-block" onclick="App.openProveEligibility('${poolId}', '${params.minContributionRM}', ${params.minContributionCents})">
           Prove eligibility (RM ${params.minContributionRM} minimum)
         </button>`;
  } catch (e) {
    document.getElementById("pool-zk-list").innerHTML =
      `<div class="small muted">Could not load ZK status: ${escapeHtml(e.message)}</div>`;
    document.getElementById("pool-zk-actions").innerHTML = "";
  }
}

function openProveEligibility(poolId, minRM, minCents) {
  openModal(`
    <h2>Prove eligibility</h2>
    <div class="zk-explainer">
      <span class="info-icon">i</span>
      <div class="body">
        This proves your monthly income meets the pool's minimum
        <strong>without revealing the amount</strong>. The pool only sees
        <em>Verified</em> or <em>Unverified</em>.
      </div>
    </div>

    <div class="card" style="margin:8px 0 4px;">
      <div class="small muted">Pool minimum</div>
      <div class="amount-md">RM ${minRM}</div>
    </div>

    <label class="form-label">Your total monthly income (RM)</label>
    <input id="zk-income" class="input" inputmode="decimal" placeholder="e.g. 2800.00" />
    <div class="small muted" style="margin-top:6px;">
      This value is used only to generate the proof and is <strong>not stored</strong>.
    </div>

    <div id="zk-status" style="margin-top:12px;"></div>

    <div class="btn-row" style="margin-top:18px;">
      <button class="btn btn-outlined" style="flex:1;" onclick="App.closeModal()">Cancel</button>
      <button id="zk-submit" class="btn btn-primary" style="flex:1;"
              onclick="App.submitProof('${poolId}', ${minCents})">
        Generate proof
      </button>
    </div>

    <details style="margin-top:18px;">
      <summary class="small muted" style="cursor:pointer;">How does this work?</summary>
      <div class="small" style="margin-top:8px; line-height:1.5;">
        A zero-knowledge proof lets you convince the pool that
        <em>"my income is at least RM ${minRM}"</em> without telling anyone
        the actual number. Think of it like proving you're old enough to enter
        a venue without showing your full ID — only your eligibility is shared.
      </div>
    </details>
  `);
}

async function submitProof(poolId, minContributionCents) {
  const incomeRM = document.getElementById("zk-income").value.trim();
  if (!incomeRM || isNaN(Number(incomeRM)) || Number(incomeRM) <= 0) {
    return toast("Enter a valid income amount", { error: true });
  }
  const totalIncomeCents = Math.round(Number(incomeRM) * 100);
  const status = document.getElementById("zk-status");
  const btn = document.getElementById("zk-submit");
  btn.disabled = true;
  btn.textContent = "Working…";
  status.innerHTML = `
    <div class="zk-spinner-row">
      <span class="spinner"></span>
      <div class="small">Generating cryptographic proof…</div>
    </div>`;

  try {
    const proveRes = await api(`/pools/${poolId}/zk/prove`, {
      method: "POST",
      body: { totalIncomeCents },
    });
    status.innerHTML = `
      <div class="zk-spinner-row">
        <span class="spinner"></span>
        <div class="small">Verifying proof…</div>
      </div>`;
    await api(`/pools/${poolId}/zk/verify`, {
      method: "POST",
      body: {
        proof: proveRes.proof,
        publicSignals: proveRes.publicSignals,
        commitmentHash: proveRes.commitmentHash,
      },
    });
    status.innerHTML = `
      <div class="card" style="background:var(--primary-light); border-color:var(--primary); margin-top:8px;">
        <strong style="color:var(--primary);">✓ Verified</strong>
        <div class="small" style="margin-top:4px;">
          The pool can now see you as eligible. Your actual income was not stored.
        </div>
      </div>`;
    btn.style.display = "none";
    setTimeout(async () => {
      closeModal();
      toast("Eligibility verified");
      await renderZkSection(poolId);
    }, 1400);
  } catch (e) {
    btn.disabled = false;
    btn.textContent = "Generate proof";
    if (/threshold/i.test(e.message)) {
      status.innerHTML = `
        <div class="card card-danger" style="margin-top:8px;">
          <strong style="color:var(--danger);">Income below pool minimum</strong>
          <div class="small" style="margin-top:4px;">
            You can still join the pool, but eligibility will show as unverified.
          </div>
        </div>`;
    } else {
      status.innerHTML = `<div class="small" style="color:var(--danger); margin-top:8px;">${escapeHtml(e.message)}</div>`;
    }
  }
}

function srCard(sr) {
  const votesApprove = (sr.votes || []).filter(v => v.decision === "APPROVE").length;
  const totalNeeded = Math.max(1, (state.currentPool?.members?.length || 1) - 1);
  const dotCount = totalNeeded;
  const dots = Array.from({ length: dotCount }).map((_, i) =>
    `<span class="vote-dot ${i < votesApprove ? "filled" : ""}"></span>`
  ).join("");
  const myVote = (sr.votes || []).find(v => v.voterId === state.me?.id);
  const isMine = sr.requesterId === state.me?.id;
  return `
    <div class="card card-warn">
      <div class="row">
        <div class="grow">
          <div class="h2">${escapeHtml(sr.title)}</div>
          <div class="small muted">${sr.category} · ${timeAgo(sr.createdAt)}</div>
        </div>
        <div class="amount-md">${fmtRM(sr.amount)}</div>
      </div>
      <div class="vote-dots">${dots}</div>
      <div class="small muted">${votesApprove} of ${totalNeeded} approvals</div>
      ${isMine
        ? `<div class="small" style="margin-top:8px;"><em>Your request — waiting for votes.</em></div>`
        : myVote
        ? `<div class="small" style="margin-top:8px;"><em>You voted ${myVote.decision}</em></div>`
        : `<div class="btn-row" style="margin-top:12px;">
             <button class="btn btn-sm btn-outlined" style="flex:1;" onclick="App.vote('${sr.id}','APPROVE')">✓ Approve</button>
             <button class="btn btn-sm btn-danger" style="flex:1;" onclick="App.vote('${sr.id}','REJECT')">✕ Reject</button>
           </div>`}
    </div>`;
}

function txRow(t) {
  const isIn = t.direction === "IN";
  return `
    <div class="list-row">
      <span class="dir-icon">${isIn ? "↑" : "↓"}</span>
      <div class="grow">
        <div class="row-title">${escapeHtml(t.description)}</div>
        <div class="row-sub">${t.user?.displayName || ""}</div>
      </div>
      <div class="row-trail">
        <div class="row-amount">${isIn ? "+" : "−"} ${fmtRM(t.amount)}</div>
        <div class="row-time">${timeAgo(t.createdAt)}</div>
      </div>
    </div>`;
}

function analyticsBlock(a) {
  const totalIn = Number(a.totals?.contributedTotal || 0);
  const totalOut = Number(a.totals?.spentTotal || 0);
  const perMember = (a.perMember || []).map(m => `
    <div class="list-row">
      <span class="avatar">${initials(m.user?.displayName)}</span>
      <div class="grow">
        <div class="row-title">${escapeHtml(m.user?.displayName || "")}</div>
        <div class="row-sub">Contributed ${fmtRM(m.contributed)} · Spent ${fmtRM(m.spent)}</div>
      </div>
      <div class="row-trail"><div class="row-amount">${Number(m.net) >= 0 ? "+" : "−"} ${fmtRM(Math.abs(Number(m.net)))}</div></div>
    </div>`).join("");
  return `
    <div class="row" style="margin-bottom:8px;">
      <div><div class="small muted">Total in</div><div class="amount-md">${fmtRM(totalIn)}</div></div>
      <div style="text-align:right;"><div class="small muted">Total out</div><div class="amount-md">${fmtRM(totalOut)}</div></div>
    </div>
    <div class="divider"></div>
    ${perMember || `<div class="muted small">No member activity yet.</div>`}`;
}

// ---------- activity ----------
async function renderActivity() {
  try {
    const r = await api("/users/me/transactions?limit=30");
    const list = (r.items || []).map(txRow).join("");
    document.getElementById("activity-list").innerHTML =
      list || `<div class="empty-state"><div class="icon">≡</div><div>No transactions yet</div></div>`;
  } catch (e) { toast(e.message, { error: true }); }
}

// ---------- profile ----------
async function renderProfile() {
  await loadMe();
  document.getElementById("profile-avatar").textContent = initials(state.me?.displayName);
  document.getElementById("profile-name").textContent = state.me?.fullName || "";
  document.getElementById("profile-phone").textContent = state.me?.phone || "";
  document.getElementById("profile-kyc").textContent = "KYC: " + (state.me?.kycStatus || "—");
  document.getElementById("profile-balance").textContent = fmtRM(state.me?.mainBalance);
  try {
    const r = await api("/users/me/notifications?limit=20");
    const unread = (r.items || []).filter(n => !n.isRead).length;
    document.getElementById("profile-notifs").innerHTML =
      `<span class="muted">${unread} unread</span>`;
  } catch {}
}

// ---------- contribute / spend / topup / create / join ----------
function openContribute() {
  if (!state.currentPool) return;
  openModal(`
    <h2>Contribute to ${escapeHtml(state.currentPool.name)}</h2>
    <div class="small muted">Pool balance ${fmtRM(state.currentPool.currentBalance)} · You have ${fmtRM(state.me?.mainBalance)}</div>
    <input id="ct-amount" class="input amount-input" placeholder="0.00" inputmode="decimal" />
    <label class="form-label">Note (optional)</label>
    <input id="ct-desc" class="input" placeholder="e.g. Hotel deposit" />
    <div class="btn-row" style="margin-top:18px;">
      <button class="btn btn-outlined" style="flex:1;" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" style="flex:1;" onclick="App.submitContribute()">Contribute</button>
    </div>
  `);
}

async function submitContribute() {
  const amount = document.getElementById("ct-amount").value.trim();
  const description = document.getElementById("ct-desc").value.trim() || undefined;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return toast("Enter a valid amount", { error: true });
  try {
    await api(`/pools/${state.currentPool.id}/contributions`, { method: "POST", body: { amount, description } });
    closeModal();
    toast("Contribution sent");
    await loadMe();
    await renderPoolDetail(state.currentPool.id);
  } catch (e) { toast(e.message, { error: true }); }
}

const SPEND_CATS = ["FOOD","ACCOMMODATION","TRANSPORT","ACTIVITIES","SHOPPING","TOLL","PETROL","OTHER_TRIP","RENT","UTILITIES","GROCERIES","EDUCATION","MEDICAL","INSURANCE","CHILDCARE","OTHER_FAMILY"];

function openSpendRequest() {
  if (!state.currentPool) return;
  openModal(`
    <h2>Request a spend</h2>
    <div class="small muted">Members will vote to approve.</div>
    <input id="sr-amount" class="input amount-input" placeholder="0.00" inputmode="decimal" />
    <label class="form-label">Title</label>
    <input id="sr-title" class="input" placeholder="e.g. Hotel deposit" />
    <label class="form-label">Category</label>
    <select id="sr-cat" class="input">${SPEND_CATS.map(c => `<option>${c}</option>`).join("")}</select>
    <label class="form-label">Description (optional)</label>
    <textarea id="sr-desc" class="input" rows="2"></textarea>
    <label class="form-label">Voting deadline (hours)</label>
    <select id="sr-exp" class="input">
      <option value="4">4 hours</option>
      <option value="12">12 hours</option>
      <option value="24" selected>24 hours</option>
      <option value="48">48 hours</option>
    </select>
    <div class="btn-row" style="margin-top:18px;">
      <button class="btn btn-outlined" style="flex:1;" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" style="flex:1;" onclick="App.submitSpendRequest()">Submit</button>
    </div>
  `);
}

async function submitSpendRequest() {
  const amount = document.getElementById("sr-amount").value.trim();
  const title = document.getElementById("sr-title").value.trim();
  const category = document.getElementById("sr-cat").value;
  const description = document.getElementById("sr-desc").value.trim() || undefined;
  const expiresInHours = Number(document.getElementById("sr-exp").value);
  if (!amount || !title) return toast("Amount and title are required", { error: true });
  try {
    await api(`/pools/${state.currentPool.id}/spend-requests`, {
      method: "POST",
      body: { amount, title, category, description, expiresInHours, isEmergency: false },
    });
    closeModal();
    toast("Spend request submitted");
    await renderPoolDetail(state.currentPool.id);
  } catch (e) { toast(e.message, { error: true }); }
}

async function vote(spendRequestId, decision) {
  try {
    const r = await api(`/pools/${state.currentPool.id}/spend-requests/${spendRequestId}/vote`, {
      method: "POST",
      body: { decision },
    });
    toast(`Vote recorded · ${r.spendRequest.status}`);
    if (r.spendRequest.status === "APPROVED") {
      // Auto-execute approved spends (transfers pool → requester wallet)
      try {
        await api(`/pools/${state.currentPool.id}/spend-requests/${spendRequestId}/execute`, { method: "POST" });
        toast("Spend executed");
      } catch (e) {
        // Only the requester or a pool admin can execute — non-blocking if voter isn't allowed
      }
    }
    await renderPoolDetail(state.currentPool.id);
  } catch (e) { toast(e.message, { error: true }); }
}

function openTopup() {
  openModal(`
    <h2>Top up wallet</h2>
    <div class="small muted">Demo only — adds straight to your TNG main wallet balance.</div>
    <input id="tu-amount" class="input amount-input" placeholder="0.00" inputmode="decimal" />
    <div class="btn-row" style="margin-top:18px;">
      <button class="btn btn-outlined" style="flex:1;" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" style="flex:1;" onclick="App.submitTopup()">Top up</button>
    </div>`);
}
async function submitTopup() {
  const amount = document.getElementById("tu-amount").value.trim();
  if (!amount || Number(amount) <= 0) return toast("Enter an amount", { error: true });
  try {
    await api("/users/me/topup", { method: "POST", body: { amount } });
    closeModal();
    await loadMe();
    renderHome();
    toast("Wallet topped up");
  } catch (e) { toast(e.message, { error: true }); }
}

function openCreatePool(type) {
  openModal(`
    <h2>Create ${type === "TRIP" ? "Trip" : "Family"} Pool</h2>
    <label class="form-label">Pool name</label>
    <input id="cp-name" class="input" placeholder="${type === "TRIP" ? "e.g. Bali 2026" : "e.g. Wong Family"}" />
    <label class="form-label">Description (optional)</label>
    <input id="cp-desc" class="input" />
    <label class="form-label">Target budget (optional)</label>
    <input id="cp-target" class="input" inputmode="decimal" placeholder="0.00" />
    ${type === "TRIP" ? `
      <label class="form-label">End date</label>
      <input id="cp-end" class="input" type="date" />
    ` : ""}
    <div class="btn-row" style="margin-top:18px;">
      <button class="btn btn-outlined" style="flex:1;" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" style="flex:1;" onclick="App.submitCreatePool('${type}')">Create</button>
    </div>`);
}

async function submitCreatePool(type) {
  const name = document.getElementById("cp-name").value.trim();
  const description = document.getElementById("cp-desc").value.trim() || undefined;
  const target = document.getElementById("cp-target").value.trim();
  const targetAmount = target && Number(target) > 0 ? Number(target).toFixed(2) : undefined;
  if (!name) return toast("Name is required", { error: true });
  const body = { type, name, description, targetAmount };
  if (type === "TRIP") {
    const end = document.getElementById("cp-end").value;
    body.endDate = end ? new Date(end).toISOString() : new Date(Date.now() + 7 * 86400e3).toISOString();
  }
  try {
    const pool = await api("/pools", { method: "POST", body });
    closeModal();
    toast("Pool created");
    await loadPools();
    openPool(pool.id);
  } catch (e) { toast(e.message, { error: true }); }
}

function openJoinPool() {
  openModal(`
    <h2>Join a pool</h2>
    <label class="form-label">Invite code</label>
    <input id="jp-code" class="input" placeholder="ABCD123XYZ" />
    <div class="btn-row" style="margin-top:18px;">
      <button class="btn btn-outlined" style="flex:1;" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" style="flex:1;" onclick="App.submitJoin()">Join</button>
    </div>`);
}
async function submitJoin() {
  const code = document.getElementById("jp-code").value.trim();
  if (!code) return toast("Enter a code", { error: true });
  try {
    await api(`/invites/${encodeURIComponent(code)}/accept`, { method: "POST" });
    closeModal();
    toast("Joined!");
    await loadPools();
    renderPoolsList();
    go("pools");
  } catch (e) { toast(e.message, { error: true }); }
}

// ---------- helpers ----------
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- bootstrap ----------
async function boot() {
  document.getElementById("btn-login").onclick = login;
  if (state.token) {
    try {
      await loadMe();
      await loadPools();
      go("home");
      connectWs();
    } catch (e) {
      console.warn("session expired", e);
      logout();
    }
  } else {
    showScreen("login");
  }
}

window.App = {
  go, openPool, openContribute, submitContribute,
  openSpendRequest, submitSpendRequest, vote,
  openTopup, submitTopup,
  openCreatePool, submitCreatePool,
  openJoinPool, submitJoin,
  openProveEligibility, submitProof,
  logout, closeModal, toast,
};
boot();
