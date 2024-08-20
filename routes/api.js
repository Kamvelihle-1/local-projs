'use strict';
const axios = require('axios');
const stockDataStore = new Map();
module.exports = function (app) {

  app.get('/api/stock-prices', async (req, res) => {
    const { stock, like } = req.query;
    const ip = req.ip; // Get the user IP address

    const fetchStockData = async (symbol) => {
      const response = await axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
      return response.data;
    };

    const processStock = async (symbol) => {
      let stockInfo = stockDataStore.get(symbol) || { likes: new Set(), data: null };
      if (!stockInfo.data) {
        stockInfo.data = await fetchStockData(symbol);
      }

      if (like === 'true') {
        const hashedIp = hashIp(ip);
        stockInfo.likes.add(hashedIp);
      }

      stockDataStore.set(symbol, stockInfo);

      return {
        stock: stockInfo.data.symbol,
        price: stockInfo.data.latestPrice,
        likes: stockInfo.likes.size
      };
    };

    if (Array.isArray(stock)) {
      const stock1 = await processStock(stock[0]);
      const stock2 = await processStock(stock[1]);

      // Calculate relative likes
      const rel_likes1 = stock1.likes - stock2.likes;
      const rel_likes2 = stock2.likes - stock1.likes;

      res.json({ stockData: [
        { stock: stock1.stock, price: stock1.price, rel_likes: rel_likes1 },
        { stock: stock2.stock, price: stock2.price, rel_likes: rel_likes2 }
      ] });
    } else {
      const stockData = await processStock(stock);
      res.json({ stockData });
    }
  });
    
};
function hashIp(ip) {
  // Simple hash function for IP
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(ip).digest('hex');
}