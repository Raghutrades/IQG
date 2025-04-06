// Load sectors and stocks
fetch('sectors.json')
  .then(response => response.json())
  .then(data => {
    const sectorDropdown = document.getElementById('sector');
    
    // Populate sectors dropdown
    Object.keys(data).forEach(sector => {
      const option = document.createElement('option');
      option.value = sector;
      option.textContent = sector;
      sectorDropdown.appendChild(option);
    });
    
    // Update stocks table when sector is selected
    sectorDropdown.addEventListener('change', (e) => {
      const selectedSector = e.target.value;
      const stocksTable = document.querySelector('#stocks-table tbody');
      stocksTable.innerHTML = ''; // Clear previous results
      
      if (selectedSector && data[selectedSector]) {
        data[selectedSector].forEach(stock => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${stock.name}</td>
            <td>${stock.ticker}</td>
            <td><a href="https://www.tradingview.com/chart/?symbol=NSE%3A${stock.ticker}" target="_blank">View Chart</a></td>
          `;
          stocksTable.appendChild(row);
        });
      }
    });
  });