# Wallet Connection Setup Guide

## Overview
FutrMarket now supports wallet-based login using thirdweb. Users can connect with:
- **MetaMask** 🦊
- **Coinbase Wallet** 🔷
- **Phantom** 👻
- **WalletConnect** 📱 (for mobile wallets)
- **Email/Social Login** ✉️ (via thirdweb's in-app wallet)

## Setup Instructions

### 1. Get Your Thirdweb Client ID

1. Go to [thirdweb.com](https://thirdweb.com) and sign up/login
2. Navigate to your dashboard
3. Create a new project or select an existing one
4. Copy your **Client ID** from the project settings

### 2. Set Environment Variables

Create a `.env` file in the root of your project (or add to your existing `.env`):

```env
VITE_THIRDWEB_CLIENT_ID=5b975454d4c6084108bf7343978c93be
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here  # Optional, only if using WalletConnect
```

**✅ Your Client ID is already configured!**

**For Vercel/Production:**
- Go to your Vercel project → Settings → Environment Variables
- Add `VITE_THIRDWEB_CLIENT_ID` with your client ID value
- Redeploy your application

### 3. Get WalletConnect Project ID (Optional)

If you want to use WalletConnect for mobile wallet connections:

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Sign up/login
3. Create a new project
4. Copy your **Project ID**
5. Add it to your `.env` as `VITE_WALLETCONNECT_PROJECT_ID`

## How It Works

### User Flow

1. **Login/Signup Page:**
   - Users see a "Connect Wallet" button at the top
   - They can choose from available wallet options
   - Once connected, their wallet address is linked to their account

2. **Non-Custodial:**
   - Users' funds stay in their wallets
   - FutrMarket never has access to private keys
   - All transactions are signed by the user's wallet

3. **Polygon Network:**
   - The app connects to Polygon (PoS) by default
   - Users need MATIC for gas fees
   - Smart contracts will be deployed on Polygon

## Features

- ✅ Multiple wallet support (MetaMask, Coinbase, Phantom, etc.)
- ✅ Non-custodial (users control their funds)
- ✅ Automatic wallet detection
- ✅ Connection persistence (remembers connected wallet)
- ✅ Error handling and user feedback
- ✅ Responsive UI matching your app's theme

## Next Steps

1. **Deploy Smart Contracts:**
   - Deploy your prediction market contracts to Polygon
   - Update contract addresses in your app

2. **Link Wallet to User Accounts:**
   - You may want to link wallet addresses to email accounts
   - Store wallet addresses in your user database
   - Allow users to connect multiple wallets to one account

3. **Test Wallet Connections:**
   - Test with MetaMask (most common)
   - Test with Coinbase Wallet
   - Test on mobile devices (WalletConnect)

## Troubleshooting

**"Failed to connect wallet" error:**
- Make sure `VITE_THIRDWEB_CLIENT_ID` is set correctly
- Check browser console for detailed error messages
- Ensure the wallet extension is installed and unlocked

**Wallet not detected:**
- Make sure the wallet extension is installed
- Refresh the page after installing a wallet extension
- Try a different wallet option

**Network issues:**
- The app connects to Polygon by default
- Users need to switch their wallet to Polygon network
- You can add network switching UI if needed

## Support

For thirdweb-specific issues:
- [thirdweb Documentation](https://portal.thirdweb.com)
- [thirdweb Discord](https://discord.gg/thirdweb)

