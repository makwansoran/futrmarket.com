import localforage from "localforage";
import { Wallet } from "ethers";
import { getSessionId } from "./lib/sessionId.js";

// Use session-specific storage for complete isolation
const sessionId = getSessionId();
localforage.config({ 
  name: `futurbet_${sessionId}`, 
  storeName: `futurbet_store_${sessionId}` 
});

const CUSTODY_KEY = (email) => `custody:${email.toLowerCase()}`;

export async function getCustodyWallet(email) {
  if (!email) return null;
  return await localforage.getItem(CUSTODY_KEY(email));
}

export async function ensureCustodyWallet(email) {
  if (!email) throw new Error("email required");
  let w = await getCustodyWallet(email);
  if (w?.address && w?.privateKey) return w;

  const wallet = Wallet.createRandom();
  const payload = { address: wallet.address, privateKey: wallet.privateKey };
  await localforage.setItem(CUSTODY_KEY(email), payload);
  return payload;
}
