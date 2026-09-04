import crypto from "node:crypto";
import QRCode from "qrcode";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Generate a cryptographically secure Base32 secret string (20 bytes / 32 base32 chars)
 */
export function generateTOTPSecret(length = 20): string {
  const buffer = crypto.randomBytes(length);
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decode Base32 string into a Buffer
 */
function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/, "").replace(/[\s-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Compute 6-digit TOTP code for a given secret at a specific counter step
 */
export function computeTOTP(secret: string, timeStepOffset = 0): string {
  const key = base32Decode(secret);
  const epochSeconds = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epochSeconds / 30) + timeStepOffset;

  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(timeStep), 0);

  const hmac = crypto.createHmac("sha1", key);
  hmac.update(counterBuf);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226)
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, "0");
  return otp;
}

/**
 * Verify a 6-digit TOTP code against a secret with window tolerance (default +-1 step = +-30s)
 */
export function verifyTOTP(code: string, secret: string, window = 1): boolean {
  if (!code || !secret) return false;
  const cleanCode = code.toString().trim();
  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) return false;

  for (let offset = -window; offset <= window; offset++) {
    const expected = computeTOTP(secret, offset);
    if (crypto.timingSafeEqual(Buffer.from(cleanCode), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}

/**
 * Generate standard otpauth URL for Google Authenticator
 */
export function getOTPAuthURL(account: string, issuer: string, secret: string): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(account);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate QR code as Data URL (image/png base64)
 */
export async function generateQRCodeDataURL(otpauthURL: string): Promise<string> {
  return QRCode.toDataURL(otpauthURL, {
    margin: 2,
    width: 240,
    color: {
      dark: "#000000",
      light: "#ffffff"
    }
  });
}
