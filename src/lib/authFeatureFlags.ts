export function isNativePasskeyLoginEnabled(): boolean {
  const value = String((import.meta as any).env?.VITE_NATIVE_PASSKEY_LOGIN_ENABLED || '')
    .trim()
    .toLowerCase();

  return value === 'true';
}
