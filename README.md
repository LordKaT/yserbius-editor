# Shadow of Yserbius — `MYCHARS.DAT` Browser Editor

A single-page, 100% client-side character save editor for *Shadow of Yserbius* (Sierra, 1993).
All table extraction, decryption, editing, round-trip verification, and re-encryption run locally in your browser with zero network requests and zero build tools. Your `YSBOX.EXE` and `MYCHARS.DAT` files never leave your machine.

## How to Run the Editor

You can run the editor in either of two ways:

1. **Open directly from disk (`file://`)**:
   Open `webtool/index.html` directly in Chromium, Chrome, Firefox, or Safari. No server or build step is required.
2. **Serve with any static HTTP server** (optional, also enables `showOpenFilePicker` overwrite-in-place support in Chromium-based browsers):
   ```sh
   python3 -m http.server -d webtool 8000
   ```
   Then visit `http://127.0.0.1:8000/`.

Once open, upload your own `YSBOX.EXE` (used solely to extract the `P` and `S` cipher tables) and your 3,076-byte `MYCHARS.DAT`.

## How to Load an Edited File in the Real Game (DOSBox-X)

Follow these exact 4 steps when replacing your save file:

1. **Back up the original file first** — copy your existing `MYCHARS.DAT` to a safe backup location before making any changes.
2. **Quit the game completely to DOS** — exit *Shadow of Yserbius* all the way back to the DOS prompt before replacing `MYCHARS.DAT`, because the game overwrites `MYCHARS.DAT` when it exits.
3. **Replace `Mychars.dat`** — copy the downloaded `Mychars.dat` into your game directory (or use the optional direct-overwrite flow if opened via File System Access API).
4. **Start the game and choose the lower volcano entrance** — launch *Shadow of Yserbius* and resume through the **lower volcano entrance** so that your edited current health, current mana, and dungeon position are preserved (the top entrance heals HP/Mana to full and resets your position).

## How to Run the Automated Tests

Requirements: **Node.js 22+** (tested on Node `v22.22.1`) and Chromium (`/usr/bin/chromium`) for the real-browser UI test (`t8-ui.test.mjs`).

From `/home/felicia/re/dos-game/handoff`:

```sh
node --test webtool/tests/*.test.mjs
```

Or run individual test suites:

```sh
# T1 (11 cipher vectors / 22 checks), T2 (whole-file round trips), T3 (YSBOX.EXE tables & validation)
node --test webtool/tests/t1-t3-cipher.test.mjs

# T4 (field decoding), T5 (edit1 byte-for-byte parity), T6 (minimal diff), T7 (safety rules)
node --test webtool/tests/t4-t7-records.test.mjs

# T8 (headless Chromium UI checks over HTTP and file://, network silence check)
node --test webtool/tests/t8-ui.test.mjs
```

## File Layout (`webtool/`)

- `index.html` — Single-page editor UI and native `<dialog>` modals.
- `styles.css` — Responsive light/dark theme (`prefers-color-scheme` + `light-dark()`).
- `data.js` — Embedded schema and name tables generated verbatim from `../data/fields.json` and `../data/names.json`.
- `cipher.js` — Standalone port of `../reference/record_cipher_ref.py` + MZ `YSBOX.EXE` table loader + SHA-1 check (`crypto.subtle` with pure-JS fallback). Zero DOM access.
- `fields.js` — Schema-driven record decoder, item/guild/skill/spell resolver, immutable save session, diff builder, and re-decryption self-checker. Zero DOM access.
- `app.js` — Browser UI controller connecting DOM controls, searchable 256-item picker, compass/grid position helpers, and export safety gates.
- `tests/` — `node --test` suite covering T1 through T8.

## Known Uncertainties, Unknowns & Implementation Notes

In accordance with the specification, unknown fields and unverified game mechanics are preserved verbatim and labeled rather than guessed:

- **Unknown record fields & bytes:**
  - `side` (`0x20`): marked `hypothesis (unknown)` — `Harmony` / `Chaos` are unconfirmed guesses.
  - `gold_hi` (`0x9D`) and `exp_hi` (`0xA1`): high 16-bit words have been `0` in every observed save; kept read-only by default unless unlocked via the Wealth checkbox.
  - `map_hi` (`0xF3`), `unk06` (`0x06..0x07`), and `unkF6` (`0xF6..0x1D5` 224-byte block except validity flags `0x17D` and `0x1AB`): shown read-only (`risk: locked` requires Advanced Mode + typing `illegal map code`) and copied through untouched.
  - Uncovered record bytes (`0x00..0x05`, `0x12`, `0x1D`, `0xF1`): always preserved byte-for-byte in the cloned 502-byte record buffer.
- **Unconfirmed option lists & mechanics:**
  - Appearance fields (`face`, `costume`, `headcover`, `nose`, `eyes`, `veil`): option names and valid ranges are unknown; shown as raw numbers without artificial caps.
  - Guild skill/spell eligibility, skill/spell max level caps, XP-needed-per-level thresholds, and item prices are unknown and are not invented or enforced.
  - Mana Potion (`206`), Mana Elixir (`207`), and Mana Restore (`208`) have `skill_raw = 24` (`skill_index: null`) and therefore render with no skill link.
- **Second name copy (`0xE7`):** Editing `Name` (`0x08`) writes both `0x08` and `0xE7` by default (controlled by an explicit checkbox and disclosed in the diff table), as it has not been verified whether the game reads `0xE7` on load.
- **File System Access API (`Save Over Opened File…`):** `window.showOpenFilePicker` is only available in Chromium-based browsers over HTTPS or `http://localhost`/`http://127.0.0.1` (not `file://` or Firefox/Safari). Standard file upload and `Download Mychars.dat` work everywhere, including `file://`.
- **Browser SHA-1 on `file://`:** In non-secure `file://` contexts where browsers omit `crypto.subtle`, `cipher.js` falls back to a pure-JS FIPS 180-4 SHA-1 implementation (`sha1HexPure`) tested against `node:crypto`.

## AI Disclosure

Portions of this project were made possible through the use of Google's Gemini Carbon model and Anthropics Claude model.

