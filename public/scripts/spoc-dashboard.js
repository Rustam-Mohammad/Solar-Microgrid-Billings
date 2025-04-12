document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  if (!username || !role || role !== 'spoc') {
    alert('Please log in as SPOC!');
    window.location.href = '/index.html';
    return;
  }

  document.getElementById('usernameDisplay').textContent = username;

  const hhFormBtn = document.getElementById('hhFormBtn');
  const vecFormBtn = document.getElementById('vecFormBtn');
  const addHHBtn = document.getElementById('addHHBtn');
  const addVECBtn = document.getElementById('addVECBtn');
  const userManagementBtn = document.getElementById('userManagementBtn');
  const editEntriesBtn = document.getElementById('editEntriesBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  hhFormBtn.addEventListener('click', () => {
    window.location.href = '/hh-data.html';
  });

  vecFormBtn.addEventListener('click', () => {
    window.location.href = '/vec-data.html';
  });

  addHHBtn.addEventListener('click', () => {
    window.location.href = '/hh-bulk.html';
  });

  addVECBtn.addEventListener('click', () => {
    window.location.href = '/vec-bulk.html';
  });

  userManagementBtn.addEventListener('click', () => {
    window.location.href = '/user-management.html';
  });

  editEntriesBtn.addEventListener('click', () => {
    window.location.href = '/edit-entries.html';
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/index.html';
  });
});