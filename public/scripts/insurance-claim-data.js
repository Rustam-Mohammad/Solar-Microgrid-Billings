document.addEventListener('DOMContentLoaded', () => {
  console.log('insurance-claim-data.js loaded');

  const hamletLabel = document.getElementById('hamletLabel');
  const hamletDropdown = document.getElementById('hamletDropdown');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');
  const insuranceClaimTableBody = document.querySelector('#insuranceClaimTable tbody');
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  let allClaims = [];
  let selectedHamlet = null;

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
        allClaims = data;
        populateHamletDropdown();
        renderTable();
      })
      .catch(error => {
        console.error('Error fetching insurance claims:', error);
        insuranceClaimTableBody.innerHTML = '<tr><td colspan="13">Error loading insurance claim data.</td></tr>';
      });
  }

  // Populate hamlet dropdown
  function populateHamletDropdown() {
    const hamlets = allClaims.map(item => item.hamlet).filter((v, i, a) => a.indexOf(v) === i);
    hamletDropdown.innerHTML = '';
    hamlets.forEach(hamlet => {
      const div = document.createElement('div');
      div.textContent = hamlet;
      div.classList.add('dropdown-item');
      div.addEventListener('click', () => {
        selectedHamlet = hamlet;
        hamletLabel.textContent = hamlet;
        hamletDropdown.style.display = 'none';
        renderTable();
      });
      hamletDropdown.appendChild(div);
    });
  }

  // Render table rows based on selected hamlet or all hamlets if none selected
  function renderTable() {
    insuranceClaimTableBody.innerHTML = '';
    let submissionsToShow = [];

    if (selectedHamlet) {
      const hamletData = allClaims.find(item => item.hamlet === selectedHamlet);
      if (hamletData && hamletData.submissions && hamletData.submissions.length > 0) {
        submissionsToShow = hamletData.submissions.map(sub => ({ ...sub, hamlet: selectedHamlet }));
      }
    } else {
      // Show all submissions from all hamlets
      allClaims.forEach(item => {
        if (item.submissions && item.submissions.length > 0) {
          const subsWithHamlet = item.submissions.map(sub => ({ ...sub, hamlet: item.hamlet }));
          submissionsToShow = submissionsToShow.concat(subsWithHamlet);
        }
      });
    }

    if (submissionsToShow.length === 0) {
      insuranceClaimTableBody.innerHTML = `<tr><td colspan="13">${selectedHamlet ? 'No insurance claim submissions found for this hamlet.' : 'No insurance claim submissions found.'}</td></tr>`;
      return;
    }

    submissionsToShow.forEach((claim, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${claim.state || ''}</td>
        <td>${claim.district || ''}</td>
        <td>${claim.block || ''}</td>
        <td>${claim.gp || ''}</td>
        <td>${claim.village || ''}</td>
        <td>${claim.hamlet || ''}</td>
        <td>${claim.vec_name || ''}</td>
        <td>${claim.microgrid_id || ''}</td>
        <td>${claim.claim_ref_number || ''}</td>
        <td>${claim.claim_date || ''}</td>
        <td>${claim.claiming_for || ''}</td>
        <td>${claim.claim_application_photo ? `<a href="${claim.claim_application_photo}" target="_blank">View Photo</a>` : ''}</td>
        <td><button class="delete-btn" data-index="${index}">Delete</button></td>
      `;
      insuranceClaimTableBody.appendChild(row);
    });

    // Attach delete button listeners
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-index'));
        if (confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
          // Determine hamlet and submission index for deletion
          let hamletForDeletion = null;
          let submissionIndex = -1;
          if (selectedHamlet) {
            hamletForDeletion = selectedHamlet;
            submissionIndex = index;
          } else {
            // When showing all submissions, find the hamlet and submission index by flattening
            let count = 0;
            for (const item of allClaims) {
              if (item.submissions && item.submissions.length > 0) {
                if (index < count + item.submissions.length) {
                  hamletForDeletion = item.hamlet;
                  submissionIndex = index - count;
                  break;
                }
                count += item.submissions.length;
              }
            }
          }
          if (hamletForDeletion === null || submissionIndex === -1) {
            alert('Failed to determine submission to delete.');
            return;
          }
          fetch(`/api/insurance/${encodeURIComponent(hamletForDeletion)}/submissions/${submissionIndex}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(response => {
            if (!response.ok) {
              return response.json().then(err => {
                throw new Error(err.error || 'Failed to delete submission');
              });
            }
            return response.json();
          })
          .then(data => {
            alert('Submission deleted successfully');
            // Refresh data
            fetchAllInsuranceClaims();
          })
          .catch(error => {
            console.error('Error deleting submission:', error);
            alert(error.message || 'Error deleting submission. Please try again.');
          });
        }
      });
    });
  }

  // Toggle dropdown visibility
  hamletLabel.addEventListener('click', () => {
    if (hamletDropdown.style.display === 'block') {
      hamletDropdown.style.display = 'none';
    } else {
      hamletDropdown.style.display = 'block';
    }
  });

  // Clear filters button
  clearFiltersBtn.addEventListener('click', () => {
    selectedHamlet = null;
    hamletLabel.textContent = 'Hamlet';
    renderTable();
  });

  // Download CSV button
  downloadCsvBtn.addEventListener('click', () => {
    let submissionsToDownload = [];

    if (selectedHamlet) {
      const hamletData = allClaims.find(item => item.hamlet === selectedHamlet);
      if (hamletData && hamletData.submissions && hamletData.submissions.length > 0) {
        submissionsToDownload = hamletData.submissions;
      }
    } else {
      allClaims.forEach(item => {
        if (item.submissions && item.submissions.length > 0) {
          submissionsToDownload = submissionsToDownload.concat(item.submissions);
        }
      });
    }

    if (submissionsToDownload.length === 0) {
      alert('No data to download.');
      return;
    }

    const csvRows = [];
    const headers = [
      'State', 'District', 'Block', 'GP', 'Village', 'Hamlet', 'VEC Name',
      'Microgrid ID', 'Claim Reference Number', 'Claim Date', 'Claiming for', 'Claim Application Photo'
    ];
    csvRows.push(headers.join(','));
    submissionsToDownload.forEach(claim => {
      const row = [
        claim.state || '',
        claim.district || '',
        claim.block || '',
        claim.gp || '',
        claim.village || '',
        claim.hamlet || '',
        claim.vec_name || '',
        claim.microgrid_id || '',
        claim.claim_ref_number || '',
        claim.claim_date || '',
        claim.claiming_for || '',
        claim.claim_application_photo || ''
      ];
      csvRows.push(row.map(value => `"${value.replace(/"/g, '""')}"`).join(','));
    });
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `insurance_claim_data${selectedHamlet ? '_' + selectedHamlet : '_all'}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // Back button handler
  backBtn.addEventListener('click', () => {
    window.location.href = '/spoc-dashboard.html';
  });

  // Logout button handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      console.log('Logout button clicked');
      localStorage.clear();
      window.location.href = '/index.html';
    });
  } else {
    console.error('Logout button not found in DOM');
  }

  // Initial fetch
  fetchAllInsuranceClaims();
});
