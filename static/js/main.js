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
  div.style.cursor = 'pointer';
  const statusColor = {Applied:'info',Interview:'warning',Offer:'success',Rejected:'danger'}[a.status] || 'secondary';
  const hasNotes = a.notes && a.notes.trim();
  div.innerHTML = `
    <div class="card-body" onclick="openDetailsModal(${a.id})">
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
        <div class="text-end" onclick="event.stopPropagation()">
          <button class="btn btn-sm btn-outline-primary" onclick="openEditModal(${a.id})" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal(${a.id})" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
      ${hasNotes ? `
        <div class="alert alert-light mb-0 mt-2 small" style="max-height: 60px; overflow: hidden; position: relative;">
          <i class="bi bi-sticky"></i> ${escapeHtml(a.notes.substring(0, 150))}${a.notes.length > 150 ? '...' : ''}
          ${a.notes.length > 150 ? '<small class="text-muted d-block mt-1"><i class="bi bi-eye"></i> Click to view full details</small>' : ''}
        </div>
      ` : ''}
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

function openDetailsModal(id) {
  const app = state.apps.find(a => a.id === id);
  if (!app) return;
  
  // Store current app id for edit functionality
  window.currentDetailAppId = id;
  
  // Parse notes to extract structured data
  const notes = app.notes || '';
  const location = extractField(notes, '📍 Location:', '💰') || extractField(notes, 'Location:', '\n');
  const salary = extractField(notes, '💰 Salary:', '⏰') || extractField(notes, 'Salary:', '\n');
  const jobType = extractField(notes, '⏰ Type:', '📝') || extractField(notes, 'Type:', '\n');
  const description = extractField(notes, '📝', '✅') || '';
  const requirements = extractField(notes, '✅ Requirements:', null) || extractField(notes, 'Requirements:', null);
  
  // Set header
  document.getElementById('detail-position').textContent = app.position;
  document.getElementById('detail-company').textContent = app.company;
  
  // Overview tab
  document.getElementById('detail-company-full').textContent = app.company;
  document.getElementById('detail-position-full').textContent = app.position;
  document.getElementById('detail-applied-date').textContent = new Date(app.applied_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const statusColor = {Applied:'info',Interview:'warning',Offer:'success',Rejected:'danger'}[app.status] || 'secondary';
  const statusBadge = document.getElementById('detail-status-badge');
  statusBadge.textContent = app.status;
  statusBadge.className = `badge bg-${statusColor}`;
  
  // Details tab
  document.getElementById('detail-source').textContent = app.source.charAt(0).toUpperCase() + app.source.slice(1);
  
  // Show/hide and set optional fields
  toggleDetailField('detail-location-container', 'detail-location', location);
  toggleDetailField('detail-salary-container', 'detail-salary', salary);
  toggleDetailField('detail-type-container', 'detail-type', jobType);
  toggleDetailField('detail-requirements-container', 'detail-requirements', requirements);
  
  // Notes tab - show full notes or structured content
  const notesContent = document.getElementById('detail-notes-content');
  if (notes.trim()) {
    notesContent.textContent = notes;
  } else {
    notesContent.innerHTML = '<em class="text-muted">No notes added yet.</em>';
  }
  
  // Timeline tab
  const appliedDate = new Date(app.applied_at);
  document.getElementById('detail-timeline-applied').textContent = appliedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const daysAgo = Math.floor((new Date() - appliedDate) / (1000 * 60 * 60 * 24));
  document.getElementById('detail-days-count').textContent = `${daysAgo} day${daysAgo !== 1 ? 's' : ''}`;
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
  modal.show();
}

function extractField(text, startMarker, endMarker) {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return null;
  
  const contentStart = startIndex + startMarker.length;
  let contentEnd = endMarker ? text.indexOf(endMarker, contentStart) : text.length;
  if (contentEnd === -1) contentEnd = text.length;
  
  return text.substring(contentStart, contentEnd).trim();
}

function toggleDetailField(containerId, fieldId, value) {
  const container = document.getElementById(containerId);
  const field = document.getElementById(fieldId);
  
  if (value && value !== 'Not specified') {
    container.style.display = 'block';
    field.textContent = value;
  } else {
    container.style.display = 'none';
  }
}

function openEditFromDetails() {
  // Close details modal
  const detailsModal = bootstrap.Modal.getInstance(document.getElementById('detailsModal'));
  if (detailsModal) detailsModal.hide();
  
  // Open edit modal with current app
  if (window.currentDetailAppId) {
    setTimeout(() => openEditModal(window.currentDetailAppId), 300);
  }
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

// AI Job Parser Functions
function toggleAIParser() {
  const aiSection = document.getElementById('ai-parser-section');
  const manualForm = document.getElementById('manual-form');
  const toggleBtn = document.getElementById('toggle-ai-parser');
  
  if (aiSection.style.display === 'none') {
    aiSection.style.display = 'block';
    toggleBtn.innerHTML = '<i class="bi bi-x-circle"></i> Manual Entry';
    toggleBtn.style.background = 'var(--dark-border)';
  } else {
    aiSection.style.display = 'none';
    toggleBtn.innerHTML = '<i class="bi bi-stars"></i> AI Job Parser';
    toggleBtn.style.background = 'linear-gradient(135deg, var(--purple-accent), var(--purple-light))';
  }
}

async function parseJobWithAI() {
  const jobDescription = document.getElementById('job-description').value.trim();
  
  if (!jobDescription || jobDescription.length < 50) {
    alert('Please paste a job description (at least 50 characters)');
    return;
  }
  
  const parseBtn = document.getElementById('parse-job-btn');
  const loading = document.getElementById('parse-loading');
  
  parseBtn.disabled = true;
  loading.style.display = 'block';
  
  try {
    const response = await fetch('/api/ai/parse-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_description: jobDescription })
    });
    
    const result = await response.json();
    
    if (result.success && result.data) {
      // Auto-fill the form with parsed data
      document.getElementById('company').value = result.data.company || '';
      document.getElementById('position').value = result.data.position || '';
      
      // Set source if it was detected
      const sourceSelect = document.getElementById('source');
      const detectedSource = result.data.source?.toLowerCase();
      if (detectedSource && detectedSource !== 'manual entry') {
        if (detectedSource.includes('linkedin')) {
          sourceSelect.value = 'linkedin';
        } else if (detectedSource.includes('indeed')) {
          sourceSelect.value = 'indeed';
        } else if (detectedSource.includes('glassdoor')) {
          sourceSelect.value = 'glassdoor';
        }
      }
      
      // Build notes with all extracted info
      let notes = '';
      if (result.data.location) notes += `📍 Location: ${result.data.location}\n`;
      if (result.data.salary && result.data.salary !== 'Not specified') notes += `💰 Salary: ${result.data.salary}\n`;
      if (result.data.job_type) notes += `⏰ Type: ${result.data.job_type}\n\n`;
      if (result.data.description) notes += `📝 ${result.data.description}\n\n`;
      if (result.data.requirements) notes += `✅ Requirements:\n${result.data.requirements}`;
      
      document.getElementById('notes').value = notes;
      
      // Clear the job description textarea
      document.getElementById('job-description').value = '';
      
      // Show success message
      const aiSection = document.getElementById('ai-parser-section');
      const successMsg = document.createElement('div');
      successMsg.className = 'alert alert-success p-2 mb-2';
      successMsg.style.fontSize = '12px';
      successMsg.innerHTML = '<i class="bi bi-check-circle"></i> AI parsed successfully! Review and click "Add Application"';
      aiSection.insertBefore(successMsg, aiSection.firstChild);
      setTimeout(() => successMsg.remove(), 3000);
      
      // Switch to manual form view
      toggleAIParser();
      
    } else {
      alert('AI parsing failed: ' + (result.error || 'Unknown error'));
    }
    
  } catch (error) {
    console.error('Parse error:', error);
    alert('Failed to parse job description. Please try again or enter manually.');
  } finally {
    parseBtn.disabled = false;
    loading.style.display = 'none';
  }
}

// AI Follow-up Email Generator
async function generateFollowupEmail() {
  if (!window.currentDetailAppId) {
    alert('No application selected');
    return;
  }
  
  const app = state.apps.find(a => a.id === window.currentDetailAppId);
  if (!app) {
    alert('Application not found');
    return;
  }
  
  // Open follow-up modal
  const followupModal = new bootstrap.Modal(document.getElementById('followupModal'));
  followupModal.show();
  
  // Show loading state
  document.getElementById('followup-loading').style.display = 'block';
  document.getElementById('followup-content').style.display = 'none';
  document.getElementById('followup-error').style.display = 'none';
  
  try {
    const response = await fetch('/api/ai/generate-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: app.id })
    });
    
    const result = await response.json();
    
    if (result.success && result.data) {
      // Calculate days since application
      const appliedDate = new Date(app.applied_at);
      const daysAgo = Math.floor((new Date() - appliedDate) / (1000 * 60 * 60 * 24));
      
      // Set recommendation text
      let recommendation = '';
      if (daysAgo < 5) {
        recommendation = 'It might be a bit early to follow up. Consider waiting until 5-7 days after applying.';
      } else if (daysAgo <= 14) {
        recommendation = 'Perfect timing! 5-14 days is the ideal window for a professional follow-up.';
      } else {
        recommendation = `It's been ${daysAgo} days. A follow-up is definitely appropriate and shows continued interest.`;
      }
      document.getElementById('followup-recommendation').textContent = recommendation;
      
      // Populate email content
      document.getElementById('followup-subject').value = result.data.subject || '';
      document.getElementById('followup-body').value = result.data.body || '';
      
      // Show content
      document.getElementById('followup-loading').style.display = 'none';
      document.getElementById('followup-content').style.display = 'block';
      
    } else {
      throw new Error(result.error || 'Failed to generate email');
    }
    
  } catch (error) {
    console.error('Follow-up generation error:', error);
    document.getElementById('followup-loading').style.display = 'none';
    document.getElementById('followup-error').style.display = 'block';
    document.getElementById('followup-error-message').textContent = error.message || 'Failed to generate follow-up email';
  }
}

