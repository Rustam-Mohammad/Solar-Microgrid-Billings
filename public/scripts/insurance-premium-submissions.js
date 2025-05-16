document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.insurance-premium-submissions-container');
  const submissionsDiv = document.getElementById('submissions');
  const newEntryBtn = document.getElementById('newEntryBtn');
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Since page is independent of hamlet, do not get hamlet from storage or URL
  // Remove hamlet related code
  // container.setAttribute('data-hamlet', '');
  
  // Fetch all submissions and drafts from backend API
  fetch('/api/insurance-premium')
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
        submissionsDiv.innerHTML = '<p>No insurance premium submissions or drafts yet.</p>';
      } else {
        // Render submissions
        submissions.forEach((submission, index) => {
          const card = document.createElement('div');
          card.className = 'submission-card';
          card.innerHTML = `
            <h3>Submission ${index + 1}</h3>
            <p><strong>Fiscal Year:</strong> ${submission.fiscalYear || 'N/A'}</p>
            <p><strong>Premium Amount Decided:</strong> ${submission.premiumAmountDecided || 'N/A'}</p>
            <p><strong>Premium Amount Paid:</strong> ${submission.premiumAmountPaid || 'N/A'}</p>
            <p><strong>Date of Payment:</strong> ${submission.dateOfPayment || 'N/A'}</p>
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
            <p><strong>Fiscal Year:</strong> ${draft.fiscalYear || 'Not set'}</p>
            <p><strong>Premium Amount Decided:</strong> ${draft.premiumAmountDecided || 'Not set'}</p>
            <p><strong>Premium Amount Paid:</strong> ${draft.premiumAmountPaid || 'Not set'}</p>
            <p><strong>Date of Payment:</strong> ${draft.dateOfPayment || 'Not set'}</p>
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
          console.log('View button clicked');
          const index = button.getAttribute('data-index');
          const type = button.getAttribute('data-type');
          // Remove hamlet parameter as page is independent of hamlet
          const url = `/insurance-premium-form.html?${type}=${index}&mode=readonly`;
          window.location.href = url;
        });
      });

      submissionsDiv.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => {
          console.log('Edit button clicked');
          const index = button.getAttribute('data-index');
          // Remove hamlet parameter as page is independent of hamlet
          const url = `/insurance-premium-form.html?draft=${index}`;
          window.location.href = url;
        });
      });

      submissionsDiv.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => {
          console.log('Delete button clicked');
          const index = button.getAttribute('data-index');
          if (confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
            fetch(`/api/insurance-premium/${encodeURIComponent(hamlet)}/drafts/${index}`, {
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
      submissionsDiv.innerHTML = `<p>Error loading submissions: ${error.message}</p>`;
    });

  newEntryBtn.addEventListener('click', () => {
    console.log('New Entry button clicked');
    // Navigate to form page without hamlet parameter since hamlet is chosen in form
    const url = '/insurance-premium-form.html';
    console.log('Navigating to:', url);
    window.location.href = url;
  });

  backBtn.addEventListener('click', () => {
    console.log('Back button clicked');
    window.location.href = '/ic-dashboard.html';
  });

  logoutBtn.addEventListener('click', () => {
    console.log('Logout button clicked');
    localStorage.clear();
    window.location.href = '/index.html';
  });
});
