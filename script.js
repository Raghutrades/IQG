// Configuration
const API_KEY = "SPCY8U9VI3R5HU1Q"; // Replace with your key
const API_DELAY = 12000; // 12 seconds between requests (5/minute limit)
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes cache

// DOM Elements
const searchBox = document.getElementById('search');
const stocksBody = document.getElementById('stocks-body');
const statusEl = document.getElementById('status');

// NIFTY50 Stocks Data
const stocks = [
  { name: "Tata Steel", ticker: "TATASTEEL.NS" },
  { name: "Cipla", ticker: "CIPLA.NS" },
  { name: "Dr. Reddy's", ticker: "DRREDDY.NS" },
  { name: "BPCL", ticker: "BPCL.NS" },
  // ... (Add all other NIFTY50 stocks in same format)
  { name: "Infosys", ticker: "INFY.NS" }
];

// Cache for stock data
const stockDataCache = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAllStocks();
});

// Search functionality
searchBox.addEventListener('input', () => {
  const searchTerm = searchBox.value.toLowerCase();
  const filtered = stocks.filter(stock => 
    stock.name.toLowerCase().includes(searchTerm) || 
    stock.ticker.toLowerCase().includes(searchTerm)
  );
  displayStocks(filtered);
});

// Main function to load and display data
async function loadAllStocks() {
  statusEl.textContent = "Loading OHLC data... (5 requests/minute limit)";
  
  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];
    
    // Check cache first
    if (stockDataCache[stock.ticker] && 
        (Date.now() - stockDataCache[stock.ticker].timestamp < CACHE_TIME)) {
      continue;
    }

    // Fetch new data with delay
    await fetchStockData(stock);
    
    // Add delay between API calls (except last one)
    if (i < stocks.length - 1) {
      statusEl.textContent = `Fetching ${stock.name} (${i+1}/${stocks.length})...`;
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
    }
  }
  
  displayStocks(stocks);
  statusEl.textContent = `Data updated at ${new Date().toLocaleTimeString()}`;
}

// Fetch OHLC data from Alpha Vantage
async function fetchStockData(stock) {
  try {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stock.ticker}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data["Time Series (Daily)"]) {
      const latestDate = Object.keys(data["Time Series (Daily)"])[0];
      stockDataCache[stock.ticker] = {
        data: data["Time Series (Daily)"][latestDate],
        timestamp: Date.now()
      };
    }
  } catch (error) {
    console.error(`Failed to fetch ${stock.ticker}:`, error);
  }
}

// Display stocks in table
function displayStocks(stocksToDisplay) {
  stocksBody.innerHTML = '';
  
  stocksToDisplay.forEach(stock => {
    const cachedData = stockDataCache[stock.ticker];
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${stock.name}</td>
      <td>${stock.ticker.replace('.NS', '')}</td>
      <td>${cachedData?.data ? cachedData.data['4. close'] : 'N/A'}</td>
      <td>${cachedData?.data ? cachedData.data['1. open'] : 'N/A'}</td>
      <td>${cachedData?.data ? cachedData.data['2. high'] : 'N/A'}</td>
      <td>${cachedData?.data ? cachedData.data['3. low'] : 'N/A'}</td>
      <td><a href="https://www.tradingview.com/chart/?symbol=NSE%3A${stock.ticker.replace('.NS', '')}" target="_blank">📈 View</a></td>
    `;
    
    stocksBody.appendChild(row);
  });
}
