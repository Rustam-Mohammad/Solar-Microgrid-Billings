document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hamlet = urlParams.get('hamlet') || localStorage.getItem('hamlet');
  if (!hamlet) {
    alert('No hamlet specified!');
    window.location.href = '/dashboard.html';
    return;
  }
  document.getElementById('hamlet').textContent = hamlet;

  fetch('/api/vec/' + encodeURIComponent(hamlet))
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch VEC data: ' + response.status);
      return response.json();
    })
    .then(vecData => {
      const submissions = vecData.submissions || [];
      const submissionsDiv = document.getElementById('submissions');
      if (submissionsDiv) {
        submissionsDiv.innerHTML = '';
        if (submissions.length === 0) {
          submissionsDiv.innerHTML = '<p>No submissions yet.</p>';
        } else {
          submissions.forEach((submission, index) => {
            const card = document.createElement('div');
            card.className = 'submission-card';
            card.innerHTML = `
              <h3>Submission ${index + 1}</h3>
              <p>Date: ${submission.submission_date || 'N/A'}</p>
              <p>Amount Collected: ${submission.amount_collected || 'N/A'}</p>
              <p>Expenditure: ${submission.expenditure || 'N/A'}</p>
              <p>Total Saving for Month: ${submission.total_saving_month || 'N/A'}</p>
              <p>Total Saving: ${submission.total_saving || 'N/A'}</p>
              <p>Amount in Bank: ${submission.amount_in_bank || 'N/A'}</p>
              <p>Amount in Hand: ${submission.amount_in_hand || 'N/A'}</p>
              <p>General Issues: ${submission.general_issue ? submission.general_issue.join(', ') : 'None'}</p>
            `;
            submissionsDiv.appendChild(card);
          });
        }
      }
    })
    .catch(error => {
      console.error('Error fetching VEC data:', error);
      alert('Error loading submissions: ' + error.message);
    });

  document.getElementById('newEntryBtn').addEventListener('click', () => {
    window.location.href = `/vec-form.html?hamlet=${encodeURIComponent(hamlet)}`;
  });

  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = localStorage.getItem('role') === 'spoc' ? '/spoc-dashboard.html' : '/dashboard.html';
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/index.html';
  });
});