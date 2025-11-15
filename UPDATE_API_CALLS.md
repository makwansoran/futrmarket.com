# API URL Update Instructions

I've updated the core files for login. To complete the setup:

## 1. Set Environment Variable in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

**Name:** `VITE_API_URL`  
**Value:** `https://futrmarket-api.onrender.com`

Then redeploy your Vercel app.

## 2. Files Already Updated:
- ✅ `src/lib/api.js` - API utility created
- ✅ `src/lib.session.js` - Login/signup API calls
- ✅ `src/marketsStore.js` - Markets API
- ✅ `src/App.jsx` - Balance sync
- ✅ `src/components/DepositButton.jsx` - Deposit API calls

## 3. Files Still Need Updating:
- `src/components/CashButton.jsx`
- `src/components/WithdrawButton.jsx`
- `src/pages.MarketDetail.jsx`
- `src/pages.Forum.jsx`
- `src/pages.Leaderboard.jsx`
- `src/pages.News.jsx`
- `src/pages.Account.jsx`
- `src/components/CompetitionsNav.jsx`

## Quick Fix:
Add this import at the top of each file:
```javascript
import { getApiUrl } from './lib/api.js';
```

Then replace all `/api/...` in fetch calls with `getApiUrl('/api/...')`

