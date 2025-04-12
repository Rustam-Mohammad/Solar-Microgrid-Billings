document.addEventListener('DOMContentLoaded', () => {
  const vecBulkForm = document.getElementById('vecBulkForm');
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  vecBulkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fileInput = vecBulkForm.querySelector('input[type="file"]');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch('/api/vec/bulk', {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(`Successfully uploaded ${data.count} VECs`);
          vecBulkForm.reset();
        } else {
          alert('Failed to upload VECs');
        }
      })
      .catch(error => {
        console.error('Error uploading VEC:', error);
        alert('Error uploading VECs');
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