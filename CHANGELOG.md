# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-06

* [Breaking] **Node.js: all functions are now synchronous.** `encode26`, `decode26`, `encode64`, and `decode64` no longer return Promises in the Node.js build. If you were using `await`, simply remove it.
* [Breaking] **Browser: `decode26`, `encode64`, `decode64` are now synchronous.** Only `encode26` remains async in the browser build (Web Crypto API requirement).
* [Performance] Eliminate unnecessary async/await overhead on Node.js by using a synchronous encoder backed by `node:crypto`.
* Make `decode26`, `encode64`, and `decode64` fully synchronous on all platforms (they never needed async).

## [1.0.5] - 2026-03-06

* [Performance] Ship separate Node.js and browser builds via conditional `package.json` exports. Node.js uses synchronous `node:crypto` for SHA-1 hashing; browsers use the Web Crypto API. Zero runtime detection overhead.
* [Performance] Replace `BigInt` operations with native `number` bitwise operations in Wiegand 26-bit encoding/decoding.
* [Performance] Eliminate redundant hex-to-binary parsing in `decode` (single `parseInt` + bit shifts instead of three separate conversions).
* [Performance] Remove `encode` → `decode` round-trip; build the result directly from computed values.

## [1.0.4] - 2026-03-03

* Include `CHANGELOG.md` in the published npm package.

## [1.0.3] - 2026-02-26

* Publish to `npmjs` through Github Actions, with provenance.
  
## [1.0.2] - 2026-02-13

* Export type `Wiegand26Result`

## [1.0.1] - 2026-02-13

* First javascript implementation from `https://github.com/looorent/anpr-wiegand`