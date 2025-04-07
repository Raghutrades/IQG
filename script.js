// Alpha Vantage API Key
const apiKey = "SPCY8U9VI3R5HU1Q";

// DOM Elements
const sectorDropdown = document.getElementById("sector");
const searchBox = document.getElementById("search");
const stocksTable = document.querySelector("#stocks-table tbody");

// Load sectors dropdown
fetch('sectors.json')
  .then(response => response.json())
  .then(data => {
    // Populate sector dropdown
    Object.keys(data).forEach(sector => {
      const option = document.createElement("option");
      option.value = sector;
      option.textContent = sector;
      sectorDropdown.appendChild(option);
    });

    // Fetch and display stocks when sector is selected
    sectorDropdown.addEventListener("change", () => {
      const sector = sectorDropdown.value;
      displayStocks(data[sector]);
    });

    // Search functionality
    searchBox.addEventListener("input", () => {
      const query = searchBox.value.toLowerCase();
      if (query.length < 2) return;
      
      const allStocks = Object.values(data).flat();
      const filteredStocks = allStocks.filter(stock => 
        stock.name.toLowerCase().includes(query) || 
        stock.ticker.toLowerCase().includes(query)
      );
      displayStocks(filteredStocks);
    });
  });

// Display stocks in table
async function displayStocks(stocks) {
  stocksTable.innerHTML = "";
  for (const stock of stocks) {
    const ohlc = await fetchOHLC(stock.ticker);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${stock.name}</td>
      <td>${stock.ticker}</td>
      <td>${ohlc ? ohlc["4. close"] : "N/A"}</td>
      <td>${ohlc ? ohlc["1. open"] : "N/A"}</td>
      <td>${ohlc ? ohlc["2. high"] : "N/A"}</td>
      <td>${ohlc ? ohlc["3. low"] : "N/A"}</td>
      <td><a href="https://www.tradingview.com/chart/?symbol=NSE%3A${stock.ticker}" target="_blank">View Chart</a></td>
    `;
    stocksTable.appendChild(row);
  }
}

// Fetch OHLC data from Alpha Vantage
async function fetchOHLC(ticker) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=NSE:${ticker}&apikey=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const latestDate = Object.keys(data["Time Series (Daily)"])[0];
    return data["Time Series (Daily)"][latestDate];
  } catch (error) {
    console.error("Error fetching OHLC for", ticker, error);
    return null;
  }
}
