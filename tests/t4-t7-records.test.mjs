import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as cipherApi from '../cipher.js';
import { FIELDS_SCHEMA, NAMES_DATA } from '../data.js';
import {
  ADVANCED_CONFIRM_TEXT,
  createSaveSession,
  decodeRecord,
  getItemDetails,
  lookupEnumName,
} from '../fields.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HANDOFF_DIR = path.resolve(__dirname, '..', '..');

const exeBytes = new Uint8Array(fs.readFileSync(path.join(HANDOFF_DIR, 'testdata', 'YSBOX.EXE')));
const tables = await cipherApi.loadTables(exeBytes);
const origBytes = new Uint8Array(
  fs.readFileSync(path.join(HANDOFF_DIR, 'testdata', 'Mychars.original.dat')),
);
const exp11Bytes = new Uint8Array(
  fs.readFileSync(path.join(HANDOFF_DIR, 'testdata', 'Mychars.exp11.dat')),
);
const expectedEdit1Bytes = new Uint8Array(
  fs.readFileSync(path.join(HANDOFF_DIR, 'testdata', 'expected', 'Mychars.edit1.dat')),
);

test('Embedded data.js matches handoff/data/fields.json and names.json verbatim', () => {
  const fieldsJson = JSON.parse(
    fs.readFileSync(path.join(HANDOFF_DIR, 'data', 'fields.json'), 'utf8'),
  );
  const namesJson = JSON.parse(
    fs.readFileSync(path.join(HANDOFF_DIR, 'data', 'names.json'), 'utf8'),
  );
  assert.deepStrictEqual(FIELDS_SCHEMA, fieldsJson);
  assert.deepStrictEqual(NAMES_DATA, namesJson);
});

