# Virtual Stock Exchange - Complete Production System

## 🚀 Features

### Backend (Node.js + Express + SQLite)
- ✅ User authentication (JWT)
- ✅ Real-time stock data (Alpha Vantage API)
- ✅ Portfolio management
- ✅ Trading system (buy/sell with commissions)
- ✅ Transaction history
- ✅ Watchlist functionality
- ✅ Global leaderboard
- ✅ SQLite database

### Frontend (React)
- ✅ Yahoo Finance-style interface
- ✅ Real-time stock quotes
- ✅ Interactive charts
- ✅ Search functionality
- ✅ Portfolio tracking
- ✅ Trade execution
- ✅ User authentication
- ✅ Responsive design

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Create .env file:
```
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this
ALPHA_VANTAGE_KEY=your-api-key-here
```

3. Get free Alpha Vantage API key:
- Visit: https://www.alphavantage.co/support/#api-key
- Sign up for free API key
- Add to .env file

## 🏃 Running the Application

### Development Mode:
```bash
npm start
```

### Access the app:
- Frontend: http://localhost:3001
- API: http://localhost:3001/api

## 🔑 API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/profile` - Get user profile

### Market Data (Real-time)
- GET `/api/market/quote/:symbol` - Get stock quote
- GET `/api/market/search/:query` - Search stocks
- GET `/api/market/chart/:symbol/:interval` - Get chart data
- GET `/api/market/history/:symbol` - Get historical data
- GET `/api/market/overview` - Market overview

### Trading
- GET `/api/portfolio` - Get user portfolio
- GET `/api/portfolio/summary` - Portfolio summary
- POST `/api/trade` - Execute trade
- GET `/api/transactions` - Transaction history

### Watchlist
- GET `/api/watchlist` - Get watchlist
- POST `/api/watchlist` - Add to watchlist
- DELETE `/api/watchlist/:symbol` - Remove from watchlist

### Leaderboard
- GET `/api/leaderboard` - Global rankings

## 🎮 Using the Platform

1. **Register Account**
   - Sign up with email/username/password
   - Receive $100,000 virtual starting capital

2. **Search Stocks**
   - Use search bar to find any stock
   - View real-time quotes and charts

3. **Execute Trades**
   - Click "Trade" button on any stock
   - Choose buy/sell and quantity
   - Confirm transaction

4. **Track Portfolio**
   - View all holdings in Portfolio tab
   - See real-time gains/losses
   - Monitor performance charts

5. **Compete**
   - Check leaderboard rankings
   - Compete with other traders
   - Track your return %

## 🔧 Configuration

### API Rate Limits (Alpha Vantage Free Tier)
- 5 API requests per minute
- 500 requests per day

### To upgrade:
- Premium tier: 75 requests/minute
- Or use alternative APIs (Yahoo Finance via RapidAPI)

## 📊 Database Schema

### Users
- id, email, username, password (hashed)
- cash_balance, starting_balance
- created_at

### Holdings
- user_id, symbol, shares, avg_price
- purchase_date

### Transactions
- user_id, symbol, type (buy/sell)
- shares, price, total_amount, commission
- timestamp

### Watchlist
- user_id, symbol, added_date

## 🚀 Deployment

### Deploy to Heroku:
```bash
heroku create your-app-name
heroku config:set JWT_SECRET=your-secret
heroku config:set ALPHA_VANTAGE_KEY=your-key
git push heroku main
```

### Deploy to Railway:
```bash
railway init
railway add
railway up
```

### Deploy to Render:
1. Connect GitHub repo
2. Add environment variables
3. Deploy

## 🔒 Security Features

- Passwords hashed with bcrypt
- JWT token authentication
- SQL injection prevention
- CORS protection
- Input validation

## 📱 Mobile App

To convert to mobile app:
1. Use React Native with same backend
2. Or wrap in Capacitor/Cordova
3. Same API endpoints work

## 💡 Future Enhancements

- [ ] Options trading
- [ ] Real-time WebSocket updates
- [ ] Advanced charts (TradingView)
- [ ] News integration
- [ ] Social features
- [ ] Paper trading competitions
- [ ] Educational content
- [ ] Mobile push notifications

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT License - feel free to use for learning or commercial projects

## 🆘 Support

For issues or questions:
- Check API key is valid
- Verify database file permissions
- Check console for errors
- Ensure all dependencies installed

## 🎓 Learning Resources

- Stock market basics
- API documentation
- Trading strategies
- Portfolio management
- Risk management

---

Built with ❤️ using Node.js, Express, React, and Alpha Vantage API
