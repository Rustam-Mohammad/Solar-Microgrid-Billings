document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('insuranceUsageForm');
  const fiscalYearSelect = document.getElementById('fiscalYear');
  const usageDateInput = document.getElementById('usageDate');
  const receiptIdInput = document.getElementById('receiptId');
  const insuranceAmountUsedInput = document.getElementById('insuranceAmountUsed');
  const usedForSelect = document.getElementById('usedFor');
  const specifyOtherGroup = document.getElementById('specifyOtherGroup');
  const specifyOtherInput = document.getElementById('specifyOther');
  const blockGroup = document.getElementById('blockGroup');
  const blockSelect = document.getElementById('block');
  const hamletGroup = document.getElementById('hamletGroup');
  const hamletSelect = document.getElementById('hamlet');
  const addImageInput = document.getElementById('addImage');
  const insuranceAmountLeftInput = document.getElementById('insuranceAmountLeft');
  const draftBtn = document.getElementById('draftBtn');
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Function to get URL parameters
  function getUrlParams() {
    const params = {};
    window.location.search.substring(1).split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
    return params;
  }

  const urlParams = getUrlParams();
  const mode = urlParams.mode || '';
  const draftIndex = urlParams.draft;
  const submissionIndex = urlParams.submission;

  // Load existing data if in edit or readonly mode
  function loadData() {
    if (mode === 'readonly' || draftIndex !== undefined || submissionIndex !== undefined) {
      // Fetch data from backend API for the given draft or submission index
      let apiUrl = '/api/insurance-usage';
      if (draftIndex !== undefined) {
        apiUrl += `/drafts/${draftIndex}`;
      } else if (submissionIndex !== undefined) {
        apiUrl += `/${submissionIndex}`;
      }
      fetch(apiUrl)
        .then(response => {
          if (!response.ok) throw new Error('Failed to load data');
          return response.json();
        })
        .then(data => {
          fiscalYearSelect.value = data.fiscalYear || '';
          usageDateInput.value = data.usageDate || '';
          receiptIdInput.value = data.receiptId || '';
          insuranceAmountUsedInput.value = data.insuranceAmountUsed || '';
          usedForSelect.value = data.usedFor || '';
          specifyOtherInput.value = data.specifyOther || '';
          blockSelect.value = data.block || '';
          hamletSelect.value = data.hamlet || '';
          insuranceAmountLeftInput.value = data.insuranceAmountLeft || '';

          // Show/hide fields based on usedFor value
          updateUsedForFields();

          if (mode === 'readonly') {
            fiscalYearSelect.disabled = true;
            usageDateInput.disabled = true;
            insuranceAmountUsedInput.disabled = true;
            usedForSelect.disabled = true;
            specifyOtherInput.disabled = true;
            blockSelect.disabled = true;
            hamletSelect.disabled = true;
            addImageInput.disabled = true;
            draftBtn.style.display = 'none';
            form.querySelector('#submitBtn').style.display = 'none';
          }
        })
        .catch(error => {
          alert('Error loading data: ' + error.message);
        });
    }
  }

  // Update visibility and required status of fields based on usedFor selection
  function updateUsedForFields() {
    const usedFor = usedForSelect.value;
    if (usedFor === 'inventoryPurchasing' || usedFor === 'otherExpenditure') {
      specifyOtherGroup.style.display = 'block';
      specifyOtherInput.required = true;
      blockGroup.style.display = 'none';
      hamletGroup.style.display = 'none';
      blockSelect.required = false;
      hamletSelect.required = false;
    } else if (usedFor === 'claimByVec') {
      specifyOtherGroup.style.display = 'none';
      specifyOtherInput.required = false;
      blockGroup.style.display = 'block';
      hamletGroup.style.display = 'block';
      blockSelect.required = true;
      hamletSelect.required = true;
    } else {
      specifyOtherGroup.style.display = 'none';
      specifyOtherInput.required = false;
      blockGroup.style.display = 'none';
      hamletGroup.style.display = 'none';
      blockSelect.required = false;
      hamletSelect.required = false;
    }
  }

  // Load hamlet data from CSV file (same as insurance premium form)
  let hamletData = {};

  async function loadHamletData() {
    try {
      const response = await fetch('/data/hamlets.csv');
      if (!response.ok) throw new Error('Failed to load hamlet data CSV');
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const obj = {};
        const currentline = lines[i].split(',').map(c => c.trim());
        headers.forEach((header, index) => {
          obj[header] = currentline[index];
        });
        data.push(obj);
      }
      hamletData = {};
      data.forEach(item => {
        if (!hamletData[item.Block]) {
          hamletData[item.Block] = [];
        }
        hamletData[item.Block].push(item.Hamlet);
      });
      populateBlocks();
    } catch (error) {
      console.error('Error loading hamlet data:', error);
    }
  }

  // Populate block dropdown
  function populateBlocks() {
    blockSelect.innerHTML = '<option value="">Select Block</option>';
    Object.keys(hamletData).forEach(block => {
      const option = document.createElement('option');
      option.value = block;
      option.textContent = block;
      blockSelect.appendChild(option);
    });
  }

  // Populate hamlet dropdown based on selected block
  function populateHamlets(block) {
    hamletSelect.innerHTML = '<option value="">Select Hamlet</option>';
    if (hamletData[block]) {
      hamletData[block].forEach(hamlet => {
        const option = document.createElement('option');
        option.value = hamlet;
        option.textContent = hamlet;
        hamletSelect.appendChild(option);
      });
    }
  }

  // Event listeners
  usedForSelect.addEventListener('change', () => {
    updateUsedForFields();
  });

  blockSelect.addEventListener('change', () => {
    populateHamlets(blockSelect.value);
  });

  // Generate Receipt ID: IC/FY/serial number starting from 0001
  function generateReceiptId() {
    const fy = fiscalYearSelect.value;
    if (!fy) {
      receiptIdInput.value = '';
      return;
    }
    // For demo, generate a random serial number; in real app, fetch from backend
    const serialNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    receiptIdInput.value = `IC/${fy}/${serialNumber}`;
  }

  fiscalYearSelect.addEventListener('change', () => {
    generateReceiptId();
  });

  insuranceAmountUsedInput.addEventListener('input', () => {
    // Calculate Insurance Amount Left based on premium collection form data
    // For demo, just subtract used amount from a fixed total (e.g., 10000)
    const totalAmount = 10000; // This should be fetched from backend based on FY
    const usedAmount = parseFloat(insuranceAmountUsedInput.value) || 0;
    const leftAmount = totalAmount - usedAmount;
    insuranceAmountLeftInput.value = leftAmount >= 0 ? leftAmount.toFixed(2) : '0.00';
  });

  // Submit form data to backend API
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      alert('Please fill all mandatory fields correctly.');
      return;
    }
    const formData = new FormData(form);
    fetch('/api/insurance-usage/submit', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.error || 'Submission failed'); });
      }
      return response.json();
    })
    .then(data => {
      alert('Insurance Usage Tracker Form submitted successfully.');
      window.location.href = '/insurance-usage-submissions.html';
    })
    .catch(error => {
      alert('Error submitting form: ' + error.message);
    });
  });

  // Save draft button handler with improved error handling
  draftBtn.addEventListener('click', () => {
    const formData = new FormData(form);
    fetch('/api/insurance-usage/draft', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          return response.json().then(err => { throw new Error(err.error || 'Failed to save draft'); });
        } else {
          return response.text().then(text => { throw new Error(text || 'Failed to save draft'); });
        }
      }
      return response.json();
    })
    .then(data => {
      alert('Draft saved successfully.');
    })
    .catch(error => {
      alert('Error saving draft: ' + error.message);
    });
  });

  backBtn.addEventListener('click', () => {
    window.location.href = '/insurance-usage-submissions.html';
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/index.html';
  });

  // Initialize form data if editing or viewing
  loadData();

  // Load hamlet data from CSV
  loadHamletData();

  // Set default date to today
  usageDateInput.value = new Date().toISOString().split('T')[0];

  // Set default fiscal year if none selected
  if (!fiscalYearSelect.value) {
    fiscalYearSelect.value = fiscalYearSelect.options[1]?.value || '';
  }

  // Generate initial receipt ID
  generateReceiptId();
});
