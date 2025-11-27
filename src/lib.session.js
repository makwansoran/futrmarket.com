import localforage from 'localforage'
import { getApiUrl } from '/src/api.js'
import { getSessionId } from './lib/sessionId.js'

// Use session-specific storage to ensure complete isolation per browser instance
const sessionId = getSessionId();
localforage.config({ 
  name: `futurbet_${sessionId}`, 
  storeName: `futurbet_store_${sessionId}` 
})

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
  const apiUrl = getApiUrl('/api/send-code');
  const fullUrl = apiUrl + '?_=' + Date.now();
  
  console.log('🔵 CLIENT: Sending code request for email:', emailTrimmed);
  console.log('🔵 CLIENT: Request URL:', fullUrl);
  console.log('🔵 CLIENT: API Base URL:', import.meta.env.VITE_API_URL || '(NOT SET - using relative path)');
  console.log('🔵 CLIENT: Request body:', requestBody);
  
  // Warn if using relative path in production
  if (!import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
    console.error('❌ CRITICAL: Using relative path in production! This will fail.');
    console.error('   The request will try to go to:', window.location.origin + fullUrl);
    console.error('   But your backend is on Render, not Vercel!');
  }
  
  const controller = new AbortController();
  let timeoutId = null;
  
  try {
    // Add cache-busting and ensure no caching
    timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const r = await fetch(fullUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store',
      signal: controller.signal
    });
    
    if (timeoutId) clearTimeout(timeoutId);
    
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
          errorMessage = 'Backend server not available. Please check if the server is running and VITE_API_URL is set correctly.';
        } else if (r.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (r.status === 0) {
          errorMessage = 'Network error. Check if the backend URL is correct and CORS is configured.';
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
    if (timeoutId) clearTimeout(timeoutId);
    
    // Handle network errors
    if (e instanceof TypeError && e.message.includes('fetch')) {
      console.error('🔵 CLIENT: Network error:', e);
      if (!import.meta.env.VITE_API_URL) {
        throw new Error('VITE_API_URL is not set! Go to Vercel → Settings → Environment Variables → Add VITE_API_URL with your Render backend URL (e.g., https://futrmarket-api.onrender.com)');
      }
      throw new Error('Network error: Unable to reach the server. Please check your internet connection and ensure VITE_API_URL is set correctly in Vercel.');
    }
    
    if (e.name === 'AbortError') {
      console.error('🔵 CLIENT: Request timeout');
      throw new Error('Request timed out. The server may be slow or unavailable.');
    }
    
    // Check if we got a 404 and VITE_API_URL is not set
    if (e.message && e.message.includes('404') && !import.meta.env.VITE_API_URL) {
      throw new Error('404 Error: VITE_API_URL is not set in Vercel! The request is going to the wrong URL. Set VITE_API_URL to your Render backend URL in Vercel environment variables.');
    }
    
    // Ensure we always throw an Error with a string message
    if (e instanceof Error) {
      throw e;
    }
    throw new Error(typeof e === 'string' ? e : 'Failed to send verification code. Please check your connection.');
  }
}