test('T4: Field decoding on Mychars.original.dat slots 0 & 4 and Mychars.exp11.dat slot 0', () => {
  // 1. Mychars.original.dat, slot 0 (Grunt)
  const origSession = createSaveSession(origBytes, tables, FIELDS_SCHEMA, NAMES_DATA, cipherApi);
  const s0 = origSession.getDecodedSlot(0);
  const v0 = s0.values;

  assert.equal(v0.name, 'Grunt');
  assert.equal(v0.title, 'of Ugh');
  assert.equal(v0.name2, 'Grunt');
  assert.equal(lookupEnumName('sexes', v0.sex, NAMES_DATA), 'Male');
  assert.equal(lookupEnumName('races', v0.race, NAMES_DATA), 'Human');
  assert.equal(lookupEnumName('guilds', v0.guild, NAMES_DATA), 'Barbarian');
  assert.equal(v0.level, 0);

  assert.equal(v0.strength, 15);
  assert.equal(v0.defense, 9);
  assert.equal(v0.agility, 2);
  assert.equal(v0.initiative, 3);
  assert.equal(v0.dexterity, 4);
  assert.equal(v0.maxhp, 30);
  assert.equal(v0.curhp, 30);
  assert.equal(v0.maxmana, 8);
  assert.equal(v0.curmana, 8);
  assert.equal(v0.gold, 30);
  assert.equal(v0.exp, 0);
  assert.equal(v0.attr_points, 0);
  assert.equal(v0.spell_points, 0);
  assert.equal(v0.skill_points, 0);

  const nonZeroSpells0 = v0.spells
    .map((lvl, idx) => ({ name: NAMES_DATA.spells[idx].name, lvl }))
    .filter((e) => e.lvl !== 0);
  assert.deepStrictEqual(nonZeroSpells0, [{ name: 'True Seeing', lvl: 2 }]);

  const nonZeroSkills0 = v0.skills
    .map((lvl, idx) => ({ name: NAMES_DATA.skills[idx].name, lvl }))
    .filter((e) => e.lvl !== 0);
  assert.deepStrictEqual(nonZeroSkills0, [{ name: 'Clubs/Axes', lvl: 1 }]);

  const nonEmptyItems0 = s0.itemSlots
    .filter((it) => !it.isEmpty)
    .map((it) => ({ label: it.slotLabel, name: it.name, charges: it.charges }));
  assert.deepStrictEqual(nonEmptyItems0, [
    { label: 'Inventory 1', name: 'Heal Potion', charges: 8 },
    { label: 'Inventory 2', name: 'Mana Potion', charges: 8 },
    { label: 'Head', name: 'Leather Cap', charges: 0 },
    { label: 'Body', name: 'Cloth Jacket', charges: 0 },
    { label: 'Left hand (weapon)', name: 'Short Sword', charges: 0 },
    { label: 'Right hand (shield)', name: 'Buckler', charges: 0 },
  ]);

  assert.equal(v0.map, 1);
  assert.equal(v0.map_hi, 1);
  assert.equal(v0.cell, 48);
  assert.equal(v0.facing, 2);
  assert.equal(lookupEnumName('facing', v0.facing, NAMES_DATA), 'East');

  // Verify item skill links on original Grunt & Mana items (ids 206, 207, 208)
  const shortSword = s0.itemSlots[17];
  assert.deepStrictEqual(shortSword.skillLink, { index: 5, name: 'Fencing', level: 0 });
  const manaPotion = s0.itemSlots[1];
  assert.equal(manaPotion.name, 'Mana Potion');
  assert.equal(manaPotion.skillLink, null);
  for (const manaId of [206, 207, 208]) {
    const d = getItemDetails(manaId, v0.guild, v0.skills, v0.spells, NAMES_DATA);
    assert.equal(d.skillLink, null, `Item ${manaId} must have null skillLink`);
  }

  // 2. Mychars.original.dat, slot 4 (Sarilion)
  const s4 = origSession.getDecodedSlot(4);
  const v4 = s4.values;
  assert.equal(v4.name, 'Sarilion');
  assert.equal(v4.title, 'of Rankin');
  assert.equal(lookupEnumName('sexes', v4.sex, NAMES_DATA), 'Male');
  assert.equal(lookupEnumName('races', v4.race, NAMES_DATA), 'Elf');
  assert.equal(lookupEnumName('guilds', v4.guild, NAMES_DATA), 'Wizard');
  assert.equal(v4.level, 0);
  assert.equal(v4.strength, 8);
  assert.equal(v4.defense, 6);
  assert.equal(v4.agility, 7);
  assert.equal(v4.initiative, 4);
  assert.equal(v4.dexterity, 6);
  assert.equal(v4.maxhp, 50);
  assert.equal(v4.maxmana, 21);
  assert.equal(v4.gold, 30);

  const nonZeroSpells4 = v4.spells
    .map((lvl, idx) => ({ name: NAMES_DATA.spells[idx].name, lvl }))
    .filter((e) => e.lvl !== 0);
  assert.deepStrictEqual(nonZeroSpells4, [
    { name: 'Lightning', lvl: 2 },
    { name: 'Light Shroud', lvl: 1 },
  ]);

  const nonZeroSkills4 = v4.skills
    .map((lvl, idx) => ({ name: NAMES_DATA.skills[idx].name, lvl }))
    .filter((e) => e.lvl !== 0);
  assert.deepStrictEqual(nonZeroSkills4, [{ name: 'Rune Reading', lvl: 1 }]);

  const nonEmptyItems4 = s4.itemSlots
    .filter((it) => !it.isEmpty)
    .map((it) => ({ label: it.slotLabel, name: it.name, charges: it.charges }));
  assert.deepStrictEqual(nonEmptyItems4, [
    { label: 'Inventory 1', name: 'Short Sword', charges: 0 },
    { label: 'Inventory 2', name: 'Leather Cap', charges: 0 },
    { label: 'Inventory 3', name: 'Cloth Jacket', charges: 0 },
    { label: 'Inventory 4', name: 'Buckler', charges: 0 },
    { label: 'Inventory 5', name: 'Heal Potion', charges: 8 },
    { label: 'Inventory 6', name: 'Mana Potion', charges: 8 },
  ]);

  assert.equal(v4.map, 1);
  assert.equal(v4.map_hi, 1);
  assert.equal(v4.cell, 48);
  assert.equal(lookupEnumName('facing', v4.facing, NAMES_DATA), 'East');

  // 3. Mychars.exp11.dat, slot 0 (Grunt Cleric)
  const exp11Session = createSaveSession(exp11Bytes, tables, FIELDS_SCHEMA, NAMES_DATA, cipherApi);
  const e0 = exp11Session.getDecodedSlot(0);
  const ev0 = e0.values;
  assert.equal(lookupEnumName('guilds', ev0.guild, NAMES_DATA), 'Cleric');
  assert.equal(ev0.gold, 1000);

  const nonEmptyItemsE0 = e0.itemSlots
    .filter((it) => !it.isEmpty)
    .map((it) => ({ label: it.slotLabel, name: it.name }));
  assert.deepStrictEqual(nonEmptyItemsE0, [
    { label: 'Inventory 1', name: 'Heal Potion' },
    { label: 'Inventory 2', name: 'Mana Potion' },
    { label: 'Inventory 3', name: 'Short Sword' },
    { label: 'Head', name: 'Leather Cap' },
    { label: 'Body', name: 'Cloth Jacket' },
    { label: 'Left hand (weapon)', name: 'Battle Axe' },
    { label: 'Right hand (shield)', name: 'Buckler' },
  ]);

  // Battle Axe in Left hand shows "Not for Cleric" and links to Clubs/Axes level 1
  const battleAxe = e0.itemSlots[17];
  assert.equal(battleAxe.name, 'Battle Axe');
  assert.equal(battleAxe.id ?? battleAxe.itemId, 19);
  assert.equal(battleAxe.forbiddenForGuild, true);
  assert.equal(battleAxe.forbidBadge, 'Not for Cleric');
  assert.deepStrictEqual(battleAxe.skillLink, { index: 1, name: 'Clubs/Axes', level: 1 });

  assert.equal(ev0.map, 6);
  assert.equal(ev0.map_hi, 1);
  assert.equal(ev0.cell, 15);
  assert.equal(ev0.facing, 0);
  assert.equal(lookupEnumName('facing', ev0.facing, NAMES_DATA), 'West');
});

