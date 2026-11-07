/**
 * Idempotency-Key generator for unsafe POSTs.
 *
 * The server (services/idempotency.js) keys on this header and replays the
 * stored response for a repeat, so a double-tap or a retried request cannot
 * create two orders / fire two confirmation emails.
 */
const HEX = '0123456789abcdef'  //Used to convert random bytes into hexadecimal characters

// Fallback generator

const fallback = () => {
  const out = []  // 

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16))  // 128 bits = 16 bytes = 32 hex chars 
    for (let i = 0; i < bytes.length; i++) out.push(HEX[bytes[i] >> 4] + HEX[bytes[i] & 15])
  } else {
// it is less secure but ensures a key is always produced for every request 32 hex chars
    for (let i = 0; i < 32; i++) out.push(HEX[Math.floor(Math.random() * 16)])
  }

  return out.join('')
}

/**
 * @returns {string} an opaque token matching the server's /^[\w.:-]{1,MAX}$/ rule
 */
export const newIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()  // generates 36 chars key
  }
  return fallback() // falls back to the custom generator
}

export default newIdempotencyKey