# anpr-wiegand

[![NPM Version](https://img.shields.io/npm/v/anpr-wiegand.svg)](https://www.npmjs.com/package/anpr-wiegand)
[![License](https://img.shields.io/npm/l/anpr-wiegand.svg)](LICENSE)

A TypeScript library to format license plates into Wiegand 26-bit and 64-bit formats. This is commonly used in **Automatic Number Plate Recognition (ANPR)** systems to integrate with access control panels (Wiegand controllers).

This library is a port of the original Java implementation: [looorent/anpr-wiegand](https://github.com/looorent/anpr-wiegand).

## What is Wiegand?

Wiegand is a standard interface used in contact-less card readers and access control systems. Since license plates are alphanumeric and Wiegand payloads are typically numeric, they must be encoded:

- **Wiegand 26-bit:** A widely used format consisting of 1 parity bit, 8 bits for a facility code, 16 bits for an ID number, and 1 final parity bit. Since a license plate is too long for 24 bits of data, this library uses a **SHA-1 hash** to derive a unique numeric ID.
- **Wiegand 64-bit:** A proprietary but common format for ANPR that allows encoding up to 10 alphanumeric characters directly using a 6-bit mapping per character.

---

## Installation

```bash
npm install anpr-wiegand
```

## Usage

```ts
import { encode26, decode26, encode64 } from "anpr-wiegand";

// --- Wiegand 26-bit ---
// Encodes a plate into a 7-character hexadecimal string
const result26 = await encode26("ABC 123"); 
// Output: { wiegand26InHexadecimal: "1A98B4B", facilityCode: 212, idNumber: 50597, ... }

// Decode an existing hex string
const decoded = await decode26("1A98B4B");

// --- Wiegand 64-bit ---
const hex64 = encode64("ABC 123");
// Output: "6000011C1FBD3615"
```

---

## API Reference

### Wiegand 26-bit

The 26-bit implementation uses the **Web Crypto API** for SHA-1 hashing, making it compatible with modern browsers and Node.js.

#### `encode26(licensePlate: string): Promise<Wiegand26Result | undefined>`
Sanitizes the input and encodes it.
- **Input:** Up to 10 alphanumeric characters.
- **Output:** A `Wiegand26Result` object or `undefined` if the input is empty.

#### `decode26(hex: string): Promise<Wiegand26Result | undefined>`
Parses a Wiegand 26 hexadecimal string back into its constituent numeric fields.

#### `Wiegand26Result` Object
```ts
{
  wiegand26InHexadecimal: string; // e.g., "1A98B4B"
  wiegand26InDecimal: number;     // The 24-bit payload as decimal
  facilityCode: number;           // 8-bit facility code
  idNumber: number;               // 16-bit ID number
  facilityCodeAndIdNumber: number; // Concatenated FC + ID (e.g., 21250597)
}
```

### Wiegand 64-bit

#### `encode64(licensePlate: string): string | undefined`
Encodes up to 10 characters using a 6-bit character mapping.
- **Input:** Up to 10 alphanumeric characters.
- **Output:** A 16-character hexadecimal string.

#### `decode64(hex: string): string | undefined`
Decodes a Wiegand 64-bit hexadecimal string back into a license plate.
- **Input:** A 16-character hexadecimal string.
- **Output:** The uppercase license plate string.

---

## Features

- **Sanitization:** Automatically strips spaces and special characters.
- **Case Insensitive:** "abc123" and "ABC-123" result in the same encoding.
- **Zero Dependencies:** Ultra-lightweight and fast.
