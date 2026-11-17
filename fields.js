/**
 * Shadow of Yserbius (1993) MYCHARS.DAT schema-driven record decoder, editor session,
 * relational item/skill/spell/guild helpers, diff builder, and self-verification.
 * Zero DOM dependencies: works identically in the browser and Node.js.
 */
const YserbiusFields = (() => {
  'use strict';

  const ADVANCED_CONFIRM_TEXT = 'illegal map code';

  /** Compute byte size of a schema field type string. */
  function fieldByteSize(type) {
    if (type === 'u8') return 1;
    if (type === 'u16') return 2;
    if (type === 'str10') return 10;
    const u16Arr = /^u16\[(\d+)\]$/.exec(type);
    if (u16Arr) return Number(u16Arr[1]) * 2;
    const u8Arr = /^u8\[(\d+)\]$/.exec(type);
    if (u8Arr) return Number(u8Arr[1]);
    const bytesArr = /^bytes\[(\d+)\]$/.exec(type);
    if (bytesArr) return Number(bytesArr[1]);
    throw new Error(`Unsupported field type in schema: ${type}`);
  }

  /** Format byte offset as uppercase hex string like 0x08 or 0x17D. */
  function formatHexOffset(offset) {
    return '0x' + offset.toString(16).toUpperCase().padStart(2, '0');
  }

  /** Build lookup map from field id -> field definition using fields.json schema. */
  function buildFieldMap(schema) {
    const map = new Map();
    for (const field of schema.fields) {
      map.set(field.id, field);
    }
    return map;
  }

  /** Decode a 10-byte NUL-padded Latin-1 string at offset. */
  function decodeStr10(plainBytes, offset) {
    let out = '';
    for (let i = 0; i < 10; i++) {
      const b = plainBytes[offset + i];
      if (b === 0) break;
      out += String.fromCharCode(b);
    }
    return out;
  }

  /** Read raw 10 bytes of a str10 field as an array of integers. */
  function readStr10RawBytes(plainBytes, offset) {
    const arr = new Array(10);
    for (let i = 0; i < 10; i++) {
      arr[i] = plainBytes[offset + i];
    }
    return arr;
  }

  /** Validate and encode a string into 10 NUL-padded Latin-1 bytes. */
  function validateAndEncodeStr10(str) {
    if (typeof str !== 'string') {
      throw new TypeError('String value expected.');
    }
    if (str.length > 10) {
      throw new RangeError(
        `Text "${str}" is ${str.length} bytes; maximum allowed is 10 bytes.`,
      );
    }
    const encoded = new Uint8Array(10);
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code === 0 || code > 0xff) {
        throw new RangeError(
          `Character "${str[i]}" (U+${code.toString(16).toUpperCase()}) is outside Latin-1 printable range (1..255).`,
        );
      }
      encoded[i] = code;
    }
    const warning =
      str.length === 10
        ? '10 characters fills all 10 bytes with no NUL terminator; lengths above 9 have not been edit-tested.'
        : null;
    return { bytes: encoded, warning };
  }

  /** Validate an integer fits within unsigned 8-bit or 16-bit storage. */
  function validateUint(value, max) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) {
      throw new RangeError(`Value must be an integer between 0 and ${max}, got ${value}.`);
    }
    return value;
  }

  /** Read a single field value from a decrypted 502-byte record using its schema definition. */
  function readField(plainBytes, fieldDef) {
    const dv = new DataView(plainBytes.buffer, plainBytes.byteOffset, plainBytes.byteLength);
    const off = fieldDef.offset;
    const t = fieldDef.type;

    if (t === 'u8') {
      return plainBytes[off];
    }
    if (t === 'u16') {
      return dv.getUint16(off, true);
    }
    if (t === 'str10') {
      return decodeStr10(plainBytes, off);
    }
    const u16Arr = /^u16\[(\d+)\]$/.exec(t);
    if (u16Arr) {
      const count = Number(u16Arr[1]);
      const arr = new Array(count);
      for (let i = 0; i < count; i++) {
        arr[i] = dv.getUint16(off + i * 2, true);
      }
      return arr;
    }
    const u8Arr = /^u8\[(\d+)\]$/.exec(t);
    if (u8Arr) {
      const count = Number(u8Arr[1]);
      const arr = new Array(count);
      for (let i = 0; i < count; i++) {
        arr[i] = plainBytes[off + i];
      }
      return arr;
    }
    const bytesArr = /^bytes\[(\d+)\]$/.exec(t);
    if (bytesArr) {
      const count = Number(bytesArr[1]);
      return plainBytes.slice(off, off + count);
    }
    throw new Error(`Unsupported field type: ${t}`);
  }

  /** Read slot validity flags (valid_a and valid_b) from schema offsets and classify slot state. */
  function getSlotValidity(plainBytes, schema) {
    const fMap = buildFieldMap(schema);
    const validADef = fMap.get('valid_a');
    const validBDef = fMap.get('valid_b');
    const validA = readField(plainBytes, validADef);
    const validB = readField(plainBytes, validBDef);

    const emptyFlags = schema.empty_slot_flags || [0, 0];
    let state = 'unexpected';
    if (validA === emptyFlags[0] && validB === emptyFlags[1]) {
      state = 'empty';
    } else if ((validA === 1 && validB === 0) || (validA === 6 && validB === 6)) {
      state = 'used';
    }
    return { validA, validB, state, validAOffset: validADef.offset, validBOffset: validBDef.offset };
  }

  /** Look up an enum entry name in names.json by enum key and numeric id. */
  function lookupEnumName(enumKey, id, names) {
    const list = names[enumKey];
    if (!Array.isArray(list)) return null;
    const hit = list.find((entry) => entry.id === id);
    return hit ? hit.name : null;
  }

  /** Look up known map metadata from names.json maps_known. */
  function lookupKnownMap(mapId, names) {
    const list = names.maps_known || [];
    return list.find((m) => m.map === mapId) || null;
  }

  /**
   * Resolve full item metadata, guild restriction badge, linked skill, and linked spell.
   * Uses skill_index (0..23) rather than skill_raw so items 206/207/208 (skill_raw 24, skill_index null)
   * safely produce skillLink: null.
   */
  function getItemDetails(itemId, charGuildId, skillLevels, spellLevels, names) {
    const item = Array.isArray(names.items) ? names.items[itemId] || null : null;
    const guild = Array.isArray(names.guilds)
      ? names.guilds.find((g) => g.id === charGuildId) || null
      : null;

    let forbidBit = 0;
    if (guild && names.guild_forbid_bit && Object.hasOwn(names.guild_forbid_bit, guild.name)) {
      forbidBit = names.guild_forbid_bit[guild.name];
    }
    const forbiddenForGuild = Boolean(
      item && itemId !== 0 && forbidBit !== 0 && (item.forbidden_mask & forbidBit) !== 0,
    );
    const forbidBadge = forbiddenForGuild && guild ? `Not for ${guild.name}` : null;

    let skillLink = null;
    if (
      item &&
      typeof item.skill_index === 'number' &&
      item.skill_index >= 0 &&
      item.skill_index < names.skills.length
    ) {
      const skillEntry = names.skills[item.skill_index];
      skillLink = {
        index: item.skill_index,
        name: skillEntry.name,
        level: Array.isArray(skillLevels) ? skillLevels[item.skill_index] : 0,
      };
    }

    let spellLink = null;
    if (
      item &&
      typeof item.spell_index === 'number' &&
      item.spell_index >= 0 &&
      item.spell_index < names.spells.length
    ) {
      const spellEntry = names.spells[item.spell_index];
      spellLink = {
        index: item.spell_index,
        name: spellEntry.name,
        level: Array.isArray(spellLevels) ? spellLevels[item.spell_index] : 0,
      };
    }

    return {
      itemId,
      item,
      name: item ? item.name : `Unknown Item #${itemId}`,
      isEmpty: itemId === 0,
      typeCode: item ? item.type_code : null,
      typeGuess: item ? item.type_guess : 'unknown',
      allowedGuilds: item ? item.allowed_guilds : 'unknown',
      forbiddenMask: item ? item.forbidden_mask : 0,
      forbiddenForGuild,
      forbidBadge,
      skillLink,
      spellLink,
      defaultCharges: item ? item.default_charges : 0,
    };
  }

  /** Compute non-blocking informational soft notes for values beyond tested thresholds or special slots. */
  function getFieldSoftNotes(fieldId, value, extra = {}) {
    const notes = [];
    const testedMax = {
      strength: 63,
      defense: 19,
      agility: 22,
      initiative: 21,
      dexterity: 17,
      maxhp: 43,
      maxmana: 14,
      level: 3,
      gold: 6000,
    };

    if (Object.hasOwn(testedMax, fieldId) && typeof value === 'number' && value > testedMax[fieldId]) {
      notes.push(
        `Above largest tested value (${testedMax[fieldId]}). Stored value is allowed; game accepted values without range checks on load.`,
      );
    }

    if (fieldId === 'facing' && typeof value === 'number' && value > 3) {
      notes.push('Values above 3 were never tested individually; confirmed compass directions are 0..3.');
    }

    if ((fieldId === 'name' || fieldId === 'name2' || fieldId === 'title') && typeof value === 'string') {
      if (value.length === 10) {
        notes.push(
          '10 characters fills all 10 bytes with no NUL terminator; lengths above 9 have not been edit-tested.',
        );
      }
    }

    if ((fieldId === 'spells' || fieldId === 'skills') && typeof value === 'number' && value > 255) {
      notes.push('High byte has always been 0 in observed saves (level is stored in low byte).');
    }

    if (fieldId === 'items') {
      const slotIndex = extra.index;
      if (typeof slotIndex === 'number' && slotIndex >= 10 && slotIndex <= 14 && value !== 0) {
        notes.push('Slots 10..14 are unused: the game clears anything placed here when it saves.');
      }
      if (typeof value === 'number' && value > 255) {
        notes.push('Item ID exceeds the 256-entry game item table (0..255).');
      }
    }

    return notes;
  }

  /** Format a scalar field value for representational display (and diff tables). */
  function formatScalarRepresentational(fieldDef, value, names) {
    if (fieldDef.id === 'side') {
      const hyp = lookupEnumName(fieldDef.enum, value, names);
      return hyp
        ? `${value} — Unknown (hypothesis: ${hyp}?)`
        : `${value} — Unknown`;
    }
    if (fieldDef.enum) {
      const label = lookupEnumName(fieldDef.enum, value, names);
      return label !== null ? `${label} (${value})` : `Unknown #${value}`;
    }
    if (fieldDef.id === 'map') {
      const known = lookupKnownMap(value, names);
      return known ? `${value} — ${known.name}` : `${value} — Unknown map`;
    }
    if (fieldDef.id === 'map_hi' || fieldDef.id === 'gold_hi' || fieldDef.id === 'exp_hi' || fieldDef.id === 'unk06') {
      return `${value} (unknown)`;
    }
    if (fieldDef.id === 'cell') {
      return `${value} (row ${value >> 4}, col ${value & 15})`;
    }
    if (fieldDef.group === 'Appearance') {
      return `Option #${value} (name unknown)`;
    }
    if (fieldDef.type === 'str10') {
      return `"${value}"`;
    }
    return String(value);
  }

  /** Decode all schema fields of a 502-byte decrypted record into structured values + metadata. */
  function decodeRecord(plainBytes, schema, names) {
    if (!(plainBytes instanceof Uint8Array) || plainBytes.length !== schema.record_size) {
      throw new RangeError(`Expected ${schema.record_size}-byte decrypted record.`);
    }
    const values = {};
    const fieldsById = {};
    for (const fieldDef of schema.fields) {
      const val = readField(plainBytes, fieldDef);
      values[fieldDef.id] = val;
      fieldsById[fieldDef.id] = {
        def: fieldDef,
        value: val,
      };
    }

    const validity = getSlotValidity(plainBytes, schema);
    const guildId = values.guild;
    const itemSlots = values.items.map((itemId, slotIndex) => ({
      slotIndex,
      slotLabel: names.item_slot_labels[slotIndex] || `Slot ${slotIndex}`,
      charges: values.charges[slotIndex],
      ...getItemDetails(itemId, guildId, values.skills, values.spells, names),
    }));

    return {
      values,
      fieldsById,
      validity,
      itemSlots,
      positionHelper: {
        map: values.map,
        mapKnown: lookupKnownMap(values.map, names),
        mapHi: values.map_hi,
        cell: values.cell,
        row: values.cell >> 4,
        col: values.cell & 15,
        facing: values.facing,
        facingName: lookupEnumName('facing', values.facing, names),
      },
    };
  }

  /** Assert that a locked field is only modified when advanced mode & confirmation are active. */
  function assertCanWriteField(fieldDef, options = {}) {
    if (fieldDef.risk !== 'locked') {
      return;
    }
    const text = typeof options.advancedConfirmText === 'string'
      ? options.advancedConfirmText.trim().toLowerCase()
      : '';
    if (!options.advancedConfirmed || !text.includes(ADVANCED_CONFIRM_TEXT)) {
      throw new Error(
        `Field "${fieldDef.label}" (${formatHexOffset(fieldDef.offset)}) is locked (risk: locked). ` +
        `Enable Advanced Mode and confirm the "${ADVANCED_CONFIRM_TEXT}" warning before editing.`,
      );
    }
  }

  /** Write a scalar field directly into a mutable 502-byte plaintext buffer. */
  function writeScalarField(plainBytes, fieldDef, value, options = {}) {
    assertCanWriteField(fieldDef, options);
    const dv = new DataView(plainBytes.buffer, plainBytes.byteOffset, plainBytes.byteLength);
    const warnings = [];

    if (fieldDef.type === 'u8') {
      const n = validateUint(value, 0xff);
      plainBytes[fieldDef.offset] = n;
      warnings.push(...getFieldSoftNotes(fieldDef.id, n));
    } else if (fieldDef.type === 'u16') {
      const n = validateUint(value, 0xffff);
      dv.setUint16(fieldDef.offset, n, true);
      warnings.push(...getFieldSoftNotes(fieldDef.id, n));
    } else if (fieldDef.type === 'str10') {
      const { bytes, warning } = validateAndEncodeStr10(value);
      plainBytes.set(bytes, fieldDef.offset);
      if (warning) warnings.push(warning);
    } else {
      throw new Error(`writeScalarField does not accept array type "${fieldDef.type}".`);
    }

    return { warnings };
  }

  /** Write a single element of an array field (`u16[N]` or `u8[N]`) into a mutable plaintext buffer. */
  function writeArrayElement(plainBytes, fieldDef, index, value, options = {}) {
    assertCanWriteField(fieldDef, options);
    const dv = new DataView(plainBytes.buffer, plainBytes.byteOffset, plainBytes.byteLength);
    const u16Arr = /^u16\[(\d+)\]$/.exec(fieldDef.type);
    const u8Arr = /^u8\[(\d+)\]$/.exec(fieldDef.type);

    if (u16Arr) {
      const count = Number(u16Arr[1]);
      if (!Number.isInteger(index) || index < 0 || index >= count) {
        throw new RangeError(`Index ${index} out of bounds for ${fieldDef.id} (0..${count - 1}).`);
      }
      const n = validateUint(value, 0xffff);
      dv.setUint16(fieldDef.offset + index * 2, n, true);
      return { warnings: getFieldSoftNotes(fieldDef.id, n, { index }) };
    }

    if (u8Arr) {
      const count = Number(u8Arr[1]);
      if (!Number.isInteger(index) || index < 0 || index >= count) {
        throw new RangeError(`Index ${index} out of bounds for ${fieldDef.id} (0..${count - 1}).`);
      }
      const n = validateUint(value, 0xff);
      plainBytes[fieldDef.offset + index] = n;
      return { warnings: getFieldSoftNotes(fieldDef.id, n, { index }) };
    }

    throw new Error(`writeArrayElement requires an array field, got "${fieldDef.type}".`);
  }

  /** Write raw byte(s) into a str10 field (for raw byte inspection/editing). */
  function writeStr10RawBytes(plainBytes, fieldDef, byteArray, options = {}) {
    assertCanWriteField(fieldDef, options);
    if (fieldDef.type !== 'str10') {
      throw new Error(`Expected str10 field, got ${fieldDef.type}.`);
    }
    if (!Array.isArray(byteArray) && !(byteArray instanceof Uint8Array)) {
      throw new TypeError('Expected array of 10 bytes.');
    }
    if (byteArray.length !== 10) {
      throw new RangeError(`Expected 10 bytes, got ${byteArray.length}.`);
    }
    for (let i = 0; i < 10; i++) {
      plainBytes[fieldDef.offset + i] = validateUint(byteArray[i], 0xff);
    }
  }

  /** Identify uncovered bytes in a record (e.g. constant prefix 0..5, padding 0x12, 0x1D, 0xF1). */
  function getUncoveredByteOffsets(schema) {
    const covered = new Uint8Array(schema.record_size);
    for (const f of schema.fields) {
      const sz = fieldByteSize(f.type);
      for (let i = 0; i < sz; i++) {
        covered[f.offset + i] = 1;
      }
    }
    const uncovered = [];
    for (let i = 0; i < schema.record_size; i++) {
      if (!covered[i]) uncovered.push(i);
    }
    return uncovered;
  }

  /** Build human-readable + byte-level diff between original and working plaintext records for all slots. */
  function computeSaveDiff(originalPlainRecords, workingPlainRecords, schema, names, options = {}) {
    const fMap = buildFieldMap(schema);
    const uncoveredOffsets = getUncoveredByteOffsets(schema);
    const name2SyncedSlots = options.name2SyncedSlots || new Set();
    const fieldDiffs = [];
    const byteDiffs = [];
    const modifiedSlots = [];

    for (let slot = 0; slot < schema.slots; slot++) {
      const orig = originalPlainRecords[slot];
      const work = workingPlainRecords[slot];
      const origName = decodeStr10(orig, fMap.get('name').offset) || `Slot ${slot}`;
      const slotLabel = `Slot ${slot} (${origName})`;

      const slotByteDiffs = [];
      for (let off = 0; off < schema.record_size; off++) {
        if (orig[off] !== work[off]) {
          slotByteDiffs.push({
            slotIndex: slot,
            slotLabel,
            offset: off,
            offsetHex: formatHexOffset(off),
            oldByte: orig[off],
            newByte: work[off],
          });
        }
      }

      if (slotByteDiffs.length === 0) continue;
      modifiedSlots.push(slot);
      byteDiffs.push(...slotByteDiffs);

      for (const fieldDef of schema.fields) {
        if (fieldDef.id === 'unkF6') {
          const validAOff = fMap.get('valid_a').offset;
          const validBOff = fMap.get('valid_b').offset;
          const sz = fieldByteSize(fieldDef.type);
          const changedOffsets = [];
          for (let off = fieldDef.offset; off < fieldDef.offset + sz; off++) {
            if (off === validAOff || off === validBOff) continue;
            if (orig[off] !== work[off]) {
              changedOffsets.push(`${formatHexOffset(off)}: 0x${orig[off].toString(16).padStart(2, '0')} -> 0x${work[off].toString(16).padStart(2, '0')}`);
            }
          }
          if (changedOffsets.length > 0) {
            fieldDiffs.push({
              slotIndex: slot,
              slotLabel,
              fieldId: fieldDef.id,
              label: fieldDef.label,
              offset: fieldDef.offset,
              offsetHex: formatHexOffset(fieldDef.offset),
              oldRaw: 'zeroes',
              newRaw: changedOffsets.join(', '),
              oldRep: 'zeroes',
              newRep: changedOffsets.join(', '),
              note: 'Unknown block 0xF6..0x1D5 modified',
            });
          }
          continue;
        }

        if (fieldDef.type === 'str10') {
          const oldBytes = readStr10RawBytes(orig, fieldDef.offset);
          const newBytes = readStr10RawBytes(work, fieldDef.offset);
          const changed = oldBytes.some((b, idx) => b !== newBytes[idx]);
          if (changed) {
            const oldStr = decodeStr10(orig, fieldDef.offset);
            const newStr = decodeStr10(work, fieldDef.offset);
            let note = null;
            if (fieldDef.id === 'name2') {
              note = name2SyncedSlots.has(slot)
                ? 'Second copy of Name at 0xE7 (automatically synced with Name)'
                : 'Second copy of Name at 0xE7';
            }
            fieldDiffs.push({
              slotIndex: slot,
              slotLabel,
              fieldId: fieldDef.id,
              label: fieldDef.label,
              offset: fieldDef.offset,
              offsetHex: formatHexOffset(fieldDef.offset),
              oldRaw: oldStr,
              newRaw: newStr,
              oldRep: `"${oldStr}"`,
              newRep: `"${newStr}"`,
              note,
            });
          }
          continue;
        }

        if (fieldDef.type === 'u8' || fieldDef.type === 'u16') {
          const oldVal = readField(orig, fieldDef);
          const newVal = readField(work, fieldDef);
          if (oldVal !== newVal) {
            fieldDiffs.push({
              slotIndex: slot,
              slotLabel,
              fieldId: fieldDef.id,
              label: fieldDef.label,
              offset: fieldDef.offset,
              offsetHex: formatHexOffset(fieldDef.offset),
              oldRaw: String(oldVal),
              newRaw: String(newVal),
              oldRep: formatScalarRepresentational(fieldDef, oldVal, names),
              newRep: formatScalarRepresentational(fieldDef, newVal, names),
              note: null,
            });
          }
          continue;
        }

        const u16Arr = /^u16\[(\d+)\]$/.exec(fieldDef.type);
        const u8Arr = /^u8\[(\d+)\]$/.exec(fieldDef.type);
        if (u16Arr || u8Arr) {
          const oldArr = readField(orig, fieldDef);
          const newArr = readField(work, fieldDef);
          const step = u16Arr ? 2 : 1;
          for (let idx = 0; idx < oldArr.length; idx++) {
            if (oldArr[idx] !== newArr[idx]) {
              let elemLabel = `${fieldDef.label} [${idx}]`;
              let oldRep = String(oldArr[idx]);
              let newRep = String(newArr[idx]);

              if (fieldDef.id === 'spells' && names.spells[idx]) {
                elemLabel = `Spell: ${names.spells[idx].name}`;
                oldRep = `Level ${oldArr[idx]}`;
                newRep = `Level ${newArr[idx]}`;
              } else if (fieldDef.id === 'skills' && names.skills[idx]) {
                elemLabel = `Skill: ${names.skills[idx].name}`;
                oldRep = `Level ${oldArr[idx]}`;
                newRep = `Level ${newArr[idx]}`;
              } else if (fieldDef.id === 'items') {
                const slotName = names.item_slot_labels[idx] || `Slot ${idx}`;
                elemLabel = `Item (${slotName})`;
                const oldItem = names.items[oldArr[idx]];
                const newItem = names.items[newArr[idx]];
                oldRep = oldItem ? `${oldItem.name} (${oldArr[idx]})` : `Unknown #${oldArr[idx]}`;
                newRep = newItem ? `${newItem.name} (${newArr[idx]})` : `Unknown #${newArr[idx]}`;
              } else if (fieldDef.id === 'charges') {
                const slotName = names.item_slot_labels[idx] || `Slot ${idx}`;
                elemLabel = `Charges (${slotName})`;
              }

              fieldDiffs.push({
                slotIndex: slot,
                slotLabel,
                fieldId: fieldDef.id,
                index: idx,
                label: elemLabel,
                offset: fieldDef.offset + idx * step,
                offsetHex: formatHexOffset(fieldDef.offset + idx * step),
                oldRaw: String(oldArr[idx]),
                newRaw: String(newArr[idx]),
                oldRep,
                newRep,
                note: null,
              });
            }
          }
        }
      }

      for (const off of uncoveredOffsets) {
        if (orig[off] !== work[off]) {
          fieldDiffs.push({
            slotIndex: slot,
            slotLabel,
            fieldId: `raw_${off}`,
            label: `Unmapped byte ${formatHexOffset(off)}`,
            offset: off,
            offsetHex: formatHexOffset(off),
            oldRaw: `0x${orig[off].toString(16).padStart(2, '0')}`,
            newRaw: `0x${work[off].toString(16).padStart(2, '0')}`,
            oldRep: `0x${orig[off].toString(16).padStart(2, '0')}`,
            newRep: `0x${work[off].toString(16).padStart(2, '0')}`,
            note: 'Unmapped record byte',
          });
        }
      }
    }

    return {
      modifiedSlots,
      fieldDiffs,
      byteDiffs,
      hasChanges: byteDiffs.length > 0,
    };
  }

  /**
   * Create an immutable, undoable save editing session for a loaded MYCHARS.DAT + YSBOX.EXE tables.
   * Implements non-negotiable safety rules:
   *  - Original file bytes, header, ciphertext, and decrypted plaintext remain untouched.
   *  - Validity flags (0x17D, 0x1AB) are invariant unless explicitly unlocked via Advanced Mode.
   *  - Export stays disabled until diff review + round-trip decrypt verification pass on latest revision.
   */
  function createSaveSession(fileBytes, tables, schema, names, cipherApi) {
    const fMap = buildFieldMap(schema);
    const { header, records } = cipherApi.splitMycharsFile(fileBytes);
    const originalFileBytes = new Uint8Array(fileBytes);
    const originalHeader = header.slice();
    const originalCipherRecords = records.map((r) => r.slice());
    const originalPlainRecords = originalCipherRecords.map((r) =>
      cipherApi.decryptRecord(r, tables),
    );
    const workingPlainRecords = originalPlainRecords.map((r) => r.slice());

    let revision = 0;
    let reviewedRevision = null;
    let lastVerification = null;
    let advancedConfirmed = false;
    let advancedConfirmText = '';
    const name2SyncedSlots = new Set();

    function invalidateReview() {
      reviewedRevision = null;
      lastVerification = null;
    }

    function checkSlotIndex(slotIndex) {
      if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= schema.slots) {
        throw new RangeError(`Invalid slot index ${slotIndex} (expected 0..${schema.slots - 1}).`);
      }
    }

    function getFieldDef(fieldId) {
      const def = fMap.get(fieldId);
      if (!def) {
        throw new Error(`Unknown field id "${fieldId}".`);
      }
      return def;
    }

    function guardValidityFlags(slotIndex, fieldId) {
      if (fieldId === 'valid_a' || fieldId === 'valid_b') return;
      const validAOff = fMap.get('valid_a').offset;
      const validBOff = fMap.get('valid_b').offset;
      if (
        workingPlainRecords[slotIndex][validAOff] !== originalPlainRecords[slotIndex][validAOff] ||
        workingPlainRecords[slotIndex][validBOff] !== originalPlainRecords[slotIndex][validBOff]
      ) {
        throw new Error('Internal safety check failed: validity flags changed unexpectedly.');
      }
    }

    function setAdvancedMode(enabled, confirmation = {}) {
      if (!enabled) {
        advancedConfirmed = false;
        advancedConfirmText = '';
        return { enabled: false };
      }
      const ack = Boolean(confirmation.acknowledged);
      const text = typeof confirmation.text === 'string' ? confirmation.text : '';
      if (!ack || !text.trim().toLowerCase().includes(ADVANCED_CONFIRM_TEXT)) {
        throw new Error(
          `Advanced Mode requires acknowledging the Experiment 7 warning and entering "${ADVANCED_CONFIRM_TEXT}".`,
        );
      }
      advancedConfirmed = true;
      advancedConfirmText = text;
      return { enabled: true };
    }

    function setScalarField(slotIndex, fieldId, value, options = {}) {
      checkSlotIndex(slotIndex);
      const def = getFieldDef(fieldId);
      const writeOpts = {
        advancedConfirmed,
        advancedConfirmText,
      };
      const beforeValidA = workingPlainRecords[slotIndex][fMap.get('valid_a').offset];
      const beforeValidB = workingPlainRecords[slotIndex][fMap.get('valid_b').offset];

      const { warnings } = writeScalarField(workingPlainRecords[slotIndex], def, value, writeOpts);
      if (fieldId !== 'valid_a' && fieldId !== 'valid_b') {
        if (
          workingPlainRecords[slotIndex][fMap.get('valid_a').offset] !== beforeValidA ||
          workingPlainRecords[slotIndex][fMap.get('valid_b').offset] !== beforeValidB
        ) {
          throw new Error('Safety invariant violated: validity flags altered by scalar edit.');
        }
      }

      if (fieldId === 'name') {
        const syncName2 = options.syncName2 !== false;
        if (syncName2) {
          const name2Def = getFieldDef('name2');
          writeScalarField(workingPlainRecords[slotIndex], name2Def, value, writeOpts);
          name2SyncedSlots.add(slotIndex);
        } else {
          name2SyncedSlots.delete(slotIndex);
        }
      }

      revision += 1;
      invalidateReview();
      return { warnings };
    }

    function setStr10Bytes(slotIndex, fieldId, byteArray, options = {}) {
      checkSlotIndex(slotIndex);
      const def = getFieldDef(fieldId);
      const writeOpts = { advancedConfirmed, advancedConfirmText };
      writeStr10RawBytes(workingPlainRecords[slotIndex], def, byteArray, writeOpts);
      if (fieldId === 'name' && options.syncName2 !== false) {
        writeStr10RawBytes(workingPlainRecords[slotIndex], getFieldDef('name2'), byteArray, writeOpts);
        name2SyncedSlots.add(slotIndex);
      }
      revision += 1;
      invalidateReview();
    }

    function setArrayElement(slotIndex, fieldId, index, value) {
      checkSlotIndex(slotIndex);
      const def = getFieldDef(fieldId);
      const beforeValidA = workingPlainRecords[slotIndex][fMap.get('valid_a').offset];
      const beforeValidB = workingPlainRecords[slotIndex][fMap.get('valid_b').offset];

      const { warnings } = writeArrayElement(
        workingPlainRecords[slotIndex],
        def,
        index,
        value,
        { advancedConfirmed, advancedConfirmText },
      );

      if (
        workingPlainRecords[slotIndex][fMap.get('valid_a').offset] !== beforeValidA ||
        workingPlainRecords[slotIndex][fMap.get('valid_b').offset] !== beforeValidB
      ) {
        throw new Error('Safety invariant violated: validity flags altered by array edit.');
      }

      revision += 1;
      invalidateReview();
      return { warnings };
    }

    function revertField(slotIndex, fieldId, index = null) {
      checkSlotIndex(slotIndex);
      const def = getFieldDef(fieldId);
      const orig = originalPlainRecords[slotIndex];
      const work = workingPlainRecords[slotIndex];

      if (index !== null && index !== undefined) {
        const u16Arr = /^u16\[(\d+)\]$/.exec(def.type);
        const u8Arr = /^u8\[(\d+)\]$/.exec(def.type);
        if (u16Arr) {
          const byteOff = def.offset + index * 2;
          work[byteOff] = orig[byteOff];
          work[byteOff + 1] = orig[byteOff + 1];
        } else if (u8Arr) {
          const byteOff = def.offset + index;
          work[byteOff] = orig[byteOff];
        } else {
          throw new Error(`Cannot revert index on non-array field ${fieldId}.`);
        }
      } else {
        const sz = fieldByteSize(def.type);
        work.set(orig.subarray(def.offset, def.offset + sz), def.offset);
        if (fieldId === 'name' && name2SyncedSlots.has(slotIndex)) {
          const n2 = getFieldDef('name2');
          work.set(orig.subarray(n2.offset, n2.offset + 10), n2.offset);
          name2SyncedSlots.delete(slotIndex);
        }
      }

      revision += 1;
      invalidateReview();
    }

    function revertSlot(slotIndex) {
      checkSlotIndex(slotIndex);
      workingPlainRecords[slotIndex] = originalPlainRecords[slotIndex].slice();
      name2SyncedSlots.delete(slotIndex);
      revision += 1;
      invalidateReview();
    }

    function revertAll() {
      for (let i = 0; i < schema.slots; i++) {
        workingPlainRecords[i] = originalPlainRecords[i].slice();
      }
      name2SyncedSlots.clear();
      revision += 1;
      invalidateReview();
    }

    function getDecodedSlot(slotIndex) {
      checkSlotIndex(slotIndex);
      return decodeRecord(workingPlainRecords[slotIndex], schema, names);
    }

    function getOriginalDecodedSlot(slotIndex) {
      checkSlotIndex(slotIndex);
      return decodeRecord(originalPlainRecords[slotIndex], schema, names);
    }

    function getSlotSummary(slotIndex) {
      checkSlotIndex(slotIndex);
      const decoded = getDecodedSlot(slotIndex);
      const diff = computeSlotDiffCount(slotIndex);
      const guildName = lookupEnumName('guilds', decoded.values.guild, names) || `Guild #${decoded.values.guild}`;
      const raceName = lookupEnumName('races', decoded.values.race, names) || `Race #${decoded.values.race}`;
      return {
        slotIndex,
        isCurrentHeaderSlot: originalHeader[0] === slotIndex,
        name: decoded.values.name,
        title: decoded.values.title,
        level: decoded.values.level,
        guildName,
        raceName,
        validity: decoded.validity,
        modifiedByteCount: diff,
      };
    }

    function computeSlotDiffCount(slotIndex) {
      const orig = originalPlainRecords[slotIndex];
      const work = workingPlainRecords[slotIndex];
      let count = 0;
      for (let i = 0; i < schema.record_size; i++) {
        if (orig[i] !== work[i]) count++;
      }
      return count;
    }

    function computeDiff() {
      return computeSaveDiff(originalPlainRecords, workingPlainRecords, schema, names, {
        name2SyncedSlots,
      });
    }

    /**
     * Encrypt modified slots (copying unmodified ciphertexts verbatim), assemble output file,
     * and verify by re-decrypting all 6 slots and asserting byte-for-byte equality with working plaintexts.
     */
    function reviewDiffAndVerify() {
      const diff = computeDiff();
      const outRecords = new Array(schema.slots);

      try {
        for (let slot = 0; slot < schema.slots; slot++) {
          if (cipherApi.bytesEqual(workingPlainRecords[slot], originalPlainRecords[slot])) {
            outRecords[slot] = originalCipherRecords[slot].slice();
          } else {
            outRecords[slot] = cipherApi.encryptRecord(workingPlainRecords[slot], tables);
          }
        }

        const outputBytes = cipherApi.joinMycharsFile(originalHeader, outRecords);

        // Self-check: re-decrypt every record in the assembled output and verify exact match.
        const splitCheck = cipherApi.splitMycharsFile(outputBytes);
        for (let slot = 0; slot < schema.slots; slot++) {
          const redecrypted = cipherApi.decryptRecord(splitCheck.records[slot], tables);
          if (!cipherApi.bytesEqual(redecrypted, workingPlainRecords[slot])) {
            lastVerification = {
              ok: false,
              error: `Self-check failed on slot ${slot}: re-decrypted output differs from edited record. Download refused.`,
              diff,
              outputBytes: null,
            };
            reviewedRevision = null;
            return lastVerification;
          }
        }

        reviewedRevision = revision;
        lastVerification = {
          ok: true,
          error: null,
          diff,
          outputBytes,
          modifiedSlots: diff.modifiedSlots,
        };
        return lastVerification;
      } catch (err) {
        lastVerification = {
          ok: false,
          error: `Self-check failed: ${err instanceof Error ? err.message : String(err)}`,
          diff,
          outputBytes: null,
        };
        reviewedRevision = null;
        return lastVerification;
      }
    }

    function canExport() {
      return Boolean(lastVerification && lastVerification.ok && reviewedRevision === revision);
    }

    function getVerifiedOutputBytes() {
      if (!canExport()) {
        throw new Error('Cannot export until Diff Review & Self-Check pass for the current edits.');
      }
      return lastVerification.outputBytes.slice();
    }

    return {
      schema,
      names,
      get originalFileBytes() {
        return originalFileBytes;
      },
      get originalHeader() {
        return originalHeader;
      },
      get originalPlainRecords() {
        return originalPlainRecords;
      },
      get workingPlainRecords() {
        return workingPlainRecords;
      },
      get revision() {
        return revision;
      },
      get reviewedRevision() {
        return reviewedRevision;
      },
      get advancedConfirmed() {
        return advancedConfirmed;
      },
      get lastVerification() {
        return lastVerification;
      },
      setAdvancedMode,
      setScalarField,
      setStr10Bytes,
      setArrayElement,
      revertField,
      revertSlot,
      revertAll,
      getDecodedSlot,
      getOriginalDecodedSlot,
      getSlotSummary,
      computeSlotDiffCount,
      computeDiff,
      reviewDiffAndVerify,
      canExport,
      getVerifiedOutputBytes,
      guardValidityFlags,
    };
  }

  return {
    ADVANCED_CONFIRM_TEXT,
    fieldByteSize,
    formatHexOffset,
    buildFieldMap,
    decodeStr10,
    readStr10RawBytes,
    validateAndEncodeStr10,
    validateUint,
    readField,
    getSlotValidity,
    lookupEnumName,
    lookupKnownMap,
    getItemDetails,
    getFieldSoftNotes,
    formatScalarRepresentational,
    decodeRecord,
    assertCanWriteField,
    writeScalarField,
    writeArrayElement,
    writeStr10RawBytes,
    getUncoveredByteOffsets,
    computeSaveDiff,
    createSaveSession,
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.YserbiusFields = YserbiusFields;
}

