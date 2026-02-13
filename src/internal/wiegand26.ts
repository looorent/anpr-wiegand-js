import { sanitize } from "./sanitize";
import { sha1 } from "./sha1";

const MAX_NUMBER_OF_CHARACTERS = 10;

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

/**
 * Converts a license plate to a Wiegand 26-bit hexadecimal string.
 * @param textLicensePlate must have length <= 10 characters
 * @returns an uppercase hexadecimal representation in the Wiegand 26-bit format, or undefined when the provided license plate is blank or null
 * @throws Error when the license plate exceeds 10 characters
 */
export async function encode(textLicensePlate: string | null | undefined): Promise<Wiegand26Result | undefined> {
  const sanitized = sanitize(textLicensePlate);
  if (sanitized) {
    if (sanitized.length > MAX_NUMBER_OF_CHARACTERS) {
      throw new Error(`Wiegand26 does not support license plate containing more than ${MAX_NUMBER_OF_CHARACTERS} characters: ${sanitized}`);
    }
    const shaOne = await sha1(sanitized);
    const bits24 = leastSignificant24Bits(shaOne);
    const bits26 = moveTo26Bits(bits24);
    const wiegand26InHexadecimal = toHexadecimal(addParityBits(bits26));
    return decode(wiegand26InHexadecimal);
  } else {
    return undefined;
  }
}

export async function decode(wiegand26InHexadecimal: string | null | undefined): Promise<Wiegand26Result | undefined> {
  if (wiegand26InHexadecimal && wiegand26InHexadecimal.length > 0) {
    const facilityCode = readFacilityCodeFrom(wiegand26InHexadecimal);
    const idNumber = readIdNumberFrom(wiegand26InHexadecimal);
    return {
      wiegand26InHexadecimal,
      wiegand26InDecimal: readDecimalPayload(wiegand26InHexadecimal),
      facilityCode: facilityCode,
      idNumber: idNumber,
      facilityCodeAndIdNumber: concatenateFacilityCodeAndIdNumber(facilityCode, idNumber),
    };
  } else {
    return undefined;
  }
}

/**
 * Reads the facility code from a hexadecimal Wiegand 26 output.
 * @param wiegand26InHexadecimal a well-formatted Wiegand 26 output; cannot be null or blank
 * @returns the facility code (8 bits at position 1)
 */
export function readFacilityCodeFrom(wiegand26InHexadecimal: string): number {
  return parseWiegand26(wiegand26InHexadecimal, 1, 1);
}

/**
 * Reads the ID number from a hexadecimal Wiegand 26 output.
 * @param wiegand26InHexadecimal a well-formatted Wiegand 26 output; cannot be null or blank
 * @returns the ID number (16 bits at position 9)
 */
export function readIdNumberFrom(wiegand26InHexadecimal: string): number {
  return parseWiegand26(wiegand26InHexadecimal, 9, 2);
}

/**
 * Reads the 3 bytes contained in a Wiegand 26 output (excluding the parity bits).
 * @param wiegand26InHexadecimal a well-formatted Wiegand 26 output; cannot be null or blank
 * @returns a decimal representation of the 3-byte payload
 */
export function readDecimalPayload(wiegand26InHexadecimal: string): number {
  return parseWiegand26(wiegand26InHexadecimal, 1, 3);
}

function concatenateFacilityCodeAndIdNumber(facilityCode: number, idNumber: number): number {
  return parseInt(`${facilityCode}${String(idNumber).padStart(5, "0")}`, 10);
}

function leastSignificant24Bits(binary: Uint8Array): bigint {
  const len = binary.length;
  const b1 = BigInt((binary[len - 3] || 0) & 0xff);
  const b2 = BigInt((binary[len - 2] || 0) & 0xff);
  const b3 = BigInt((binary[len - 1] || 0) & 0xff);

  return (b1 << 16n) | (b2 << 8n) | b3;
}

function moveTo26Bits(value: bigint): bigint {
  return value << 1n;
}

function bitCount(n: bigint): bigint {
  let count = 0n;
  let v = n;
  while (v > 0n) {
    count += v & 1n;
    v >>= 1n;
  }
  return count;
}

const EVEN_PARITY_FIELD = 0b11111111111110000000000000n;
const EVEN_PARITY_MASK = 0b10000000000000000000000000n;
function setEvenParityBit(value: bigint): bigint {
  const oneBits = bitCount(value & EVEN_PARITY_FIELD);
  const mustAddParityBit = oneBits % 2n !== 0n;
  return mustAddParityBit ? value | EVEN_PARITY_MASK : value;
}

const ODD_PARITY_FIELD = 0b00000000000001111111111111n;
const ODD_PARITY_MASK = 0b00000000000000000000000001n;
function setOddParityBit(value: bigint): bigint {
  const oneBits = bitCount(value & ODD_PARITY_FIELD);
  const mustAddParityBit = oneBits % 2n === 0n;
  return mustAddParityBit ? value | ODD_PARITY_MASK : value;
}

function addParityBits(bits: bigint): bigint {
  return setOddParityBit(setEvenParityBit(bits));
}

function toHexadecimal(value: bigint): string {
  return value.toString(16).toUpperCase().padStart(7, "0");
}

function leftPad(text: string, size: number): string {
  return text.padStart(size, "0");
}

const WIEGAND26_LENGTH = 26;
function parseWiegand26(wiegand26InHexadecimal: string, binaryPosition: number, numberOfBytes: number): number {
  if (wiegand26InHexadecimal == null || wiegand26InHexadecimal.trim() === "") {
    throw new Error("A Wiegand26 cannot be empty or blank");
  }

  let binaryRepresentation = BigInt(`0x${wiegand26InHexadecimal}`).toString(2);

  if (binaryRepresentation.length > WIEGAND26_LENGTH) {
    throw new Error("Wiegand26 is too long.");
  }
  binaryRepresentation = leftPad(binaryRepresentation, WIEGAND26_LENGTH);
  const slice = binaryRepresentation.substring(binaryPosition, 8 * numberOfBytes + binaryPosition);
  return parseInt(slice, 2);
}
