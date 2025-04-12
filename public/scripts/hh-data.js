document.addEventListener('DOMContentLoaded', () => {
  let allData = [];
  let filteredData = [];
  let allHamlets = [];
  let allMonths = [];

  function loadData() {
    fetch('/api/hh-list?all=true')
      .then(response => response.json())
      .then(data => {
        allData = data;
        const tbody = document.querySelector('#hhTable tbody');
        const hamletLabel = document.getElementById('hamletLabel');
        const hamletDropdown = document.getElementById('hamletDropdown');
        const monthLabel = document.getElementById('monthLabel');
        const monthDropdown = document.getElementById('monthDropdown');

        // Populate hamlet dropdown
        allHamlets = [...new Set(data.map(hh => hh.hamlet))];
        hamletDropdown.innerHTML = '<label><input type="checkbox" value="">All</label>' + 
          allHamlets.map(h => `<label><input type="checkbox" value="${h}">${h}</label>`).join('');

        // Populate month dropdown
        allMonths = [...new Set(data.flatMap(hh => hh.submissions.map(sub => {
          if (!sub.read_date) return null;
          const date = new Date(sub.read_date);
          return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
        }).filter(m => m)))];
        monthDropdown.innerHTML = '<label><input type="checkbox" value="">All</label>' + 
          allMonths.map(m => `<label><input type="checkbox" value="${m}">${m}</label>`).join('');

        // Toggle dropdowns
        hamletLabel.addEventListener('click', () => toggleDropdown(hamletDropdown));
        monthLabel.addEventListener('click', () => toggleDropdown(monthDropdown));

        // Filter on checkbox change
        [hamletDropdown, monthDropdown].forEach(dropdown => {
          dropdown.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', filterAndRender);
          });
        });

        // Initial render
        filterAndRender();

        // CSV download
        document.getElementById('downloadCsvBtn').addEventListener('click', () => {
          const selectedHamlets = Array.from(hamletDropdown.querySelectorAll('input:checked')).map(cb => cb.value).filter(v => v);
          const selectedMonths = Array.from(monthDropdown.querySelectorAll('input:checked')).map(cb => cb.value).filter(v => v);
          const csv = [
            'Customer ID,HH Name,Date,Meter Reading,Units Consumed,Current Bill,Past Due,Total Due,Amount Paid,Balance,VEC,Hamlet,Village,GP,Block,District,Meter Reading Image,Individual Issue',
            ...filteredData.map(sub => {
              const hh = sub.hh;
              return `${hh.customer_id},${hh.hh_name},${sub.read_date || ''},${sub.meter_read || ''},${sub.net_consumed || ''},${sub.current_bill || ''},${sub.past_due || ''},${sub.total_due || ''},${sub.amount_paid || ''},${sub.amount_balance || ''},${hh.vec_name || ''},${hh.hamlet || ''},${hh.village || ''},${hh.gp || ''},${hh.block || ''},${hh.district || ''},${sub.meter_image ? '/uploads/' + sub.meter_image : ''},${sub.individual_issues ? sub.individual_issues.join(';') : ''}`;
            })
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `hh_data${selectedHamlets.length ? '_' + selectedHamlets.join('_') : ''}${selectedMonths.length ? '_' + selectedMonths.map(m => m.replace(' ', '_')).join('_') : ''}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }, { once: true });
      })
      .catch(error => {
        console.error('Error fetching HH data:', error);
        alert('Error loading HH data');
      });
  }

  function toggleDropdown(dropdown) {
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  }

  function filterAndRender() {
    const hamletDropdown = document.getElementById('hamletDropdown');
    const monthDropdown = document.getElementById('monthDropdown');
    const selectedHamlets = Array.from(hamletDropdown.querySelectorAll('input:checked')).map(cb => cb.value).filter(v => v);
    const selectedMonths = Array.from(monthDropdown.querySelectorAll('input:checked')).map(cb => cb.value).filter(v => v);
    const tbody = document.querySelector('#hhTable tbody');

    filteredData = allData.flatMap(hh => hh.submissions.map(sub => ({ ...sub, hh }))).filter(sub => {
      const matchesHamlet = !selectedHamlets.length || selectedHamlets.includes(sub.hh.hamlet);
      const subMonth = sub.read_date ? `${new Date(sub.read_date).toLocaleString('default', { month: 'long' })} ${new Date(sub.read_date).getFullYear()}` : null;
      const matchesMonth = !selectedMonths.length || (subMonth && selectedMonths.includes(subMonth));
      return matchesHamlet && matchesMonth;
    });

    tbody.innerHTML = '';
    filteredData.forEach(sub => {
      const hh = sub.hh;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${hh.customer_id}</td>
        <td>${hh.hh_name}</td>
        <td>${sub.read_date || 'N/A'}</td>
        <td>${sub.meter_read || 'N/A'}</td>
        <td>${sub.net_consumed || 'N/A'}</td>
        <td>${sub.current_bill || 'N/A'}</td>
        <td>${sub.past_due || 'N/A'}</td>
        <td>${sub.total_due || 'N/A'}</td>
        <td>${sub.amount_paid || 'N/A'}</td>
        <td>${sub.amount_balance || 'N/A'}</td>
        <td>${hh.vec_name || 'N/A'}</td>
        <td>${hh.hamlet || 'N/A'}</td>
        <td>${hh.village || 'N/A'}</td>
        <td>${hh.gp || 'N/A'}</td>
        <td>${hh.block || 'N/A'}</td>
        <td>${hh.district || 'N/A'}</td>
        <td>${sub.meter_image ? `<img src="/uploads/${sub.meter_image}" alt="Meter Reading" onclick="window.open('/uploads/${sub.meter_image}', '_blank')">` : 'N/A'}</td>
        <td>${sub.individual_issues ? sub.individual_issues.join(', ') : 'N/A'}</td>
      `;
      tbody.appendChild(row);
    });
  }

  // Initial load
  loadData();

  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/spoc-dashboard.html';
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/index.html';
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
    }
  });
});