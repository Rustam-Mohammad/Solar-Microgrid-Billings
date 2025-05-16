document.addEventListener('DOMContentLoaded', () => {
  console.log('insurance-usage-data.js loaded');

  const hamletLabel = document.getElementById('hamletLabel');
  const hamletDropdown = document.getElementById('hamletDropdown');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');
  const insuranceUsageTableBody = document.querySelector('#insuranceUsageTable tbody');
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  let allUsageData = [];
  let selectedHamlet = null;

  // Fetch all insurance usage data for all hamlets
  function fetchAllInsuranceUsage() {
    fetch('/api/insurance-usage')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch insurance usage data');
        }
        return response.json();
      })
      .then(data => {
        allUsageData = data;
        populateHamletDropdown();
        renderTable();
      })
      .catch(error => {
        console.error('Error fetching insurance usage data:', error);
        insuranceUsageTableBody.innerHTML = '<tr><td colspan="11">Error loading insurance usage data.</td></tr>';
      });
  }

  // Populate hamlet dropdown
  function populateHamletDropdown() {
    const hamlets = allUsageData.map(item => item.hamlet).filter((v, i, a) => a.indexOf(v) === i);
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
    insuranceUsageTableBody.innerHTML = '';
    let submissionsToShow = [];

    if (selectedHamlet) {
      const hamletData = allUsageData.find(item => item.hamlet === selectedHamlet);
      if (hamletData && hamletData.submissions && hamletData.submissions.length > 0) {
        submissionsToShow = hamletData.submissions.map(sub => ({ ...sub, hamlet: selectedHamlet }));
      }
    } else {
      // Show all submissions from all hamlets
      allUsageData.forEach(item => {
        if (item.submissions && item.submissions.length > 0) {
          const subsWithHamlet = item.submissions.map(sub => ({ ...sub, hamlet: item.hamlet }));
          submissionsToShow = submissionsToShow.concat(subsWithHamlet);
        }
      });
    }

    if (submissionsToShow.length === 0) {
      insuranceUsageTableBody.innerHTML = `<tr><td colspan="11">${selectedHamlet ? 'No insurance usage submissions found for this hamlet.' : 'No insurance usage submissions found.'}</td></tr>`;
      return;
    }

    submissionsToShow.forEach((submission, index) => {
      const row = document.createElement('tr');
      row.innerHTML = \`
        <td>\${submission.fiscalYear || ''}</td>
        <td>\${submission.usageDate || ''}</td>
        <td>\${submission.receiptId || ''}</td>
        <td>\${submission.insuranceAmountUsed || ''}</td>
        <td>\${submission.usedFor || ''}</td>
        <td>\${submission.specifyOther || ''}</td>
        <td>\${submission.block || ''}</td>
        <td>\${submission.hamlet || ''}</td>
        <td>\${submission.addImage ? \`<a href="\${submission.addImage}" target="_blank">View Image</a>\` : ''}</td>
        <td>\${submission.insuranceAmountLeft || ''}</td>
        <td><button class="delete-btn" data-index="\${index}">Delete</button></td>
      \`;
      insuranceUsageTableBody.appendChild(row);
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
            for (const item of allUsageData) {
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
          fetch(\`/api/insurance-usage/\${encodeURIComponent(hamletForDeletion)}/submissions/\${submissionIndex}\`, {
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
            fetchAllInsuranceUsage();
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
      const hamletData = allUsageData.find(item => item.hamlet === selectedHamlet);
      if (hamletData && hamletData.submissions && hamletData.submissions.length > 0) {
        submissionsToDownload = hamletData.submissions;
      }
    } else {
      allUsageData.forEach(item => {
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
      'Fiscal Year', 'Date', 'Receipt ID', 'Insurance Amount Used', 'Used For', 'Specify Other',
      'Block', 'Hamlet', 'Add Image', 'Insurance Amount Left'
    ];
    csvRows.push(headers.join(','));
    submissionsToDownload.forEach(submission => {
      const row = [
        submission.fiscalYear || '',
        submission.usageDate || '',
        submission.receiptId || '',
        submission.insuranceAmountUsed || '',
        submission.usedFor || '',
        submission.specifyOther || '',
        submission.block || '',
        submission.hamlet || '',
        submission.addImage || '',
        submission.insuranceAmountLeft || ''
      ];
      csvRows.push(row.map(value => \`"\${value.replace(/"/g, '""')}"\`).join(','));
    });
    const csvString = csvRows.join('\\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', \`insurance_usage_data\${selectedHamlet ? '_' + selectedHamlet : '_all'}.csv\`);
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
  fetchAllInsuranceUsage();
});
