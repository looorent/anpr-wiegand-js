export async function sha1(input: string): Promise<Uint8Array> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Web Crypto API is unavailable. SHA-1 hashing requires a secure context (HTTPS).");
  }
  const data = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-1", data);
  return new Uint8Array(buffer);
}
