const state = { apps: [] };

async function fetchApps(){
  const [statsRes, listRes] = await Promise.all([
    fetch('/api/dashboard-stats'),
    fetch('/api/list-applications')
  ]);
  const stats = await statsRes.json();
  const apps = await listRes.json();
  state.apps = apps;
  renderStats(stats);
  renderApps(apps);
}

function renderStats(stats){
  const container = document.getElementById('stats');
  container.innerHTML = '';
  const totalCard = document.createElement('div');
  totalCard.className = 'stat p-2 border rounded text-center me-2';
  totalCard.innerHTML = `<div class="h4 mb-0">${stats.total || 0}</div><small class="text-muted">Total</small>`;
  container.appendChild(totalCard);
  for(const [k,v] of Object.entries(stats.by_status || {})){
    const c = document.createElement('div');
    c.className = 'stat p-2 border rounded text-center me-2';
    c.innerHTML = `<div class="h6 mb-0">${v}</div><small class="text-muted">${k}</small>`;
    container.appendChild(c);
  }
}

function makeAppCard(a){
  const div = document.createElement('div');
  div.className = 'card mb-2 app-card';
  div.innerHTML = `
    <div class="card-body d-flex justify-content-between align-items-start">
      <div>
        <div class="fw-bold">${escapeHtml(a.company)}</div>
        <div class="app-meta">${escapeHtml(a.position)} · <span class="badge bg-secondary">${escapeHtml(a.source)}</span></div>
      </div>
      <div class="text-end">
        <div><span class="badge bg-info text-dark">${escapeHtml(a.status)}</span></div>
        <div class="mt-2">
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-primary" onclick="updateStatus(${a.id}, 'Interview')">Interview</button>
            <button class="btn btn-sm btn-outline-success" onclick="updateStatus(${a.id}, 'Offer')">Offer</button>
            <button class="btn btn-sm btn-outline-danger" onclick="updateStatus(${a.id}, 'Rejected')">Reject</button>
          </div>
        </div>
      </div>
    </div>
  `;
  return div;
}

function renderApps(apps){
  const list = document.getElementById('apps-list');
  const q = document.getElementById('search').value.toLowerCase();
  const statusFilter = document.getElementById('filter-status').value;
  list.innerHTML = '';
  apps.filter(a => {
    if(statusFilter && a.status !== statusFilter) return false;
    if(!q) return true;
    return (a.company + ' ' + a.position).toLowerCase().includes(q);
  }).forEach(a => list.appendChild(makeAppCard(a)));
}

async function addApplication(){
  const company = document.getElementById('company').value.trim();
  const position = document.getElementById('position').value.trim();
  const source = document.getElementById('source').value;
  if(!company || !position){
    alert('Company and position are required');
    return;
  }
  const res = await fetch('/api/add-application', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({company, position, source}) });
  if(res.ok){
    document.getElementById('company').value = '';
    document.getElementById('position').value = '';
    fetchApps();
  } else {
    const err = await res.json();
    alert(err.error || 'Failed to add');
  }
}

async function updateStatus(id, status){
  await fetch('/api/update-status', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({id, status}) });
  fetchApps();
}

async function syncGmail(){
  document.getElementById('sync-btn').disabled = true;
  await fetch('/api/sync-gmail', { method:'POST' });
  document.getElementById('sync-btn').disabled = false;
  fetchApps();
}

function generateReport(){
  window.location = '/api/generate-report';
}

function escapeHtml(str){
  return String(str).replace(/[&<>\"]+/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]));
}

// Wire up UI events
document.getElementById('add-btn')?.addEventListener('click', addApplication);
document.getElementById('sync-btn')?.addEventListener('click', syncGmail);
document.getElementById('report-btn')?.addEventListener('click', generateReport);
document.getElementById('search')?.addEventListener('input', fetchApps);
document.getElementById('filter-status')?.addEventListener('change', fetchApps);

// Initial load
fetchApps();
