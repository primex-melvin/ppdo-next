/**
 * Self-contained Scrypt password hashing implementation
 * Compatible with Convex Auth's Lucia-based Scrypt hashing
 *
 * This implementation avoids external dependencies that may not bundle
 * correctly in Convex's serverless environment.
 *
 * Based on the Scrypt implementation from Lucia (MIT License)
 * Original Copyright (c) 2022 Paul Miller (https://paulmillr.com)
 */

// Scrypt parameters matching Lucia's defaults
const SCRYPT_N = 16384;  // CPU/memory cost parameter
const SCRYPT_R = 16;     // Block size parameter
const SCRYPT_P = 1;      // Parallelization parameter
const SCRYPT_DKLEN = 64; // Derived key length

/**
 * Convert Uint8Array to hex string
 */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert hex string to Uint8Array
 */
function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Constant-time comparison of two Uint8Arrays
 * Prevents timing attacks
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

/**
 * Left rotate a 32-bit integer
 */
function rotl(a: number, b: number): number {
  return (a << b) | (a >>> (32 - b));
}

/**
 * XOR with Salsa20/8 core
 */
function XorAndSalsa(
  prev: Uint32Array,
  pi: number,
  input: Uint32Array,
  ii: number,
  out: Uint32Array,
  oi: number
): void {
  const y00 = prev[pi++] ^ input[ii++],
    y01 = prev[pi++] ^ input[ii++];
  const y02 = prev[pi++] ^ input[ii++],
    y03 = prev[pi++] ^ input[ii++];
  const y04 = prev[pi++] ^ input[ii++],
    y05 = prev[pi++] ^ input[ii++];
  const y06 = prev[pi++] ^ input[ii++],
    y07 = prev[pi++] ^ input[ii++];
  const y08 = prev[pi++] ^ input[ii++],
    y09 = prev[pi++] ^ input[ii++];
  const y10 = prev[pi++] ^ input[ii++],
    y11 = prev[pi++] ^ input[ii++];
  const y12 = prev[pi++] ^ input[ii++],
    y13 = prev[pi++] ^ input[ii++];
  const y14 = prev[pi++] ^ input[ii++],
    y15 = prev[pi++] ^ input[ii++];

  let x00 = y00,
    x01 = y01,
    x02 = y02,
    x03 = y03,
    x04 = y04,
    x05 = y05,
    x06 = y06,
    x07 = y07,
    x08 = y08,
    x09 = y09,
    x10 = y10,
    x11 = y11,
    x12 = y12,
    x13 = y13,
    x14 = y14,
    x15 = y15;

  for (let i = 0; i < 8; i += 2) {
    x04 ^= rotl((x00 + x12) | 0, 7);
    x08 ^= rotl((x04 + x00) | 0, 9);
    x12 ^= rotl((x08 + x04) | 0, 13);
    x00 ^= rotl((x12 + x08) | 0, 18);
    x09 ^= rotl((x05 + x01) | 0, 7);
    x13 ^= rotl((x09 + x05) | 0, 9);
    x01 ^= rotl((x13 + x09) | 0, 13);
    x05 ^= rotl((x01 + x13) | 0, 18);
    x14 ^= rotl((x10 + x06) | 0, 7);
    x02 ^= rotl((x14 + x10) | 0, 9);
    x06 ^= rotl((x02 + x14) | 0, 13);
    x10 ^= rotl((x06 + x02) | 0, 18);
    x03 ^= rotl((x15 + x11) | 0, 7);
    x07 ^= rotl((x03 + x15) | 0, 9);
    x11 ^= rotl((x07 + x03) | 0, 13);
    x15 ^= rotl((x11 + x07) | 0, 18);
    x01 ^= rotl((x00 + x03) | 0, 7);
    x02 ^= rotl((x01 + x00) | 0, 9);
    x03 ^= rotl((x02 + x01) | 0, 13);
    x00 ^= rotl((x03 + x02) | 0, 18);
    x06 ^= rotl((x05 + x04) | 0, 7);
    x07 ^= rotl((x06 + x05) | 0, 9);
    x04 ^= rotl((x07 + x06) | 0, 13);
    x05 ^= rotl((x04 + x07) | 0, 18);
    x11 ^= rotl((x10 + x09) | 0, 7);
    x08 ^= rotl((x11 + x10) | 0, 9);
    x09 ^= rotl((x08 + x11) | 0, 13);
    x10 ^= rotl((x09 + x08) | 0, 18);
    x12 ^= rotl((x15 + x14) | 0, 7);
    x13 ^= rotl((x12 + x15) | 0, 9);
    x14 ^= rotl((x13 + x12) | 0, 13);
    x15 ^= rotl((x14 + x13) | 0, 18);
  }

  out[oi++] = (y00 + x00) | 0;
  out[oi++] = (y01 + x01) | 0;
  out[oi++] = (y02 + x02) | 0;
  out[oi++] = (y03 + x03) | 0;
  out[oi++] = (y04 + x04) | 0;
  out[oi++] = (y05 + x05) | 0;
  out[oi++] = (y06 + x06) | 0;
  out[oi++] = (y07 + x07) | 0;
  out[oi++] = (y08 + x08) | 0;
  out[oi++] = (y09 + x09) | 0;
  out[oi++] = (y10 + x10) | 0;
  out[oi++] = (y11 + x11) | 0;
  out[oi++] = (y12 + x12) | 0;
  out[oi++] = (y13 + x13) | 0;
  out[oi++] = (y14 + x14) | 0;
  out[oi++] = (y15 + x15) | 0;
}

