document.addEventListener('DOMContentLoaded', () => {
  const hhBulkForm = document.getElementById('hhBulkForm');
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  hhBulkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fileInput = hhBulkForm.querySelector('input[type="file"]');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch('/api/hh/bulk', {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(`Successfully uploaded ${data.count} households`);
          hhBulkForm.reset();
        } else {
          alert('Failed to upload households');
        }
      })
      .catch(error => {
        console.error('Error uploading HH:', error);
        alert('Error uploading households');
      });
  });

  backBtn.addEventListener('click', () => {
    window.location.href = '/spoc-dashboard.html';
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/index.html';
  });
});