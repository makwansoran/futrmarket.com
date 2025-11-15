import localforage from 'localforage'

localforage.config({ name: 'futurbet', storeName: 'futurbet_store' })

const USERS_KEY = (email) => `users:${email.toLowerCase()}`
const SESS_KEY = 'session:user'
const WALLET_KEY = (email) => `wallet:${email.toLowerCase()}`
const CASH_KEY = (email) => `cash:${email.toLowerCase()}`
const PORTF_KEY = (email) => `portfolio:${email.toLowerCase()}`

// ----- Email code flow (your API at :8787) -----
export async function sendCode(email) {
  const emailTrimmed = String(email || '').trim().toLowerCase();
  if (!emailTrimmed) {
    throw new Error('Email is required');
  }
  
  const requestBody = { email: emailTrimmed };
  console.log('🔵 CLIENT: Sending code request for email:', emailTrimmed);
  console.log('🔵 CLIENT: Request URL: /api/send-code');
  console.log('🔵 CLIENT: Request body:', requestBody);
  
  try {
    // Add cache-busting and ensure no caching
    const r = await fetch('/api/send-code?_=' + Date.now(), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store'
    });
    
    console.log('🔵 CLIENT: Response status:', r.status);
    console.log('🔵 CLIENT: Response URL:', r.url);
    
    // Handle non-OK responses
    if (!r.ok) {
      const errorText = await r.text().catch(() => '');
      let errorMessage = `Server error (${r.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        if (r.status === 404) {
          errorMessage = 'Backend server not available. Please check if the server is running.';
        } else if (r.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      }
      throw new Error(errorMessage);
    }
    
    const j = await r.json().catch((e) => {
      console.error('🔵 CLIENT: Failed to parse response:', e);
      throw new Error('Failed to parse server response');
    });
    
    console.log('🔵 CLIENT: Send code response:', j, 'Status:', r.status);
    
    if (!j.ok) {
      const errorMsg = typeof j.error === 'string' ? j.error : 'Failed to send email';
      throw new Error(errorMsg);
    }
    return true;
  } catch (e) {
    // Ensure we always throw an Error with a string message
    if (e instanceof Error) {
      throw e;
    }
    throw new Error(typeof e === 'string' ? e : 'Failed to send verification code. Please check your connection.');
  }
}

export async function verifyCode(email, code) {
  try {
    const r = await fetch('/api/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    
    // Handle non-OK responses
    if (!r.ok) {
      const errorText = await r.text().catch(() => '');
      let errorMessage = `Server error (${r.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        if (r.status === 404) {
          errorMessage = 'Backend server not available. Please check if the server is running.';
        } else if (r.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      }
      throw new Error(errorMessage);
    }
    
    const j = await r.json().catch(() => ({}));
    if (!j.ok) {
      const errorMsg = typeof j.error === 'string' ? j.error : 'Invalid code';
      throw new Error(errorMsg);
    }
    return true;
  } catch (e) {
    // Ensure we always throw an Error with a string message
    if (e instanceof Error) {
      throw e;
    }
    throw new Error(typeof e === 'string' ? e : 'Failed to verify code. Please check your connection.');
  }
}

// ----- Users & session -----
export async function saveUser(email) {
  await localforage.setItem(USERS_KEY(email), { email, createdAt: Date.now() })
}
export async function saveSession(email) {
  await localforage.setItem(SESS_KEY, { email, ts: Date.now() })
}
export async function loadSession() {
  return (await localforage.getItem(SESS_KEY)) || null
}
export async function clearSession() {
  await localforage.removeItem(SESS_KEY)
}

// ----- Wallet link (local only) -----
export async function getLinkedWallet(email) {
  return (await localforage.getItem(WALLET_KEY(email))) || null
}
export async function setLinkedWallet(email, wallet) {
  await localforage.setItem(WALLET_KEY(email), wallet)
}
export async function unlinkWallet(email) {
  await localforage.removeItem(WALLET_KEY(email))
}

// ----- Balances (local only) -----
export async function ensureBalances(email) {
  const [cash, portf] = await Promise.all([
    localforage.getItem(CASH_KEY(email)),
    localforage.getItem(PORTF_KEY(email)),
  ])
  if (cash == null) await localforage.setItem(CASH_KEY(email), 10000)
  if (portf == null) await localforage.setItem(PORTF_KEY(email), 0)
  return true
}
export async function getBalances(email) {
  const [cash, portf] = await Promise.all([
    localforage.getItem(CASH_KEY(email)),
    localforage.getItem(PORTF_KEY(email)),
  ])
  return { cash: Number(cash || 0), portfolio: Number(portf || 0) }
}
export async function setBalances(email, { cash, portfolio }) {
  if (cash != null) await localforage.setItem(CASH_KEY(email), Number(cash))
  if (portfolio != null) await localforage.setItem(PORTF_KEY(email), Number(portfolio))
}
