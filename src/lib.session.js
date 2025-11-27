import localforage from 'localforage'
import { getApiUrl } from '/src/api.js'
import { getSessionId } from './lib/sessionId.js'
import { generateAuthMessage } from './lib/walletAuth.js'

// Use session-specific storage to ensure complete isolation per browser instance
const sessionId = getSessionId();
localforage.config({ 
  name: `futurbet_${sessionId}`, 
  storeName: `futurbet_store_${sessionId}` 
})

const USERS_KEY = (identifier) => `users:${identifier.toLowerCase()}`
const SESS_KEY = 'session:user'
const WALLET_KEY = (identifier) => `wallet:${identifier.toLowerCase()}`
const CASH_KEY = (identifier) => `cash:${identifier.toLowerCase()}`
const PORTF_KEY = (identifier) => `portfolio:${identifier.toLowerCase()}`

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
// Now supports both wallet_address (primary) and email (backward compatibility)
export async function saveUser(identifier) {
  await localforage.setItem(USERS_KEY(identifier), { identifier, createdAt: Date.now() })
}
export async function saveSession(identifier) {
  // Store wallet_address or email as identifier
  await localforage.setItem(SESS_KEY, { 
    identifier, // wallet_address or email
    wallet_address: identifier.startsWith('0x') ? identifier : null,
    email: identifier.includes('@') ? identifier : null,
    ts: Date.now() 
  })
}
export async function loadSession() {
  const session = await localforage.getItem(SESS_KEY);
  if (!session) return null;
  // Backward compatibility: if old format (email only), convert it
  if (session.email && !session.identifier) {
    return { identifier: session.email, email: session.email, ts: session.ts };
  }
  return session;
}
export async function clearSession() {
  await localforage.removeItem(SESS_KEY)
}

// ----- Wallet authentication -----
/**
 * Authenticate user with wallet address and signature
 * Checks if wallet is linked to existing account, or creates new account
 * @param {string} walletAddress - The wallet address (0x...)
 * @param {Object} account - The thirdweb account object for signing messages
 * @returns {Promise<string>} - The user identifier (wallet_address)
 */
export async function authenticateWithWallet(walletAddress, account = null) {
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
    const message = generateAuthMessage(addressLower);
    let signature = null;
    
    // Request signature from wallet if account is available
    if (account && typeof account.signMessage === 'function') {
      try {
        console.log('Requesting signature from wallet...');
        signature = await account.signMessage({ message });
        console.log('Signature received:', signature ? 'Yes' : 'No');
      } catch (signError) {
        console.error('Signature error:', signError);
        // If user rejects signature, throw a user-friendly error
        if (signError?.message?.includes('reject') || signError?.message?.includes('denied')) {
          throw new Error('Signature request was cancelled. Please try again and sign the message.');
        }
        throw new Error('Failed to sign message. Please try again.');
      }
    } else {
      console.warn('⚠️  No account provided for signature. Authentication will proceed without signature verification.');
    }
    
    if (checkData.linked && checkData.wallet_address) {
      // Wallet is linked to existing account - login with that account
      // Still verify signature for security
      if (signature) {
        const verifyRes = await fetch(getApiUrl('/api/wallet/authenticate'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            walletAddress: addressLower,
            signature: signature,
            message: message
          })
        });
        
        if (!verifyRes.ok) {
          const errorText = await verifyRes.text().catch(() => '');
          let errorMessage = 'Failed to verify signature';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
          } catch {}
          throw new Error(errorMessage);
        }
      }
      
      // Use wallet_address as the identifier
      await saveUser(checkData.wallet_address);
      await saveSession(checkData.wallet_address);
      return checkData.wallet_address;
    }
    
    // Wallet is not linked - authenticate to create new account
    const authRes = await fetch(getApiUrl('/api/wallet/authenticate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        walletAddress: addressLower,
        signature: signature,
        message: message
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
    
    if (!authData.ok || !authData.wallet_address) {
      throw new Error(authData.error || 'Failed to authenticate wallet');
    }
    
    // Save session with wallet_address as identifier
    await saveUser(authData.wallet_address);
    await saveSession(authData.wallet_address);
    return authData.wallet_address;
  } catch (e) {
    console.error('Wallet authentication error:', e);
    throw e;
  }
}

// ----- Wallet link (local only) -----
export async function getLinkedWallet(identifier) {
  return (await localforage.getItem(WALLET_KEY(identifier))) || null
}
export async function setLinkedWallet(identifier, wallet) {
  await localforage.setItem(WALLET_KEY(identifier), wallet)
}
export async function unlinkWallet(identifier) {
  await localforage.removeItem(WALLET_KEY(identifier))
}

// ----- Balances (local only) -----
export async function ensureBalances(identifier) {
  const [cash, portf] = await Promise.all([
    localforage.getItem(CASH_KEY(identifier)),
    localforage.getItem(PORTF_KEY(identifier)),
  ])
  if (cash == null) await localforage.setItem(CASH_KEY(identifier), 10000)
  if (portf == null) await localforage.setItem(PORTF_KEY(identifier), 0)
  return true
}
export async function getBalances(identifier) {
  const [cash, portf] = await Promise.all([
    localforage.getItem(CASH_KEY(identifier)),
    localforage.getItem(PORTF_KEY(identifier)),
  ])
  return { cash: Number(cash || 0), portfolio: Number(portf || 0) }
}
export async function setBalances(identifier, { cash, portfolio }) {
  if (cash != null) await localforage.setItem(CASH_KEY(identifier), Number(cash))
  if (portfolio != null) await localforage.setItem(PORTF_KEY(identifier), Number(portfolio))
}
