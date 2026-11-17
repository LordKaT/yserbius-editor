/**
 * Embedded field schema and game name tables generated verbatim from
 * data/fields.json and data/names.json (no cipher tables or save data included).
 */
const YserbiusData = (() => {
  'use strict';

  const FIELDS_SCHEMA = {
  "record_size": 502,
  "header_size": 64,
  "slots": 6,
  "slot_valid_flags": {
    "0x17D": [
      1,
      6
    ],
    "0x1AB": [
      0,
      6
    ]
  },
  "empty_slot_flags": [
    0,
    0
  ],
  "encrypted_span": [
    8,
    460
  ],
  "fields": [
    {
      "id": "name",
      "label": "Name",
      "offset": 8,
      "type": "str10",
      "group": "Identity",
      "status": "confirmed",
      "risk": "safe",
      "notes": "10 bytes, NUL padded. A second copy of the name is at 0xE7; write both (that the game reads the second copy is not tested)."
    },
    {
      "id": "name2",
      "label": "Name (second copy)",
      "offset": 231,
      "type": "str10",
      "group": "Identity",
      "status": "confirmed",
      "risk": "caution"
    },
    {
      "id": "title",
      "label": "Title (\"of Ugh\", \"the Fair\", ...)",
      "offset": 19,
      "type": "str10",
      "group": "Identity",
      "status": "confirmed",
      "risk": "safe",
      "notes": "Changing \"Ugh\" to \"Pgh\" in this field worked in the game."
    },
    {
      "id": "sex",
      "label": "Sex",
      "offset": 30,
      "type": "u8",
      "group": "Identity",
      "status": "supported",
      "risk": "safe",
      "enum": "sexes"
    },
    {
      "id": "race",
      "label": "Race",
      "offset": 31,
      "type": "u8",
      "group": "Identity",
      "status": "supported",
      "risk": "safe",
      "enum": "races",
      "notes": "Race indices fit the five shipped characters; the game shows no race text, so the order is not confirmed by display."
    },
    {
      "id": "side",
      "label": "Side (alignment?)",
      "offset": 32,
      "type": "u8",
      "group": "Identity",
      "status": "hypothesis",
      "risk": "caution",
      "enum": "sides_hypothesis",
      "notes": "Meaning unknown. Setting 2 had no visible effect."
    },
    {
      "id": "guild",
      "label": "Guild",
      "offset": 33,
      "type": "u8",
      "group": "Identity",
      "status": "confirmed",
      "risk": "safe",
      "enum": "guilds",
      "notes": "Index 4 = Cleric was confirmed by editing. Items are NOT checked against the guild on load, only in store/equip."
    },
    {
      "id": "level",
      "label": "Level",
      "offset": 34,
      "type": "u16",
      "group": "Identity",
      "status": "confirmed",
      "risk": "safe",
      "notes": "The game shows \"exp needed\" for the next level and recomputes nothing else. Tested up to 3."
    },
    {
      "id": "face",
      "label": "Face",
      "offset": 36,
      "type": "u8",
      "group": "Appearance",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "costume",
      "label": "Costume",
      "offset": 37,
      "type": "u8",
      "group": "Appearance",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "headcover",
      "label": "Head cover",
      "offset": 38,
      "type": "u8",
      "group": "Appearance",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "nose",
      "label": "Nose",
      "offset": 39,
      "type": "u8",
      "group": "Appearance",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "eyes",
      "label": "Eye color",
      "offset": 40,
      "type": "u8",
      "group": "Appearance",
      "status": "supported",
      "risk": "safe",
      "notes": "Identified by elimination."
    },
    {
      "id": "veil",
      "label": "Facial hair / veil",
      "offset": 41,
      "type": "u8",
      "group": "Appearance",
      "status": "confirmed",
      "risk": "safe",
      "notes": "The game forced a veil value in one experiment; option names are not known."
    },
    {
      "id": "initiative",
      "label": "Initiative",
      "offset": 42,
      "type": "u16",
      "group": "Attributes",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "strength",
      "label": "Strength",
      "offset": 44,
      "type": "u16",
      "group": "Attributes",
      "status": "confirmed",
      "risk": "safe",
      "notes": "63 was tested and accepted."
    },
    {
      "id": "defense",
      "label": "Defense",
      "offset": 46,
      "type": "u16",
      "group": "Attributes",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "dexterity",
      "label": "Dexterity",
      "offset": 48,
      "type": "u16",
      "group": "Attributes",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "maxhp",
      "label": "Max health",
      "offset": 50,
      "type": "u16",
      "group": "Attributes",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "agility",
      "label": "Agility",
      "offset": 52,
      "type": "u16",
      "group": "Attributes",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "maxmana",
      "label": "Max mana",
      "offset": 54,
      "type": "u16",
      "group": "Attributes",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "curhp",
      "label": "Current health",
      "offset": 227,
      "type": "u16",
      "group": "Attributes",
      "status": "confirmed",
      "risk": "safe",
      "notes": "Only survives when you resume from the LOWER volcano entrance; the top entrance heals fully."
    },
    {
      "id": "curmana",
      "label": "Current mana",
      "offset": 229,
      "type": "u16",
      "group": "Attributes",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "spells",
      "label": "Spell levels",
      "offset": 56,
      "type": "u16[24]",
      "group": "Spells",
      "status": "confirmed",
      "risk": "safe",
      "enum": "spells",
      "notes": "Entry i at 0x38+2i is the level of spell i. The level is in the low byte; the high byte has always been 0. Only index 23 (True Seeing) was edited in game; the other names follow the game string order."
    },
    {
      "id": "skills",
      "label": "Skill levels",
      "offset": 104,
      "type": "u16[24]",
      "group": "Skills",
      "status": "confirmed",
      "risk": "safe",
      "enum": "skills",
      "notes": "Entry i at 0x68+2i is the level of skill i. Only index 1 (Clubs/Axes) was edited in game."
    },
    {
      "id": "attr_points",
      "label": "Attribute points remaining",
      "offset": 152,
      "type": "u8",
      "group": "Points",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "spell_points",
      "label": "Spell points remaining",
      "offset": 153,
      "type": "u8",
      "group": "Points",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "skill_points",
      "label": "Skill points remaining",
      "offset": 154,
      "type": "u8",
      "group": "Points",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "gold",
      "label": "Gold (low 16 bits)",
      "offset": 155,
      "type": "u16",
      "group": "Wealth",
      "status": "confirmed",
      "risk": "safe",
      "notes": "Probably the low half of a 32-bit value (the word at 0x9D is zero); only values up to 6000 were tested."
    },
    {
      "id": "gold_hi",
      "label": "Gold high word (unknown)",
      "offset": 157,
      "type": "u16",
      "group": "Wealth",
      "status": "hypothesis",
      "risk": "caution"
    },
    {
      "id": "exp",
      "label": "Experience (low 16 bits)",
      "offset": 159,
      "type": "u16",
      "group": "Wealth",
      "status": "confirmed",
      "risk": "safe"
    },
    {
      "id": "exp_hi",
      "label": "Experience high word (unknown)",
      "offset": 161,
      "type": "u16",
      "group": "Wealth",
      "status": "hypothesis",
      "risk": "caution"
    },
    {
      "id": "items",
      "label": "Item slots",
      "offset": 163,
      "type": "u16[32]",
      "group": "Items",
      "status": "confirmed",
      "risk": "safe",
      "enum": "items",
      "slot_labels": "item_slot_labels",
      "notes": "Item ids, 0 = empty. Slots 10-14 are unused: the game clears them on save. Equipping rules are enforced by the game only in store/equip, not on load."
    },
    {
      "id": "charges",
      "label": "Item charges",
      "offset": 470,
      "type": "u8[32]",
      "group": "Items",
      "status": "confirmed",
      "risk": "safe",
      "notes": "Byte k = remaining uses of item slot k. There are no stack counts. Item records have a default (names.json items[].default_charges)."
    },
    {
      "id": "map",
      "label": "Map number (low byte)",
      "offset": 242,
      "type": "u8",
      "group": "Position",
      "status": "supported",
      "risk": "locked",
      "notes": "The game loads 0xF2..0xF3 as one word (0xF3 is its high byte, listed separately as map_hi, always 1). 1 = start level, 6 = Soldier's Quarters. Changing it together with 0xF3 and the cell gave \"illegal map code\" (experiment 7); never edited alone. Keep read-only unless the user turns on advanced mode."
    },
    {
      "id": "map_hi",
      "label": "Position part 0xF3",
      "offset": 243,
      "type": "u8",
      "group": "Position",
      "status": "hypothesis",
      "risk": "locked",
      "notes": "Always 1 in every real save. Meaning unknown."
    },
    {
      "id": "cell",
      "label": "Cell index",
      "offset": 244,
      "type": "u8",
      "group": "Position",
      "status": "confirmed",
      "risk": "caution",
      "notes": "row*16 + column of the map grid (16 wide). +1 = one tile east was confirmed by editing; row step 16 is expected but untried. The game does not check for walls, so a bad cell can put the character inside rock."
    },
    {
      "id": "facing",
      "label": "Facing",
      "offset": 245,
      "type": "u8",
      "group": "Position",
      "status": "confirmed",
      "risk": "safe",
      "enum": "facing",
      "notes": "0 West, 1 South, 2 East, 3 North. Values above 3 were never tested alone."
    },
    {
      "id": "unk06",
      "label": "Unknown word 0x06 (part of the unencrypted prefix)",
      "offset": 6,
      "type": "u16",
      "group": "Unknown",
      "status": "hypothesis",
      "risk": "locked",
      "notes": "Always E0 00 in every record, so part of the constant prefix 08 00 00 00 00 00 E0 00. Copy through."
    },
    {
      "id": "valid_a",
      "label": "Validity flag A",
      "offset": 381,
      "type": "u8",
      "group": "Unknown",
      "status": "confirmed",
      "risk": "locked",
      "notes": "1 or 6 for a used slot, 0 for an empty one. The game checks it on load. Must pair with flag B: (1,0) or (6,6)."
    },
    {
      "id": "valid_b",
      "label": "Validity flag B",
      "offset": 427,
      "type": "u8",
      "group": "Unknown",
      "status": "confirmed",
      "risk": "locked",
      "notes": "0 when A is 1, 6 when A is 6, 0 for an empty slot."
    },
    {
      "id": "unkF6",
      "label": "Unknown block 0xF6..0x1D5 (224 bytes; zero except the two validity flags)",
      "offset": 246,
      "type": "bytes[224]",
      "group": "Unknown",
      "status": "hypothesis",
      "risk": "locked",
      "contains": [
        "valid_a",
        "valid_b"
      ],
      "notes": "Every byte is 0 in all 12 records seen except 0x17D and 0x1AB (the validity flags, listed separately and INSIDE this span: treat valid_a/valid_b as sub-fields, not as overlapping data). Copy through unchanged."
    }
  ]
};

  const NAMES_DATA = {
  "guilds": [
    {
      "id": 0,
      "name": "Barbarian",
      "status": "decoded from data; index 4 (Cleric) confirmed by edit test"
    },
    {
      "id": 1,
      "name": "Knight",
      "status": "decoded from data; index 4 (Cleric) confirmed by edit test"
    },
    {
      "id": 2,
      "name": "Ranger",
      "status": "decoded from data; index 4 (Cleric) confirmed by edit test"
    },
    {
      "id": 3,
      "name": "Thief",
      "status": "decoded from data; index 4 (Cleric) confirmed by edit test"
    },
    {
      "id": 4,
      "name": "Cleric",
      "status": "confirmed in game"
    },
    {
      "id": 5,
      "name": "Wizard",
      "status": "decoded from data; index 4 (Cleric) confirmed by edit test"
    }
  ],
  "guild_forbid_bit": {
    "Barbarian": 128,
    "Knight": 64,
    "Ranger": 32,
    "Thief": 16,
    "Cleric": 8,
    "Wizard": 4
  },
  "sexes": [
    {
      "id": 0,
      "name": "Male",
      "status": "supported (Grunt turned female with 0x1E=1; matches the other characters)"
    },
    {
      "id": 1,
      "name": "Female",
      "status": "supported (Grunt turned female with 0x1E=1; matches the other characters)"
    }
  ],
  "races": [
    {
      "id": 0,
      "name": "Human",
      "status": "supported (fits the five original characters; no text display)"
    },
    {
      "id": 1,
      "name": "Orc",
      "status": "supported (fits the five original characters; no text display)"
    },
    {
      "id": 2,
      "name": "Elf",
      "status": "supported (fits the five original characters; no text display)"
    },
    {
      "id": 3,
      "name": "Troll",
      "status": "supported (fits the five original characters; no text display)"
    },
    {
      "id": 4,
      "name": "Dwarf",
      "status": "supported (fits the five original characters; no text display)"
    },
    {
      "id": 5,
      "name": "Gnome",
      "status": "supported (fits the five original characters; no text display)"
    },
    {
      "id": 6,
      "name": "Halfling",
      "status": "supported (fits the five original characters; no text display)"
    },
    {
      "id": 7,
      "name": "Gremlin",
      "status": "supported (fits the five original characters; no text display)"
    }
  ],
  "sides_hypothesis": [
    {
      "id": 0,
      "name": "Harmony",
      "status": "hypothesis (next list after the races; meaning of 0x20 not confirmed)"
    },
    {
      "id": 1,
      "name": "Chaos",
      "status": "hypothesis (next list after the races; meaning of 0x20 not confirmed)"
    }
  ],
  "skills": [
    {
      "id": 0,
      "name": "Athletics",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 1,
      "name": "Clubs/Axes",
      "status": "confirmed in game"
    },
    {
      "id": 2,
      "name": "Berserker",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 3,
      "name": "Pursuit",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 4,
      "name": "Leadership",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 5,
      "name": "Fencing",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 6,
      "name": "Binding",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 7,
      "name": "Intimidate",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 8,
      "name": "Archery",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 9,
      "name": "Stamina",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 10,
      "name": "Furtiveness",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 11,
      "name": "Read Tracks",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 12,
      "name": "Bard",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 13,
      "name": "Detect",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 14,
      "name": "Lockpick",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 15,
      "name": "Pickpocket",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 16,
      "name": "Martial Arts",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 17,
      "name": "Deflect Magic",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 18,
      "name": "Medic",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 19,
      "name": "Reverie",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 20,
      "name": "Rune Reading",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 21,
      "name": "Staff",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 22,
      "name": "Channel",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    },
    {
      "id": 23,
      "name": "Deep Trance",
      "status": "decoded from data; ordering checked by index 1 = Clubs/Axes"
    }
  ],
  "spells": [
    {
      "id": 0,
      "name": "Backfire",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 1,
      "name": "Blast",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 2,
      "name": "Control",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 3,
      "name": "Curse",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 4,
      "name": "Death Darts",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 5,
      "name": "Dissipate",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 6,
      "name": "Fireball",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 7,
      "name": "Hail",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 8,
      "name": "Lightning",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 9,
      "name": "Petrify",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 10,
      "name": "Poison Cloud",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 11,
      "name": "Storm Wind",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 12,
      "name": "Aura",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 13,
      "name": "Light Shroud",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 14,
      "name": "Energy Field",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 15,
      "name": "Shield",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 16,
      "name": "Refresh",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 17,
      "name": "Teleport",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 18,
      "name": "Bless",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 19,
      "name": "Cure",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 20,
      "name": "Heal",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 21,
      "name": "Resist",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 22,
      "name": "Resuscitate",
      "status": "decoded from data; ordering checked by index 23 = True Seeing"
    },
    {
      "id": 23,
      "name": "True Seeing",
      "status": "confirmed in game"
    }
  ],
  "items": [
    {
      "id": 0,
      "name": "Null Item",
      "type_code": 0,
      "type_guess": "?",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 1,
      "name": "Short Sword",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 2,
      "name": "Broadsword",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 12,
      "allowed_guilds": "Barbarian/Knight/Ranger/Thief",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 3,
      "name": "Longsword",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 28,
      "allowed_guilds": "Barbarian/Knight/Ranger",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 4,
      "name": "Katana",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 164,
      "allowed_guilds": "Knight/Thief/Cleric",
      "skill_raw": 16,
      "skill_index": 16,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 5,
      "name": "Sword of Decision",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 6,
      "name": "Sword of Destiny",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 7,
      "name": "Sword of Destruction",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 28,
      "allowed_guilds": "Barbarian/Knight/Ranger",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": 9,
      "default_charges": 2
    },
    {
      "id": 8,
      "name": "Sword of Despair",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 236,
      "allowed_guilds": "Thief",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": 9,
      "default_charges": 2
    },
    {
      "id": 9,
      "name": "Flex Sword",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": 2,
      "default_charges": 2
    },
    {
      "id": 10,
      "name": "Sword of the Crypt",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 11,
      "name": "Sword of the Dead",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 224,
      "allowed_guilds": "Thief/Cleric/Wizard",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": 5,
      "default_charges": 2
    },
    {
      "id": 12,
      "name": "Sword of the Flames",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 12,
      "allowed_guilds": "Barbarian/Knight/Ranger/Thief",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": 6,
      "default_charges": 3
    },
    {
      "id": 13,
      "name": "Sword of Lightning",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": 8,
      "default_charges": 3
    },
    {
      "id": 14,
      "name": "Sword of Storms",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 242,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": 11,
      "default_charges": 2
    },
    {
      "id": 15,
      "name": "Sword of Ice",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 192,
      "allowed_guilds": "Ranger/Thief/Cleric/Wizard",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": 7,
      "default_charges": 2
    },
    {
      "id": 16,
      "name": "Sword of Radiance",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 29,
      "allowed_guilds": "Barbarian/Knight/Ranger",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": 1,
      "default_charges": 2
    },
    {
      "id": 17,
      "name": "Sword of Stone",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 192,
      "allowed_guilds": "Ranger/Thief/Cleric/Wizard",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": 9,
      "default_charges": 2
    },
    {
      "id": 18,
      "name": "Axe",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 19,
      "name": "Battle Axe",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 28,
      "allowed_guilds": "Barbarian/Knight/Ranger",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 20,
      "name": "Barbarian Axe",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 124,
      "allowed_guilds": "Barbarian",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": 3,
      "default_charges": 2
    },
    {
      "id": 21,
      "name": "Behemoth Axe",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 60,
      "allowed_guilds": "Barbarian/Knight",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": 10,
      "default_charges": 2
    },
    {
      "id": 22,
      "name": "Bestial Axe",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 12,
      "allowed_guilds": "Barbarian/Knight/Ranger/Thief",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 23,
      "name": "Burning Axe",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": 6,
      "default_charges": 2
    },
    {
      "id": 24,
      "name": "Blinding Axe",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 196,
      "allowed_guilds": "Ranger/Thief/Cleric",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": 1,
      "default_charges": 2
    },
    {
      "id": 25,
      "name": "Blunt Axe",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": 5,
      "default_charges": 2
    },
    {
      "id": 26,
      "name": "Club",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 27,
      "name": "Mace",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 20,
      "allowed_guilds": "Barbarian/Knight/Ranger/Cleric",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 28,
      "name": "Morningstar",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 28,
      "allowed_guilds": "Barbarian/Knight/Ranger",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 29,
      "name": "War Hammer",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 124,
      "allowed_guilds": "Barbarian",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 30,
      "name": "Nunchukas",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 224,
      "allowed_guilds": "Thief/Cleric/Wizard",
      "skill_raw": 16,
      "skill_index": 16,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 31,
      "name": "Club of Punishment",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 32,
      "name": "Spiked Mace",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 12,
      "allowed_guilds": "Barbarian/Knight/Ranger/Thief",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 33,
      "name": "Mourning Star",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 188,
      "allowed_guilds": "Knight",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": 6,
      "default_charges": 2
    },
    {
      "id": 34,
      "name": "Harmony Hammer",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 21,
      "allowed_guilds": "Barbarian/Knight/Ranger/Cleric",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": 0,
      "default_charges": 2
    },
    {
      "id": 35,
      "name": "Ninja Sticks",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 224,
      "allowed_guilds": "Thief/Cleric/Wizard",
      "skill_raw": 16,
      "skill_index": 16,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 36,
      "name": "Bludgeon of Kindness",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 224,
      "allowed_guilds": "Thief/Cleric/Wizard",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": 8,
      "default_charges": 2
    },
    {
      "id": 37,
      "name": "Mace of Purity",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 244,
      "allowed_guilds": "Cleric",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": 7,
      "default_charges": 2
    },
    {
      "id": 38,
      "name": "Mystic Mourningstar",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 28,
      "allowed_guilds": "Barbarian/Knight/Ranger",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": 3,
      "default_charges": 2
    },
    {
      "id": 39,
      "name": "Hollowed Nunchukas",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 224,
      "allowed_guilds": "Thief/Cleric/Wizard",
      "skill_raw": 16,
      "skill_index": 16,
      "spell_index": 4,
      "default_charges": 2
    },
    {
      "id": 40,
      "name": "Cleric's Shillelagh",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 41,
      "name": "Mace of Chivalry",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 188,
      "allowed_guilds": "Knight",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 42,
      "name": "Malice Morningstar",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 30,
      "allowed_guilds": "Barbarian/Knight/Ranger",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": 6,
      "default_charges": 2
    },
    {
      "id": 43,
      "name": "War Hammer of Doom",
      "type_code": 1,
      "type_guess": "melee weapon",
      "forbidden_mask": 60,
      "allowed_guilds": "Barbarian/Knight",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": 1,
      "default_charges": 3
    },
    {
      "id": 44,
      "name": "Quarterstaff",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 144,
      "allowed_guilds": "Knight/Ranger/Cleric/Wizard",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 45,
      "name": "Wizard Staff",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 248,
      "allowed_guilds": "Wizard",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": 9,
      "default_charges": 2
    },
    {
      "id": 46,
      "name": "Staff of Splintered Oak",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 128,
      "allowed_guilds": "Knight/Ranger/Thief/Cleric/Wizard",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 47,
      "name": "Staff and a Half",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 144,
      "allowed_guilds": "Knight/Ranger/Cleric/Wizard",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 48,
      "name": "Malevolent Quarterstaff",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 208,
      "allowed_guilds": "Ranger/Cleric/Wizard",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": 6,
      "default_charges": 2
    },
    {
      "id": 49,
      "name": "Quarterstaff of Terror",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": 5,
      "default_charges": 2
    },
    {
      "id": 50,
      "name": "Druid Staff",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": 10,
      "default_charges": 2
    },
    {
      "id": 51,
      "name": "Fire Staff",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 208,
      "allowed_guilds": "Ranger/Cleric/Wizard",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": 6,
      "default_charges": 2
    },
    {
      "id": 52,
      "name": "Staff of Life",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 192,
      "allowed_guilds": "Ranger/Thief/Cleric/Wizard",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": 1,
      "default_charges": 2
    },
    {
      "id": 53,
      "name": "Spear",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 54,
      "name": "Halberd",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 28,
      "allowed_guilds": "Barbarian/Knight/Ranger",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 55,
      "name": "Ranger Spear",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 220,
      "allowed_guilds": "Ranger",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 56,
      "name": "Stalking Spear",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 57,
      "name": "Mystic Spear",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 12,
      "allowed_guilds": "Barbarian/Knight/Ranger/Thief",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 58,
      "name": "Poleaxe of Peace",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 28,
      "allowed_guilds": "Barbarian/Knight/Ranger",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": 14,
      "default_charges": 2
    },
    {
      "id": 59,
      "name": "Shocking Spear",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": 8,
      "default_charges": 2
    },
    {
      "id": 60,
      "name": "Spear of Lies",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 236,
      "allowed_guilds": "Thief",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": 11,
      "default_charges": 2
    },
    {
      "id": 61,
      "name": "Holy Halberd",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 176,
      "allowed_guilds": "Knight/Cleric/Wizard",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": 9,
      "default_charges": 2
    },
    {
      "id": 62,
      "name": "Splinter Spear",
      "type_code": 2,
      "type_guess": "staff",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": 21,
      "skill_index": 21,
      "spell_index": 4,
      "default_charges": 2
    },
    {
      "id": 63,
      "name": "Sling",
      "type_code": 3,
      "type_guess": "ranged weapon",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 64,
      "name": "Short Bow",
      "type_code": 3,
      "type_guess": "ranged weapon",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 65,
      "name": "Longbow",
      "type_code": 3,
      "type_guess": "ranged weapon",
      "forbidden_mask": 20,
      "allowed_guilds": "Barbarian/Knight/Ranger/Cleric",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 66,
      "name": "Crossbow",
      "type_code": 3,
      "type_guess": "ranged weapon",
      "forbidden_mask": 12,
      "allowed_guilds": "Barbarian/Knight/Ranger/Thief",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 67,
      "name": "Stout Bow",
      "type_code": 3,
      "type_guess": "ranged weapon",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 68,
      "name": "Lethal Longbow",
      "type_code": 3,
      "type_guess": "ranged weapon",
      "forbidden_mask": 220,
      "allowed_guilds": "Ranger",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 69,
      "name": "Double Crossbow",
      "type_code": 3,
      "type_guess": "ranged weapon",
      "forbidden_mask": 13,
      "allowed_guilds": "Barbarian/Knight/Ranger/Thief",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 70,
      "name": "Bow of the Elementals",
      "type_code": 3,
      "type_guess": "ranged weapon",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 71,
      "name": "Fire Bow",
      "type_code": 3,
      "type_guess": "ranged weapon",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": 6,
      "default_charges": 2
    },
    {
      "id": 72,
      "name": "Bow of Sorrow",
      "type_code": 3,
      "type_guess": "ranged weapon",
      "forbidden_mask": 76,
      "allowed_guilds": "Barbarian/Ranger/Thief",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": 3,
      "default_charges": 2
    },
    {
      "id": 73,
      "name": "Intractable Bow",
      "type_code": 3,
      "type_guess": "ranged weapon",
      "forbidden_mask": 160,
      "allowed_guilds": "Knight/Thief/Cleric/Wizard",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": 1,
      "default_charges": 2
    },
    {
      "id": 74,
      "name": "Rain Bow",
      "type_code": 3,
      "type_guess": "ranged weapon",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": 7,
      "default_charges": 2
    },
    {
      "id": 75,
      "name": "Crossbow of Chaos",
      "type_code": 3,
      "type_guess": "ranged weapon",
      "forbidden_mask": 2,
      "allowed_guilds": "Barbarian/Knight/Ranger/Thief/Cleric/Wizard",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": 4,
      "default_charges": 2
    },
    {
      "id": 76,
      "name": "Blessed Bow",
      "type_code": 3,
      "type_guess": "ranged weapon",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 77,
      "name": "Buckler",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 78,
      "name": "Round Shield",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 79,
      "name": "Oblong Shield",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 28,
      "allowed_guilds": "Barbarian/Knight/Ranger",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 80,
      "name": "Beastly Buckler",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 144,
      "allowed_guilds": "Knight/Ranger/Cleric/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 81,
      "name": "Blessed Buckler",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 82,
      "name": "Buckler of the Elements",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 83,
      "name": "Bronze Buckler",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 4,
      "allowed_guilds": "Barbarian/Knight/Ranger/Thief/Cleric",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 84,
      "name": "Buckler of Dawn",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 192,
      "allowed_guilds": "Ranger/Thief/Cleric/Wizard",
      "skill_raw": 17,
      "skill_index": 17,
      "spell_index": null,
      "default_charges": 35
    },
    {
      "id": 85,
      "name": "Shield of Life",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 86,
      "name": "Shield of Sorrow",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 12,
      "allowed_guilds": "Barbarian/Knight/Ranger/Thief",
      "skill_raw": 17,
      "skill_index": 17,
      "spell_index": null,
      "default_charges": 99
    },
    {
      "id": 87,
      "name": "Obedient Shield",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 88,
      "name": "Shield of Sanity",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": 17,
      "skill_index": 17,
      "spell_index": null,
      "default_charges": 25
    },
    {
      "id": 89,
      "name": "Beastly Shield",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 28,
      "allowed_guilds": "Barbarian/Knight/Ranger",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 90,
      "name": "Rotund Shield",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 60,
      "allowed_guilds": "Barbarian/Knight",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 91,
      "name": "Shield of Silence",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 17,
      "skill_index": 17,
      "spell_index": null,
      "default_charges": 35
    },
    {
      "id": 92,
      "name": "Rectangle Shield",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 28,
      "allowed_guilds": "Barbarian/Knight/Ranger",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 93,
      "name": "Kite Shield",
      "type_code": 6,
      "type_guess": "shield",
      "forbidden_mask": 188,
      "allowed_guilds": "Knight",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 94,
      "name": "Leather Cap",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 95,
      "name": "Head Chainmail",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 96,
      "name": "War-Hat",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 148,
      "allowed_guilds": "Knight/Ranger/Cleric",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 97,
      "name": "Helmet",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 188,
      "allowed_guilds": "Knight",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 98,
      "name": "Lizard Cap",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 99,
      "name": "Cap of Good Hope",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": 17,
      "skill_index": 17,
      "spell_index": null,
      "default_charges": 50
    },
    {
      "id": 100,
      "name": "Cap of Wisdom",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": 17,
      "skill_index": 17,
      "spell_index": null,
      "default_charges": 25
    },
    {
      "id": 101,
      "name": "Mail Cap",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 102,
      "name": "Grimoire Headmail",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": 17,
      "skill_index": 17,
      "spell_index": null,
      "default_charges": 99
    },
    {
      "id": 103,
      "name": "Adamantine Headmail",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 16,
      "allowed_guilds": "Barbarian/Knight/Ranger/Cleric/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 104,
      "name": "Headmail of Health",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 105,
      "name": "Cleowyn's Crown",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 106,
      "name": "Horned-Hat",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 20,
      "allowed_guilds": "Barbarian/Knight/Ranger/Cleric",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 107,
      "name": "Warrior-Hat",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 28,
      "allowed_guilds": "Barbarian/Knight/Ranger",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 108,
      "name": "War-Hat of the Viper",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 20,
      "allowed_guilds": "Barbarian/Knight/Ranger/Cleric",
      "skill_raw": 17,
      "skill_index": 17,
      "spell_index": null,
      "default_charges": 35
    },
    {
      "id": 109,
      "name": "Sallet of Victory",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 148,
      "allowed_guilds": "Knight/Ranger/Cleric",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 110,
      "name": "Chapel de Fer",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 148,
      "allowed_guilds": "Knight/Ranger/Cleric",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 111,
      "name": "Helm of Mercy",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 156,
      "allowed_guilds": "Knight/Ranger",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 112,
      "name": "Wolf Helmet",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 188,
      "allowed_guilds": "Knight",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 113,
      "name": "Armet",
      "type_code": 7,
      "type_guess": "head armor",
      "forbidden_mask": 188,
      "allowed_guilds": "Knight",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 114,
      "name": "Cloth Jacket",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 115,
      "name": "Leather Jacket",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 116,
      "name": "Chainmail",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 16,
      "allowed_guilds": "Barbarian/Knight/Ranger/Cleric/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 117,
      "name": "Breastplate",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 16,
      "allowed_guilds": "Barbarian/Knight/Ranger/Cleric/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 118,
      "name": "Armor Suit",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 188,
      "allowed_guilds": "Knight",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 119,
      "name": "Jacket of Safety",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 120,
      "name": "Cleowyn's Robe",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 121,
      "name": "Sack Cloth Jacket",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 122,
      "name": "Lizardskin Jacket",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 123,
      "name": "Impervious Jacket",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 208,
      "allowed_guilds": "Ranger/Cleric/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 124,
      "name": "Galabryan Chainmail",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 20,
      "allowed_guilds": "Barbarian/Knight/Ranger/Cleric",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 125,
      "name": "Mail of the Magus",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 126,
      "name": "Rainbow Chainmail",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 20,
      "allowed_guilds": "Barbarian/Knight/Ranger/Cleric",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 127,
      "name": "Diamond Mail",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 20,
      "allowed_guilds": "Barbarian/Knight/Ranger/Cleric",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 128,
      "name": "Mail Surcoat",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 16,
      "allowed_guilds": "Barbarian/Knight/Ranger/Cleric/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 129,
      "name": "Plate of Iron",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 28,
      "allowed_guilds": "Barbarian/Knight/Ranger",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 130,
      "name": "Globular Breastplate",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 24,
      "allowed_guilds": "Barbarian/Knight/Ranger/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 131,
      "name": "Wyvern Breastplate",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 184,
      "allowed_guilds": "Knight/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 132,
      "name": "Breastplate of the Lost",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 24,
      "allowed_guilds": "Barbarian/Knight/Ranger/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 133,
      "name": "Pearly Breastplate",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 152,
      "allowed_guilds": "Knight/Ranger/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 134,
      "name": "War Harness",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 190,
      "allowed_guilds": "Knight",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 135,
      "name": "Armor of Patience",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 189,
      "allowed_guilds": "Knight",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 136,
      "name": "Infinite Armor",
      "type_code": 8,
      "type_guess": "body armor",
      "forbidden_mask": 188,
      "allowed_guilds": "Knight",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 137,
      "name": "Bowman Insignia",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 8,
      "skill_index": 8,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 138,
      "name": "Cudgel Insignia",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 1,
      "skill_index": 1,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 139,
      "name": "Duelist Insignia",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 5,
      "skill_index": 5,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 140,
      "name": "Shiruken Insignia",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 16,
      "skill_index": 16,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 141,
      "name": "Animate Ring",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 142,
      "name": "Ring of Vigor",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 143,
      "name": "Ring of Resistance",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 144,
      "name": "Dynamic Ring",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 145,
      "name": "Ring of Warding",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 146,
      "name": "Lamia Amulet",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 2,
      "default_charges": 2
    },
    {
      "id": 147,
      "name": "Recoil Amulet",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 0,
      "default_charges": 3
    },
    {
      "id": 148,
      "name": "Basilisk Amulet",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 9,
      "default_charges": 0
    },
    {
      "id": 149,
      "name": "Carnivorous Medallion",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 150,
      "name": "Netherworld Medallion",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 151,
      "name": "Vermin Medallion",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 152,
      "name": "Ophidian Medallion",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 153,
      "name": "Bravo Wreath",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 156,
      "allowed_guilds": "Knight/Ranger",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 21,
      "default_charges": 10
    },
    {
      "id": 154,
      "name": "Brigand Wreath",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 108,
      "allowed_guilds": "Barbarian/Thief",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 21,
      "default_charges": 10
    },
    {
      "id": 155,
      "name": "Talisman Wreath",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 240,
      "allowed_guilds": "Cleric/Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 21,
      "default_charges": 10
    },
    {
      "id": 156,
      "name": "Barbarian Resuscitator",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 124,
      "allowed_guilds": "Barbarian",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 22,
      "default_charges": 3
    },
    {
      "id": 157,
      "name": "Knight Resuscitator",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 188,
      "allowed_guilds": "Knight",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 22,
      "default_charges": 3
    },
    {
      "id": 158,
      "name": "Ranger Resuscitator",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 220,
      "allowed_guilds": "Ranger",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 22,
      "default_charges": 3
    },
    {
      "id": 159,
      "name": "Thief Resuscitator",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 236,
      "allowed_guilds": "Thief",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 22,
      "default_charges": 3
    },
    {
      "id": 160,
      "name": "Cleric Resuscitator",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 244,
      "allowed_guilds": "Cleric",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 22,
      "default_charges": 3
    },
    {
      "id": 161,
      "name": "Wizard Resuscitator",
      "type_code": 9,
      "type_guess": "insignia/resuscitator",
      "forbidden_mask": 248,
      "allowed_guilds": "Wizard",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 22,
      "default_charges": 3
    },
    {
      "id": 162,
      "name": "Magic Eye Amulet",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 23,
      "default_charges": 5
    },
    {
      "id": 163,
      "name": "Refresh-All Scroll",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 16,
      "default_charges": 2
    },
    {
      "id": 164,
      "name": "Refresh Scroll",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 16,
      "default_charges": 5
    },
    {
      "id": 165,
      "name": "Halo Scroll",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 12,
      "default_charges": 5
    },
    {
      "id": 166,
      "name": "Scroll of Protection",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 14,
      "default_charges": 5
    },
    {
      "id": 167,
      "name": "Shielding Scroll",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 15,
      "default_charges": 2
    },
    {
      "id": 168,
      "name": "Aura Scroll",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 12,
      "default_charges": 2
    },
    {
      "id": 169,
      "name": "Scroll of Safety",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 14,
      "default_charges": 2
    },
    {
      "id": 170,
      "name": "Scroll of the Sun",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 6,
      "default_charges": 4
    },
    {
      "id": 171,
      "name": "Basalt Scroll",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 9,
      "default_charges": 4
    },
    {
      "id": 172,
      "name": "Cursed Scroll",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 3,
      "default_charges": 4
    },
    {
      "id": 173,
      "name": "Crystal Scroll",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 7,
      "default_charges": 2
    },
    {
      "id": 174,
      "name": "Shaman Scroll",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 1,
      "default_charges": 2
    },
    {
      "id": 175,
      "name": "Blood Scroll",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 8,
      "default_charges": 2
    },
    {
      "id": 176,
      "name": "Scroll of Fire",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 6,
      "default_charges": 2
    },
    {
      "id": 177,
      "name": "Scroll of Wind",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 11,
      "default_charges": 2
    },
    {
      "id": 178,
      "name": "Boomerang Scroll",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 0,
      "default_charges": 2
    },
    {
      "id": 179,
      "name": "Sovereign Scroll",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 2,
      "default_charges": 2
    },
    {
      "id": 180,
      "name": "Scroll of Death",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 4,
      "default_charges": 2
    },
    {
      "id": 181,
      "name": "Heal Potion",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 20,
      "default_charges": 8
    },
    {
      "id": 182,
      "name": "Elixir of Health",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 20,
      "default_charges": 12
    },
    {
      "id": 183,
      "name": "Heal-All Potion",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 20,
      "default_charges": 15
    },
    {
      "id": 184,
      "name": "Silver Bar",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 185,
      "name": "Gold Bar",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 186,
      "name": "Platinum Bar",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 187,
      "name": "Teleport Pass",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 17,
      "default_charges": 5
    },
    {
      "id": 188,
      "name": "Rune Prism",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 20,
      "skill_index": 20,
      "spell_index": null,
      "default_charges": 3
    },
    {
      "id": 189,
      "name": "Sensor Prism",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 11,
      "skill_index": 11,
      "spell_index": null,
      "default_charges": 4
    },
    {
      "id": 190,
      "name": "Omniscient Prism",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 13,
      "skill_index": 13,
      "spell_index": null,
      "default_charges": 4
    },
    {
      "id": 191,
      "name": "Green Lockpick  ",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 192,
      "name": "Yellow Lockpick  ",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 193,
      "name": "Orange Lockpick",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 194,
      "name": "Red Lockpick",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 195,
      "name": "Purple Lockpick",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 196,
      "name": "Blue Lockpick",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 197,
      "name": "Wand of Radiance",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 8,
      "default_charges": 4
    },
    {
      "id": 198,
      "name": "Wand of Bolts",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 4,
      "default_charges": 4
    },
    {
      "id": 199,
      "name": "Wand of Malediction",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 3,
      "default_charges": 4
    },
    {
      "id": 200,
      "name": "Marble Wand",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 9,
      "default_charges": 4
    },
    {
      "id": 201,
      "name": "Venom Wand",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 10,
      "default_charges": 4
    },
    {
      "id": 202,
      "name": "Arquebus Wand",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 1,
      "default_charges": 4
    },
    {
      "id": 203,
      "name": "Cure Potion",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 19,
      "default_charges": 8
    },
    {
      "id": 204,
      "name": "Curative Elixir",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 19,
      "default_charges": 12
    },
    {
      "id": 205,
      "name": "Cure-All Potion",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 19,
      "default_charges": 15
    },
    {
      "id": 206,
      "name": "Mana Potion",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 24,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 8
    },
    {
      "id": 207,
      "name": "Mana Elixir",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 24,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 12
    },
    {
      "id": 208,
      "name": "Mana Restore",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": 24,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 15
    },
    {
      "id": 209,
      "name": "Bless  Potion",
      "type_code": 11,
      "type_guess": "consumable / magic item",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": 18,
      "default_charges": 5
    },
    {
      "id": 210,
      "name": "Cleowyn's Lockpick",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 211,
      "name": "Cleowyn's Key",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 212,
      "name": "Sunbeam Key",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 213,
      "name": "Dwarf Mine Key",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 214,
      "name": "Cyclops' Mine Key",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 215,
      "name": "Hidden Mine Key",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 216,
      "name": "Elfin Cave Key",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 217,
      "name": "Key to Cleowyn's Palace",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 218,
      "name": "O Rune Vowel Key",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 219,
      "name": "E Rune Vowel Key ",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 220,
      "name": "I Rune Vowel Key",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 221,
      "name": "Wind Knight Key",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 222,
      "name": "Thief's Labyrinth Key",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 223,
      "name": "Voranti's Key",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 224,
      "name": "Key to Back Alley",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 225,
      "name": "Domicile Key",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 226,
      "name": "Lava Key",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 227,
      "name": "Cleowyn's Scepter",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 228,
      "name": "Autumn Seeds",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 229,
      "name": "Winter Waters",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 230,
      "name": "Harvest Horn",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 231,
      "name": "Spring Renewal",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 232,
      "name": "Summer Radiance",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 233,
      "name": "Nature's Robe",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 234,
      "name": "Jack of Spades",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 235,
      "name": "Queen of Spades",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 236,
      "name": "King of Spades",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 237,
      "name": "Ace of Spades",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 238,
      "name": "Chess Piece",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 239,
      "name": "Blue Metal",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 240,
      "name": "Flex Metal",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 241,
      "name": "Cyclop's Head",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 242,
      "name": "Moon Prism",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 243,
      "name": "Golden Boat",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 244,
      "name": "Rainbow Red",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 245,
      "name": "Rainbow Yel",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 246,
      "name": "Rainbow Grn",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 247,
      "name": "Rainbow Blue",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 248,
      "name": "King's Ring",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 249,
      "name": "King's Pass",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 250,
      "name": "Cleowyn's Bones",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 251,
      "name": "Thieves' Key",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 252,
      "name": "Lava Glove",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 253,
      "name": "To be Assigned",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 254,
      "name": "To be Assigned",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    },
    {
      "id": 255,
      "name": "Not to be Assigned",
      "type_code": 12,
      "type_guess": "quest item / key",
      "forbidden_mask": 0,
      "allowed_guilds": "all",
      "skill_raw": null,
      "skill_index": null,
      "spell_index": null,
      "default_charges": 0
    }
  ],
  "facing": [
    {
      "id": 0,
      "name": "West",
      "status": "confirmed (set by editing)"
    },
    {
      "id": 1,
      "name": "South",
      "status": "supported (saved by the game)"
    },
    {
      "id": 2,
      "name": "East",
      "status": "confirmed (set by editing)"
    },
    {
      "id": 3,
      "name": "North",
      "status": "confirmed (saved by the game; sidestep confirmed)"
    }
  ],
  "item_slot_labels": [
    "Inventory 1",
    "Inventory 2",
    "Inventory 3",
    "Inventory 4",
    "Inventory 5",
    "Inventory 6",
    "Inventory 7",
    "Inventory 8",
    "Inventory 9",
    "Inventory 10",
    "(unused 10)",
    "(unused 11)",
    "(unused 12)",
    "(unused 13)",
    "(unused 14)",
    "Head",
    "Body",
    "Left hand (weapon)",
    "Right hand (shield)",
    "Left foot",
    "Right foot",
    "Quest item 1",
    "Quest item 2",
    "Quest item 3",
    "Quest item 4",
    "Quest item 5",
    "Quest item 6",
    "Quest item 7",
    "Quest item 8",
    "Quest item 9",
    "Quest item 10",
    "Ground (between the feet)"
  ],
  "maps_known": [
    {
      "map": 1,
      "name": "Start level (volcano entrance)",
      "automap_floor": 0
    },
    {
      "map": 6,
      "name": "L1 Soldier's Quarters",
      "automap_floor": 1
    }
  ]
};

  return { FIELDS_SCHEMA, NAMES_DATA };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.YserbiusData = YserbiusData;
}

if (typeof exports === 'object' && typeof module === 'object') {
  exports.FIELDS_SCHEMA = YserbiusData.FIELDS_SCHEMA;
  exports.NAMES_DATA = YserbiusData.NAMES_DATA;
}
