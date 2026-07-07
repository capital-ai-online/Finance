// Web Crypto AES-GCM encryption/decryption helper
// Enforces zero-breach data integrity and seals local states under Version 0.6.0-Beta requirements.

const AES_KEY_PBKDF2_SALT = 'capital-ai-salt-2026';

async function deriveKey(passcode: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(AES_KEY_PBKDF2_SALT),
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(plainText: string, passcode: string): Promise<string> {
  try {
    const key = await deriveKey(passcode);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encoder.encode(plainText)
    );
    
    // Combine IV and CipherText
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64
    return btoa(Array.from(combined, byte => String.fromCharCode(byte)).join(''));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
}

export async function decryptData(cipherBase64: string, passcode: string): Promise<string> {
  try {
    const key = await deriveKey(passcode);
    const binaryStr = atob(cipherBase64);
    const combined = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      combined[i] = binaryStr.charCodeAt(i);
    }
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
}

export const secureStorage = {
  async setItem(key: string, value: string, passcode: string): Promise<void> {
    const encrypted = await encryptData(value, passcode);
    localStorage.setItem(key, encrypted);
  },
  
  async getItem(key: string, passcode: string): Promise<string | null> {
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      return await decryptData(item, passcode);
    } catch {
      return null;
    }
  },
  
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }
};
