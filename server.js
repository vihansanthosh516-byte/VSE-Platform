// Virtual Stock Exchange - Backend Server
// Real API Integration + User Authentication + Database

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database Setup
const db = new sqlite3.Database('./vse_database.db', (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('✅ Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        starting_balance REAL DEFAULT 100000.00,
        cash_balance REAL DEFAULT 100000.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Portfolio holdings
    db.run(`CREATE TABLE IF NOT EXISTS holdings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        shares INTEGER NOT NULL,
        avg_price REAL NOT NULL,
        purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, symbol)
    )`);

    // Transaction history
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        type TEXT NOT NULL,
        shares INTEGER NOT NULL,
        price REAL NOT NULL,
        total_amount REAL NOT NULL,
        commission REAL DEFAULT 4.95,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Watchlist
    db.run(`CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, symbol)
    )`);

    // Achievements
    db.run(`CREATE TABLE IF NOT EXISTS user_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        achievement_id TEXT NOT NULL,
        unlocked_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, achievement_id)
    )`);

    console.log('✅ Database tables initialized');
}

// API Configuration - Using Alpha Vantage (Free tier available)
// Sign up at: https://www.alphavantage.co/support/#api-key
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || 'demo';
const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';

// Alternative: Using Yahoo Finance via Rapid API
// const RAPID_API_KEY = process.env.RAPID_API_KEY;
// const YAHOO_FINANCE_URL = 'https://yahoo-finance15.p.rapidapi.com';

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// ============================================
// USER AUTHENTICATION ROUTES
// ============================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
            [email, username, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ error: 'Email or username already exists' });
                    }
                    return res.status(500).json({ error: 'Registration failed' });
                }

                const token = jwt.sign(
                    { id: this.lastID, username },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );

                res.json({
                    message: 'Registration successful',
                    token,
                    user: { id: this.lastID, username, email }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    });
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
    db.get(
        'SELECT id, username, email, cash_balance, starting_balance, created_at FROM users WHERE id = ?',
        [req.user.id],
        (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        }
    );
});

// ============================================
// REAL MARKET DATA API ROUTES
// ============================================

// Get real-time quote for a single stock
app.get('/api/market/quote/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        
        // Using Alpha Vantage Global Quote
        const response = await axios.get(ALPHA_VANTAGE_URL, {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: symbol.toUpperCase(),
                apikey: ALPHA_VANTAGE_KEY
            }
        });

        const quote = response.data['Global Quote'];
        
        if (!quote || !quote['05. price']) {
            return res.status(404).json({ error: 'Symbol not found' });
        }

        res.json({
            symbol: quote['01. symbol'],
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            volume: parseInt(quote['06. volume']),
            high: parseFloat(quote['03. high']),
            low: parseFloat(quote['04. low']),
            open: parseFloat(quote['02. open']),
            previousClose: parseFloat(quote['08. previous close']),
            timestamp: quote['07. latest trading day']
        });
    } catch (error) {
        console.error('Quote fetch error:', error.message);
        res.status(500).json({ error: 'Failed to fetch quote' });
    }
});

// Search for stocks
app.get('/api/market/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        
        const response = await axios.get(ALPHA_VANTAGE_URL, {
            params: {
                function: 'SYMBOL_SEARCH',
                keywords: query,
                apikey: ALPHA_VANTAGE_KEY
            }
        });

        const matches = response.data.bestMatches || [];
        const results = matches.map(match => ({
            symbol: match['1. symbol'],
            name: match['2. name'],
            type: match['3. type'],
            region: match['4. region'],
            currency: match['8. currency']
        }));

        res.json(results);
    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Get intraday data for charting
app.get('/api/market/chart/:symbol/:interval', async (req, res) => {
    try {
        const { symbol, interval } = req.params; // interval: 1min, 5min, 15min, 30min, 60min
        
        const response = await axios.get(ALPHA_VANTAGE_URL, {
            params: {
                function: 'TIME_SERIES_INTRADAY',
                symbol: symbol.toUpperCase(),
                interval: interval,
                apikey: ALPHA_VANTAGE_KEY
            }
        });

        const timeSeries = response.data[`Time Series (${interval})`];
        
        if (!timeSeries) {
            return res.status(404).json({ error: 'Chart data not available' });
        }

        const chartData = Object.entries(timeSeries).map(([time, data]) => ({
            timestamp: time,
            open: parseFloat(data['1. open']),
            high: parseFloat(data['2. high']),
            low: parseFloat(data['3. low']),
            close: parseFloat(data['4. close']),
            volume: parseInt(data['5. volume'])
        })).reverse();

        res.json(chartData);
    } catch (error) {
        console.error('Chart data error:', error.message);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});

// Get daily historical data
app.get('/api/market/history/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        
        const response = await axios.get(ALPHA_VANTAGE_URL, {
            params: {
                function: 'TIME_SERIES_DAILY',
                symbol: symbol.toUpperCase(),
                outputsize: 'compact', // last 100 days
                apikey: ALPHA_VANTAGE_KEY
            }
        });

        const timeSeries = response.data['Time Series (Daily)'];
        
        if (!timeSeries) {
            return res.status(404).json({ error: 'Historical data not available' });
        }

        const history = Object.entries(timeSeries).map(([date, data]) => ({
            date,
            open: parseFloat(data['1. open']),
            high: parseFloat(data['2. high']),
            low: parseFloat(data['3. low']),
            close: parseFloat(data['4. close']),
            volume: parseInt(data['5. volume'])
        })).reverse();

        res.json(history);
    } catch (error) {
        console.error('History error:', error.message);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Get market overview (top gainers, losers, most active)
app.get('/api/market/overview', async (req, res) => {
    try {
        // Popular stocks to track
        const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM'];
        const quotes = [];

        for (const symbol of symbols) {
            try {
                const response = await axios.get(ALPHA_VANTAGE_URL, {
                    params: {
                        function: 'GLOBAL_QUOTE',
                        symbol,
                        apikey: ALPHA_VANTAGE_KEY
                    }
                });

                const quote = response.data['Global Quote'];
                if (quote && quote['05. price']) {
                    quotes.push({
                        symbol: quote['01. symbol'],
                        name: symbol, // Would need company names API
                        price: parseFloat(quote['05. price']),
                        change: parseFloat(quote['09. change']),
                        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                        volume: parseInt(quote['06. volume'])
                    });
                }
            } catch (err) {
                console.error(`Error fetching ${symbol}:`, err.message);
            }
        }

        // Sort by change percent
        const gainers = [...quotes].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
        const losers = [...quotes].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
        const mostActive = [...quotes].sort((a, b) => b.volume - a.volume).slice(0, 5);

        res.json({ gainers, losers, mostActive });
    } catch (error) {
        console.error('Overview error:', error.message);
        res.status(500).json({ error: 'Failed to fetch market overview' });
    }
});

// ============================================
// PORTFOLIO & TRADING ROUTES
// ============================================

// Get user's portfolio
app.get('/api/portfolio', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM holdings WHERE user_id = ?',
        [req.user.id],
        (err, holdings) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch portfolio' });
            }
            res.json(holdings);
        }
    );
});

