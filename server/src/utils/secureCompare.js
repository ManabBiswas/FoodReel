import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time string comparison for secrets (admin codes, etc).
 * A timing attack is a type of side‑channel attack where an attacker infers secret information (like passwords or encryption keys) by measuring how long a system takes to perform certain operations. Even microsecond differences in response time can leak clues about the underlying data.
 * 
 * `timingSafeEqual` requires equal-length buffers, and comparing unequal-length
 * strings directly returns early — both leak information about the secret via
 * timing. Hashing both sides to a fixed-width SHA-256 digest first removes the
 * length dependency and makes every comparison take the same time.
 */
export function timingSafeStringEqual(a, b) {
  const left = createHash('sha256').update(String(a ?? '')).digest();
  //digest() returns a Buffer object and not a String while String(b ?? '') returns a string. ?? is a nullish coalescing operator that returns the first truthy value.
  const right = createHash('sha256').update(String(b ?? '')).digest();
  return timingSafeEqual(left, right);
}
