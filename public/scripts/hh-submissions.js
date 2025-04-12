const urlParams = new URLSearchParams(window.location.search);
const customerId = urlParams.get('customer_id');

if (!customerId) {
  alert('No customer ID provided!');
  window.location.href = '/hh-list.html';
}

fetch('/api/hh/' + encodeURIComponent(customerId))
  .then(response => {
    if (!response.ok) throw new Error(`Failed to fetch HH data: ${response.status}`);
    return response.json();
  })
  .then(data => {
    const submissionList = document.getElementById('submissionList');
    const submissions = data.submissions || [];
    const drafts = data.drafts || [];
    if (submissions.length === 0 && drafts.length === 0) {
      submissionList.innerHTML = '<p>No previous submissions or drafts found.</p>';
    } else {
      // Display drafts
      drafts.forEach((draft, index) => {
        const card = document.createElement('div');
        card.className = 'submission-card draft';
        card.innerHTML = `
          <h3>Draft ${index + 1}</h3>
          <p>Date: ${draft.read_date || 'N/A'}</p>
          <p>Status: Draft (Payment Pending)</p>
          <button class="view-btn">View</button>
          <button class="edit-btn">Edit</button>
        `;
        card.querySelector('.view-btn').addEventListener('click', () => {
          window.location.href = `/hh-form.html?customer_id=${encodeURIComponent(customerId)}&draft=${index}&mode=readonly`;
        });
        card.querySelector('.edit-btn').addEventListener('click', () => {
          window.location.href = `/hh-form.html?customer_id=${encodeURIComponent(customerId)}&draft=${index}&mode=edit`;
        });
        submissionList.appendChild(card);
      });
      // Display submissions
      submissions.forEach((submission, index) => {
        const card = document.createElement('div');
        card.className = 'submission-card';
        const isEditable = !submission.amount_paid; // Editable only if amount_paid is empty
        card.innerHTML = `
          <h3>Submission ${index + 1}</h3>
          <p>Date: ${submission.read_date || 'N/A'}</p>
          <p>Amount Paid: ${submission.amount_paid || 'Not Paid'}</p>
          <button class="view-btn">View</button>
          ${isEditable ? '<button class="edit-btn">Edit</button>' : ''}
        `;
        card.querySelector('.view-btn').addEventListener('click', () => {
          window.location.href = `/hh-form.html?customer_id=${encodeURIComponent(customerId)}&submission=${index}&mode=readonly`;
        });
        if (isEditable) {
          card.querySelector('.edit-btn').addEventListener('click', () => {
            window.location.href = `/hh-form.html?customer_id=${encodeURIComponent(customerId)}&submission=${index}&mode=edit`;
          });
        }
        submissionList.appendChild(card);
      });
    }
  })
  .catch(error => {
    console.error('Error fetching submissions:', error);
    alert('Error loading submissions: ' + error.message);
  });

document.getElementById('newEntryBtn').addEventListener('click', () => {
  window.location.href = `/hh-form.html?customer_id=${encodeURIComponent(customerId)}&mode=edit`;
});

document.getElementById('backBtn').addEventListener('click', () => {
  window.location.href = '/hh-list.html';
});