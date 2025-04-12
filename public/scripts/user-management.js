document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('role');
  if (role !== 'spoc') {
    alert('Access restricted to SPOC only!');
    window.location.href = '/index.html';
    return;
  }

  const addUserBtn = document.getElementById('addUserBtn');
  const addUserFormDiv = document.getElementById('addUserForm');
  const addUserForm = document.getElementById('addUser');
  const tbody = document.querySelector('#userTable tbody');

  // Load user list
  function loadUsers() {
    fetch('/api/users')
      .then(response => response.json())
      .then(users => {
        tbody.innerHTML = '';
        users.forEach(user => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${user.username}</td>
            <td class="password-cell">
              <span class="password" data-password="${user.password}">****</span>
              <button class="toggle-password">Show</button>
            </td>
            <td>${user.hamlet || 'N/A'}</td>
            <td><button class="remove-btn" data-username="${user.username}">Remove</button></td>
          `;
          tbody.appendChild(row);
        });

        // Add event listeners to toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(btn => {
          btn.addEventListener('click', () => {
            const passwordSpan = btn.previousElementSibling;
            const realPassword = passwordSpan.getAttribute('data-password');
            if (passwordSpan.textContent === '****') {
              passwordSpan.textContent = realPassword;
              btn.textContent = 'Hide';
            } else {
              passwordSpan.textContent = '****';
              btn.textContent = 'Show';
            }
          });
        });

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const username = btn.getAttribute('data-username');
            if (confirm(`Are you sure you want to remove user "${username}"?`)) {
              fetch('/api/users/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
              })
                .then(response => response.json())
                .then(data => {
                  if (data.success) {
                    alert('User removed successfully');
                    loadUsers(); // Refresh table
                  } else {
                    alert('Failed to remove user');
                  }
                })
                .catch(error => {
                  console.error('Error removing user:', error);
                  alert('Error removing user');
                });
            }
          });
        });
      })
      .catch(error => {
        console.error('Error fetching users:', error);
        alert('Error loading user list');
      });
  }

  // Initial load
  loadUsers();

  // Toggle Add User form
  addUserBtn.addEventListener('click', () => {
    addUserFormDiv.style.display = addUserFormDiv.style.display === 'none' ? 'block' : 'none';
  });

  // Handle Add User form submission
  addUserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = addUserForm.username.value;
    const password = addUserForm.password.value;
    const hamlet = addUserForm.hamlet.value;
    fetch('/api/users/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, hamlet })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('User added successfully');
          addUserForm.reset();
          addUserFormDiv.style.display = 'none';
          loadUsers(); // Refresh table
        } else {
          alert('Failed to add user');
        }
      })
      .catch(error => {
        console.error('Error adding user:', error);
        alert('Error adding user');
      });
  });

  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/spoc-dashboard.html';
  });

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/index.html';
  });
});