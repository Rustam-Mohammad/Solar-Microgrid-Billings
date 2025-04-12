document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('role');
  if (role !== 'spoc') {
    alert('Access restricted to SPOC only!');
    window.location.href = '/index.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const hamlet = urlParams.get('hamlet');
  const subIndex = parseInt(urlParams.get('subIndex'));
  const form = document.getElementById('vecForm');
  const submitBtn = form.querySelector('button[type="submit"]');

  function updateAmountCollected() {
    const currentMonth = form.submission_date.value.slice(0, 7);
    fetch('/api/hh-list?all=true')
      .then(response => response.json())
      .then(hhData => {
        const hhSubmissions = hhData.map(hh => 
          fetch(`/api/hh/${encodeURIComponent(hh.customer_id)}`)
            .then(res => res.json())
            .then(data => ({ submissions: data.submissions || [], hamlet: data.hamlet }))
        );
        Promise.all(hhSubmissions).then(allSubs => {
          const totalCollected = allSubs
            .filter(hh => hh.hamlet.toLowerCase() === hamlet.toLowerCase())
            .flatMap(hh => hh.submissions)
            .filter(sub => sub.read_date && sub.read_date.slice(0, 7) === currentMonth)
            .reduce((sum, sub) => sum + (parseFloat(sub.amount_paid) || 0), 0);
          form.amount_collected.value = totalCollected.toFixed(2);
          form.amount_collected.readOnly = true;
          calculateFields();
        });
      })
      .catch(error => {
        console.error('Error fetching HH data:', error);
        form.amount_collected.value = '0.00';
      });
  }

  function checkSubmissionLimit() {
    const submissionDate = form.submission_date.value;
    if (!submissionDate) return;
    const submissionMonth = submissionDate.slice(0, 7);
    fetch(`/api/vec/${encodeURIComponent(hamlet)}`)
      .then(res => res.json())
      .then(data => {
        const submissions = data.submissions || [];
        const otherSubmissions = submissions.filter((_, idx) => idx !== subIndex);
        const hasSubmission = otherSubmissions.some(sub => sub.submission_date && sub.submission_date.slice(0, 7) === submissionMonth);
        if (hasSubmission) {
          submitBtn.disabled = true;
          alert('A submission for this month already exists.');
        } else {
          submitBtn.disabled = false;
        }
      })
      .catch(error => console.error('Error checking submission limit:', error));
  }

  function loadSubmission() {
    fetch(`/api/vec/${encodeURIComponent(hamlet)}`)
      .then(res => res.json())
      .then(data => {
        if (!data.submissions || subIndex < 0 || subIndex >= data.submissions.length) {
          alert('Submission not found');
          window.location.href = '/edit-entries.html';
          return;
        }
        const submission = data.submissions[subIndex];
        form.hamlet.value = hamlet;
        form.vec_name.value = data.vec_name || 'Prakash Saur Oorja Samiti';
        form.micro_id.value = data.microgrid_id || 'MG-SARAIPANI';
        form.submission_date.value = submission.submission_date || '';
        const issueSelect = form.general_issues;
        Array.from(issueSelect.options).forEach(option => {
          option.selected = submission.general_issues && submission.general_issues.includes(option.value);
        });
        if (submission.general_issues && submission.general_issues.length && !submission.general_issues.includes('No Issue')) {
          document.getElementById('issueImgDiv').style.display = 'block';
        }
        form.amount_collected.value = submission.amount_collected || '';
        form.expenditure.value = submission.expenditure || '';
        form.saving_month.value = submission.saving_month || '';
        form.total_saving.value = submission.total_saving || '';
        form.amount_bank.value = submission.amount_bank || '';
        form.amount_hand.value = submission.amount_hand || '';
        updateAmountCollected();
        checkSubmissionLimit();
      })
      .catch(error => {
        console.error('Error loading submission:', error);
        alert('Error loading submission');
      });
  }

  function calculateFields() {
    const amountCollected = parseFloat(form.amount_collected.value) || 0;
    const expenditure = parseFloat(form.expenditure.value) || 0;
    const savingMonth = amountCollected - expenditure;
    form.saving_month.value = savingMonth.toFixed(2);
    
    const totalSaving = parseFloat(form.total_saving.value) || 0;
    const amountBank = parseFloat(form.amount_bank.value) || 0;
    form.amount_hand.value = (totalSaving - amountBank).toFixed(2);
  }

  form.submission_date.addEventListener('change', () => {
    updateAmountCollected();
    checkSubmissionLimit();
  });
  form.amount_collected.addEventListener('input', calculateFields);
  form.expenditure.addEventListener('input', calculateFields);
  form.total_saving.addEventListener('input', calculateFields);
  form.amount_bank.addEventListener('input', calculateFields);

  form.general_issues.addEventListener('change', () => {
    const selectedIssues = Array.from(form.general_issues.selectedOptions).map(opt => opt.value);
    document.getElementById('issueImgDiv').style.display = selectedIssues.length && !selectedIssues.includes('No Issue') ? 'block' : 'none';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const submission = {};
    formData.forEach((value, key) => {
      if (key === 'general_issues') {
        submission[key] = Array.from(form.general_issues.selectedOptions).map(opt => opt.value);
      } else if (key !== 'issue_img') {
        submission[key] = value;
      }
    });

    fetch(`/api/vec/${encodeURIComponent(hamlet)}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subIndex, ...submission })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('Submission updated successfully');
          window.location.href = '/edit-entries.html';
        } else {
          alert('Failed to update submission: ' + (data.error || 'Unknown error'));
        }
      })
      .catch(error => {
        console.error('Error updating submission:', error);
        alert('Error updating submission');
      });
  });

  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/edit-entries.html';
  });

  loadSubmission();
});