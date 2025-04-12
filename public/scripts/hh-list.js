document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hamlet = urlParams.get('hamlet') || localStorage.getItem('hamlet');
  if (!hamlet) {
    alert('No hamlet specified!');
    window.location.href = '/dashboard.html';
    return;
  }
  document.getElementById('hamlet').textContent = hamlet;

  fetch(`/api/hh-list?hamlet=${encodeURIComponent(hamlet)}`)
    .then(response => response.json())
    .then(hhList => {
      const hhListDiv = document.getElementById('hhList');
      if (hhListDiv) {
        hhListDiv.innerHTML = '';
        if (hhList.length === 0) {
          hhListDiv.innerHTML = '<p>No households found.</p>';
        } else {
          hhList.forEach(hh => {
            const div = document.createElement('div');
            div.innerHTML = `
              <input type="checkbox" value="${hh.customer_id}">
              <button onclick="window.location.href='/hh-submissions.html?customer_id=${encodeURIComponent(hh.customer_id)}'">
                ${hh.hh_name} (${hh.customer_id})
              </button>
            `;
            hhListDiv.appendChild(div);
          });
        }
      }
    })
    .catch(error => {
      console.error('Error fetching HH list:', error);
      alert('Error loading HH list: ' + error.message);
    });

  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = localStorage.getItem('role') === 'spoc' ? '/spoc-dashboard.html' : '/dashboard.html';
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/index.html';
  });
});