// Configuration
const API_KEY = "B9TJH3V7UR3Q5BL5"; // Your Alpha Vantage key
const API_DELAY = 13000; // 13 seconds between requests (5/minute limit)
const CACHE_TIME = 15 * 60 * 1000; // 15 minutes cache

// DOM Elements
const searchBox = document.getElementById('search');
const timeframeSelect = document.getElementById('timeframe');
const refreshBtn = document.getElementById('refresh-btn');
const stocksBody = document.getElementById('stocks-body');
const statusEl = document.getElementById('status');

// NIFTY50 Stocks Data
const stocks = [
  { name: "Tata Steel", ticker: "TATASTEEL.NS" },
  { name: "Cipla", ticker: "CIPLA.NS" },
  // ... (Add all other NIFTY50 stocks)
  { name: "Infosys", ticker: "INFY.NS" }
];

// Data Cache
const stockDataCache = {};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  loadInitialData();
  setupEventListeners();
}

function setupEventListeners() {
  // Search functionality
  searchBox.addEventListener('input', () => {
    const term = searchBox.value.toLowerCase();
    const filtered = stocks.filter(stock => 
      stock.name.toLowerCase().includes(term) || 
      stock.ticker.toLowerCase().includes(term)
    );
    displayStocks(filtered);
  });

  // Timeframe change
  timeframeSelect.addEventListener('change', () => {
    displayStocks(getVisibleStocks());
  });

  // Manual refresh
  refreshBtn.addEventListener('click', () => {
    statusEl.textContent = "Force refreshing data...";
    loadAllStocks(true); // Bypass cache
  });
}

function getVisibleStocks() {
  const term = searchBox.value.toLowerCase();
  return term 
    ? stocks.filter(s => s.name.toLowerCase().includes(term) || s.ticker.toLowerCase().includes(term))
    : [...stocks];
}

async function loadInitialData() {
  // Load first 5 stocks immediately
  const initialStocks = stocks.slice(0, 5);
  await Promise.all(initialStocks.map(stock => fetchStockData(stock)));
  displayStocks(initialStocks);
  
  // Load remaining in background
  loadAllStocks();
}

async function loadAllStocks(forceRefresh = false) {
  const stocksToLoad = forceRefresh 
    ? [...stocks] 
    : stocks.filter(stock => !stockDataCache[stock.ticker] || 
          (Date.now() - stockDataCache[stock.ticker].timestamp > CACHE_TIME));

  if (stocksToLoad.length === 0) {
    statusEl.textContent = `Data up-to-date (${new Date().toLocaleTimeString()})`;
    return;
  }

  statusEl.textContent = `Loading ${stocksToLoad.length} stocks...`;

  for (let i = 0; i < stocksToLoad.length; i++) {
    const stock = stocksToLoad[i];
    await fetchStockData(stock);
    
    // Update status
    statusEl.textContent = `Loading ${i+1}/${stocksToLoad.length}: ${stock.name}...`;
    
    // Add delay between API calls
    if (i < stocksToLoad.length - 1) {
      await new Promise(resolve => setTimeout(resolve, API_DELAY));
    }
  }

  statusEl.textContent = `Data updated at ${new Date().toLocaleTimeString()}`;
  displayStocks(getVisibleStocks());
}

async function fetchStockData(stock) {
  try {
    const timeframe = timeframeSelect.value;
    let url, dataKey;
    
    switch(timeframe) {
      case 'weekly':
        url = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${stock.ticker}&apikey=${API_KEY}`;
        dataKey = "Weekly Time Series";
        break;
      case 'monthly':
        url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${stock.ticker}&apikey=${API_KEY}`;
        dataKey = "Monthly Time Series";
        break;
      default: // daily
        url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stock.ticker}&apikey=${API_KEY}`;
        dataKey = "Time Series (Daily)";
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data[dataKey]) {
      const dates = Object.keys(data[dataKey]);
      stockDataCache[stock.ticker] = {
        data: data[dataKey][dates[0]], // Latest entry
        meta: {
          timeframe,
          lastUpdated: new Date().toISOString()
        },
        timestamp: Date.now()
      };
    } else if (data.Note) {
      console.warn(`API Limit Reached for ${stock.ticker}`);
      throw new Error("API limit reached");
    }
  } catch (error) {
    console.error(`Error fetching ${stock.ticker}:`, error);
    statusEl.textContent = `Error: ${error.message || "Check console"}`;
  }
}

function displayStocks(stocksToDisplay) {
  stocksBody.innerHTML = '';
  const timeframe = timeframeSelect.value;

  stocksToDisplay.forEach(stock => {
    const cachedData = stockDataCache[stock.ticker];
    const isCurrentTimeframe = cachedData?.meta?.timeframe === timeframe;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${stock.name}</td>
      <td>${stock.ticker.replace('.NS', '')}</td>
      <td>${(cachedData && isCurrentTimeframe) ? cachedData.data['1. open'] : '...'}</td>
      <td>${(cachedData && isCurrentTimeframe) ? cachedData.data['2. high'] : '...'}</td>
      <td>${(cachedData && isCurrentTimeframe) ? cachedData.data['3. low'] : '...'}</td>
      <td>${(cachedData && isCurrentTimeframe) ? cachedData.data['4. close'] : '...'}</td>
      <td>${(cachedData && isCurrentTimeframe) ? cachedData.data['5. volume'] : '...'}</td>
      <td>
        <a href="https://www.tradingview.com/chart/?symbol=NSE%3A${stock.ticker.replace('.NS', '')}" 
           target="_blank" class="stock-link">
           📈 Chart
        </a>
      </td>
    `;
    stocksBody.appendChild(row);
  });
}
