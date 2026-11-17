import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEBTOOL_DIR = path.resolve(__dirname, '..');
const HANDOFF_DIR = path.resolve(WEBTOOL_DIR, '..');
const EXE_PATH = path.join(HANDOFF_DIR, 'testdata', 'YSBOX.EXE');
const ORIG_DAT_PATH = path.join(HANDOFF_DIR, 'testdata', 'Mychars.original.dat');
const EXP11_DAT_PATH = path.join(HANDOFF_DIR, 'testdata', 'Mychars.exp11.dat');
const EXPECTED_EDIT1_PATH = path.join(HANDOFF_DIR, 'testdata', 'expected', 'Mychars.edit1.dat');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqPath = (req.url || '/').split('?')[0];
      const rel = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');
      const fullPath = path.resolve(WEBTOOL_DIR, rel);
      if (!fullPath.startsWith(WEBTOOL_DIR) || !fs.existsSync(fullPath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(fullPath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(fullPath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.id !== undefined) {
        const entry = this.pending.get(msg.id);
        if (entry) {
          this.pending.delete(msg.id);
          if (msg.error) entry.reject(new Error(`${msg.error.message} (${msg.error.code})`));
          else entry.resolve(msg.result);
        }
      } else if (msg.method) {
        const list = this.listeners.get(msg.method);
        if (list) {
          for (const cb of list) cb(msg.params || {});
        }
      }
    });
  }

  on(method, cb) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(cb);
  }

  send(method, params = {}, sessionId = undefined) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }

  close() {
    this.ws.close();
  }
}

