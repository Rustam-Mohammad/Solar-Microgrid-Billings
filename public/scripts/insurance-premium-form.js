console.log('insurance-premium-form.js loaded - top level');
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded event fired');
  const hamletSelect = document.getElementById('hamlet');
  const blockInput = document.getElementById('block');
  const stateInput = document.getElementById('state');
  const districtInput = document.getElementById('district');
  const gpInput = document.getElementById('gp');
  const villageInput = document.getElementById('village');
  const vecNameInput = document.getElementById('vecName');
  const microGridIdInput = document.getElementById('microGridId');
  const fiscalYearSelect = document.getElementById('fiscalYear');
  const referenceIdInput = document.getElementById('referenceId');
  const dateOfPaymentInput = document.getElementById('dateOfPayment');
  const form = document.getElementById('insurancePremiumForm');
  const backBtn = document.getElementById('backBtn');
  const draftBtn = document.getElementById('draftBtn');
  const hamletGroup = document.getElementById('hamletGroup');

  if (!backBtn) {
    console.error('Back button element with id "backBtn" not found in DOM');
  }

  let hamletData = [];

  function parseCSV(csvText) {
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
    return data;
  }

  async function loadHamletData() {
    try {
      console.log('Fetching hamlet data CSV...');
      const response = await fetch('/data/hamlets.csv');
      if (!response.ok) {
        throw new Error('Failed to load hamlet data CSV');
      }
      const csvText = await response.text();
      console.log('Hamlet CSV loaded, length:', csvText.length);
      const parsedData = parseCSV(csvText);
      console.log('Parsed hamlet data count:', parsedData.length);
      hamletData = parsedData;
      populateHamlets();
      hamletSelect.value = '';
      prefillFields('');
      generateReferenceId();
    } catch (error) {
      console.error('Error loading hamlet data:', error);
    }
  }

  function populateHamlets() {
    console.log('Populating hamlet dropdown...');
    hamletSelect.innerHTML = '<option value="">Select Hamlet</option>';
    if (hamletData.length > 0) {
      hamletGroup.style.display = 'block';
      hamletData.forEach(item => {
        const option = document.createElement('option');
        option.value = item.Hamlet;
        option.textContent = item.Hamlet;
        hamletSelect.appendChild(option);
      });
      console.log('Hamlet options populated:', hamletSelect.options.length);
      console.log('hamletGroup display style:', hamletGroup.style.display);
    } else {
      hamletGroup.style.display = 'none';
      console.log('No hamlets found, hamletGroup hidden');
    }
  }

  function prefillFields(hamlet) {
    console.log('Prefill fields called with hamlet:', hamlet);
    let found = false;
    hamletData.forEach(item => {
      if (item.Hamlet === hamlet) {
        blockInput.value = item.Block || '';
        stateInput.value = item.State || '';
        districtInput.value = item.District || '';
        gpInput.value = item.Panchayat || '';
        villageInput.value = item['Revenue Village'] || '';
        vecNameInput.value = item['VEC Name'] || '';
        const serialNumber = Math.floor(Math.random() * 70) + 1;
        const serialStr = serialNumber.toString().padStart(3, '0');
        microGridIdInput.value = `MG-${hamlet}/${serialStr}`;
        found = true;
      }
    });
    if (!found) {
      blockInput.value = '';
      stateInput.value = '';
      districtInput.value = '';
      gpInput.value = '';
      villageInput.value = '';
      vecNameInput.value = '';
      microGridIdInput.value = '';
    }
    generateReferenceId();
  }

  function generateReferenceId() {
    const hamlet = hamletSelect.value;
    const fy = fiscalYearSelect ? fiscalYearSelect.value : '';
    if (!hamlet) {
      referenceIdInput.value = '';
      return;
    }
    const serialNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    if (fy) {
      referenceIdInput.value = `${hamlet}/${fy}/${serialNumber}`;
    } else {
      referenceIdInput.value = `${hamlet}/${serialNumber}`;
    }
  }

  function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    dateOfPaymentInput.value = today;
  }

  hamletSelect.addEventListener('change', () => {
    console.log('Hamlet changed to:', hamletSelect.value);
    prefillFields(hamletSelect.value);
  });

  fiscalYearSelect.addEventListener('change', () => {
    generateReferenceId();
  });

  backBtn.addEventListener('click', () => {
    window.location.href = '/ic-dashboard.html';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      alert('Please fill all mandatory fields correctly.');
      return;
    }
    const formData = new FormData(form);
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    try {
      const response = await fetch('/api/insurance-premium/submit', {
        method: 'POST',
        body: formData
      });
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (!response.ok) {
          throw new Error(data.error || 'Submission failed');
        }
        alert('Insurance Premium Form submitted successfully.');
        window.location.href = '/ic-dashboard.html';
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError, 'Response text:', text);
        alert('Error submitting form: Invalid server response');
      }
    } catch (error) {
      alert('Error submitting form: ' + error.message);
    }
  });

  draftBtn.addEventListener('click', async () => {
    const formData = new FormData(form);
    try {
      const response = await fetch('/api/insurance-premium/draft', {
        method: 'POST',
        body: formData
      });
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (!response.ok) {
          throw new Error(data.error || 'Failed to save draft');
        }
        alert('Draft saved successfully.');
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError, 'Response text:', text);
        alert('Error saving draft: Invalid server response');
      }
    } catch (error) {
      alert('Error saving draft: ' + error.message);
    }
  });

  setDefaultDate();
  loadHamletData();

  if (!fiscalYearSelect.value) {
    fiscalYearSelect.value = fiscalYearSelect.options[1]?.value || '';
  }
});