/**
 * PBKDF2 using Web Crypto API
 */
async function pbkdf2(
  password: Uint8Array,
  salt: Uint8Array,
  iterations: number,
  dkLen: number
): Promise<Uint8Array> {
  // Create fresh ArrayBuffers to avoid SharedArrayBuffer type issues
  const passwordBuffer = new Uint8Array(password).buffer;
  const saltBuffer = new Uint8Array(salt).buffer;

  const pwKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const keyBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBuffer,
      iterations,
    },
    pwKey,
    dkLen * 8
  );
  return new Uint8Array(keyBuffer);
}

/**
 * BlockMix function for Scrypt
 */
function BlockMix(
  input: Uint32Array,
  ii: number,
  out: Uint32Array,
  oi: number,
  r: number
): void {
  let head = oi + 0;
  let tail = oi + 16 * r;
  for (let i = 0; i < 16; i++) out[tail + i] = input[ii + (2 * r - 1) * 16 + i];
  for (let i = 0; i < r; i++, head += 16, ii += 16) {
    XorAndSalsa(out, tail, input, ii, out, head);
    if (i > 0) tail += 16;
    XorAndSalsa(out, head, input, (ii += 16), out, tail);
  }
}

/**
 * Convert Uint8Array to Uint32Array
 */
function u32(arr: Uint8Array): Uint32Array {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}

/**
 * Core Scrypt function
 */
async function scryptCore(
  password: Uint8Array,
  salt: Uint8Array,
  N: number,
  r: number,
  p: number,
  dkLen: number
): Promise<Uint8Array> {
  const maxmem = 1024 ** 3 + 1024;
  const blockSize = 128 * r;
  const blockSize32 = blockSize / 4;

  if (N <= 1 || (N & (N - 1)) !== 0 || N >= 2 ** (blockSize / 8) || N > 2 ** 32) {
    throw new Error(
      "Scrypt: N must be larger than 1, a power of 2, less than 2^(128 * r / 8) and less than 2^32"
    );
  }
  if (p < 0 || p > ((2 ** 32 - 1) * 32) / blockSize) {
    throw new Error(
      "Scrypt: p must be a positive integer less than or equal to ((2^32 - 1) * 32) / (128 * r)"
    );
  }
  if (dkLen < 0 || dkLen > (2 ** 32 - 1) * 32) {
    throw new Error(
      "Scrypt: dkLen should be positive integer less than or equal to (2^32 - 1) * 32"
    );
  }

  const memUsed = blockSize * (N + p);
  if (memUsed > maxmem) {
    throw new Error(
      `Scrypt: parameters too large, ${memUsed} (128 * r * (N + p)) > ${maxmem} (maxmem)`
    );
  }

  const B = await pbkdf2(password, salt, 1, blockSize * p);
  const B32 = u32(B);
  const V = u32(new Uint8Array(blockSize * N));
  const tmp = u32(new Uint8Array(blockSize));

  for (let pi = 0; pi < p; pi++) {
    const Pi = blockSize32 * pi;
    for (let i = 0; i < blockSize32; i++) V[i] = B32[Pi + i];
    for (let i = 0, pos = 0; i < N - 1; i++) {
      BlockMix(V, pos, V, (pos += blockSize32), r);
      await new Promise((resolve) => resolve(undefined)); // yield
    }
    BlockMix(V, (N - 1) * blockSize32, B32, Pi, r);
    for (let i = 0; i < N; i++) {
      const j = B32[Pi + blockSize32 - 16] % N;
      for (let k = 0; k < blockSize32; k++) {
        tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k];
      }
      BlockMix(tmp, 0, B32, Pi, r);
      await new Promise((resolve) => resolve(undefined)); // yield
    }
  }

  const res = await pbkdf2(password, B, 1, dkLen);
  B.fill(0);
  V.fill(0);
  tmp.fill(0);
  return res;
}

/**
 * Generate Scrypt key from password and salt
 */
async function generateScryptKey(
  data: string,
  salt: string,
  blockSize: number = SCRYPT_R
): Promise<Uint8Array> {
  const encodedData = new TextEncoder().encode(data);
  const encodedSalt = new TextEncoder().encode(salt);
  return await scryptCore(
    encodedData,
    encodedSalt,
    SCRYPT_N,
    blockSize,
    SCRYPT_P,
    SCRYPT_DKLEN
  );
}

/**
 * Scrypt password hasher compatible with Lucia/Convex Auth
 *
 * Hash format: `{salt}:{hash}` where both are lowercase hex strings
 * - salt: 16 random bytes (32 hex chars)
 * - hash: 64 bytes derived from scrypt (128 hex chars)
 */
export class Scrypt {
  /**
   * Hash a password using Scrypt
   * @param password - The plain text password
   * @returns Promise<string> - Hash in format "salt:hash"
   */
  async hash(password: string): Promise<string> {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = toHex(saltBytes);
    const key = await generateScryptKey(password.normalize("NFKC"), salt);
    return `${salt}:${toHex(key)}`;
  }

  /**
   * Verify a password against a hash
   * @param hash - The stored hash in format "salt:hash"
   * @param password - The plain text password to verify
   * @returns Promise<boolean> - True if password matches
   */
  async verify(hash: string, password: string): Promise<boolean> {
    const parts = hash.split(":");
    if (parts.length !== 2) return false;
    const [salt, key] = parts;
    const targetKey = await generateScryptKey(password.normalize("NFKC"), salt);
    return constantTimeEqual(targetKey, fromHex(key));
  }
}
