# Complete Setup Guide - Virtual Stock Exchange

## Quick Start (5 minutes)

### Step 1: Install Node.js
Download and install Node.js from https://nodejs.org (choose LTS version)

### Step 2: Extract Files
Extract all project files to a folder, e.g., `VSE-Platform`

### Step 3: Install Dependencies
Open terminal/command prompt in project folder:
```bash
cd VSE-Platform
npm install
```

### Step 4: Get Free API Key
1. Go to https://www.alphavantage.co/support/#api-key
2. Enter your email
3. Get instant free API key (no credit card needed)
4. Copy your API key

### Step 5: Configure Environment
Create file named `.env` in project root:
```
PORT=3001
JWT_SECRET=my-super-secret-key-12345
ALPHA_VANTAGE_KEY=YOUR_API_KEY_HERE
```
Replace `YOUR_API_KEY_HERE` with your actual API key

### Step 6: Start the Server
```bash
npm start
```

### Step 7: Open Browser
Go to: http://localhost:3001

## First Time Usage

### Create Account
1. Click "Sign Up"
2. Enter email, username, password
3. Click "Register"
4. You'll get $100,000 virtual cash!

### Start Trading
1. Search for stocks (try "AAPL" or "TESLA")
2. Click on a stock to see details
3. Click "Buy" or "Sell"
4. Enter number of shares
5. Confirm trade

### Track Portfolio
1. Go to "Portfolio" tab
2. See all your holdings
3. View real-time gains/losses
4. Check performance chart

## API Key Limits

### Free Tier (Alpha Vantage)
- 5 API calls per minute
- 500 API calls per day
- Perfect for learning!

### If you need more:
- Upgrade to premium ($50/month for unlimited)
- Or use demo mode (included)

## Troubleshooting

### "Failed to fetch" error
- Check internet connection
- Verify API key is correct
- Wait 1 minute if rate limit hit

### "npm install" fails
- Update Node.js to latest version
- Run: `npm cache clean --force`
- Try again

### Port 3001 already in use
Change PORT in .env file:
```
PORT=3002
```

### Can't login
- Clear browser cookies
- Check database file exists
- Restart server

## File Structure

```
VSE-Platform/
├── server.js          # Backend API server
├── package.json       # Dependencies
├── .env              # Your configuration
├── vse_database.db   # SQLite database (auto-created)
├── public/
│   └── index.html    # Frontend app
├── README.md         # Documentation
└── SETUP_GUIDE.md    # This file
```

## Testing the Platform

### Test Account
- Username: `demo`
- Password: `demo123`
- Starting balance: $100,000

### Test Stocks
Try searching for:
- AAPL (Apple)
- GOOGL (Google)
- MSFT (Microsoft)
- TSLA (Tesla)
- AMZN (Amazon)

## Advanced Setup

### Using PostgreSQL (Production)
```bash
npm install pg
```
Update server.js to use PostgreSQL instead of SQLite

### Using Real-time Data
Upgrade to premium Alpha Vantage or use:
- Yahoo Finance API (RapidAPI)
- IEX Cloud
- Polygon.io

### Adding WebSockets
```bash
npm install socket.io
```
Add real-time price updates to all clients

## Deployment

### Deploy to Railway (Free)
1. Create account at railway.app
2. Connect GitHub repo
3. Add environment variables
4. Deploy!

### Deploy to Heroku
```bash
heroku create vse-platform
heroku config:set JWT_SECRET=your-secret
heroku config:set ALPHA_VANTAGE_KEY=your-key
git push heroku main
```

### Deploy to Vercel
```bash
vercel
```
Add environment variables in dashboard

## Security Checklist

- [ ] Change JWT_SECRET to random string
- [ ] Use HTTPS in production
- [ ] Enable rate limiting
- [ ] Add input validation
- [ ] Use environment variables
- [ ] Regular backups of database
- [ ] Monitor API usage

## Next Steps

1. Customize starting balance
2. Add more features
3. Invite friends to compete
4. Create trading competitions
5. Add educational content
6. Build mobile app
7. Add social features

## Support

Need help?
- Check README.md
- Review code comments
- Test with demo API key
- Check browser console for errors

## Success Checklist

✅ Node.js installed
✅ Dependencies installed
✅ .env file created
✅ API key added
✅ Server starts successfully
✅ Can access http://localhost:3001
✅ Can register account
✅ Can search stocks
✅ Can execute trades
✅ Portfolio updates correctly

If all checked, you're ready to trade! 🚀
