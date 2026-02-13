import { describe, expect, it } from "vitest";
import { decode, encode } from "../src/internal/wiegand64";

describe("wiegand64", () => {
  describe("encode", () => {
    it("returns undefined for null", async () => {
      expect(await encode(null)).toBeUndefined();
    });

    it("returns undefined for undefined", async () => {
      expect(await encode(undefined)).toBeUndefined();
    });

    it.each(["", "   ", " "])("returns undefined for blank input '%s'", async (blank) => {
      expect(await encode(blank)).toBeUndefined();
    });

    it.each(["azertyuiop0987", "1234567899879825", "nnnnnnnnnnnnnnnn"])("throws for very long plate '%s'", async (plate) => {
      await expect(encode(plate)).rejects.toThrow();
    });

    it.each([
      ["AZERTYUIOP", "66B37ABB72BA2A29"],
      ["Z", "6000000000000033"],
      ["1WFV385", "6000011C1FBD3615"],
      ["1SDF534", "6000011B1D7D54D4"],
      ["ADF543", "600000069D7D5513"],
      ["DE56G", "600000001D7955A0"],
      ["FF23DDFDF5", "67DF49375D7DD7D5"],
      ["AZERTYUIOI", "66B37ABB72BA2A22"],
      ["1FRDEERE", "600045FADD79EADE"],
      ["2ZZD456", "6000012CF3754556"],
      ["1T1234", "600000046D4524D4"],
    ])("encode('%s') returns '%s'", async (plate, expectedHash) => {
      const result = await encode(plate);
      expect(result).toBe(expectedHash);
      expect(result?.length).toBe(16);
    });

    it.each([
      ["A", "600000000000001A"],
      ["EE", "600000000000079E"],
      ["012", "6000000000010452"],
      ["1T", "600000000000046D"],
      ["789", "6000000000017619"],
      ["42", "6000000000000512"],
      ["1337", "60000000004534D7"],
      ["CB", "600000000000071B"],
      ["ZIP", "60000000000338A9"],
      ["WAP", "60000000000306A9"],
      ["IU", "60000000000008AE"],
      ["PL", "6000000000000A65"],
    ])("encode('%s') (short plate) returns '%s'", async (plate, expectedHash) => {
      const result = await encode(plate);
      expect(result).toBe(expectedHash);
      expect(result?.length).toBe(16);
    });

    it.each([
      ["HK 55 EVB", "600002191555EBDB"],
      ["VR46#T", "600000002FAD45AD"],
      [" VR46#T   ", "600000002FAD45AD"],
    ])("encode('%s') (special chars) returns '%s'", async (plate, expectedHash) => {
      const result = await encode(plate);
      expect(result).toBe(expectedHash);
      expect(result?.length).toBe(16);
    });
  });

  describe("decode", () => {
    it("returns undefined for null", async () => {
      expect(await decode(null)).toBeUndefined();
    });

    it("returns undefined for undefined", async () => {
      expect(await decode(undefined)).toBeUndefined();
    });

    it.each(["", "   ", " "])("returns undefined for blank input '%s'", async (blank) => {
      expect(await decode(blank)).toBeUndefined();
    });

    it.each([
      ["66B37ABB72BA2A29", "AZERTYUIOP"],
      ["6000000000000033", "Z"],
      ["6000011C1FBD3615", "1WFV385"],
      ["600002191555EBDB", "HK55EVB"],
      // 0x6FFFFFFFFFFFFFFF = Header (6) + ten blocks of 111111 (63)
      ["6FFFFFFFFFFFFFFF", "??????????"],
      // 0x600000000000003F = Header (6) + nine blocks of 000000 (space) + one block of 111111 (63) -> " ?" -> trimmed to "?"
      ["600000000000003F", "?"],
    ])("decode('%s') returns '%s'", async (hex, expectedPlate) => {
      expect(await decode(hex)).toBe(expectedPlate);
    });
  });
});