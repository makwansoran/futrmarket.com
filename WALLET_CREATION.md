# Automatic Wallet Creation for Users

This system automatically creates a wallet for every user when they sign up on the platform.

## How It Works

When a new user signs up (via email/password or wallet connection), the system:

1. **Generates a new wallet** using `ethers.js` - creates a fully functional Ethereum/Polygon wallet
2. **Stores the wallet address** in the database as the user's primary wallet
3. **Links the wallet to the user** in the wallet-first database schema

## Implementation

### Files Modified

- `lib/thirdweb-wallet.cjs` - Utility functions for wallet creation
- `lib/db.cjs` - Updated `createUser()` to create real wallets instead of placeholders

### Wallet Creation Flow

```
User Signs Up
    ↓
createUser() called
    ↓
createWalletForUser() generates wallet using ethers.js
    ↓
Wallet address stored in database
    ↓
User can use wallet for transactions
```

## Configuration

### Required Environment Variables

Currently, wallet creation works without any additional configuration. Wallets are generated using `ethers.js`.

### Optional: thirdweb Integration

If you want to integrate with thirdweb's In-App Wallet system (for email-based wallet access), you can set:

```env
THIRDWEB_SECRET_KEY=your_secret_key_here
THIRDWEB_CLIENT_ID=your_client_id_here
```

**To get your thirdweb Secret Key:**
1. Go to [thirdweb Dashboard](https://portal.thirdweb.com)
2. Navigate to your project settings
3. Copy your **Secret Key** (not the Client ID)

**Note:** The Secret Key should be kept secure and never exposed in client-side code.

## Wallet Security

### Current Implementation

- Wallets are generated server-side using `ethers.js`
- Wallet addresses are stored in the database
- Private keys are **NOT** stored (for security)

### Future Enhancements

You can enhance wallet security by:

1. **Encrypted Private Key Storage** (if you need server-side access):
   - Encrypt private keys before storing in database
   - Only decrypt when needed for transactions
   - Use strong encryption (AES-256)

2. **thirdweb In-App Wallets** (for user-controlled wallets):
   - Users authenticate via email to access their wallet
   - Private keys managed by thirdweb (non-custodial)
   - Better UX for non-crypto-native users

3. **Hardware Wallet Integration**:
   - Allow users to connect their own hardware wallets
   - Support for Ledger, Trezor, etc.

## Testing

To test wallet creation:

1. Sign up a new user via the signup page
2. Check the server logs for wallet creation messages
3. Verify the wallet address is stored in the database
4. The wallet should be ready for transactions on Polygon

## Troubleshooting

### Wallet Not Created

- Check server logs for error messages
- Verify `ethers` package is installed: `npm install ethers`
- Ensure database connection is working

### thirdweb Integration Issues

- Verify `THIRDWEB_SECRET_KEY` is set correctly
- Check thirdweb dashboard for API status
- Review thirdweb API documentation for latest endpoints

## Next Steps

1. **Fund Initial Wallets**: Consider airdropping small amounts of MATIC to new wallets for gas fees
2. **Wallet Recovery**: Implement wallet recovery mechanisms (seed phrases, email recovery, etc.)
3. **Multi-Wallet Support**: Allow users to link multiple wallets to one account
4. **Wallet Export**: Allow users to export their wallet to MetaMask or other wallets

## API Reference

### `createWalletForUser(email)`

Creates a new wallet for a user.

**Parameters:**
- `email` (string): User's email address

**Returns:**
- `{ walletAddress: string }` - The generated wallet address

**Example:**
```javascript
const { createWalletForUser } = require("./lib/thirdweb-wallet.cjs");
const { walletAddress } = await createWalletForUser("[email protected]");
console.log("Wallet created:", walletAddress);
```

### `generateDeterministicWallet(email)`

Generates a deterministic wallet address from email (fallback method).

**Parameters:**
- `email` (string): User's email address

**Returns:**
- `{ walletAddress: string }` - Deterministic wallet address

**Note:** This method always generates the same wallet for the same email. Used as a fallback if random generation fails.

