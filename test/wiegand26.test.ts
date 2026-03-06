import { describe, expect, it } from "vitest";
import { sha1 } from "../src/internal/sha1.node";
import { createSyncEncoder, decode, readDecimalPayload, readFacilityCodeFrom, readIdNumberFrom } from "../src/internal/wiegand26";

const encode = createSyncEncoder(sha1);

describe("wiegand26", () => {
  describe("encode", () => {
    it("returns undefined for null", () => {
      expect(encode(null)).toBeUndefined();
    });

    it("returns undefined for undefined", () => {
      expect(encode(undefined)).toBeUndefined();
    });

    it.each(["", "   ", " "])("returns undefined for blank input '%s'", (blank) => {
      expect(encode(blank)).toBeUndefined();
    });

    it.each(["azertyuiop0987", "1234567899879825", "nnnnnnnnnnnnnnnn"])("throws for very long plate '%s'", (plate) => {
      expect(() => encode(plate)).toThrow();
    });

    it.each([
      ["1WFV385", "1A98B4B"],
      ["1SDF534", "2521053"],
      ["ADF543", "226C607"],
      ["DE56G", "31C234A"],
      ["FF23DDFDF5", "090BF4D"],
      ["AZERTYUIOI", "006D2EC"],
      ["1FRDEERE", "1A7622D"],
      ["2ZZD456", "2866DD8"],
    ])("encode('%s') returns hex '%s'", (plate, expectedHex) => {
      const result = encode(plate);
      expect(result?.wiegand26InHexadecimal).toBe(expectedHex);
      expect(result?.wiegand26InHexadecimal.length).toBe(7);
    });

    it.each([
      ["85", "0A6D5C5"],
      ["34", "3FE96B2"],
      ["3", "0DD0777"],
      ["DFDF5", "1F628B4"],
      ["YUIOI", "3A9BABB"],
      ["ERE", "08F4AEC"],
      ["56", "3EB746E"],
    ])("encode('%s') (short plate) returns hex '%s'", (plate, expectedHex) => {
      const result = encode(plate);
      expect(result?.wiegand26InHexadecimal).toBe(expectedHex);
      expect(result?.wiegand26InHexadecimal.length).toBe(7);
    });

    it.each([
      ["HK 55 EVB", "3019E2A"],
      ["HK-55-EVB", "3019E2A"],
      ["HK-55-evb", "3019E2A"],
      [" HK-55€evb ", "3019E2A"],
      ["1wfv385", "1A98B4B"],
      ["1S--DF534", "2521053"],
      ["A__DF543", "226C607"],
      ["de56g", "31C234A"],
      ["FF23DDFDF5", "090BF4D"],
      ["azer)TYUIOI", "006D2EC"],
      ["1FR//DEERE", "1A7622D"],
      ["2ZZD4;;..56", "2866DD8"],
    ])("encode('%s') (special chars) returns hex '%s'", (plate, expectedHex) => {
      const result = encode(plate);
      expect(result?.wiegand26InHexadecimal).toBe(expectedHex);
      expect(result?.wiegand26InHexadecimal.length).toBe(7);
    });
  });

  describe("decode", () => {
    it("returns undefined for null", () => {
      expect(decode(null)).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      expect(decode("")).toBeUndefined();
    });

    it("returns all fields for a valid plate", () => {
      const result = decode("1A98B4B");
      expect(result).toEqual({
        wiegand26InHexadecimal: "1A98B4B",
        facilityCode: 212,
        idNumber: 50597,
        wiegand26InDecimal: 13944229,
        facilityCodeAndIdNumber: 21250597,
      });
    });

    it("returns all fields for another plate", () => {
      const result = decode("31C234A");
      expect(result).toEqual({
        wiegand26InHexadecimal: "31C234A",
        facilityCode: 142,
        idNumber: 4517,
        wiegand26InDecimal: 9310629,
        facilityCodeAndIdNumber: 14204517,
      });
    });
  });

  describe("readFacilityCodeFrom", () => {
    it.each(["    ", ""])("throws for blank/empty input '%s'", (input) => {
      expect(() => readFacilityCodeFrom(input)).toThrow();
    });

    it("throws if the input is too long (> 26 bits)", () => {
      // 0x4000000 is 1 followed by 26 zeros in binary (27 bits)
      expect(() => readFacilityCodeFrom("4000000")).toThrow("Wiegand26 is too long.");
    });

    it.each([
      ["3019E2A", 128],
      ["2521053", 41],
      ["1A7622D", 211],
      ["31C234A", 142],
      ["1A98B4B", 212],
    ])("readFacilityCodeFrom('%s') returns %d", (input, expected) => {
      expect(readFacilityCodeFrom(input)).toBe(expected);
    });
  });

  describe("readIdNumberFrom", () => {
    it.each(["    ", ""])("throws for blank/empty input '%s'", (input) => {
      expect(() => readIdNumberFrom(input)).toThrow();
    });

    it.each([
      ["3019E2A", 53013],
      ["2521053", 2089],
      ["1A7622D", 45334],
      ["31C234A", 4517],
      ["1A98B4B", 50597],
    ])("readIdNumberFrom('%s') returns %d", (input, expected) => {
      expect(readIdNumberFrom(input)).toBe(expected);
    });
  });

  describe("readDecimalPayload", () => {
    it.each(["    ", ""])("throws for blank/empty input '%s'", (input) => {
      expect(() => readDecimalPayload(input)).toThrow();
    });

    it.each([
      ["3019E2A", 8441621],
      ["2521053", 2689065],
      ["1A7622D", 13873430],
      ["31C234A", 9310629],
      ["1A98B4B", 13944229],
    ])("readDecimalPayload('%s') returns %d", (input, expected) => {
      expect(readDecimalPayload(input)).toBe(expected);
    });
  });
});
