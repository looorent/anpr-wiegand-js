import { sanitize } from "./sanitize";

const UNKNOWN_CHARACTER = 0b111111;
const EMPTY = 0b000000;
const MAX_NUMBER_OF_CHARACTERS = 10;
const HEADER = BigInt(0b0110) << 60n;
const NUMBER_OF_BITS_PER_CHARACTER = 6;

const MAPPINGS: Map<string, number> = initializeMappings();
const REVERSE_MAPPINGS: Map<number, string> = initializeReverseMappings();

/**
 * Converts a license plate to a Wiegand 64-bit hexadecimal string.
 * @param textLicencePlate must have length <= 10 characters
 * @returns an uppercase hexadecimal representation in the Wiegand 64-bit format, or undefined when the provided license plate is blank or null
 * @throws Error when the license plate exceeds 10 characters
 */
export function encode(textLicencePlate: string | null | undefined): string | undefined {
  const sanitized = sanitize(textLicencePlate);
  if (sanitized && sanitized?.length > 0) {
    if (sanitized.length > MAX_NUMBER_OF_CHARACTERS) {
      throw new Error(`Wiegand64 does not support license plate containing more than ${MAX_NUMBER_OF_CHARACTERS} characters: ${sanitized}`);
    }
    const bits = on64Bits(sanitized);
    return bits.toString(16).toUpperCase();
  } else {
    return undefined;
  }
}

/**
 * Decodes a Wiegand 64-bit hexadecimal string back to a license plate.
 * Unknown characters (not matching [A-Z0-9 ]) are decoded as "?".
 * @param wiegand64InHexadecimal a 16-character hexadecimal string
 * @returns the decoded license plate (uppercase), or undefined if the input is empty
 */
export function decode(wiegand64InHexadecimal: string | null | undefined): string | undefined {
  if (wiegand64InHexadecimal && wiegand64InHexadecimal.trim().length > 0) {
    const bits = BigInt(`0x${wiegand64InHexadecimal}`);
    let result = "";
    for (let i = 0; i < MAX_NUMBER_OF_CHARACTERS; i++) {
      const shift = BigInt(NUMBER_OF_BITS_PER_CHARACTER * (MAX_NUMBER_OF_CHARACTERS - i - 1));
      const charBits = Number((bits >> shift) & 0b111111n);
      const char = REVERSE_MAPPINGS.get(charBits) ?? "?";
      result += char;
    }
    return result.trim();
  } else {
    return undefined;
  }
}


function initializeMappings(): Map<string, number> {
  const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const zero = 0b010000;
  const mapping = new Map<string, number>();
  for (let i = 0; i < characters.length; i++) {
    mapping.set(characters[i], zero + i);
  }
  mapping.set(" ", EMPTY);
  return mapping;
}

function initializeReverseMappings(): Map<number, string> {
  const mapping = new Map<number, string>();
  for (const [char, value] of MAPPINGS) {
    mapping.set(value, char);
  }
  return mapping;
}

function findBinaryRepresentationOf(character: string): number {
  return MAPPINGS.get(character) ?? UNKNOWN_CHARACTER;
}

function computeBinaryMask(position: number, character: string): bigint {
  const binary = BigInt(findBinaryRepresentationOf(character));
  const shift = BigInt(NUMBER_OF_BITS_PER_CHARACTER * (MAX_NUMBER_OF_CHARACTERS - position - 1));
  return binary << shift;
}

function toArrayOfCharacters(plate: string): string[] {
  return plate.padStart(MAX_NUMBER_OF_CHARACTERS).split("");
}

function on64Bits(plate: string): bigint {
  const characters = toArrayOfCharacters(plate);
  let bits = HEADER;
  for (let position = 0; position < MAX_NUMBER_OF_CHARACTERS; position++) {
    bits |= computeBinaryMask(position, characters[position]);
  }
  return bits;
}