test('T5: Edit round trip from Mychars.exp11.dat (facing=3, gold=1234) equals Mychars.edit1.dat byte-for-byte', () => {
  const session = createSaveSession(exp11Bytes, tables, FIELDS_SCHEMA, NAMES_DATA, cipherApi);
  session.setScalarField(0, 'facing', 3);
  session.setScalarField(0, 'gold', 1234);

  const res = session.reviewDiffAndVerify();
  assert.equal(res.ok, true);
  assert.equal(session.canExport(), true);

  const outBytes = session.getVerifiedOutputBytes();
  assert.equal(
    cipherApi.bytesEqual(outBytes, expectedEdit1Bytes),
    true,
    'Produced output must equal expected/Mychars.edit1.dat byte-for-byte',
  );
  const outMd5 = crypto.createHash('md5').update(outBytes).digest('hex');
  assert.equal(outMd5, '343ee5e5d9e5bb14726fba1c35b79b8a');

  // Verify exact plaintext byte diffs and untouched header + slots 1..5
  assert.deepStrictEqual(
    res.diff.byteDiffs.map((d) => [d.offset, d.oldByte, d.newByte]),
    [
      [0x9b, 0xe8, 0xd2],
      [0x9c, 0x03, 0x04],
      [0xf5, 0x00, 0x03],
    ],
  );
  assert.equal(
    cipherApi.bytesEqual(outBytes.subarray(0, 64), exp11Bytes.subarray(0, 64)),
    true,
  );
  for (let slot = 1; slot < 6; slot++) {
    const start = 64 + slot * 502;
    assert.equal(
      cipherApi.bytesEqual(
        outBytes.subarray(start, start + 502),
        exp11Bytes.subarray(start, start + 502),
      ),
      true,
    );
  }
});

test('T6: Only touch what the user changed (no-op export, 1-char name edit, slot isolation, revert)', () => {
  // 1. Open, change nothing, export -> byte-identical
  const sNoop = createSaveSession(origBytes, tables, FIELDS_SCHEMA, NAMES_DATA, cipherApi);
  const noopRes = sNoop.reviewDiffAndVerify();
  assert.equal(noopRes.ok, true);
  assert.equal(noopRes.diff.hasChanges, false);
  assert.equal(cipherApi.bytesEqual(sNoop.getVerifiedOutputBytes(), origBytes), true);

  // 2. Change one name character (default synced copy + unsynced mode)
  const sNameSync = createSaveSession(origBytes, tables, FIELDS_SCHEMA, NAMES_DATA, cipherApi);
  sNameSync.setScalarField(0, 'name', 'Grint');
  const syncRes = sNameSync.reviewDiffAndVerify();
  assert.equal(syncRes.ok, true);
  const outSync = sNameSync.getVerifiedOutputBytes();
  for (let slot = 1; slot < 6; slot++) {
    const start = 64 + slot * 502;
    assert.equal(
      cipherApi.bytesEqual(outSync.subarray(start, start + 502), origBytes.subarray(start, start + 502)),
      true,
    );
  }
  assert.deepStrictEqual(
    syncRes.diff.byteDiffs.map((b) => b.offset),
    [0x0a, 0xe9],
  );
  const name2Diff = syncRes.diff.fieldDiffs.find((f) => f.fieldId === 'name2');
  assert.ok(name2Diff && /0xE7/i.test(name2Diff.note), 'Diff view must explain 0xE7 second copy write');

  // Unsynced mode: only 0x08..0x11 changes
  const sNameOnly = createSaveSession(origBytes, tables, FIELDS_SCHEMA, NAMES_DATA, cipherApi);
  sNameOnly.setScalarField(0, 'name', 'Grint', { syncName2: false });
  const onlyRes = sNameOnly.reviewDiffAndVerify();
  assert.equal(onlyRes.ok, true);
  assert.deepStrictEqual(
    onlyRes.diff.byteDiffs.map((b) => b.offset),
    [0x0a],
  );

  // 3. Revert slot restores exact byte-identity
  sNameSync.revertSlot(0);
  const revRes = sNameSync.reviewDiffAndVerify();
  assert.equal(revRes.ok, true);
  assert.equal(revRes.diff.hasChanges, false);
  assert.equal(cipherApi.bytesEqual(sNameSync.getVerifiedOutputBytes(), origBytes), true);
});