// Get portfolio summary with real-time values
app.get('/api/portfolio/summary', authenticateToken, async (req, res) => {
    try {
        // Get user's cash balance
        const user = await new Promise((resolve, reject) => {
            db.get(
                'SELECT cash_balance, starting_balance FROM users WHERE id = ?',
                [req.user.id],
                (err, row) => err ? reject(err) : resolve(row)
            );
        });

        // Get holdings
        const holdings = await new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM holdings WHERE user_id = ?',
                [req.user.id],
                (err, rows) => err ? reject(err) : resolve(rows)
            );
        });

        let totalInvested = 0;
        let currentValue = 0;

        // Calculate current values (would fetch real prices in production)
        for (const holding of holdings) {
            const invested = holding.shares * holding.avg_price;
            totalInvested += invested;
            
            // In production, fetch current price for each symbol
            // For now, simulate with avg_price
            currentValue += holding.shares * holding.avg_price;
        }

        const totalPortfolioValue = user.cash_balance + currentValue;
        const totalReturn = ((totalPortfolioValue - user.starting_balance) / user.starting_balance) * 100;

        res.json({
            cashBalance: user.cash_balance,
            invested: totalInvested,
            currentValue,
            totalPortfolioValue,
            totalReturn,
            startingBalance: user.starting_balance
        });
    } catch (error) {
        console.error('Portfolio summary error:', error);
        res.status(500).json({ error: 'Failed to calculate portfolio summary' });
    }
});

