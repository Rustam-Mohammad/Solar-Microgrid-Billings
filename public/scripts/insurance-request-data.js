document.addEventListener('DOMContentLoaded', () => {
  const cardContainer = document.getElementById('cardContainer');
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Fetch all insurance claims for all hamlets
  function fetchAllInsuranceClaims() {
    fetch('/api/insurance')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch insurance claims');
        }
        return response.json();
      })
      .then(data => {
        renderCards(data);
      })
      .catch(error => {
        console.error('Error fetching insurance claims:', error);
        cardContainer.innerHTML = '<p>Error loading insurance claim data.</p>';
      });
  }

  // Render cards for each submission
  function renderCards(allClaims) {
    cardContainer.innerHTML = '';
    let submissionsToShow = [];

    // Flatten all submissions from all hamlets
    allClaims.forEach(item => {
      if (item.submissions && item.submissions.length > 0) {
        const subsWithHamlet = item.submissions.map(sub => ({ ...sub, hamlet: item.hamlet }));
        submissionsToShow = submissionsToShow.concat(subsWithHamlet);
      }
    });

    if (submissionsToShow.length === 0) {
      cardContainer.innerHTML = '<p>No insurance claim submissions found.</p>';
      return;
    }

    submissionsToShow.forEach((claim, index) => {
      const card = document.createElement('div');
      card.classList.add('submission-card');
      card.innerHTML = `
        <h3>Claim Reference: ${claim.claim_ref_number || 'N/A'}</h3>
        <p><strong>Claim Date:</strong> ${claim.claim_date || 'N/A'}</p>
        <p><strong>Claiming For:</strong> ${claim.claiming_for || 'N/A'}</p>
        <p><strong>Hamlet:</strong> ${claim.hamlet || 'N/A'}</p>
        <div class="button-group">
          <button class="view-btn burgundy-btn" data-index="${index}">View</button>
          <button class="accept-btn burgundy-btn" data-index="${index}">Accept</button>
          <button class="reject-btn burgundy-btn" data-index="${index}">Reject</button>
        </div>
      `;
      cardContainer.appendChild(card);
    });

    // Attach event listeners for buttons
    cardContainer.querySelectorAll('.view-btn').forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-index'));
        const claimRefNumber = submissionsToShow[index].claim_ref_number;
        if (claimRefNumber) {
          window.location.href = `/insurance-claim-form.html?claim_ref_number=${encodeURIComponent(claimRefNumber)}`;
        } else {
          alert('Claim reference number not found.');
        }
      });
    });

    cardContainer.querySelectorAll('.accept-btn').forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-index'));
        alert(`Accept clicked for claim reference: ${submissionsToShow[index].claim_ref_number}`);
      });
    });

    cardContainer.querySelectorAll('.reject-btn').forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-index'));
        alert(`Reject clicked for claim reference: ${submissionsToShow[index].claim_ref_number}`);
      });
    });

    cardContainer.querySelectorAll('.escalate-btn').forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-index'));
        alert(`Escalate clicked for claim reference: ${submissionsToShow[index].claim_ref_number}`);
      });
    });

    cardContainer.querySelectorAll('.request-info-btn').forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-index'));
        alert(`Request Info clicked for claim reference: ${submissionsToShow[index].claim_ref_number}`);
      });
    });
  }

  backBtn.addEventListener('click', () => {
    window.location.href = '/ic-dashboard.html';
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = '/index.html';
    });
  }

  // Initial fetch
  fetchAllInsuranceClaims();

  // Center align card content and burgundy button styles
  const style = document.createElement('style');
  style.textContent = `
    #cardContainer {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
      min-height: 80vh;
    }
    .submission-card {
      text-align: center;
    }
    .burgundy-btn {
      background-color: #800020 !important;
      color: white !important;
      border: none !important;
      padding: 6px 12px !important;
      border-radius: 4px !important;
      cursor: pointer !important;
      font-size: 0.9em !important;
      width: 100px !important;
      display: inline-block !important;
      margin: 0 5px !important;
      transition: background-color 0.3s !important;
    }
    .burgundy-btn:hover {
      background-color: #a63333 !important;
    }
  `;
  document.head.appendChild(style);
});