test('T7: Safety rules (size check, self-check & diff gating, locked fields, validity preservation, str10 limit)', () => {
  // 1. Non-3076 bytes rejected
  assert.throws(
    () => createSaveSession(origBytes.slice(0, 3075), tables, FIELDS_SCHEMA, NAMES_DATA, cipherApi),
    /3076/,
  );
  assert.throws(
    () => createSaveSession(new Uint8Array(3077), tables, FIELDS_SCHEMA, NAMES_DATA, cipherApi),
    /3076/,
  );

  // 2. Download gated on self-check & diff review
  const session = createSaveSession(exp11Bytes, tables, FIELDS_SCHEMA, NAMES_DATA, cipherApi);
  assert.equal(session.canExport(), false);
  assert.throws(() => session.getVerifiedOutputBytes(), /Diff Review/i);

  session.setScalarField(0, 'gold', 50000);
  assert.equal(session.canExport(), false);

  const review = session.reviewDiffAndVerify();
  assert.equal(review.ok, true);
  assert.equal(session.canExport(), true);

  // Subsequent edit invalidates review & re-locks export
  session.setScalarField(0, 'strength', 200);
  assert.equal(session.canExport(), false);

  // Broken encryptor triggers self-check failure and blocks export
  const brokenCipherApi = {
    ...cipherApi,
    encryptRecord(rec, t) {
      const bad = cipherApi.encryptRecord(rec, t);
      bad[20] ^= 0x01;
      return bad;
    },
  };
  const badSession = createSaveSession(exp11Bytes, tables, FIELDS_SCHEMA, NAMES_DATA, brokenCipherApi);
  badSession.setScalarField(0, 'gold', 999);
  const badReview = badSession.reviewDiffAndVerify();
  assert.equal(badReview.ok, false);
  assert.match(badReview.error, /self-check failed/i);
  assert.equal(badSession.canExport(), false);
  assert.throws(() => badSession.getVerifiedOutputBytes(), /Cannot export/i);

  // 3. risk: locked fields cannot be edited without advanced mode + confirmation text
  assert.throws(() => session.setScalarField(0, 'map', 6), /locked/i);
  assert.throws(() => session.setScalarField(0, 'map_hi', 2), /locked/i);
  assert.throws(() => session.setScalarField(0, 'valid_a', 1), /locked/i);
  assert.throws(() => session.setScalarField(0, 'valid_b', 0), /locked/i);
  assert.throws(() => session.setScalarField(0, 'unk06', 0), /locked/i);

  // Partial confirmation without phrase is refused
  assert.throws(
    () => session.setAdvancedMode(true, { acknowledged: true, text: 'yes' }),
    /illegal map code/i,
  );
  assert.equal(session.advancedConfirmed, false);

  // Proper confirmation unlocks locked fields
  session.setAdvancedMode(true, { acknowledged: true, text: ADVANCED_CONFIRM_TEXT });
  assert.equal(session.advancedConfirmed, true);
  session.setScalarField(0, 'map', 1);
  assert.equal(session.getDecodedSlot(0).values.map, 1);

  // Locking again protects locked fields once more
  session.setAdvancedMode(false);
  assert.throws(() => session.setScalarField(0, 'map', 6), /locked/i);

  // 4. Editing non-locked fields preserves validity flags
  const sValid = createSaveSession(exp11Bytes, tables, FIELDS_SCHEMA, NAMES_DATA, cipherApi);
  sValid.setScalarField(0, 'name', 'Hero');
  sValid.setScalarField(0, 'strength', 65535);
  sValid.setArrayElement(0, 'items', 17, 20);
  sValid.setArrayElement(0, 'charges', 0, 99);
  assert.equal(sValid.workingPlainRecords[0][0x17d], 6);
  assert.equal(sValid.workingPlainRecords[0][0x1ab], 6);
  assert.doesNotThrow(() => decodeRecord(sValid.workingPlainRecords[0], FIELDS_SCHEMA, NAMES_DATA));

  // 5. Name > 10 bytes refused; 10 bytes accepted with warning
  assert.throws(() => sValid.setScalarField(0, 'name', '12345678901'), /10 bytes/);
  const tenRes = sValid.setScalarField(0, 'name', '1234567890');
  assert.equal(sValid.getDecodedSlot(0).values.name, '1234567890');
  assert.equal(tenRes.warnings.length > 0, true);
  assert.match(tenRes.warnings[0], /above 9/);
});
