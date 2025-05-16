document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.insurance-usage-submissions-container');
  const submissionsDiv = document.getElementById('submissions');
  const newEntryBtn = document.getElementById('newEntryBtn');
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Fetch all usage tracker submissions and drafts from backend API
  fetch('/api/insurance-usage')
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch submissions');
      return response.json();
    })
    .then(data => {
      const submissions = data.submissions || [];
      const drafts = data.drafts || [];
      submissionsDiv.innerHTML = '';

      // Enable New Entry button after loading submissions
      newEntryBtn.disabled = false;

      if (submissions.length === 0 && drafts.length === 0) {
        submissionsDiv.innerHTML = '<p>No insurance usage tracker submissions or drafts yet.</p>';
      } else {
        // Render submissions
        submissions.forEach((submission, index) => {
          const card = document.createElement('div');
          card.className = 'submission-card';
          card.innerHTML = `
            <h3>Submission ${index + 1}</h3>
            <p><strong>Date:</strong> ${submission.date || 'N/A'}</p>
            <p><strong>Usage Details:</strong> ${submission.usageDetails || 'N/A'}</p>
            <div class="button-group">
              <button class="view-btn" data-index="${index}" data-type="submission">View</button>
            </div>
          `;
          submissionsDiv.appendChild(card);
        });

        // Render drafts
        drafts.forEach((draft, index) => {
          const card = document.createElement('div');
          card.className = 'submission-card draft-card';
          card.innerHTML = `
            <h3>Draft ${index + 1}</h3>
            <p><strong>Date:</strong> ${draft.date || 'Not set'}</p>
            <p><strong>Usage Details:</strong> ${draft.usageDetails || 'Not set'}</p>
            <div class="button-group">
              <button class="view-btn" data-index="${index}" data-type="draft">View</button>
              <button class="edit-btn" data-index="${index}" data-type="draft">Edit</button>
              <button class="delete-btn" data-index="${index}" data-type="draft">Delete</button>
            </div>
          `;
          submissionsDiv.appendChild(card);
        });
      }

      // Attach button event listeners
      submissionsDiv.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', () => {
          const index = button.getAttribute('data-index');
          const type = button.getAttribute('data-type');
          const url = `/insurance-usage-form.html?${type}=${index}&mode=readonly`;
          window.location.href = url;
        });
      });

      submissionsDiv.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => {
          const index = button.getAttribute('data-index');
          const url = `/insurance-usage-form.html?draft=${index}`;
          window.location.href = url;
        });
      });

      submissionsDiv.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => {
          const index = button.getAttribute('data-index');
          if (confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
            fetch(`/api/insurance-usage/drafts/${index}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
            })
            .then(response => {
              if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || 'Failed to delete draft'); });
              }
              return response.json();
            })
            .then(() => {
              alert('Draft deleted successfully');
              window.location.reload();
            })
            .catch(error => {
              alert('Error deleting draft: ' + error.message);
            });
          }
        });
      });
    })
    .catch(error => {
      console.error('Error loading submissions:', error);
      submissionsDiv.innerHTML = `<p>Error loading submissions: ${error.message}</p>`;
      // Enable New Entry button even if fetch fails
      newEntryBtn.disabled = false;
    });

  newEntryBtn.addEventListener('click', () => {
    const url = '/insurance-usage-form.html';
    window.location.href = url;
  });

  backBtn.addEventListener('click', () => {
    window.location.href = '/ic-dashboard.html';
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/index.html';
  });
});
