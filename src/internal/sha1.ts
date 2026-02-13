/**
 * Computes the SHA-1 hash of a string using the Web Crypto API.
 * @param input The string to hash.
 * @returns A Promise resolving to the 20-byte SHA-1 digest as a Uint8Array.
 * @throws Error if the Web Crypto API is unavailable (e.g., in insecure contexts).
 */
export async function sha1(input: string): Promise<Uint8Array> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Web Crypto API is unavailable. SHA-1 hashing requires a secure context (HTTPS) or a modern Node.js environment.");
  }
  const data = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-1", data);
  return new Uint8Array(buffer);
}
