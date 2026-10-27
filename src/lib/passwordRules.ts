export const PASSWORD_MIN = 8;
/** The server reads only the first 72 bytes of a password, so a longer one is refused up front. */
export const PASSWORD_MAX = 72;

/**
 * What is wrong with a chosen password, in words the person can act on.
 *
 * @param {string} password - The new password.
 * @param {string} confirmation - Typed a second time.
 * @returns {string | null} The first problem, or null when it can be used.
 */
export function validateNewPassword(password: string, confirmation: string): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (new TextEncoder().encode(password).length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  if (confirmation && password !== confirmation) return "The two passwords do not match.";
  if (!confirmation) return "Type the password again to confirm it.";
  return null;
}
