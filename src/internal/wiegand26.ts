import { sanitize } from "./sanitize";

type SyncSha1Provider = (input: string) => Uint8Array;
type AsyncSha1Provider = (input: string) => Promise<Uint8Array>;

const MAX_NUMBER_OF_CHARACTERS = 10;
const WIEGAND26_LENGTH = 26;

export interface Wiegand26Result {
  // the uppercase hexadecimal representation in the Wiegand 26-bit format
  wiegand26InHexadecimal: string;

  // the 3 bytes contained in a Wiegand 26 output (excluding the parity bits)
  wiegand26InDecimal: number;

  // the facility code (8 bits at position 1)
  facilityCode: number;

  // the ID number (16 bits at position 9)
  idNumber: number;

  // the concatenated facility code and ID number
  facilityCodeAndIdNumber: number;
}

function computeWiegand26(shaOne: Uint8Array): Wiegand26Result {
  const len = shaOne.length;
  const bits24 = (((shaOne[len - 3] ?? 0) & 0xff) << 16) | (((shaOne[len - 2] ?? 0) & 0xff) << 8) | ((shaOne[len - 1] ?? 0) & 0xff);
  const bits26 = bits24 << 1;
  const withParity = addParityBits(bits26);
  const wiegand26InHexadecimal = (withParity >>> 0).toString(16).toUpperCase().padStart(7, "0");
  const payload = (withParity >> 1) & 0xffffff;
  const facilityCode = (payload >> 16) & 0xff;
  const idNumber = payload & 0xffff;
  return {
    wiegand26InHexadecimal,
    wiegand26InDecimal: payload,
    facilityCode,
    idNumber,
    facilityCodeAndIdNumber: concatenateFacilityCodeAndIdNumber(facilityCode, idNumber),
  };
}

function validateAndSanitize(textLicensePlate: string | null | undefined): string | undefined {
  const sanitized = sanitize(textLicensePlate);
  if (sanitized) {
    if (sanitized.length > MAX_NUMBER_OF_CHARACTERS) {
      throw new Error(`Wiegand26 does not support license plate containing more than ${MAX_NUMBER_OF_CHARACTERS} characters: ${sanitized}`);
    }
  }
  return sanitized;
}

/**
 * Creates a synchronous Wiegand 26-bit encoder using a synchronous SHA-1 implementation.
 */
export function createSyncEncoder(sha1: SyncSha1Provider) {
  return function encode(textLicensePlate: string | null | undefined): Wiegand26Result | undefined {
    const sanitized = validateAndSanitize(textLicensePlate);
    if (sanitized) {
      return computeWiegand26(sha1(sanitized));
    }
    return undefined;
  };
}

/**
 * Creates an asynchronous Wiegand 26-bit encoder using an async SHA-1 implementation (e.g. WebCrypto).
 */
export function createAsyncEncoder(sha1: AsyncSha1Provider) {
  return async function encode(textLicensePlate: string | null | undefined): Promise<Wiegand26Result | undefined> {
    const sanitized = validateAndSanitize(textLicensePlate);
    if (sanitized) {
      return computeWiegand26(await sha1(sanitized));
    }
    return undefined;
  };
}

export function decode(wiegand26InHexadecimal: string | null | undefined): Wiegand26Result | undefined {
  if (wiegand26InHexadecimal && wiegand26InHexadecimal.length > 0) {
    const value = parseInt(wiegand26InHexadecimal, 16);
    if (value >= 1 << WIEGAND26_LENGTH) {
      throw new Error("Wiegand26 is too long.");
    }
    const payload = (value >> 1) & 0xffffff;
    const facilityCode = (payload >> 16) & 0xff;
    const idNumber = payload & 0xffff;
    return {
      wiegand26InHexadecimal,
      wiegand26InDecimal: payload,
      facilityCode,
      idNumber,
      facilityCodeAndIdNumber: concatenateFacilityCodeAndIdNumber(facilityCode, idNumber),
    };
  }
  return undefined;
}

/**
 * Reads the facility code from a hexadecimal Wiegand 26 output.
 * @param wiegand26InHexadecimal a well-formatted Wiegand 26 output; cannot be null or blank
 * @returns the facility code (8 bits at position 1)
 */
export function readFacilityCodeFrom(wiegand26InHexadecimal: string): number {
  const value = parseWiegand26Value(wiegand26InHexadecimal);
  return (value >> 17) & 0xff;
}

/**
 * Reads the ID number from a hexadecimal Wiegand 26 output.
 * @param wiegand26InHexadecimal a well-formatted Wiegand 26 output; cannot be null or blank
 * @returns the ID number (16 bits at position 9)
 */
export function readIdNumberFrom(wiegand26InHexadecimal: string): number {
  const value = parseWiegand26Value(wiegand26InHexadecimal);
  return (value >> 1) & 0xffff;
}

/**
 * Reads the 3 bytes contained in a Wiegand 26 output (excluding the parity bits).
 * @param wiegand26InHexadecimal a well-formatted Wiegand 26 output; cannot be null or blank
 * @returns a decimal representation of the 3-byte payload
 */
export function readDecimalPayload(wiegand26InHexadecimal: string): number {
  const value = parseWiegand26Value(wiegand26InHexadecimal);
  return (value >> 1) & 0xffffff;
}

function concatenateFacilityCodeAndIdNumber(facilityCode: number, idNumber: number): number {
  return parseInt(`${facilityCode}${String(idNumber).padStart(5, "0")}`, 10);
}

function popcount(n: number): number {
  let v = n;
  v = v - ((v >> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
  return (((v + (v >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24;
}

function addParityBits(bits26: number): number {
  let value = bits26;
  // Even parity over bits 0-12 (upper half: facility code + leading parity bit area)
  const evenField = (value >> 13) & 0x1fff;
  if (popcount(evenField) % 2 !== 0) {
    value |= 1 << 25; // set MSB (even parity bit)
  }
  // Odd parity over bits 0-12 (lower half: ID number + trailing parity bit area)
  // bit 0 is not set yet, so we count bits 1-12
  const oddField = (value >> 1) & 0xfff;
  if (popcount(oddField) % 2 === 0) {
    value |= 1; // set LSB (odd parity bit)
  }
  return value;
}

function parseWiegand26Value(wiegand26InHexadecimal: string): number {
  if (wiegand26InHexadecimal == null || wiegand26InHexadecimal.trim() === "") {
    throw new Error("A Wiegand26 cannot be empty or blank");
  }
  const value = parseInt(wiegand26InHexadecimal, 16);
  if (value >= 1 << WIEGAND26_LENGTH) {
    throw new Error("Wiegand26 is too long.");
  }
  return value;
}