async function withChromiumPage(fn) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yserbius-cdp-'));
  const chrome = spawn(
    '/usr/bin/chromium',
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--remote-debugging-port=0',
      `--user-data-dir=${tmpDir}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );

  let cdpUrl = null;
  let stderr = '';
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Chromium startup timed out. stderr=${stderr}`)),
      10000,
    );
    chrome.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      const match = /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr);
      if (match) {
        cdpUrl = match[1];
        clearTimeout(timer);
        resolve();
      }
    });
    chrome.on('exit', (code) => {
      if (!cdpUrl) {
        clearTimeout(timer);
        reject(new Error(`Chromium exited early (${code}): ${stderr}`));
      }
    });
  });

  const cdp = new CdpClient(cdpUrl);
  await cdp.ready;

  try {
    const { targetInfos } = await cdp.send('Target.getTargets');
    let pageTarget = targetInfos.find((t) => t.type === 'page');
    if (!pageTarget) {
      const created = await cdp.send('Target.createTarget', { url: 'about:blank' });
      pageTarget = { targetId: created.targetId };
    }
    const { sessionId } = await cdp.send('Target.attachToTarget', {
      targetId: pageTarget.targetId,
      flatten: true,
    });

    const pageErrors = [];
    const networkRequests = [];
    cdp.on('Runtime.exceptionThrown', (params) => {
      pageErrors.push(params.exceptionDetails?.text || 'Runtime exception');
    });
    cdp.on('Network.requestWillBeSent', (params) => {
      if (params.request?.url) networkRequests.push(params.request.url);
    });

    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('DOM.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Network.enable', {}, sessionId);

    const evalJs = async (expression) => {
      const res = await cdp.send(
        'Runtime.evaluate',
        { expression, awaitPromise: true, returnByValue: true },
        sessionId,
      );
      if (res.exceptionDetails) {
        throw new Error(
          `Page JS exception: ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}`,
        );
      }
      return res.result?.value;
    };

    const waitFor = async (predicateExpr, timeoutMs = 5000) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (await evalJs(predicateExpr)) return;
        await new Promise((r) => setTimeout(r, 40));
      }
      throw new Error(`Timed out waiting for: ${predicateExpr}`);
    };

    const setFile = async (selector, filePath) => {
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 }, sessionId);
      const { nodeId } = await cdp.send(
        'DOM.querySelector',
        { nodeId: root.nodeId, selector },
        sessionId,
      );
      assert.ok(nodeId > 0, `Selector ${selector} not found`);
      await cdp.send('DOM.setFileInputFiles', { nodeId, files: [filePath] }, sessionId);
    };

    await fn({ cdp, sessionId, evalJs, waitFor, setFile, pageErrors, networkRequests });
  } finally {
    cdp.close();
    chrome.kill('SIGTERM');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

test('T8: Real-browser UI verification (HTTP static server + zero network leaks + all T8 checks)', async () => {
  const { server, baseUrl } = await startStaticServer();
  try {
    await withChromiumPage(async ({ cdp, sessionId, evalJs, waitFor, setFile, pageErrors, networkRequests }) => {
      await cdp.send('Page.navigate', { url: `${baseUrl}/index.html` }, sessionId);
      await waitFor(`document.readyState === 'complete' && !!document.getElementById('exe-input')`);

      // Verify zero external network requests (only 127.0.0.1 local assets)
      const externalReqs = networkRequests.filter((u) => !u.startsWith(baseUrl));
      assert.deepStrictEqual(externalReqs, [], `Unexpected external network requests: ${externalReqs}`);

      // Upload YSBOX.EXE & Mychars.original.dat
      await setFile('#exe-input', EXE_PATH);
      await waitFor(`document.getElementById('exe-status').classList.contains('alert-ok')`);

      await setFile('#dat-input', ORIG_DAT_PATH);
      await waitFor(`!document.getElementById('workspace').classList.contains('hidden')`);

      // T8 check 1: Facing shows West/South/East/North and switches cleanly to numeric 0/1/2/3 editing same byte
      const facingRepOptions = await evalJs(`
        Array.from(document.querySelector('[data-field-input="facing-rep"]').options).map(o => o.textContent)
      `);
      assert.deepStrictEqual(facingRepOptions, ['0 — West', '1 — South', '2 — East', '3 — North']);
      assert.equal(await evalJs(`document.querySelector('[data-field-input="facing-rep"]').value`), '2');

      // Switch facing per-field mode to numeric, set 3, switch back to Rep and verify North (3)
      await evalJs(`document.querySelector('[data-field-mode-btn="facing"]').click()`);
      await waitFor(`!!document.querySelector('[data-field-input="facing-raw"]')`);
      assert.equal(await evalJs(`document.querySelector('[data-field-input="facing-raw"]').value`), '2');
      await evalJs(`(() => {
        const inp = document.querySelector('[data-field-input="facing-raw"]');
        inp.value = '3';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      await evalJs(`document.querySelector('[data-field-mode-btn="facing"]').click()`);
      await waitFor(`!!document.querySelector('[data-field-input="facing-rep"]')`);
      assert.equal(await evalJs(`document.querySelector('[data-field-input="facing-rep"]').value`), '3');
      assert.equal(
        await evalJs(`document.querySelector('.compass-btn[data-dir="3"]').classList.contains('active')`),
        true,
      );

      // T8 check 2: Item slots show label & item name; item search finds "Battle Axe" (id 19)
      const leftHandLabel = await evalJs(`document.querySelector('[data-item-slot="17"]').textContent`);
      assert.match(leftHandLabel, /Left hand \(weapon\)/);
      const leftHandOption = await evalJs(`
        (() => {
          const sel = document.querySelector('[data-item-select="17"]');
          return sel.options[sel.selectedIndex].textContent;
        })()
      `);
      assert.equal(leftHandOption, '1: Short Sword');

      // Inline search for Battle Axe
      await evalJs(`(() => {
        const s = document.getElementById('inline-item-search');
        s.value = 'Battle Axe';
        s.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      const inlineText = await evalJs(`document.getElementById('inline-item-search-results').textContent`);
      assert.match(inlineText, /19: Battle Axe/);

      // Search inside Item Picker modal
      await evalJs(`document.querySelector('[data-open-item-search="0"]').click()`);
      await waitFor(`document.getElementById('item-picker-dialog').open`);
      await evalJs(`(() => {
        const s = document.getElementById('item-picker-search');
        s.value = 'Battle Axe';
        s.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      const pickerMatch = await evalJs(`document.querySelector('[data-picker-item-id="19"]').textContent`);
      assert.match(pickerMatch, /19: Battle Axe/);
      await evalJs(`document.getElementById('item-picker-dialog').close()`);

      // T8 check 4a: Short Sword -> Fencing (level 0) on original Grunt; Mana Potion -> NO skill link
      const swordSkillText = await evalJs(`
        document.querySelector('[data-item-slot="17"] [data-item-skill-link]').textContent
      `);
      assert.equal(swordSkillText, 'Uses skill: Fencing (level 0)');

      const manaPotionSkillLinks = await evalJs(`
        document.querySelectorAll('[data-item-slot="1"] [data-item-skill-link]').length
      `);
      assert.equal(manaPotionSkillLinks, 0);

      // Select Mana Elixir (207) and Mana Restore (208) into slot 2 and verify NO skill link and no errors
      for (const manaId of ['207', '208']) {
        await evalJs(`(() => {
          const sel = document.querySelector('[data-item-select="2"]');
          sel.value = '${manaId}';
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        })()`);
        assert.equal(
          await evalJs(`document.querySelectorAll('[data-item-slot="2"] [data-item-skill-link]').length`),
          0,
        );
      }

      // Now load Mychars.exp11.dat
      await setFile('#dat-input', EXP11_DAT_PATH);
      await waitFor(`document.querySelector('[data-field-input="guild-rep"]').value === '4'`);

      // T8 check 3 & 4b: Battle Axe in exp11 Grunt Left hand -> "Not for Cleric" badge AND Clubs/Axes (level 1)
      const forbidBadge = await evalJs(`
        document.querySelector('[data-item-slot="17"] [data-guild-forbidden]').textContent
      `);
      assert.equal(forbidBadge, 'Not for Cleric');
      const axeSkillText = await evalJs(`
        document.querySelector('[data-item-slot="17"] [data-item-skill-link]').textContent
      `);
      assert.equal(axeSkillText, 'Uses skill: Clubs/Axes (level 1)');

      // Locked field (map) is disabled until Advanced Mode + confirmation text
      assert.equal(await evalJs(`document.getElementById('field-map').disabled`), true);
      await evalJs(`document.getElementById('advanced-mode-btn').click()`);
      await waitFor(`document.getElementById('advanced-mode-dialog').open`);
      await evalJs(`(() => {
        document.getElementById('adv-ack-checkbox').checked = true;
        document.getElementById('adv-confirm-input').value = 'illegal map code';
        document.getElementById('advanced-mode-form').requestSubmit();
      })()`);
      await waitFor(`!document.getElementById('advanced-mode-dialog').open`);
      assert.equal(await evalJs(`document.getElementById('field-map').disabled`), false);
      // Re-lock before export test
      await evalJs(`document.getElementById('advanced-mode-btn').click()`);
      assert.equal(await evalJs(`document.getElementById('field-map').disabled`), true);

      // Edit facing = 3 and gold = 1234 -> Download stays disabled until Review Diff & Self-Check
      await evalJs(`document.querySelector('.compass-btn[data-dir="3"]').click()`);
      await evalJs(`(() => {
        const g = document.getElementById('field-gold');
        g.value = '1234';
        g.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      assert.equal(await evalJs(`document.getElementById('download-btn').disabled`), true);

      // Click Review Diff & Self-Check -> passes and enables Download (Not for Cleric does NOT block)
      await evalJs(`document.getElementById('review-diff-btn').click()`);
      await waitFor(`!document.getElementById('diff-panel').classList.contains('hidden')`);
      const selfCheckText = await evalJs(`document.getElementById('self-check-banner').textContent`);
      assert.match(selfCheckText, /Self-check PASSED/);
      assert.equal(await evalJs(`document.getElementById('download-btn').disabled`), false);

      // Intercept Blob passed to URL.createObjectURL when clicking Download and verify exact edit1 bytes!
      const downloadedBase64 = await evalJs(`(async () => {
        let capturedBlob = null;
        const origCreate = URL.createObjectURL;
        URL.createObjectURL = (b) => { capturedBlob = b; return origCreate.call(URL, b); };
        document.getElementById('download-btn').click();
        URL.createObjectURL = origCreate;
        const buf = new Uint8Array(await capturedBlob.arrayBuffer());
        let bin = '';
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        return btoa(bin);
      })()`);
      const downloadedBuf = Buffer.from(downloadedBase64, 'base64');
      const expectedEdit1Buf = fs.readFileSync(EXPECTED_EDIT1_PATH);
      assert.equal(downloadedBuf.equals(expectedEdit1Buf), true, 'Browser Download bytes must match expected/Mychars.edit1.dat');
      assert.equal(crypto.createHash('md5').update(downloadedBuf).digest('hex'), '343ee5e5d9e5bb14726fba1c35b79b8a');

      // Name length > 10 refused with inline error; length === 10 accepted with warning
      await evalJs(`(() => {
        const n = document.getElementById('field-name');
        n.value = '12345678901';
        n.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      assert.equal(await evalJs(`document.getElementById('field-name').getAttribute('aria-invalid')`), 'true');
      assert.match(
        await evalJs(`document.querySelector('[data-field-id="name"] .field-error-note').textContent`),
        /maximum allowed is 10 bytes/i,
      );
      await evalJs(`(() => {
        const n = document.getElementById('field-name');
        n.value = '1234567890';
        n.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      assert.equal(await evalJs(`document.getElementById('field-name').getAttribute('aria-invalid')`), null);
      assert.match(
        await evalJs(`document.querySelector('[data-field-id="name"] .field-soft-note').textContent`),
        /above 9/i,
      );

      // Editing another field immediately re-disables download until re-reviewed
      await evalJs(`(() => {
        const s = document.getElementById('field-strength');
        s.value = '64';
        s.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      assert.equal(await evalJs(`document.getElementById('download-btn').disabled`), true);
      const softNote = await evalJs(`
        document.querySelector('[data-field-id="strength"] .field-soft-note:last-child').textContent
      `);
      assert.match(softNote, /Above largest tested value \(63\)/);

      // Invalid DAT size (<3076 bytes) rejected cleanly without decoding
      const badDatPath = path.join(os.tmpdir(), 'bad-mychars.dat');
      fs.writeFileSync(badDatPath, Buffer.alloc(100));
      try {
        await setFile('#dat-input', badDatPath);
        await waitFor(`document.getElementById('dat-status').classList.contains('alert-error')`);
        assert.equal(await evalJs(`document.getElementById('workspace').classList.contains('hidden')`), true);
      } finally {
        fs.rmSync(badDatPath, { force: true });
      }

      // Unrecognized EXE table triggers warning modal and cancelling rejects it
      const modExePath = path.join(os.tmpdir(), 'mod-ysbox.exe');
      const modExeBuf = fs.readFileSync(EXE_PATH);
      modExeBuf[0x3f8a] ^= 0xff;
      fs.writeFileSync(modExePath, modExeBuf);
      try {
        await setFile('#exe-input', modExePath);
        await waitFor(`document.getElementById('exe-mismatch-dialog').open`);
        await evalJs(`document.querySelector('#exe-mismatch-dialog button[value="cancel"]').click()`);
        await waitFor(`!document.getElementById('exe-mismatch-dialog').open`);
        await waitFor(`document.getElementById('exe-status').classList.contains('alert-error')`);
      } finally {
        fs.rmSync(modExePath, { force: true });
      }

      assert.deepStrictEqual(pageErrors, []);
      assert.deepStrictEqual(networkRequests.filter((u) => !u.startsWith(baseUrl)), []);
    });
  } finally {
    server.close();
  }
});

test('T8: Opening webtool/index.html directly over file:// works without network or server', async () => {
  await withChromiumPage(async ({ cdp, sessionId, evalJs, waitFor, setFile, pageErrors, networkRequests }) => {
    const fileUrl = pathToFileURL(path.join(WEBTOOL_DIR, 'index.html')).href;
    await cdp.send('Page.navigate', { url: fileUrl }, sessionId);
    await waitFor(`document.readyState === 'complete' && !!document.getElementById('exe-input')`);

    await setFile('#exe-input', EXE_PATH);
    await waitFor(`document.getElementById('exe-status').classList.contains('alert-ok')`);

    await setFile('#dat-input', EXP11_DAT_PATH);
    await waitFor(`!document.getElementById('workspace').classList.contains('hidden')`);

    const slot0Summary = await evalJs(`document.querySelector('[data-slot-card="0"]').textContent`);
    assert.match(slot0Summary, /Grunt/);
    assert.match(slot0Summary, /Cleric/);

    const externalReqs = networkRequests.filter((u) => !u.startsWith('file://'));
    assert.deepStrictEqual(externalReqs, []);
    assert.deepStrictEqual(pageErrors, []);
  });
});
