document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hamlet = urlParams.get('hamlet');
  const submissionIndex = urlParams.get('submission');
  const mode = urlParams.get('mode') || 'edit';
  const form = document.getElementById('vecForm');
  const issueSelect = form.querySelector('[name="general_issues"]');
  const issueImgDiv = document.getElementById('issueImgDiv');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.submission_date.value = new Date().toISOString().split('T')[0];

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
          updateCalculations();
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
    fetch('/api/vec/' + encodeURIComponent(hamlet))
      .then(response => response.json())
      .then(data => {
        const submissions = data.submissions || [];
        const hasSubmission = submissions.some(sub => sub.submission_date && sub.submission_date.slice(0, 7) === submissionMonth);
        if (hasSubmission && mode !== 'readonly' && (submissionIndex === null || parseInt(submissionIndex) !== submissions.findIndex(sub => sub.submission_date && sub.submission_date.slice(0, 7) === submissionMonth))) {
          submitBtn.disabled = true;
          alert('A submission for this month already exists.');
        } else {
          submitBtn.disabled = false;
        }
      })
      .catch(error => console.error('Error checking submission limit:', error));
  }

  fetch('/api/vec/' + encodeURIComponent(hamlet))
    .then(response => response.json())
    .then(data => {
      const submissions = data.submissions || [];
      const lastSubmission = submissions[submissions.length - 1] || {};

      if (mode === 'readonly' && submissionIndex !== null) {
        const submission = submissions[parseInt(submissionIndex)];
        if (!submission) throw new Error('Submission not found');
        populateForm(submission);
        makeFormReadOnly();
      } else {
        form.hamlet.value = hamlet;
        form.vec_name.value = data.vec_name || 'Prakash Saur Oorja Samiti';
        form.micro_id.value = data.microgrid_id || 'MG-SARAIPANI';

        if (submissions.length === 0) {
          form.total_saving.value = '';
          form.total_saving.readOnly = false;
        } else {
          form.total_saving.value = (parseFloat(lastSubmission.total_saving) || 0).toFixed(2);
          form.total_saving.readOnly = true;
        }

        updateAmountCollected();
        checkSubmissionLimit();
      }
    })
    .catch(error => {
      console.error('Fetch Previous Error:', error);
      alert('Error loading VEC data');
    });

  form.submission_date.addEventListener('change', () => {
    updateAmountCollected();
    checkSubmissionLimit();
  });

  issueSelect.addEventListener('change', function() {
    const hasIssue = Array.from(this.selectedOptions).some(opt => opt.value !== 'No Issue');
    issueImgDiv.style.display = hasIssue ? 'block' : 'none';
  });

  form.expenditure.addEventListener('input', updateCalculations);
  form.amount_bank.addEventListener('input', updateCalculations);
  if (!form.total_saving.readOnly) {
    form.total_saving.addEventListener('input', updateCalculations);
  }

  function updateCalculations() {
    if (mode === 'readonly') return;
    const amountCollected = parseFloat(form.amount_collected.value) || 0;
    const expenditure = parseFloat(form.expenditure.value) || 0;
    const totalSavingPrev = parseFloat(form.total_saving.value) || 0;
    const amountBank = parseFloat(form.amount_bank.value) || 0;

    const savingMonth = amountCollected - expenditure;
    const totalSaving = form.total_saving.readOnly ? (totalSavingPrev + savingMonth) : totalSavingPrev;

    form.saving_month.value = savingMonth.toFixed(2);
    if (form.total_saving.readOnly) form.total_saving.value = totalSaving.toFixed(2);
    form.amount_hand.value = (totalSaving - amountBank).toFixed(2);
  }

  function populateForm(submission) {
    form.submission_date.value = submission.submission_date || '';
    form.amount_collected.value = submission.amount_collected || '';
    form.expenditure.value = submission.expenditure || '';
    form.saving_month.value = submission.saving_month || '';
    form.total_saving.value = submission.total_saving || '';
    form.amount_bank.value = submission.amount_bank || '';
    form.amount_hand.value = submission.amount_hand || '';
    let issues = submission.general_issues;
    if (typeof issues === 'string') issues = issues.split(',');
    else if (!Array.isArray(issues)) issues = issues ? [issues] : ['No Issue'];
    Array.from(issueSelect.options).forEach(option => {
      option.selected = issues.includes(option.value);
    });
    issueImgDiv.style.display = issues.some(i => i !== 'No Issue') ? 'block' : 'none';
  }

  function makeFormReadOnly() {
    Array.from(form.elements).forEach(element => {
      if (element.tagName !== 'BUTTON') element.disabled = true;
    });
    submitBtn.style.display = 'none';
  }

  form.addEventListener('submit', function(e) {
    if (mode === 'readonly') return;
    e.preventDefault();
    const formData = new FormData();
    const submission = {};
    for (const [key, value] of new FormData(form)) {
      if (key === 'general_issues') {
        submission[key] = Array.from(form.general_issues.selectedOptions).map(opt => opt.value);
      } else if (key !== 'issue_img') {
        submission[key] = value;
      }
    }
    formData.append('submission', JSON.stringify(submission));
    if (form.issue_img.files[0]) formData.append('issue_img', form.issue_img.files[0]);

    fetch('/api/vec/' + encodeURIComponent(hamlet) + '/submit', {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (data.success) {
          window.location.href = '/vec.html';
        } else {
          alert('Submission failed: ' + (data.error || 'Unknown error'));
        }
      })
      .catch(error => {
        alert('Error submitting form: ' + error.message);
      });
  });

  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = `/vec-submissions.html?hamlet=${encodeURIComponent(hamlet)}`;
  });
});