document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = this.username.value;
    const password = this.password.value;

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(response => {
        if (!response.ok) throw new Error('Login failed: ' + response.status);
        return response.json();
      })
      .then(data => {
        if (data.success) {
          localStorage.setItem('username', data.username);
          localStorage.setItem('role', data.role);
          localStorage.setItem('hamlet', data.hamlet || '');
          console.log('Login data stored:', { username: data.username, role: data.role, hamlet: data.hamlet });
          window.location.href = data.role === 'spoc' ? '/spoc-dashboard.html' : '/dashboard.html';
        } else {
          alert('Login failed: ' + data.error);
        }
      })
      .catch(error => {
        console.error('Error during login:', error);
        alert('Error during login: ' + error.message);
      });
  });

  document.getElementById('showPassword').addEventListener('change', function() {
    const passwordInput = document.getElementById('passwordInput');
    passwordInput.type = this.checked ? 'text' : 'password';
  });
});