function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  const text = element.value || element.textContent;
  
  navigator.clipboard.writeText(text).then(() => {
    // Show success feedback
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Copied!';
    btn.classList.remove('btn-outline-primary');
    btn.classList.add('btn-success');
    
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.classList.remove('btn-success');
      btn.classList.add('btn-outline-primary');
    }, 2000);
  }).catch(err => {
    console.error('Copy failed:', err);
    alert('Failed to copy to clipboard');
  });
}

function copyEntireEmail() {
  const subject = document.getElementById('followup-subject').value;
  const body = document.getElementById('followup-body').value;
  const fullEmail = `Subject: ${subject}\n\n${body}`;
  
  navigator.clipboard.writeText(fullEmail).then(() => {
    // Show success feedback
    const btn = event.target;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Copied!';
    btn.classList.remove('btn-success');
    btn.classList.add('btn-outline-success');
    
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.classList.remove('btn-outline-success');
      btn.classList.add('btn-success');
    }, 2000);
  }).catch(err => {
    console.error('Copy failed:', err);
    alert('Failed to copy to clipboard');
  });
}

// AI Cover Letter Generator
async function generateCoverLetter() {
  if (!window.currentDetailAppId) {
    alert('No application selected');
    return;
  }
  
  // Open cover letter modal
  const coverLetterModal = new bootstrap.Modal(document.getElementById('coverLetterModal'));
  coverLetterModal.show();
  
  // Show loading state
  document.getElementById('cover-letter-loading').style.display = 'block';
  document.getElementById('cover-letter-content').style.display = 'none';
  document.getElementById('cover-letter-error').style.display = 'none';
  document.getElementById('cover-letter-no-profile').style.display = 'none';
  
  try {
    const response = await fetch('/api/ai/generate-cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: window.currentDetailAppId })
    });
    
    const result = await response.json();
    
    if (result.success && result.data) {
      // Populate cover letter
      document.getElementById('cover-letter-text').value = result.data.content || '';
      
      // Show content
      document.getElementById('cover-letter-loading').style.display = 'none';
      document.getElementById('cover-letter-content').style.display = 'block';
      
    } else if (response.status === 400 && result.error.includes('profile')) {
      // No profile error
      document.getElementById('cover-letter-loading').style.display = 'none';
      document.getElementById('cover-letter-no-profile').style.display = 'block';
    } else {
      throw new Error(result.error || 'Failed to generate cover letter');
    }
    
  } catch (error) {
    console.error('Cover letter generation error:', error);
    document.getElementById('cover-letter-loading').style.display = 'none';
    document.getElementById('cover-letter-error').style.display = 'block';
    document.getElementById('cover-letter-error-message').textContent = error.message || 'Failed to generate cover letter. Please try again.';
  }
}

function downloadCoverLetter() {
  const content = document.getElementById('cover-letter-text').value;
  const app = state.apps.find(a => a.id === window.currentDetailAppId);
  
  if (!content || !app) {
    alert('No cover letter to download');
    return;
  }
  
  // Create filename
  const filename = `CoverLetter_${app.company.replace(/[^a-z0-9]/gi, '_')}_${app.position.replace(/[^a-z0-9]/gi, '_')}.txt`;
  
  // Create blob and download
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  // Show success feedback
  const btn = event.target;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Downloaded!';
  btn.classList.remove('btn-outline-success');
  btn.classList.add('btn-success');
  
  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.classList.remove('btn-success');
    btn.classList.add('btn-outline-success');
  }, 2000);
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
document.getElementById('toggle-ai-parser')?.addEventListener('click', toggleAIParser);
document.getElementById('parse-job-btn')?.addEventListener('click', parseJobWithAI);

// Initial load
fetchApps();
