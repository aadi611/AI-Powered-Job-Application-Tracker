const state = { apps: [], chart: null };

async function fetchApps(){
  // Build query string for date filtering
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  let url = '/api/list-applications';
  const params = new URLSearchParams();
  if(startDate) params.append('start_date', startDate + 'T00:00:00');
  if(endDate) params.append('end_date', endDate + 'T23:59:59');
  if(params.toString()) url += '?' + params.toString();

  const [statsRes, listRes] = await Promise.all([
    fetch('/api/dashboard-stats'),
    fetch(url)
  ]);
  const stats = await statsRes.json();
  const apps = await listRes.json();
  state.apps = apps;
  renderStats(stats);
  renderApps(apps);
  renderChart(stats);
}

function renderStats(stats){
  const container = document.getElementById('stats');
  if(!container) return; // Skip if stats container doesn't exist (not on this page)
  
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
  const statusColor = {Applied:'info',Interview:'warning',Offer:'success',Rejected:'danger'}[a.status] || 'secondary';
  const hasNotes = a.notes && a.notes.trim();
  div.innerHTML = `
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div class="flex-grow-1">
          <div class="fw-bold fs-5">${escapeHtml(a.company)}</div>
          <div class="text-muted">${escapeHtml(a.position)}</div>
          <div class="mt-1">
            <span class="badge bg-${statusColor}">${escapeHtml(a.status)}</span>
            <span class="badge bg-secondary ms-1"><i class="bi bi-building"></i> ${escapeHtml(a.source)}</span>
            <small class="text-muted ms-2"><i class="bi bi-calendar"></i> ${new Date(a.applied_at).toLocaleDateString()}</small>
          </div>
        </div>
        <div class="text-end">
          <button class="btn btn-sm btn-outline-primary" onclick="openEditModal(${a.id})" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal(${a.id})" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
      ${hasNotes ? `<div class="alert alert-light mb-0 mt-2 small"><i class="bi bi-sticky"></i> ${escapeHtml(a.notes)}</div>` : ''}
    </div>
  `;
  return div;
}

function renderApps(apps){
  const list = document.getElementById('apps-list');
  if(!list) return; // Skip if apps list doesn't exist (not on this page)
  
  const q = document.getElementById('search')?.value.toLowerCase() || '';
  const statusFilter = document.getElementById('filter-status')?.value || '';
  list.innerHTML = '';
  
  const filtered = apps.filter(a => {
    if(statusFilter && a.status !== statusFilter) return false;
    if(!q) return true;
    return (a.company + ' ' + a.position).toLowerCase().includes(q);
  });
  
  if(filtered.length === 0){
    list.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle"></i> No applications found. Add your first application to get started!</div>';
    return;
  }
  
  filtered.forEach(a => list.appendChild(makeAppCard(a)));
}

async function addApplication(){
  const company = document.getElementById('company').value.trim();
  const position = document.getElementById('position').value.trim();
  const source = document.getElementById('source').value;
  const notes = document.getElementById('notes').value.trim();
  if(!company || !position){
    alert('Company and position are required');
    return;
  }
  const res = await fetch('/api/add-application', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({company, position, source, notes}) });
  if(res.ok){
    document.getElementById('company').value = '';
    document.getElementById('position').value = '';
    document.getElementById('notes').value = '';
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

function openEditModal(id){
  const app = state.apps.find(a => a.id === id);
  if(!app) return;
  document.getElementById('edit-id').value = app.id;
  document.getElementById('edit-company').value = app.company;
  document.getElementById('edit-position').value = app.position;
  document.getElementById('edit-source').value = app.source;
  document.getElementById('edit-status').value = app.status;
  document.getElementById('edit-notes').value = app.notes || '';
  const modal = new bootstrap.Modal(document.getElementById('editModal'));
  modal.show();
}

async function saveEdit(){
  const id = document.getElementById('edit-id').value;
  const data = {
    company: document.getElementById('edit-company').value.trim(),
    position: document.getElementById('edit-position').value.trim(),
    source: document.getElementById('edit-source').value,
    status: document.getElementById('edit-status').value,
    notes: document.getElementById('edit-notes').value.trim()
  };
  if(!data.company || !data.position){
    alert('Company and position are required');
    return;
  }
  const res = await fetch(`/api/edit-application/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
  if(res.ok){
    const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
    modal.hide();
    fetchApps();
  } else {
    alert('Failed to update');
  }
}

function openDeleteModal(id){
  document.getElementById('delete-id').value = id;
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
}

async function confirmDelete(){
  const id = document.getElementById('delete-id').value;
  const res = await fetch(`/api/delete-application/${id}`, { method:'DELETE' });
  if(res.ok){
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    modal.hide();
    fetchApps();
  } else {
    alert('Failed to delete');
  }
}

function renderChart(stats){
  const ctx = document.getElementById('statusChart');
  if(!ctx) return;
  
  const labels = Object.keys(stats.by_status || {});
  const data = Object.values(stats.by_status || {});
  const colors = labels.map(l => ({Applied:'#0dcaf0',Interview:'#ffc107',Offer:'#198754',Rejected:'#dc3545'}[l] || '#6c757d'));
  
  if(state.chart){
    state.chart.destroy();
  }
  
  state.chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// Wire up UI events
document.getElementById('add-btn')?.addEventListener('click', addApplication);
document.getElementById('sync-btn')?.addEventListener('click', syncGmail);
document.getElementById('report-btn')?.addEventListener('click', generateReport);
document.getElementById('search')?.addEventListener('input', fetchApps);
document.getElementById('filter-status')?.addEventListener('change', fetchApps);
document.getElementById('start-date')?.addEventListener('change', fetchApps);
document.getElementById('end-date')?.addEventListener('change', fetchApps);
document.getElementById('save-edit-btn')?.addEventListener('click', saveEdit);
document.getElementById('confirm-delete-btn')?.addEventListener('click', confirmDelete);

// Initial load
fetchApps();
