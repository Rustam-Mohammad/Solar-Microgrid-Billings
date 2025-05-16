document.addEventListener('DOMContentLoaded', () => {
  const claimRefNumberInput = document.getElementById('claimRefNumber');
  const claimDateInput = document.getElementById('claimDate');
  const claimingForInput = document.getElementById('claimingFor');
  const hamletInput = document.getElementById('hamlet');
  const vecNameInput = document.getElementById('vecName');
  const microgridIdInput = document.getElementById('microgridId');
  const claimPhotoLink = document.getElementById('claimPhotoLink');
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Get claim_ref_number from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const claimRefNumber = urlParams.get('claim_ref_number');

  if (!claimRefNumber) {
    alert('No claim reference number provided.');
    window.location.href = '/insurance-request-data.html';
    return;
  }

  // Fetch all insurance claims and find the one with the matching claim_ref_number
  function fetchClaim() {
    fetch('/api/insurance')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch insurance claims');
        }
        return response.json();
      })
      .then(data => {
        let foundClaim = null;
        for (const item of data) {
          if (item.submissions && item.submissions.length > 0) {
            foundClaim = item.submissions.find(sub => sub.claim_ref_number === claimRefNumber);
            if (foundClaim) {
              // Add hamlet info from parent item
              foundClaim.hamlet = item.hamlet;
              break;
            }
          }
        }
        if (!foundClaim) {
          alert('Claim not found.');
          window.location.href = '/insurance-request-data.html';
          return;
        }
        populateForm(foundClaim);
      })
      .catch(error => {
        console.error('Error fetching insurance claims:', error);
        alert('Error loading claim data.');
        window.location.href = '/insurance-request-data.html';
      });
  }

  // Populate form fields with claim data
  function populateForm(claim) {
    claimRefNumberInput.value = claim.claim_ref_number || '';
    claimDateInput.value = claim.claim_date || '';
    claimingForInput.value = claim.claiming_for || '';
    hamletInput.value = claim.hamlet || '';
    vecNameInput.value = claim.vec_name || '';
    microgridIdInput.value = claim.microgrid_id || '';
    if (claim.claim_application_photo) {
      claimPhotoLink.href = claim.claim_application_photo;
      claimPhotoLink.style.display = 'inline';
    } else {
      claimPhotoLink.style.display = 'none';
    }
  }

  backBtn.addEventListener('click', () => {
    window.location.href = '/insurance-request-data.html';
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = '/index.html';
    });
  }

  fetchClaim();
});