// Execute trade (buy/sell)
app.post('/api/trade', authenticateToken, async (req, res) => {
    try {
        const { symbol, shares, action, price } = req.body; // action: 'buy' or 'sell'
        
        if (!symbol || !shares || !action || !price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const commission = 4.95;
        const totalAmount = shares * price;
        const totalCost = action === 'buy' ? totalAmount + commission : totalAmount - commission;

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // Get current cash balance
            db.get(
                'SELECT cash_balance FROM users WHERE id = ?',
                [req.user.id],
                (err, user) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Transaction failed' });
                    }

                    if (action === 'buy') {
                        // Check if user has enough cash
                        if (user.cash_balance < totalCost) {
                            db.run('ROLLBACK');
                            return res.status(400).json({ error: 'Insufficient funds' });
                        }

                        // Deduct cash
                        db.run(
                            'UPDATE users SET cash_balance = cash_balance - ? WHERE id = ?',
                            [totalCost, req.user.id]
                        );

                        // Update or insert holding
                        db.get(
                            'SELECT * FROM holdings WHERE user_id = ? AND symbol = ?',
                            [req.user.id, symbol],
                            (err, holding) => {
                                if (holding) {
                                    // Update existing holding
                                    const newShares = holding.shares + shares;
                                    const newAvgPrice = ((holding.shares * holding.avg_price) + (shares * price)) / newShares;
                                    
                                    db.run(
                                        'UPDATE holdings SET shares = ?, avg_price = ? WHERE user_id = ? AND symbol = ?',
                                        [newShares, newAvgPrice, req.user.id, symbol]
                                    );
                                } else {
                                    // Insert new holding
                                    db.run(
                                        'INSERT INTO holdings (user_id, symbol, shares, avg_price) VALUES (?, ?, ?, ?)',
                                        [req.user.id, symbol, shares, price]
                                    );
                                }
                            }
                        );
                    } else if (action === 'sell') {
                        // Check if user has enough shares
                        db.get(
                            'SELECT * FROM holdings WHERE user_id = ? AND symbol = ?',
                            [req.user.id, symbol],
                            (err, holding) => {
                                if (!holding || holding.shares < shares) {
                                    db.run('ROLLBACK');
                                    return res.status(400).json({ error: 'Insufficient shares' });
                                }

                                // Add cash
                                db.run(
                                    'UPDATE users SET cash_balance = cash_balance + ? WHERE id = ?',
                                    [totalAmount - commission, req.user.id]
                                );

                                // Update or remove holding
                                if (holding.shares === shares) {
                                    db.run(
                                        'DELETE FROM holdings WHERE user_id = ? AND symbol = ?',
                                        [req.user.id, symbol]
                                    );
                                } else {
                                    db.run(
                                        'UPDATE holdings SET shares = shares - ? WHERE user_id = ? AND symbol = ?',
                                        [shares, req.user.id, symbol]
                                    );
                                }
                            }
                        );
                    }

                    // Record transaction
                    db.run(
                        'INSERT INTO transactions (user_id, symbol, type, shares, price, total_amount, commission) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [req.user.id, symbol, action, shares, price, totalAmount, commission],
                        function(err) {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: 'Transaction recording failed' });
                            }

                            db.run('COMMIT');
                            res.json({
                                message: `Successfully ${action === 'buy' ? 'bought' : 'sold'} ${shares} shares of ${symbol}`,
                                transactionId: this.lastID
                            });
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error('Trade error:', error);
        res.status(500).json({ error: 'Trade execution failed' });
    }
});

// Get transaction history
app.get('/api/transactions', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50',
        [req.user.id],
        (err, transactions) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch transactions' });
            }
            res.json(transactions);
        }
    );
});

// ============================================
// WATCHLIST ROUTES
// ============================================

app.get('/api/watchlist', authenticateToken, (req, res) => {
    db.all(
        'SELECT symbol, added_date FROM watchlist WHERE user_id = ?',
        [req.user.id],
        (err, watchlist) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch watchlist' });
            }
            res.json(watchlist);
        }
    );
});

app.post('/api/watchlist', authenticateToken, (req, res) => {
    const { symbol } = req.body;
    
    db.run(
        'INSERT INTO watchlist (user_id, symbol) VALUES (?, ?)',
        [req.user.id, symbol.toUpperCase()],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Symbol already in watchlist' });
                }
                return res.status(500).json({ error: 'Failed to add to watchlist' });
            }
            res.json({ message: 'Added to watchlist', id: this.lastID });
        }
    );
});

app.delete('/api/watchlist/:symbol', authenticateToken, (req, res) => {
    db.run(
        'DELETE FROM watchlist WHERE user_id = ? AND symbol = ?',
        [req.user.id, req.params.symbol.toUpperCase()],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to remove from watchlist' });
            }
            res.json({ message: 'Removed from watchlist' });
        }
    );
});

// ============================================
// LEADERBOARD ROUTES
// ============================================

app.get('/api/leaderboard', (req, res) => {
    // Calculate returns for all users
    db.all(
        `SELECT 
            u.id,
            u.username,
            u.starting_balance,
            u.cash_balance,
            COALESCE(SUM(h.shares * h.avg_price), 0) as invested_value,
            COUNT(t.id) as trade_count,
            u.created_at
         FROM users u
         LEFT JOIN holdings h ON u.id = h.user_id
         LEFT JOIN transactions t ON u.id = t.user_id
         GROUP BY u.id
         ORDER BY (u.cash_balance + COALESCE(SUM(h.shares * h.avg_price), 0)) DESC
         LIMIT 20`,
        (err, users) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch leaderboard' });
            }

            const leaderboard = users.map((user, index) => {
                const totalValue = user.cash_balance + user.invested_value;
                const returnPercent = ((totalValue - user.starting_balance) / user.starting_balance) * 100;
                
                return {
                    rank: index + 1,
                    username: user.username,
                    totalValue,
                    returnPercent: returnPercent.toFixed(2),
                    tradeCount: user.trade_count,
                    memberSince: user.created_at
                };
            });

            res.json(leaderboard);
        }
    );
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Virtual Stock Exchange Server                   ║
║                                                       ║
║   Status: Running ✅                                  ║
║   Port: ${PORT}                                          ║
║   Database: SQLite ✅                                 ║
║   API: Alpha Vantage                                  ║
║                                                       ║
║   Endpoints:                                          ║
║   • POST /api/auth/register                          ║
║   • POST /api/auth/login                             ║
║   • GET  /api/market/quote/:symbol                   ║
║   • GET  /api/market/search/:query                   ║
║   • GET  /api/portfolio                              ║
║   • POST /api/trade                                  ║
║   • GET  /api/leaderboard                            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
