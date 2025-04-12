document.addEventListener('DOMContentLoaded', () => {
  let allData = [];
  let filteredData = [];
  let allHamlets = [];
  let allMonths = [];

  function loadData() {
    fetch('/api/vec-list')
      .then(response => response.json())
      .then(data => {
        allData = data;
        const tbody = document.querySelector('#vecTable tbody');
        const hamletLabel = document.getElementById('hamletLabel');
        const hamletDropdown = document.getElementById('hamletDropdown');
        const monthLabel = document.getElementById('monthLabel');
        const monthDropdown = document.getElementById('monthDropdown');

        // Populate hamlet dropdown
        allHamlets = [...new Set(data.map(vec => vec.hamlet))];
        hamletDropdown.innerHTML = '<label><input type="checkbox" value="">All</label>' + 
          allHamlets.map(h => `<label><input type="checkbox" value="${h}">${h}</label>`).join('');

        // Populate month dropdown
        allMonths = [...new Set(data.flatMap(vec => vec.submissions.map(sub => {
          if (!sub.submission_date) return null;
          const date = new Date(sub.submission_date);
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
            'Microgrid ID,VEC,Hamlet,Village,GP,Block,District,Date,General Issue,Amount Collected for the Month,Total Saving for the Month,Total Saving,Amount in Bank,Amount in Hand',
            ...filteredData.map(sub => {
              const vec = sub.vec;
              return `${vec.microgrid_id || ''},${vec.vec_name || ''},${vec.hamlet || ''},${vec.village || ''},${vec.gp || ''},${vec.block || ''},${vec.district || ''},${sub.submission_date || ''},${sub.general_issue ? sub.general_issue.join(';') : ''},${sub.amount_collected || ''},${sub.total_saving_month || ''},${sub.total_saving || ''},${sub.amount_in_bank || ''},${sub.amount_in_hand || ''}`;
            })
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vec_data${selectedHamlets.length ? '_' + selectedHamlets.join('_') : ''}${selectedMonths.length ? '_' + selectedMonths.map(m => m.replace(' ', '_')).join('_') : ''}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }, { once: true });
      })
      .catch(error => {
        console.error('Error fetching VEC data:', error);
        alert('Error loading VEC data');
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
    const tbody = document.querySelector('#vecTable tbody');

    filteredData = allData.flatMap(vec => vec.submissions.map(sub => ({ ...sub, vec }))).filter(sub => {
      const matchesHamlet = !selectedHamlets.length || selectedHamlets.includes(sub.vec.hamlet);
      const subMonth = sub.submission_date ? `${new Date(sub.submission_date).toLocaleString('default', { month: 'long' })} ${new Date(sub.submission_date).getFullYear()}` : null;
      const matchesMonth = !selectedMonths.length || (subMonth && selectedMonths.includes(subMonth));
      return matchesHamlet && matchesMonth;
    });

    tbody.innerHTML = '';
    filteredData.forEach(sub => {
      const vec = sub.vec;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${vec.microgrid_id || 'N/A'}</td>
        <td>${vec.vec_name || 'N/A'}</td>
        <td>${vec.hamlet || 'N/A'}</td>
        <td>${vec.village || 'N/A'}</td>
        <td>${vec.gp || 'N/A'}</td>
        <td>${vec.block || 'N/A'}</td>
        <td>${vec.district || 'N/A'}</td>
        <td>${sub.submission_date || 'N/A'}</td>
        <td>${sub.general_issue ? sub.general_issue.join(', ') : 'N/A'}</td>
        <td>${sub.amount_collected || 'N/A'}</td>
        <td>${sub.total_saving_month || 'N/A'}</td>
        <td>${sub.total_saving || 'N/A'}</td>
        <td>${sub.amount_in_bank || 'N/A'}</td>
        <td>${sub.amount_in_hand || 'N/A'}</td>
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