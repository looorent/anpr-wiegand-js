export async function sha1(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-1", data);
  return new Uint8Array(buffer);
}
