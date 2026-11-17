import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EXPECTED_EXE_SIZE,
  EXPECTED_PERM_SHA1,
  EXPECTED_SCRAMBLE_SHA1,
  bytesEqual,
  decryptRecord,
  encryptRecord,
  hexToBytes,
  imageOffset,
  joinMycharsFile,
  loadTables,
  loadTablesSync,
  sha1Hex,
  sha1HexPure,
  splitMycharsFile,
} from '../cipher.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HANDOFF_DIR = path.resolve(__dirname, '..', '..');

const exeBytes = new Uint8Array(fs.readFileSync(path.join(HANDOFF_DIR, 'testdata', 'YSBOX.EXE')));
const vectorsJson = JSON.parse(
  fs.readFileSync(path.join(HANDOFF_DIR, 'data', 'vectors.json'), 'utf8'),
);

test('T3: Table extraction and fingerprint verification from YSBOX.EXE', async () => {
  assert.equal(exeBytes.length, EXPECTED_EXE_SIZE);
  const exeMd5 = crypto.createHash('md5').update(exeBytes).digest('hex');
  assert.equal(exeMd5, 'edb754b4a37fd615c4d3e20f2a6fd2c0');

  assert.equal(imageOffset(exeBytes), 14336);

  const tablesSync = loadTablesSync(exeBytes);
  assert.equal(tablesSync.headerSize, 14336);
  assert.equal(tablesSync.permOffset, 0x3f8a);
  assert.equal(tablesSync.scrambleOffset, 0x25182);
  assert.equal(tablesSync.permBytes.length, 128);
  assert.equal(tablesSync.entries.length, 32);
  assert.equal(tablesSync.scramble.length, 470);

  const nodePermSha1 = crypto.createHash('sha1').update(tablesSync.permBytes).digest('hex');
  const nodeScrSha1 = crypto.createHash('sha1').update(tablesSync.scramble).digest('hex');
  assert.equal(nodePermSha1, EXPECTED_PERM_SHA1);
  assert.equal(nodeScrSha1, EXPECTED_SCRAMBLE_SHA1);

  assert.equal(sha1HexPure(tablesSync.permBytes), EXPECTED_PERM_SHA1);
  assert.equal(sha1HexPure(tablesSync.scramble), EXPECTED_SCRAMBLE_SHA1);
  assert.equal(await sha1Hex(tablesSync.permBytes), EXPECTED_PERM_SHA1);
  assert.equal(await sha1Hex(tablesSync.scramble), EXPECTED_SCRAMBLE_SHA1);

  const tables = await loadTables(exeBytes);
  assert.equal(tables.fingerprintsMatch, true);
  assert.equal(tables.permSha1, EXPECTED_PERM_SHA1);
  assert.equal(tables.scrambleSha1, EXPECTED_SCRAMBLE_SHA1);
});

test('T3: Empty, non-MZ, truncated EXEs rejected cleanly and modified table warns via fingerprint mismatch', async () => {
  assert.throws(() => loadTablesSync(new Uint8Array(0)), /empty/i);
  assert.throws(() => loadTablesSync(Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0, 0])), /MZ/);
  assert.throws(() => loadTablesSync(exeBytes.slice(0, 1000)), /truncated|too short/i);
  assert.throws(() => loadTablesSync(exeBytes.slice(0, 0x25182 + 469)), /truncated|too short/i);

  const modifiedExe = exeBytes.slice();
  modifiedExe[0x3f8a] ^= 0xff;
  const modTables = await loadTables(modifiedExe);
  assert.equal(modTables.fingerprintsMatch, false);
});

test('T1: All 11 known-answer cipher vectors (22 decrypt + encrypt checks) match game output', async () => {
  const tables = await loadTables(exeBytes);
  assert.equal(vectorsJson.vectors.length, 11);

  for (const vec of vectorsJson.vectors) {
    const plain = hexToBytes(vec.plain);
    const cipher = hexToBytes(vec.cipher);
    const plainOrig = plain.slice();
    const cipherOrig = cipher.slice();

    const decrypted = decryptRecord(cipher, tables);
    const encrypted = encryptRecord(plain, tables);

    assert.equal(
      bytesEqual(decrypted, plain),
      true,
      `decrypt mismatch for vector "${vec.name}"`,
    );
    assert.equal(
      bytesEqual(encrypted, cipher),
      true,
      `encrypt mismatch for vector "${vec.name}"`,
    );
    // Input buffers must never be mutated.
    assert.equal(bytesEqual(plain, plainOrig), true);
    assert.equal(bytesEqual(cipher, cipherOrig), true);
  }
});

test('T2: Whole-file round trip and validity flags on Mychars.original.dat and Mychars.exp11.dat', async () => {
  const tables = await loadTables(exeBytes);

  for (const filename of ['Mychars.original.dat', 'Mychars.exp11.dat']) {
    const raw = new Uint8Array(fs.readFileSync(path.join(HANDOFF_DIR, 'testdata', filename)));
    const { header, records } = splitMycharsFile(raw);
    assert.equal(header.length, 64);
    assert.equal(records.length, 6);

    const reencrypted = [];
    for (let slot = 0; slot < 6; slot++) {
      const dec = decryptRecord(records[slot], tables);
      const validA = dec[0x17d];
      const validB = dec[0x1ab];

      if (slot < 5) {
        const isPair10 = validA === 1 && validB === 0;
        const isPair66 = validA === 6 && validB === 6;
        assert.equal(
          isPair10 || isPair66,
          true,
          `${filename} slot ${slot} unexpected validity flags (${validA}, ${validB})`,
        );
      } else {
        assert.equal(validA, 0);
        assert.equal(validB, 0);
        const slotName = Buffer.from(dec.slice(8, 18)).toString('latin1').split('\0')[0];
        assert.equal(slotName, 'no one');
      }

      const enc = encryptRecord(dec, tables);
      assert.equal(bytesEqual(enc, records[slot]), true, `${filename} slot ${slot} round-trip mismatch`);
      reencrypted.push(enc);
    }

    const out = joinMycharsFile(header, reencrypted);
    assert.equal(bytesEqual(out, raw), true, `${filename} whole-file round trip mismatch`);
  }
});