export async function checkEmail(email) {
  try {
    const r = await fetch(getApiUrl('/api/check-email'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
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
      const errorMsg = typeof j.error === 'string' ? j.error : 'Invalid email';
      throw new Error(errorMsg);
    }
    return true;
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error(typeof e === 'string' ? e : 'Failed to check email. Please check your connection.');
  }
}

export async function checkPassword(email, password) {
  try {
    const r = await fetch(getApiUrl('/api/check-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
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
      const errorMsg = typeof j.error === 'string' ? j.error : 'Invalid password';
      throw new Error(errorMsg);
    }
    return true;
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error(typeof e === 'string' ? e : 'Failed to check password. Please check your connection.');
  }
}

export async function resetPassword(email, code, newPassword, confirmPassword) {
  try {
    const r = await fetch(getApiUrl('/api/reset-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword, confirmPassword })
    });
    
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
      const errorMsg = typeof j.error === 'string' ? j.error : 'Failed to reset password';
      throw new Error(errorMsg);
    }
    return true;
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error(typeof e === 'string' ? e : 'Failed to reset password. Please check your connection.');
  }
}

export async function checkEmailExists(email) {
  try {
    const r = await fetch(getApiUrl('/api/check-email-exists'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
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
      const errorMsg = typeof j.error === 'string' ? j.error : 'Failed to check email';
      throw new Error(errorMsg);
    }
    return j;
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error(typeof e === 'string' ? e : 'Failed to check email. Please check your connection.');
  }
}

export async function checkUsername(username) {
  try {
    const r = await fetch(getApiUrl('/api/check-username'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    
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
      const errorMsg = typeof j.error === 'string' ? j.error : 'Username validation failed';
      throw new Error(errorMsg);
    }
    return j;
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error(typeof e === 'string' ? e : 'Failed to check username. Please check your connection.');
  }
}

export async function verifyCode(email, code, password, confirmPassword, username) {
  try {
    const body = { email, code };
    if (password) {
      body.password = password;
    }
    if (confirmPassword) {
      body.confirmPassword = confirmPassword;
    }
    if (username) {
      body.username = username;
    }
    
    const r = await fetch(getApiUrl('/api/verify-code'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
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

// ----- Wallet authentication -----
/**
 * Authenticate user with wallet address and signature
 * Checks if wallet is linked to existing account, or creates new account
 * @param {string} walletAddress - The wallet address (0x...)
 * @param {Function} signMessageFn - Function to sign authentication message
 * @returns {Promise<string>} - The user identifier (email)
 */
export async function authenticateWithWallet(walletAddress, signMessageFn) {
  if (!walletAddress || typeof walletAddress !== 'string') {
    throw new Error('Wallet address is required');
  }
  
  const addressLower = walletAddress.trim().toLowerCase();
  
  try {
    // First, check if wallet is linked to an existing user
    const checkRes = await fetch(getApiUrl('/api/wallet/check'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: addressLower })
    });
    
    if (!checkRes.ok) {
      throw new Error('Failed to check wallet account');
    }
    
    const checkData = await checkRes.json().catch(() => ({}));
    
    // Generate authentication message
    const timestamp = Date.now();
    const message = `Welcome to FutrMarket!\n\nSign this message to authenticate with your wallet.\n\nWallet: ${addressLower}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any fees.`;
    
    // Request signature from wallet
    let signature = null;
    if (signMessageFn && typeof signMessageFn === 'function') {
      try {
        signature = await signMessageFn(message);
      } catch (e) {
        if (e?.message && (e.message.includes("cancelled") || e.message.includes("rejected"))) {
          throw new Error("Signature request cancelled. Please sign the message to continue.");
        }
        throw new Error("Failed to sign message. Please try again.");
      }
    }
    
    if (checkData.linked && checkData.email) {
      // Wallet is linked to existing account - login with that account
      // Still require signature for security
      if (!signature) {
        throw new Error("Signature is required for authentication");
      }
      
      await saveUser(checkData.email);
      await saveSession(checkData.email);
      return checkData.email;
    }
    
    // Wallet is not linked - authenticate to create new account or link
    const authRes = await fetch(getApiUrl('/api/wallet/authenticate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        walletAddress: addressLower,
        signature: signature,
        message: message,
        timestamp: timestamp
      })
    });
    
    if (!authRes.ok) {
      const errorText = await authRes.text().catch(() => '');
      let errorMessage = 'Failed to authenticate wallet';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }
    
    const authData = await authRes.json().catch(() => ({}));
    
    if (!authData.ok || !authData.email) {
      throw new Error(authData.error || 'Failed to authenticate wallet');
    }
    
    // Save session
    await saveUser(authData.email);
    await saveSession(authData.email);
    return authData.email;
  } catch (e) {
    console.error('Wallet authentication error:', e);
    throw e;
  }
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
