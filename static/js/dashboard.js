let statusChart, sourceChart, trendChart;

async function fetchDashboardData() {
  try {
    const [statsRes, appsRes] = await Promise.all([
      fetch('/api/dashboard-stats'),
      fetch('/api/list-applications')
    ]);
    
    const stats = await statsRes.json();
    const apps = await appsRes.json();
    
    updateStats(stats, apps);
    updateCharts(stats, apps);
    updateRecentApps(apps);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
}

function updateStats(stats, apps) {
  document.getElementById('totalApps').textContent = stats.total || 0;
  document.getElementById('pendingApps').textContent = stats.by_status['Applied'] || 0;
  document.getElementById('interviewApps').textContent = stats.by_status['Interview'] || 0;
  document.getElementById('offerApps').textContent = stats.by_status['Offer'] || 0;
}

function updateCharts(stats, apps) {
  // Status Distribution Chart
  const statusCtx = document.getElementById('statusChart').getContext('2d');
  if (statusChart) statusChart.destroy();
  
  const statusData = stats.by_status || {};
  statusChart = new Chart(statusCtx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(statusData),
      datasets: [{
        data: Object.values(statusData),
        backgroundColor: [
          '#667eea',
          '#fbbf24',
          '#34d399',
          '#ef4444',
          '#8b5cf6'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });

  // Source Distribution Chart
  const sourceCtx = document.getElementById('sourceChart').getContext('2d');
  if (sourceChart) sourceChart.destroy();
  
  const sourceData = apps.reduce((acc, app) => {
    acc[app.source] = (acc[app.source] || 0) + 1;
    return acc;
  }, {});
  
  sourceChart = new Chart(sourceCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(sourceData),
      datasets: [{
        label: 'Applications',
        data: Object.values(sourceData),
        backgroundColor: '#667eea',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });

  // Trend Chart (Last 30 Days)
  const trendCtx = document.getElementById('trendChart').getContext('2d');
  if (trendChart) trendChart.destroy();
  
  const last30Days = getLast30Days();
  const trendData = last30Days.map(date => {
    return apps.filter(app => {
      const appDate = new Date(app.applied_at).toDateString();
      return appDate === date.toDateString();
    }).length;
  });
  
  trendChart = new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: last30Days.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Applications',
        data: trendData,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function updateRecentApps(apps) {
  const tbody = document.getElementById('recentApps');
  tbody.innerHTML = '';
  
  const recent = apps.slice(0, 10);
  
  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No applications yet</td></tr>';
    return;
  }
  
  recent.forEach(app => {
    const tr = document.createElement('tr');
    const statusColors = {
      'Applied': 'info',
      'Interview': 'warning',
      'Offer': 'success',
      'Rejected': 'danger'
    };
    const badgeClass = statusColors[app.status] || 'secondary';
    
    tr.innerHTML = `
      <td class="fw-semibold">${escapeHtml(app.company)}</td>
      <td>${escapeHtml(app.position)}</td>
      <td><span class="badge bg-${badgeClass}">${escapeHtml(app.status)}</span></td>
      <td class="text-muted">${new Date(app.applied_at).toLocaleDateString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

function getLast30Days() {
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  return dates;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

async function syncGmail() {
  document.getElementById('syncBtn').disabled = true;
  await fetch('/api/sync-gmail', { method: 'POST' });
  await fetchDashboardData();
  document.getElementById('syncBtn').disabled = false;
}

function generateReport() {
  window.location = '/api/generate-report';
}

// Event listeners
document.getElementById('syncBtn')?.addEventListener('click', syncGmail);
document.getElementById('exportBtn')?.addEventListener('click', generateReport);

// Initial load
fetchDashboardData();
