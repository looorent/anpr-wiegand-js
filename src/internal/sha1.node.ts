import { createHash } from "node:crypto";

export function sha1(input: string): Uint8Array {
  return createHash("sha1").update(input).digest();
}
