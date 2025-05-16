document.addEventListener('DOMContentLoaded', () => {
  // Check user credentials and role
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');
  if (!role || !username) {
    alert('You must be logged in to access this page.');
    window.location.href = '/index.html';
    return;
  }
  // Only allow users with role 'ic-operator' or 'admin' to access IC Dashboard
  if (!['ic-operator', 'admin'].includes(role)) {
    alert('You do not have permission to access this page.');
    window.location.href = '/index.html';
    return;
  }

  const insurancePremiumFormBtn = document.getElementById('insurancePremiumFormBtn');
  const insuranceUsageFormBtn = document.getElementById('insuranceUsageFormBtn');
  const insuranceRequestsBtn = document.getElementById('insuranceRequestsBtn');
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  insurancePremiumFormBtn.addEventListener('click', () => {
    // Set default hamlet to empty string to avoid redirect error
    localStorage.setItem('hamlet', '');
    window.location.href = '/insurance-premium-submissions.html';
  });

  insuranceUsageFormBtn.addEventListener('click', () => {
    window.location.href = '/insurance-usage-submissions.html';
  });

  insuranceRequestsBtn.addEventListener('click', () => {
    window.location.href = '/insurance-request-data.html';
  });

  backBtn.addEventListener('click', () => {
    window.location.href = '/dashboard.html';
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = '/index.html';
    });
  }
});
