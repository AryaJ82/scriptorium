import bcrypt from 'bcrypt';

const SALT_ROUNDS = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS) : 10;

/**
 * Hashes a plaintext password using bcrypt.
 * @param {string} password - The plaintext password to hash.
 * @returns {Promise<string>} - A promise that resolves to the hashed password.
 */
export async function hashPassword(password: string) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plaintext password with a hashed password using bcrypt.
 * @param {string} password - The plaintext password to compare.
 * @param {string} hashedPassword - The hashed password to compare against.
 * @returns {Promise<boolean>} - A promise that resolves to true if the passwords match, or false if they don't.
 */
export async function comparePassword(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
}