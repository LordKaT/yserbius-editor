/**
 * Shadow of Yserbius (1993) MYCHARS.DAT record cipher & YSBOX.EXE table extractor.
 * Pure byte-array implementation (zero DOM dependencies) for browser and Node.js.
 *
 * Algorithm faithfully ported from reference/record_cipher_ref.py
 * (disassembly of YSBOX.EXE 1000:030F encrypt and 1000:051D decrypt).
 */
const YserbiusCipher = (() => {
  'use strict';

  const KEY_INIT = Uint8Array.from([0x12, 0x2F, 0x39, 0x39, 0x32, 0x21, 0x07, 0x0C]);
  const RECORD_SIZE = 502;
  const HEADER_SIZE = 0x40;
  const SLOTS = 6;
  const FILE_SIZE = HEADER_SIZE + SLOTS * RECORD_SIZE; // 3076
  const ENCRYPTED_START = 8;
  const ENCRYPTED_LEN = 0x1C4; // 452

  const PERM_IMAGE_OFF = 0x078A;
  const PERM_BYTE_LEN = 128;
  const SCRAMBLE_IMAGE_OFF = 0x20250 + 0x1732; // 0x21982
  const SCRAMBLE_NEEDED = 470;

  const EXPECTED_EXE_SIZE = 345952;
  const EXPECTED_PERM_SHA1 = '5e8cf8f7c345276f88ecfc63bf9c4d6a0f6bc51a';
  const EXPECTED_SCRAMBLE_SHA1 = '3ff6a94f080b5591d8f129a93f547c1828f8f3dd';

  /** Convert an ArrayBuffer or TypedArray view into a Uint8Array without mutating source. */
  function toUint8Array(input, label = 'input') {
    if (input instanceof Uint8Array) {
      return input;
    }
    if (input instanceof ArrayBuffer) {
      return new Uint8Array(input);
    }
    if (ArrayBuffer.isView(input)) {
      return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }
    throw new TypeError(`${label} must be a Uint8Array or ArrayBuffer.`);
  }

  /** Compare two byte arrays for exact byte-for-byte equality. */
  function bytesEqual(a, b) {
    if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  /** Convert a hex string to a Uint8Array. */
  function hexToBytes(hex) {
    const clean = hex.replace(/\s+/g, '');
    if (clean.length % 2 !== 0) {
      throw new RangeError('Hex string must have an even number of digits.');
    }
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) {
      const byte = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
      if (Number.isNaN(byte)) {
        throw new RangeError(`Invalid hex byte at index ${i}.`);
      }
      out[i] = byte;
    }
    return out;
  }

  /** Convert a Uint8Array to a lowercase hex string. */
  function bytesToHex(bytes) {
    const arr = toUint8Array(bytes, 'bytes');
    let out = '';
    for (let i = 0; i < arr.length; i++) {
      out += arr[i].toString(16).padStart(2, '0');
    }
    return out;
  }

  /** Pure-JS FIPS 180-4 SHA-1 fallback when Web Crypto subtle.digest is unavailable (e.g., insecure file://). */
  function sha1HexPure(input) {
    const data = toUint8Array(input, 'input');
    const bitLen = data.length * 8;
    const totalLen = Math.ceil((data.length + 9) / 64) * 64;
    const padded = new Uint8Array(totalLen);
    padded.set(data);
    padded[data.length] = 0x80;

    const dv = new DataView(padded.buffer);
    const hiBits = Math.floor(bitLen / 0x100000000);
    const loBits = bitLen >>> 0;
    dv.setUint32(totalLen - 8, hiBits, false);
    dv.setUint32(totalLen - 4, loBits, false);

    let h0 = 0x67452301;
    let h1 = 0xEFCDAB89;
    let h2 = 0x98BADCFE;
    let h3 = 0x10325476;
    let h4 = 0xC3D2E1F0;

    const w = new Uint32Array(80);
    const rotl = (n, s) => ((n << s) | (n >>> (32 - s))) >>> 0;

    for (let chunk = 0; chunk < totalLen; chunk += 64) {
      for (let i = 0; i < 16; i++) {
        w[i] = dv.getUint32(chunk + i * 4, false);
      }
      for (let i = 16; i < 80; i++) {
        w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
      }

      let a = h0;
      let b = h1;
      let c = h2;
      let d = h3;
      let e = h4;

      for (let i = 0; i < 80; i++) {
        let f;
        let k;
        if (i < 20) {
          f = (b & c) | ((~b) & d);
          k = 0x5A827999;
        } else if (i < 40) {
          f = b ^ c ^ d;
          k = 0x6ED9EBA1;
        } else if (i < 60) {
          f = (b & c) | (b & d) | (c & d);
          k = 0x8F1BBCDC;
        } else {
          f = b ^ c ^ d;
          k = 0xCA62C1D6;
        }
        const temp = (rotl(a, 5) + (f >>> 0) + e + k + w[i]) >>> 0;
        e = d;
        d = c;
        c = rotl(b, 30);
        b = a;
        a = temp;
      }

      h0 = (h0 + a) >>> 0;
      h1 = (h1 + b) >>> 0;
      h2 = (h2 + c) >>> 0;
      h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0;
    }

    return [h0, h1, h2, h3, h4]
      .map((word) => word.toString(16).padStart(8, '0'))
      .join('');
  }

  /** Compute lowercase SHA-1 hex digest, preferring Web Crypto SubtleCrypto when available. */
  async function sha1Hex(input) {
    const data = toUint8Array(input, 'input');
    if (globalThis.crypto && globalThis.crypto.subtle && typeof globalThis.crypto.subtle.digest === 'function') {
      try {
        const cleanCopy = new Uint8Array(data);
        const digest = await globalThis.crypto.subtle.digest('SHA-1', cleanCopy);
        return bytesToHex(new Uint8Array(digest));
      } catch {
        // Fall through to pure-JS SHA-1 if a restricted environment disables SubtleCrypto.
      }
    }
    return sha1HexPure(data);
  }

  /**
   * Compute offset of the DOS MZ program image inside YSBOX.EXE:
   * MZ header size in paragraphs (u16le at offset 8) * 16.
   */
  function imageOffset(exeInput) {
    const exe = toUint8Array(exeInput, 'YSBOX.EXE');
    if (exe.length === 0) {
      throw new Error('YSBOX.EXE file is empty.');
    }
    if (exe.length < 10 || exe[0] !== 0x4D || exe[1] !== 0x5A) {
      throw new Error('Not a valid DOS MZ executable (missing "MZ" header).');
    }
    const dv = new DataView(exe.buffer, exe.byteOffset, exe.byteLength);
    return dv.getUint16(8, true) * 16;
  }

  /** Synchronously extract lookup tables P (32 bit-masks) and S (470 bytes) from YSBOX.EXE. */
  function loadTablesSync(exeInput) {
    const exe = toUint8Array(exeInput, 'YSBOX.EXE');
    const hs = imageOffset(exe);
    const permOffset = hs + PERM_IMAGE_OFF;
    const scrambleOffset = hs + SCRAMBLE_IMAGE_OFF;

    if (
      permOffset < 0 ||
      permOffset + PERM_BYTE_LEN > exe.length ||
      scrambleOffset < 0 ||
      scrambleOffset + SCRAMBLE_NEEDED > exe.length
    ) {
      throw new Error(
        `EXE is truncated or too short to contain the cipher lookup tables (got ${exe.length} bytes).`,
      );
    }

    const permBytes = exe.slice(permOffset, permOffset + PERM_BYTE_LEN);
    const scramble = exe.slice(scrambleOffset, scrambleOffset + SCRAMBLE_NEEDED);
    const permView = new DataView(permBytes.buffer, permBytes.byteOffset, permBytes.byteLength);
    const entries = new Array(32);
    for (let k = 0; k < 32; k++) {
      entries[k] = [permView.getUint16(4 * k, true), permView.getUint16(4 * k + 2, true)];
    }

    return {
      exeSize: exe.length,
      headerSize: hs,
      permOffset,
      scrambleOffset,
      permBytes,
      entries,
      scramble,
    };
  }

  /** Extract lookup tables and verify SHA-1 fingerprints against the known tested YSBOX.EXE. */
  async function loadTables(exeInput) {
    const tables = loadTablesSync(exeInput);
    const permSha1 = await sha1Hex(tables.permBytes);
    const scrambleSha1 = await sha1Hex(tables.scramble);
    const fingerprintsMatch =
      permSha1 === EXPECTED_PERM_SHA1 && scrambleSha1 === EXPECTED_SCRAMBLE_SHA1;

    return {
      ...tables,
      permSha1,
      scrambleSha1,
      expectedPermSha1: EXPECTED_PERM_SHA1,
      expectedScrambleSha1: EXPECTED_SCRAMBLE_SHA1,
      expectedExeSize: EXPECTED_EXE_SIZE,
      fingerprintsMatch,
    };
  }

  /** Rotate entries T[lo..hi] inclusive left by one place. */
  function rotateLeft(T, lo, hi) {
    const first = T[lo];
    for (let idx = lo; idx < hi; idx++) {
      T[idx] = T[idx + 1];
    }
    T[hi] = first;
  }

  /**
   * Encrypt or decrypt one 502-byte character record without mutating inputs.
   * Bytes 0..7 and 460..501 are copied through unchanged; bytes 8..459 (452 bytes) are transformed.
   */
  function cryptRecord(recordInput, entries, scrambleInput, encrypt) {
    const record = toUint8Array(recordInput, 'record');
    if (record.length !== RECORD_SIZE) {
      throw new RangeError(`Record must be exactly ${RECORD_SIZE} bytes, got ${record.length}.`);
    }
    if (!Array.isArray(entries) || entries.length !== 32) {
      throw new RangeError('Permutation table P must have exactly 32 entries.');
    }
    const scramble = toUint8Array(scrambleInput, 'scramble');
    if (scramble.length < SCRAMBLE_NEEDED) {
      throw new RangeError(`Scramble table S must have at least ${SCRAMBLE_NEEDED} bytes.`);
    }

    const key = new Uint8Array(KEY_INIT);
    key[2] = key[6];
    const d = record.slice(ENCRYPTED_START, ENCRYPTED_START + ENCRYPTED_LEN);
    const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
    const T = entries.map((pair) => [pair[0], pair[1]]);

    if (encrypt) {
      let bp = key[0];
      for (let i = 0; i < ENCRYPTED_LEN; i++) {
        const s = scramble[bp];
        const tmp = d[i];
        d[i] = d[s];
        d[s] = tmp;
        d[s] ^= s;
        bp += 1;
      }
    } else {
      let bp = key[7] + ENCRYPTED_LEN - 1;
      for (let i = ENCRYPTED_LEN - 1; i >= 0; i--) {
        const s = scramble[bp];
        const tmp = d[i];
        d[i] = d[s];
        d[s] = tmp;
        bp -= 1;
      }
    }

    for (let off = 0; off < ENCRYPTED_LEN; off += 4) {
      for (let r = 0; r < key[5] + 1; r++) {
        rotateLeft(T, 0, 24);
      }
      for (let r = 0; r < key[2] + 1; r++) {
        rotateLeft(T, 18, 28);
      }

      if (encrypt) {
        const v = dv.getUint32(off, true);
        const lo = v & 0xFFFF;
        const hi = v >>> 16;
        let acc = 0;
        for (let k = 0; k < 32; k++) {
          const w0 = T[k][0];
          const w1 = T[k][1];
          const bit = w0 !== 0 ? ((w0 & lo) !== 0 ? 1 : 0) : ((w1 & hi) !== 0 ? 1 : 0);
          acc = ((acc << 1) | bit) >>> 0;
        }
        dv.setUint32(off, acc >>> 0, false);
        key[2] = (d[off] + d[off + 1] + d[off + 2] + d[off + 3]) & 0xFF;
      } else {
        key[2] = (d[off] + d[off + 1] + d[off + 2] + d[off + 3]) & 0xFF;
        const acc = dv.getUint32(off, false);
        let lo = 0;
        let hi = 0;
        for (let k = 0; k < 32; k++) {
          if ((acc >>> (31 - k)) & 1) {
            const w0 = T[k][0];
            const w1 = T[k][1];
            if (w0 !== 0) {
              lo |= w0;
            } else {
              hi |= w1;
            }
          }
        }
        const word = ((lo & 0xFFFF) | ((hi & 0xFFFF) << 16)) >>> 0;
        dv.setUint32(off, word, true);
      }
    }

    if (encrypt) {
      let bp = key[7];
      for (let i = 0; i < ENCRYPTED_LEN; i++) {
        const s = scramble[bp];
        const tmp = d[i];
        d[i] = d[s];
        d[s] = tmp;
        bp += 1;
      }
    } else {
      let bp = key[0] + ENCRYPTED_LEN - 1;
      for (let i = ENCRYPTED_LEN - 1; i >= 0; i--) {
        const s = scramble[bp];
        d[s] ^= s;
        const tmp = d[i];
        d[i] = d[s];
        d[s] = tmp;
        bp -= 1;
      }
    }

    const out = new Uint8Array(RECORD_SIZE);
    out.set(record.subarray(0, ENCRYPTED_START), 0);
    out.set(d, ENCRYPTED_START);
    out.set(record.subarray(ENCRYPTED_START + ENCRYPTED_LEN, RECORD_SIZE), ENCRYPTED_START + ENCRYPTED_LEN);
    return out;
  }

  /** Encrypt a 502-byte plaintext character record using loaded tables `{ entries, scramble }`. */
  function encryptRecord(plainRecord, tables) {
    if (!tables || !tables.entries || !tables.scramble) {
      throw new TypeError('Tables object with { entries, scramble } is required.');
    }
    return cryptRecord(plainRecord, tables.entries, tables.scramble, true);
  }

  /** Decrypt a 502-byte ciphertext character record using loaded tables `{ entries, scramble }`. */
  function decryptRecord(cipherRecord, tables) {
    if (!tables || !tables.entries || !tables.scramble) {
      throw new TypeError('Tables object with { entries, scramble } is required.');
    }
    return cryptRecord(cipherRecord, tables.entries, tables.scramble, false);
  }

  /** Validate a MYCHARS.DAT file is exactly 3076 bytes and split into cloned header + 6 records. */
  function splitMycharsFile(fileInput) {
    const data = toUint8Array(fileInput, 'Mychars.dat');
    if (data.length !== FILE_SIZE) {
      throw new RangeError(
        `Mychars.dat must be exactly ${FILE_SIZE} bytes (0x40 + 6 x 502), got ${data.length} bytes.`,
      );
    }
    const header = data.slice(0, HEADER_SIZE);
    const records = new Array(SLOTS);
    for (let i = 0; i < SLOTS; i++) {
      const start = HEADER_SIZE + i * RECORD_SIZE;
      records[i] = data.slice(start, start + RECORD_SIZE);
    }
    return { header, records };
  }

  /** Assemble a 64-byte header and six 502-byte records into a fresh 3076-byte MYCHARS.DAT buffer. */
  function joinMycharsFile(headerInput, records) {
    const header = toUint8Array(headerInput, 'header');
    if (header.length !== HEADER_SIZE) {
      throw new RangeError(`Header must be ${HEADER_SIZE} bytes, got ${header.length}.`);
    }
    if (!Array.isArray(records) || records.length !== SLOTS) {
      throw new RangeError(`Expected ${SLOTS} records.`);
    }
    const out = new Uint8Array(FILE_SIZE);
    out.set(header, 0);
    for (let i = 0; i < SLOTS; i++) {
      const rec = toUint8Array(records[i], `record[${i}]`);
      if (rec.length !== RECORD_SIZE) {
        throw new RangeError(`Record ${i} must be ${RECORD_SIZE} bytes, got ${rec.length}.`);
      }
      out.set(rec, HEADER_SIZE + i * RECORD_SIZE);
    }
    return out;
  }

  return {
    KEY_INIT,
    RECORD_SIZE,
    HEADER_SIZE,
    SLOTS,
    FILE_SIZE,
    ENCRYPTED_START,
    ENCRYPTED_LEN,
    PERM_IMAGE_OFF,
    PERM_BYTE_LEN,
    SCRAMBLE_IMAGE_OFF,
    SCRAMBLE_NEEDED,
    EXPECTED_EXE_SIZE,
    EXPECTED_PERM_SHA1,
    EXPECTED_SCRAMBLE_SHA1,
    bytesEqual,
    hexToBytes,
    bytesToHex,
    sha1HexPure,
    sha1Hex,
    imageOffset,
    loadTablesSync,
    loadTables,
    cryptRecord,
    encryptRecord,
    decryptRecord,
    splitMycharsFile,
    joinMycharsFile,
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.YserbiusCipher = YserbiusCipher;
}

if (typeof exports === 'object' && typeof module === 'object') {
  exports.KEY_INIT = YserbiusCipher.KEY_INIT;
  exports.RECORD_SIZE = YserbiusCipher.RECORD_SIZE;
  exports.HEADER_SIZE = YserbiusCipher.HEADER_SIZE;
  exports.SLOTS = YserbiusCipher.SLOTS;
  exports.FILE_SIZE = YserbiusCipher.FILE_SIZE;
  exports.ENCRYPTED_START = YserbiusCipher.ENCRYPTED_START;
  exports.ENCRYPTED_LEN = YserbiusCipher.ENCRYPTED_LEN;
  exports.PERM_IMAGE_OFF = YserbiusCipher.PERM_IMAGE_OFF;
  exports.PERM_BYTE_LEN = YserbiusCipher.PERM_BYTE_LEN;
  exports.SCRAMBLE_IMAGE_OFF = YserbiusCipher.SCRAMBLE_IMAGE_OFF;
  exports.SCRAMBLE_NEEDED = YserbiusCipher.SCRAMBLE_NEEDED;
  exports.EXPECTED_EXE_SIZE = YserbiusCipher.EXPECTED_EXE_SIZE;
  exports.EXPECTED_PERM_SHA1 = YserbiusCipher.EXPECTED_PERM_SHA1;
  exports.EXPECTED_SCRAMBLE_SHA1 = YserbiusCipher.EXPECTED_SCRAMBLE_SHA1;
  exports.bytesEqual = YserbiusCipher.bytesEqual;
  exports.hexToBytes = YserbiusCipher.hexToBytes;
  exports.bytesToHex = YserbiusCipher.bytesToHex;
  exports.sha1HexPure = YserbiusCipher.sha1HexPure;
  exports.sha1Hex = YserbiusCipher.sha1Hex;
  exports.imageOffset = YserbiusCipher.imageOffset;
  exports.loadTablesSync = YserbiusCipher.loadTablesSync;
  exports.loadTables = YserbiusCipher.loadTables;
  exports.cryptRecord = YserbiusCipher.cryptRecord;
  exports.encryptRecord = YserbiusCipher.encryptRecord;
  exports.decryptRecord = YserbiusCipher.decryptRecord;
  exports.splitMycharsFile = YserbiusCipher.splitMycharsFile;
  exports.joinMycharsFile = YserbiusCipher.joinMycharsFile;
}
