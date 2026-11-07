/**
 * Password hashing helpers for bcrypt
 * Existing accounts were hashed at cost 10. OWASP now recommends >= 12 for new
 * applications.
 */
import bcrypt from 'bcrypt';

// Raise gradually rather than in one jump: cost 12 takes ~4x longer than 10 on
// commodity hardware, and every login plus rehash pays it.
export const BCRYPT_COST = 12;

/** bcrypt hash strings look like $2a$10$... - the cost is the 3rd field. */
export const hashCostOf = (hash) => {
    const match = /^\$2[aby]?\$(\d{2})\$/.exec(String(hash || ''));
    return match ? Number(match[1]) : null;
};

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_COST);

/**
 * Verify a password, transparently upgrading the stored hash when it is older
 * than the current cost.
 * @returns {Promise<boolean>} whether the password matched
 */
export const verifyPassword = async (plain, storedHash, persist) => {
    const matches = await bcrypt.compare(plain, storedHash);
    if (!matches) return false;

    const cost = hashCostOf(storedHash);
    if (cost !== null && cost < BCRYPT_COST && typeof persist === 'function') {
        try {
            await persist(await bcrypt.hash(plain, BCRYPT_COST));
        } catch (error) {
            console.error('Password rehash failed:', error.message);
        }
    }
    return true;
};