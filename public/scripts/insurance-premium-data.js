document.addEventListener('DOMContentLoaded', () => {
  console.log('insurance-premium-data.js loaded');

  const hamletLabel = document.getElementById('hamletLabel');
  const hamletDropdown = document.getElementById('hamletDropdown');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');
  const insurancePremiumTableBody = document.querySelector('#insurancePremiumTable tbody');
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  let allPremiums = [];
  let selectedHamlet = null;

  // Fetch all insurance premium data for all hamlets
  function fetchAllInsurancePremiums() {
    fetch('/api/insurance-premium')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch insurance premium data');
        }
        return response.json();
      })
      .then(data => {
        allPremiums = data;
        populateHamletDropdown();
        renderTable();
      })
      .catch(error => {
        console.error('Error fetching insurance premium data:', error);
        insurancePremiumTableBody.innerHTML = '<tr><td colspan="15">Error loading insurance premium data.</td></tr>';
      });
  }

  // Populate hamlet dropdown
  function populateHamletDropdown() {
    const hamlets = allPremiums.map(item => item.hamlet).filter((v, i, a) => a.indexOf(v) === i);
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
    insurancePremiumTableBody.innerHTML = '';
    let submissionsToShow = [];

    if (selectedHamlet) {
      const hamletData = allPremiums.find(item => item.hamlet === selectedHamlet);
      if (hamletData && hamletData.submissions && hamletData.submissions.length > 0) {
        submissionsToShow = hamletData.submissions.map(sub => ({ ...sub, hamlet: selectedHamlet }));
      }
    } else {
      // Show all submissions from all hamlets
      allPremiums.forEach(item => {
        if (item.submissions && item.submissions.length > 0) {
          const subsWithHamlet = item.submissions.map(sub => ({ ...sub, hamlet: item.hamlet }));
          submissionsToShow = submissionsToShow.concat(subsWithHamlet);
        }
      });
    }

    if (submissionsToShow.length === 0) {
      insurancePremiumTableBody.innerHTML = `<tr><td colspan="15">${selectedHamlet ? 'No insurance premium submissions found for this hamlet.' : 'No insurance premium submissions found.'}</td></tr>`;
      return;
    }

    submissionsToShow.forEach((submission, index) => {
      const row = document.createElement('tr');
      row.innerHTML = \`
        <td>\${submission.fiscalYear || ''}</td>
        <td>\${submission.block || ''}</td>
        <td>\${submission.hamlet || ''}</td>
        <td>\${submission.state || ''}</td>
        <td>\${submission.district || ''}</td>
        <td>\${submission.gp || ''}</td>
        <td>\${submission.village || ''}</td>
        <td>\${submission.vecName || ''}</td>
        <td>\${submission.microGridId || ''}</td>
        <td>\${submission.premiumAmountDecided || ''}</td>
        <td>\${submission.premiumAmountPaid || ''}</td>
        <td>\${submission.referenceId || ''}</td>
        <td>\${submission.dateOfPayment || ''}</td>
        <td>\${submission.receiptImage ? \`<a href="\${submission.receiptImage}" target="_blank">View Image</a>\` : ''}</td>
        <td><button class="delete-btn" data-index="\${index}">Delete</button></td>
      \`;
      insurancePremiumTableBody.appendChild(row);
    });

    // Attach delete button listeners
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.getAttribute('data-index'));
        if (confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
          let hamletForDeletion = null;
          let submissionIndex = -1;
          if (selectedHamlet) {
            hamletForDeletion = selectedHamlet;
            submissionIndex = index;
          } else {
            let count = 0;
            for (const item of allPremiums) {
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
          fetch(\`/api/insurance-premium/\${encodeURIComponent(hamletForDeletion)}/submissions/\${submissionIndex}\`, {
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
            fetchAllInsurancePremiums();
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
      const hamletData = allPremiums.find(item => item.hamlet === selectedHamlet);
      if (hamletData && hamletData.submissions && hamletData.submissions.length > 0) {
        submissionsToDownload = hamletData.submissions;
      }
    } else {
      allPremiums.forEach(item => {
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
      'Fiscal Year', 'Block', 'Hamlet', 'State', 'District', 'GP', 'Village', 'VEC Name',
      'Micro Grid ID', 'Premium Amount Decided by IC', 'Premium Amount Paid', 'Reference ID',
      'Date of Payment', 'Receipt Image'
    ];
    csvRows.push(headers.join(','));
    submissionsToDownload.forEach(submission => {
      const row = [
        submission.fiscalYear || '',
        submission.block || '',
        submission.hamlet || '',
        submission.state || '',
        submission.district || '',
        submission.gp || '',
        submission.village || '',
        submission.vecName || '',
        submission.microGridId || '',
        submission.premiumAmountDecided || '',
        submission.premiumAmountPaid || '',
        submission.referenceId || '',
        submission.dateOfPayment || '',
        submission.receiptImage || ''
      ];
      csvRows.push(row.map(value => \`"\${value.replace(/"/g, '""')}"\`).join(','));
    });
    const csvString = csvRows.join('\\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', \`insurance_premium_data\${selectedHamlet ? '_' + selectedHamlet : '_all'}.csv\`);
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
      localStorage.clear();
      window.location.href = '/index.html';
    });
  }

  // Initial fetch
  fetchAllInsurancePremiums();
});