if (typeof exports === 'object' && typeof module === 'object') {
  exports.ADVANCED_CONFIRM_TEXT = YserbiusFields.ADVANCED_CONFIRM_TEXT;
  exports.fieldByteSize = YserbiusFields.fieldByteSize;
  exports.formatHexOffset = YserbiusFields.formatHexOffset;
  exports.buildFieldMap = YserbiusFields.buildFieldMap;
  exports.decodeStr10 = YserbiusFields.decodeStr10;
  exports.readStr10RawBytes = YserbiusFields.readStr10RawBytes;
  exports.validateAndEncodeStr10 = YserbiusFields.validateAndEncodeStr10;
  exports.validateUint = YserbiusFields.validateUint;
  exports.readField = YserbiusFields.readField;
  exports.getSlotValidity = YserbiusFields.getSlotValidity;
  exports.lookupEnumName = YserbiusFields.lookupEnumName;
  exports.lookupKnownMap = YserbiusFields.lookupKnownMap;
  exports.getItemDetails = YserbiusFields.getItemDetails;
  exports.getFieldSoftNotes = YserbiusFields.getFieldSoftNotes;
  exports.formatScalarRepresentational = YserbiusFields.formatScalarRepresentational;
  exports.decodeRecord = YserbiusFields.decodeRecord;
  exports.assertCanWriteField = YserbiusFields.assertCanWriteField;
  exports.writeScalarField = YserbiusFields.writeScalarField;
  exports.writeArrayElement = YserbiusFields.writeArrayElement;
  exports.writeStr10RawBytes = YserbiusFields.writeStr10RawBytes;
  exports.getUncoveredByteOffsets = YserbiusFields.getUncoveredByteOffsets;
  exports.computeSaveDiff = YserbiusFields.computeSaveDiff;
  exports.createSaveSession = YserbiusFields.createSaveSession;
}
