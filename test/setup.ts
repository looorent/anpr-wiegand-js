import { webcrypto } from "node:crypto";

if (typeof globalThis.crypto === "undefined") {
  // biome-ignore lint/suspicious/noExplicitAny: polyfilling global crypto requires any due to slight type mismatches
  globalThis.crypto = webcrypto as any;
}
