document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');
  const hamlet = localStorage.getItem('hamlet');

  if (!username || !role) {
    alert('Please log in first!');
    window.location.href = '/index.html';
    return;
  }

  document.getElementById('usernameDisplay').textContent = username;

  const hhFormBtn = document.getElementById('hhFormBtn');
  const vecFormBtn = document.getElementById('vecFormBtn');
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (hhFormBtn) {
    hhFormBtn.addEventListener('click', () => {
      window.location.href = `/hh-list.html${hamlet ? '?hamlet=' + encodeURIComponent(hamlet) : ''}`;
    });
  }

  if (vecFormBtn) {
    vecFormBtn.addEventListener('click', () => {
      window.location.href = `/vec-submissions.html${hamlet ? '?hamlet=' + encodeURIComponent(hamlet) : ''}`;
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = '/index.html';
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = '/index.html';
    });
  }
});