document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('role');
  if (role !== 'spoc') {
    alert('Access restricted to SPOC only!');
    window.location.href = '/index.html';
    return;
  }

  let hhData = [];
  let vecData = [];
  let allHamlets = [];
  let allMonths = [];

  function loadData() {
    Promise.all([
      fetch('/api/hh-list?all=true').then(res => res.json()),
      fetch('/api/vec-list').then(res => res.json())
    ])
      .then(([hh, vec]) => {
        hhData = hh.flatMap(h => h.submissions.map((s, i) => ({ ...s, type: 'HH', customer_id: h.customer_id, hh_name: h.hh_name, subIndex: i, hamlet: h.hamlet })));
        vecData = vec.flatMap(v => v.submissions.map((s, i) => ({ ...s, type: 'VEC', hamlet: v.hamlet, vec_name: v.vec_name, subIndex: i })));

        const typeLabel = document.getElementById('typeLabel');
        const typeDropdown = document.getElementById('typeDropdown');
        const hamletLabel = document.getElementById('hamletLabel');
        const hamletDropdown = document.getElementById('hamletDropdown');
        const monthLabel = document.getElementById('monthLabel');
        const monthDropdown = document.getElementById('monthDropdown');

        // Populate hamlet dropdown
        allHamlets = [...new Set([...hh.map(h => h.hamlet), ...vec.map(v => v.hamlet)])];
        hamletDropdown.innerHTML = '<label><input type="checkbox" value="">All</label>' + 
          allHamlets.map(h => `<label><input type="checkbox" value="${h}">${h}</label>`).join('');

        // Populate month dropdown
        allMonths = [...new Set([...hhData, ...vecData].map(entry => {
          const date = entry.read_date || entry.submission_date;
          if (!date) return null;
          const d = new Date(date);
          return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
        }).filter(m => m))];
        monthDropdown.innerHTML = '<label><input type="checkbox" value="">All</label>' + 
          allMonths.map(m => `<label><input type="checkbox" value="${m}">${m}</label>`).join('');

        // Toggle dropdowns
        typeLabel.addEventListener('click', () => toggleDropdown(typeDropdown));
        hamletLabel.addEventListener('click', () => toggleDropdown(hamletDropdown));
        monthLabel.addEventListener('click', () => toggleDropdown(monthDropdown));

        // Filter on checkbox change
        [typeDropdown, hamletDropdown, monthDropdown].forEach(dropdown => {
          dropdown.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', filterAndRender);
          });
        });

        filterAndRender();
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        alert('Error loading entries');
      });
  }

  function toggleDropdown(dropdown) {
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  }

  function filterAndRender() {
    const typeDropdown = document.getElementById('typeDropdown');
    const hamletDropdown = document.getElementById('hamletDropdown');
    const monthDropdown = document.getElementById('monthDropdown');
    const selectedTypes = Array.from(typeDropdown.querySelectorAll('input:checked')).map(cb => cb.value);
    const selectedHamlets = Array.from(hamletDropdown.querySelectorAll('input:checked')).map(cb => cb.value).filter(v => v);
    const selectedMonths = Array.from(monthDropdown.querySelectorAll('input:checked')).map(cb => cb.value).filter(v => v);
    const entriesContainer = document.getElementById('entriesContainer');
    const allEntries = [...hhData, ...vecData].filter(entry => {
      const matchesType = !selectedTypes.length || selectedTypes.includes(entry.type);
      const matchesHamlet = !selectedHamlets.length || selectedHamlets.includes(entry.hamlet);
      const entryMonth = (entry.read_date || entry.submission_date) ? 
        `${new Date(entry.read_date || entry.submission_date).toLocaleString('default', { month: 'long' })} ${new Date(entry.read_date || entry.submission_date).getFullYear()}` : null;
      const matchesMonth = !selectedMonths.length || (entryMonth && selectedMonths.includes(entryMonth));
      return matchesType && matchesHamlet && matchesMonth;
    });

    entriesContainer.innerHTML = '';
    allEntries.forEach(entry => {
      const card = document.createElement('div');
      card.className = 'card';
      if (entry.type === 'HH') {
        card.innerHTML = `
          <h3>HH: ${entry.customer_id} (${entry.hh_name || 'N/A'})</h3>
          <p>Date: ${entry.read_date || 'N/A'}</p>
          <p>Meter Reading: ${entry.meter_read || 'N/A'}</p>
          <p>Amount Paid: ${entry.amount_paid || 'N/A'}</p>
          <button class="edit-btn" data-type="HH" data-id="${entry.customer_id}" data-index="${entry.subIndex}">Edit</button>
          <button class="remove-btn" data-type="HH" data-id="${entry.customer_id}" data-index="${entry.subIndex}">Remove</button>
        `;
      } else {
        card.innerHTML = `
          <h3>VEC: ${entry.hamlet} (${entry.vec_name || 'N/A'})</h3>
          <p>Date: ${entry.submission_date || 'N/A'}</p>
          <p>Amount Collected: ${entry.amount_collected || 'N/A'}</p>
          <button class="edit-btn" data-type="VEC" data-id="${entry.hamlet}" data-index="${entry.subIndex}">Edit</button>
          <button class="remove-btn" data-type="VEC" data-id="${entry.hamlet}" data-index="${entry.subIndex}">Remove</button>
        `;
      }

      card.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const type = e.target.getAttribute('data-type');
        const id = e.target.getAttribute('data-id');
        const subIndex = e.target.getAttribute('data-index');
        if (type === 'HH') {
          window.location.href = `/edit-hh-form.html?customer_id=${encodeURIComponent(id)}&subIndex=${subIndex}`;
        } else {
          window.location.href = `/edit-vec-form.html?hamlet=${encodeURIComponent(id)}&subIndex=${subIndex}`;
        }
      });

      card.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const type = e.target.getAttribute('data-type');
        const id = e.target.getAttribute('data-id');
        const subIndex = e.target.getAttribute('data-index');
        if (confirm(`Are you sure you want to remove this ${type} submission? This action cannot be undone.`)) {
          fetch(`/api/${type.toLowerCase()}/${encodeURIComponent(id)}/remove`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-role': 'spoc' // Send role for backend verification
            },
            body: JSON.stringify({ subIndex: parseInt(subIndex) })
          })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                alert('Submission removed successfully');
                loadData(); // Refresh the entries
              } else {
                alert('Failed to remove submission: ' + (data.error || 'Unknown error'));
              }
            })
            .catch(error => {
              console.error('Error removing submission:', error);
              alert('Error removing submission');
            });
        }
      });

      entriesContainer.appendChild(card);
    });
  }

  loadData();

  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/spoc-dashboard.html';
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/index.html';
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
    }
  });
});