/**
 * Shadow of Yserbius — MYCHARS.DAT Browser Editor UI Controller.
 * Zero network requests, zero build step, works over file:// and HTTP static servers.
 */
(() => {
  'use strict';

  const { FIELDS_SCHEMA, NAMES_DATA } = globalThis.YserbiusData;
  const cipher = globalThis.YserbiusCipher;
  const fieldsApi = globalThis.YserbiusFields;

  const FIELD_MAP = fieldsApi.buildFieldMap(FIELDS_SCHEMA);

  const state = {
    tables: null,
    pendingDatBytes: null,
    openedFileHandle: null,
    openedFileName: null,
    session: null,
    activeSlot: 0,
    globalMode: 'rep', // 'rep' | 'raw'
    fieldModes: new Map(), // key -> 'rep' | 'raw'
    unlockWealthHi: false,
    allowUnusedItems: false,
    skillOrder: [],
    spellOrder: [],
    pickerTargetSlot: null,
    pendingExeResolve: null,
    suppressItemChangeHandler: false,
  };

  // ---------- DOM helpers ----------
  const $ = (id) => document.getElementById(id);

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'className') {
        node.className = v;
      } else if (k === 'textContent') {
        node.textContent = v;
      } else if (k === 'dataset') {
        for (const [dk, dv] of Object.entries(v)) {
          node.dataset[dk] = String(dv);
        }
      } else if (k === 'disabled' || k === 'checked' || k === 'readOnly' || k === 'selected' || k === 'required') {
        node[k] = Boolean(v);
      } else {
        node.setAttribute(k, String(v));
      }
    }
    for (const child of children) {
      if (child === null || child === undefined || child === false) continue;
      if (typeof child === 'string' || typeof child === 'number') {
        node.appendChild(document.createTextNode(String(child)));
      } else {
        node.appendChild(child);
      }
    }
    return node;
  }

  function showGlobalError(msg) {
    const banner = $('global-error-banner');
    if (!msg) {
      banner.textContent = '';
      banner.classList.add('hidden');
    } else {
      banner.textContent = msg;
      banner.classList.remove('hidden');
    }
  }

  function getMode(key) {
    return state.fieldModes.get(key) || state.globalMode;
  }

  function toggleMode(key) {
    const next = getMode(key) === 'rep' ? 'raw' : 'rep';
    state.fieldModes.set(key, next);
  }

  function makeStatusBadge(status) {
    if (status === 'confirmed') {
      return el('span', { className: 'badge badge-confirmed', textContent: 'confirmed' });
    }
    if (status === 'supported') {
      return el('span', { className: 'badge badge-supported', textContent: 'supported' });
    }
    return el('span', {
      className: 'badge badge-hypothesis',
      textContent: 'hypothesis (unknown)',
    });
  }

  function makeRiskBadge(risk) {
    if (risk === 'locked') {
      return el('span', { className: 'badge badge-locked', textContent: 'risk: locked' });
    }
    if (risk === 'caution') {
      return el('span', { className: 'badge badge-caution', textContent: 'risk: caution' });
    }
    return null;
  }

  function readFileBytes(file) {
    return file.arrayBuffer().then((buf) => new Uint8Array(buf));
  }

  // ---------- File Loading & Dialog Confirmation ----------
  function confirmExeMismatch(tables) {
    const dialog = $('exe-mismatch-dialog');
    $('exe-mismatch-details').textContent =
      `File size: ${tables.exeSize} bytes (expected ${tables.expectedExeSize})\n` +
      `P table SHA-1: ${tables.permSha1}\n` +
      `  expected:    ${tables.expectedPermSha1}\n` +
      `S table SHA-1: ${tables.scrambleSha1}\n` +
      `  expected:    ${tables.expectedScrambleSha1}`;

    return new Promise((resolve) => {
      state.pendingExeResolve = resolve;
      dialog.returnValue = '';
      dialog.showModal();
    });
  }

  $('exe-mismatch-dialog').addEventListener('close', () => {
    const dialog = $('exe-mismatch-dialog');
    const confirmed = dialog.returnValue === 'confirm';
    dialog.returnValue = '';
    if (state.pendingExeResolve) {
      const fn = state.pendingExeResolve;
      state.pendingExeResolve = null;
      fn(confirmed);
    }
  });

  async function processExeBytes(bytes, filename) {
    showGlobalError('');
    const statusEl = $('exe-status');
    try {
      const tables = await cipher.loadTables(bytes);
      if (!tables.fingerprintsMatch) {
        const proceed = await confirmExeMismatch(tables);
        if (!proceed) {
          state.tables = null;
          state.session = null;
          $('workspace').classList.add('hidden');
          statusEl.className = 'alert alert-error';
          statusEl.textContent = `Rejected ${filename}: table SHA-1 fingerprints did not match the tested YSBOX.EXE.`;
          return;
        }
      }

      state.tables = tables;
      statusEl.className = tables.fingerprintsMatch ? 'alert alert-ok' : 'alert alert-warn';
      statusEl.replaceChildren(
        el('strong', { textContent: tables.fingerprintsMatch ? 'YSBOX.EXE verified: ' : 'YSBOX.EXE loaded (unverified hashes): ' }),
        `${filename} (${tables.exeSize} bytes) — header=${tables.headerSize}, P @ ${fieldsApi.formatHexOffset(tables.permOffset)}, S @ ${fieldsApi.formatHexOffset(tables.scrambleOffset)}.`,
        el('br'),
        el('span', { className: 'mono', textContent: `P SHA-1: ${tables.permSha1} | S SHA-1: ${tables.scrambleSha1}` }),
      );
      tryInitializeSession();
    } catch (err) {
      state.tables = null;
      state.session = null;
      $('workspace').classList.add('hidden');
      statusEl.className = 'alert alert-error';
      statusEl.textContent = `Failed to load ${filename}: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async function processDatBytes(bytes, filename, fileHandle = null) {
    showGlobalError('');
    const statusEl = $('dat-status');
    try {
      // Strictly validate 3076-byte size before keeping or decoding anything.
      cipher.splitMycharsFile(bytes);
      state.pendingDatBytes = bytes;
      state.openedFileHandle = fileHandle;
      state.openedFileName = filename;

      statusEl.className = 'alert alert-ok';
      statusEl.textContent = `Loaded ${filename} (${bytes.length} bytes — valid 0x40 + 6 x 502 layout).${fileHandle ? ' Overwrite handle ready.' : ''}`;
      tryInitializeSession();
    } catch (err) {
      state.pendingDatBytes = null;
      state.openedFileHandle = null;
      state.openedFileName = null;
      state.session = null;
      $('workspace').classList.add('hidden');
      statusEl.className = 'alert alert-error';
      statusEl.textContent = `Rejected ${filename}: ${err instanceof Error ? err.message : String(err)} Nothing was decoded.`;
    }
  }

  function tryInitializeSession() {
    if (!state.tables || !state.pendingDatBytes) {
      return;
    }
    try {
      state.session = fieldsApi.createSaveSession(
        state.pendingDatBytes,
        state.tables,
        FIELDS_SCHEMA,
        NAMES_DATA,
        cipher,
      );
      const headerSlot = state.session.originalHeader[0];
      state.activeSlot = headerSlot < FIELDS_SCHEMA.slots ? headerSlot : 0;
      computeGroupOrders();
      $('workspace').classList.remove('hidden');
      $('diff-panel').classList.add('hidden');
      renderAll();
    } catch (err) {
      state.session = null;
      $('workspace').classList.add('hidden');
      showGlobalError(`Error initializing save session: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function computeGroupOrders() {
    if (!state.session) return;
    const dec = state.session.getDecodedSlot(state.activeSlot);
    const sortByNonZero = (arr) => {
      const nonZero = [];
      const zero = [];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] > 0) nonZero.push(i);
        else zero.push(i);
      }
      return [...nonZero, ...zero];
    };
    state.skillOrder = sortByNonZero(dec.values.skills);
    state.spellOrder = sortByNonZero(dec.values.spells);
  }

  function setupDropzone(zoneId, onFile) {
    const zone = $(zoneId);
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });
    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const item = e.dataTransfer?.items?.[0];
      let handle = null;
      if (item && typeof item.getAsFileSystemHandle === 'function') {
        try {
          const maybeHandle = await item.getAsFileSystemHandle();
          if (maybeHandle && maybeHandle.kind === 'file') {
            handle = maybeHandle;
          }
        } catch {
          handle = null;
        }
      }
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        onFile(file, handle);
      }
    });
  }

  $('exe-input').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await processExeBytes(await readFileBytes(file), file.name);
    }
  });

  $('dat-input').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await processDatBytes(await readFileBytes(file), file.name, null);
    }
  });

  setupDropzone('exe-dropzone', async (file) => {
    await processExeBytes(await readFileBytes(file), file.name);
  });

  setupDropzone('dat-dropzone', async (file, handle) => {
    await processDatBytes(await readFileBytes(file), file.name, handle);
  });

  if (typeof window.showOpenFilePicker === 'function') {
    const openHandleBtn = $('open-handle-btn');
    openHandleBtn.classList.remove('hidden');
    openHandleBtn.addEventListener('click', async () => {
      try {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: 'Yserbius MYCHARS.DAT Save File',
              accept: { 'application/octet-stream': ['.dat', '.DAT'] },
            },
          ],
        });
        if (!handle) return;
        const file = await handle.getFile();
        await processDatBytes(await readFileBytes(file), file.name, handle);
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        showGlobalError(`Could not open file handle: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
  }

  // ---------- Toolbar & Advanced Mode ----------
  function syncToolbarState() {
    if (!state.session) return;
    const isRep = state.globalMode === 'rep';
    $('global-mode-rep').className = `btn-small ${isRep ? 'btn-primary' : ''}`;
    $('global-mode-rep').setAttribute('aria-pressed', String(isRep));
    $('global-mode-raw').className = `btn-small ${!isRep ? 'btn-primary' : ''}`;
    $('global-mode-raw').setAttribute('aria-pressed', String(!isRep));

    const advBtn = $('advanced-mode-btn');
    const advOn = state.session.advancedConfirmed;
    advBtn.textContent = advOn
      ? 'Advanced Mode: ON (Locked fields unlocked)'
      : 'Advanced Mode: OFF (Locked fields read-only)';
    advBtn.className = `btn-small ${advOn ? 'btn-danger' : ''}`;
    advBtn.setAttribute('aria-pressed', String(advOn));

    const activeSummary = state.session.getSlotSummary(state.activeSlot);
    $('active-slot-banner').textContent = `Editing Slot ${state.activeSlot}: ${activeSummary.name || '(unnamed)'}`;
    $('revert-slot-btn').disabled = activeSummary.modifiedByteCount === 0;

    const diff = state.session.computeDiff();
    $('revert-all-btn').disabled = !diff.hasChanges;
    $('nav-diff-count').textContent = `${diff.byteDiffs.length} byte${diff.byteDiffs.length === 1 ? '' : 's'}`;
    $('nav-diff-count').className = `badge ${diff.hasChanges ? 'badge-modified' : ''}`;

    updateExportControls();
  }

  function updateExportControls() {
    if (!state.session) return;
    const canExport = state.session.canExport();
    $('download-btn').disabled = !canExport;

    const overwriteBtn = $('overwrite-btn');
    if (state.openedFileHandle && typeof state.openedFileHandle.createWritable === 'function') {
      overwriteBtn.classList.remove('hidden');
      overwriteBtn.disabled = !canExport;
    } else {
      overwriteBtn.classList.add('hidden');
      overwriteBtn.disabled = true;
    }

    const pill = $('review-status-pill');
    if (canExport) {
      pill.className = 'badge badge-confirmed';
      pill.textContent = 'Verified & Diff Reviewed — Ready to Download';
    } else if (state.session.lastVerification && !state.session.lastVerification.ok) {
      pill.className = 'badge badge-locked';
      pill.textContent = 'Self-check FAILED — Download Blocked';
    } else {
      pill.className = 'badge badge-caution';
      pill.textContent = 'Review Diff & Self-Check required before download';
      if (state.session.reviewedRevision === null) {
        // Keep panel visible if already shown once, but update its banner to warn edits occurred.
        const panel = $('diff-panel');
        if (!panel.classList.contains('hidden')) {
          $('self-check-banner').className = 'alert alert-warn';
          $('self-check-banner').textContent =
            'You made changes after the last review. Click "Review Diff & Self-Check Output" again to re-verify before downloading.';
        }
      }
    }
  }

  $('global-mode-rep').addEventListener('click', () => {
    state.globalMode = 'rep';
    state.fieldModes.clear();
    renderAll();
  });

  $('global-mode-raw').addEventListener('click', () => {
    state.globalMode = 'raw';
    state.fieldModes.clear();
    renderAll();
  });

  $('revert-slot-btn').addEventListener('click', () => {
    if (!state.session) return;
    state.session.revertSlot(state.activeSlot);
    computeGroupOrders();
    renderAll();
  });

  $('revert-all-btn').addEventListener('click', () => {
    if (!state.session) return;
    state.session.revertAll();
    computeGroupOrders();
    renderAll();
  });

  $('unlock-wealth-hi-chk').addEventListener('change', (e) => {
    state.unlockWealthHi = e.target.checked;
    renderPointsWealth();
  });

  $('allow-unused-items-chk').addEventListener('change', (e) => {
    state.allowUnusedItems = e.target.checked;
    renderItems();
  });

  $('regroup-skills-spells-btn').addEventListener('click', () => {
    computeGroupOrders();
    renderSkillsAndSpells();
  });

  // Advanced Mode Dialog
  $('advanced-mode-btn').addEventListener('click', () => {
    if (!state.session) return;
    if (state.session.advancedConfirmed) {
      state.session.setAdvancedMode(false);
      renderAll();
      return;
    }
    const dialog = $('advanced-mode-dialog');
    $('adv-ack-checkbox').checked = false;
    $('adv-confirm-input').value = '';
    $('adv-dialog-error').classList.add('hidden');
    dialog.showModal();
  });

  $('adv-cancel-btn').addEventListener('click', () => {
    $('advanced-mode-dialog').close('cancel');
  });

  $('advanced-mode-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.session) return;
    const ack = $('adv-ack-checkbox').checked;
    const text = $('adv-confirm-input').value;
    try {
      state.session.setAdvancedMode(true, { acknowledged: ack, text });
      $('advanced-mode-dialog').close('confirm');
      renderAll();
    } catch (err) {
      const errBox = $('adv-dialog-error');
      errBox.textContent = err instanceof Error ? err.message : String(err);
      errBox.classList.remove('hidden');
    }
  });

  // ---------- Slots Overview ----------
  function renderSlots() {
    const header = state.session.originalHeader;
    $('header-info').replaceChildren(
      el('span', { className: 'badge badge-offset', textContent: `Header current slot: ${header[0]}` }),
      el('span', {
        className: 'badge badge-offset',
        textContent: `Header bytes[0..5]: ${Array.from(header.subarray(0, 6)).join(' ')}`,
      }),
    );

    const grid = $('slots-grid');
    const cards = [];
    for (let i = 0; i < FIELDS_SCHEMA.slots; i++) {
      const s = state.session.getSlotSummary(i);
      const isActive = i === state.activeSlot;

      const selectBtn = el(
        'button',
        {
          type: 'button',
          className: 'slot-select-btn',
          'aria-pressed': String(isActive),
        },
        el('div', {
          className: 'slot-name',
          textContent: `Slot ${i}: ${s.name || '(empty)'}${s.title ? ' ' + s.title : ''}`,
        }),
        el('div', {
          className: 'slot-meta',
          textContent: s.validity.state === 'empty'
            ? `Empty slot (flags ${s.validity.validA}, ${s.validity.validB})`
            : `${s.raceName} ${s.guildName} · Lv ${s.level} · flags (${s.validity.validA}, ${s.validity.validB})`,
        }),
      );
      selectBtn.addEventListener('click', () => {
        if (state.activeSlot !== i) {
          state.activeSlot = i;
          computeGroupOrders();
          renderAll();
        }
      });

      const badges = el('div', { className: 'badge-row' });
      if (s.isCurrentHeaderSlot) {
        badges.appendChild(el('span', { className: 'badge badge-supported', textContent: 'Active in Header' }));
      }
      if (s.validity.state === 'empty') {
        badges.appendChild(el('span', { className: 'badge badge-offset', textContent: 'Empty' }));
      }
      if (s.modifiedByteCount > 0) {
        badges.appendChild(
          el('span', {
            className: 'badge badge-modified',
            textContent: `Modified (${s.modifiedByteCount} B)`,
          }),
        );
      }

      const revertBtn = el('button', {
        type: 'button',
        className: 'btn-small',
        textContent: 'Revert Slot',
        disabled: s.modifiedByteCount === 0,
      });
      revertBtn.addEventListener('click', () => {
        state.session.revertSlot(i);
        if (i === state.activeSlot) computeGroupOrders();
        renderAll();
      });

      cards.push(
        el(
          'div',
          { className: `slot-card${isActive ? ' active' : ''}`, dataset: { slotCard: i } },
          selectBtn,
          badges,
          revertBtn,
        ),
      );
    }
    grid.replaceChildren(...cards);
  }

  // ---------- Field Rendering Helpers ----------
  function isFieldModified(fieldDef) {
    const orig = state.session.originalPlainRecords[state.activeSlot];
    const work = state.session.workingPlainRecords[state.activeSlot];
    const sz = fieldsApi.fieldByteSize(fieldDef.type);
    for (let i = 0; i < sz; i++) {
      if (orig[fieldDef.offset + i] !== work[fieldDef.offset + i]) return true;
    }
    return false;
  }

  function afterInPlaceInput(fieldBox, fieldDef, softNoteEl, warnings = [], errorMsg = '') {
    if (errorMsg) {
      fieldBox.querySelector('.field-error-note')?.remove();
      const errNode = el('div', { className: 'field-error-note', textContent: errorMsg });
      fieldBox.appendChild(errNode);
    } else {
      fieldBox.querySelector('.field-error-note')?.remove();
    }

    if (softNoteEl) {
      if (warnings.length > 0) {
        softNoteEl.textContent = warnings.join(' ');
        softNoteEl.classList.remove('hidden');
      } else {
        softNoteEl.textContent = '';
        softNoteEl.classList.add('hidden');
      }
    }

    const mod = isFieldModified(fieldDef);
    fieldBox.classList.toggle('modified', mod);
    const modBadge = fieldBox.querySelector('[data-mod-badge]');
    if (modBadge) modBadge.classList.toggle('hidden', !mod);
    const revBtn = fieldBox.querySelector('[data-field-revert]');
    if (revBtn) revBtn.disabled = !mod;

    syncToolbarState();
    renderSlots();
    renderUnknownHexViewsOnly();
  }

  function createFieldBox(fieldDef, decoded, opts = {}) {
    const mode = getMode(fieldDef.id);
    const mod = isFieldModified(fieldDef);
    const isLockedField = fieldDef.risk === 'locked' && !state.session.advancedConfirmed;
    const isForceReadOnly = Boolean(opts.readOnly) || isLockedField;
    const inputId = `field-${fieldDef.id}`;

    const box = el('div', {
      className: `field-box${mod ? ' modified' : ''}`,
      dataset: { fieldId: fieldDef.id },
    });

    const headerBadges = el(
      'div',
      { className: 'badge-row' },
      el('span', { className: 'badge badge-offset', textContent: fieldsApi.formatHexOffset(fieldDef.offset) }),
      makeStatusBadge(fieldDef.status),
      makeRiskBadge(fieldDef.risk),
      el('span', {
        className: `badge badge-modified${mod ? '' : ' hidden'}`,
        textContent: 'modified',
        dataset: { modBadge: '1' },
      }),
    );

    const modeBtn = el('button', {
      type: 'button',
      className: 'btn-small',
      textContent: mode === 'rep' ? 'Rep → Raw' : 'Raw → Rep',
      title: 'Switch this field between Representational and Numeric (Raw) mode',
      dataset: { fieldModeBtn: fieldDef.id },
    });
    modeBtn.addEventListener('click', () => {
      toggleMode(fieldDef.id);
      renderSectionForGroup(fieldDef.group);
    });

    const revertBtn = el('button', {
      type: 'button',
      className: 'btn-small',
      textContent: 'Revert',
      disabled: !mod || isForceReadOnly,
      dataset: { fieldRevert: fieldDef.id },
    });
    revertBtn.addEventListener('click', () => {
      state.session.revertField(state.activeSlot, fieldDef.id);
      renderAll();
    });

    const titleEl = el('label', { className: 'field-title', for: inputId, textContent: fieldDef.label });
    box.appendChild(
      el(
        'div',
        { className: 'field-header' },
        el('div', {}, titleEl, headerBadges),
        el('div', { className: 'badge-row' }, modeBtn, revertBtn),
      ),
    );

    const controls = el('div', { className: 'field-controls' });
    const softNoteEl = el('div', { className: 'field-soft-note hidden' });
    const val = decoded.values[fieldDef.id];
    const initialWarnings = fieldsApi.getFieldSoftNotes(fieldDef.id, val);
    if (initialWarnings.length > 0) {
      softNoteEl.textContent = initialWarnings.join(' ');
      softNoteEl.classList.remove('hidden');
    }

    if (fieldDef.type === 'str10') {
      if (mode === 'rep') {
        const input = el('input', {
          id: inputId,
          type: 'text',
          value: val,
          readOnly: isForceReadOnly,
          autocorrect: 'off',
          autocapitalize: 'none',
          spellcheck: 'false',
          dataset: { fieldInput: fieldDef.id },
        });
        const byteCountBadge = el('span', {
          className: 'badge badge-offset',
          textContent: `${val.length} / 10 B`,
        });

        input.addEventListener('input', () => {
          const text = input.value;
          byteCountBadge.textContent = `${text.length} / 10 B`;
          if (isForceReadOnly) return;
          try {
            const syncChk = $('sync-name2-chk');
            const syncName2 = fieldDef.id === 'name' ? (syncChk ? syncChk.checked : true) : false;
            const { warnings } = state.session.setScalarField(state.activeSlot, fieldDef.id, text, { syncName2 });
            input.setCustomValidity('');
            input.removeAttribute('aria-invalid');
            afterInPlaceInput(box, fieldDef, softNoteEl, warnings, '');
            if (fieldDef.id === 'name' && syncName2) {
              const name2Box = document.querySelector('[data-field-id="name2"]');
              const name2Input = name2Box?.querySelector('input[type="text"]');
              if (name2Input) {
                name2Input.value = text;
                afterInPlaceInput(
                  name2Box,
                  FIELD_MAP.get('name2'),
                  name2Box.querySelector('.field-soft-note'),
                  warnings,
                  '',
                );
              }
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            input.setAttribute('aria-invalid', 'true');
            afterInPlaceInput(box, fieldDef, softNoteEl, [], msg);
          }
        });

        controls.append(input, byteCountBadge);
        if (fieldDef.id === 'name') {
          const syncId = 'sync-name2-chk';
          const syncChk = el('input', { id: syncId, type: 'checkbox', checked: true });
          const syncLbl = el('label', { for: syncId, textContent: 'Also write 2nd copy at 0xE7' });
          box.appendChild(controls);
          box.appendChild(el('div', { className: 'file-actions-row' }, syncChk, syncLbl));
        } else {
          box.appendChild(controls);
        }
      } else {
        // Raw 10-byte editor
        const rawBytes = fieldsApi.readStr10RawBytes(
          state.session.workingPlainRecords[state.activeSlot],
          fieldDef.offset,
        );
        const byteGrid = el('div', { className: 'byte-array-grid' });
        const inputs = rawBytes.map((b, idx) => {
          const bInput = el('input', {
            id: idx === 0 ? inputId : undefined,
            type: 'number',
            min: 0,
            max: 255,
            value: b,
            disabled: isForceReadOnly,
            'aria-label': `${fieldDef.label} byte ${idx}`,
          });
          bInput.addEventListener('input', () => {
            if (bInput.value === '') return;
            const arr = inputs.map((inp) => Number.parseInt(inp.value, 10));
            if (arr.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
              afterInPlaceInput(box, fieldDef, softNoteEl, [], 'Each raw byte must be an integer 0..255.');
              return;
            }
            const syncName2 = fieldDef.id === 'name' && ($('sync-name2-chk')?.checked ?? true);
            state.session.setStr10Bytes(state.activeSlot, fieldDef.id, arr, { syncName2 });
            afterInPlaceInput(box, fieldDef, softNoteEl, [], '');
          });
          byteGrid.appendChild(bInput);
          return bInput;
        });
        box.appendChild(byteGrid);
      }
    } else if (fieldDef.enum && mode === 'rep') {
      // Enum dropdown (sex, race, side, guild, facing)
      const list = NAMES_DATA[fieldDef.enum] || [];
      const select = el('select', {
        id: inputId,
        disabled: isForceReadOnly,
        dataset: { fieldInput: `${fieldDef.id}-rep` },
      });

      let found = false;
      for (const entry of list) {
        const label =
          fieldDef.id === 'side'
            ? `${entry.id} — Unknown (hypothesis: ${entry.name}?)`
            : `${entry.id} — ${entry.name}`;
        const opt = el('option', { value: entry.id, textContent: label, selected: entry.id === val });
        if (entry.id === val) found = true;
        select.appendChild(opt);
      }
      if (!found) {
        select.appendChild(
          el('option', { value: val, textContent: `${val} — Unknown (#${val})`, selected: true }),
        );
      }

      select.addEventListener('change', () => {
        const n = Number.parseInt(select.value, 10);
        state.session.setScalarField(state.activeSlot, fieldDef.id, n);
        if (fieldDef.id === 'guild') {
          renderAll();
        } else if (fieldDef.id === 'facing') {
          renderPosition();
          syncToolbarState();
          renderSlots();
          renderUnknownHexViewsOnly();
        } else {
          afterInPlaceInput(box, fieldDef, softNoteEl, fieldsApi.getFieldSoftNotes(fieldDef.id, n), '');
        }
      });

      controls.appendChild(select);
      box.appendChild(controls);
    } else if (fieldDef.id === 'cell' && mode === 'rep') {
      // Cell row / col helper
      const rowVal = val >> 4;
      const colVal = val & 15;
      const rowInp = el('input', {
        id: inputId,
        type: 'number',
        min: 0,
        max: 15,
        value: rowVal,
        disabled: isForceReadOnly,
        'aria-label': 'Cell row (0..15)',
      });
      const colInp = el('input', {
        id: `${inputId}-col`,
        type: 'number',
        min: 0,
        max: 15,
        value: colVal,
        disabled: isForceReadOnly,
        'aria-label': 'Cell column (0..15)',
      });
      const summaryBadge = el('span', {
        className: 'badge badge-offset',
        textContent: `cell = ${val}`,
      });

      const handleCellRC = () => {
        if (rowInp.value === '' || colInp.value === '') return;
        const r = Number.parseInt(rowInp.value, 10);
        const c = Number.parseInt(colInp.value, 10);
        if (!Number.isInteger(r) || r < 0 || r > 15 || !Number.isInteger(c) || c < 0 || c > 15) {
          afterInPlaceInput(box, fieldDef, softNoteEl, [], 'Row and Column must each be 0..15.');
          return;
        }
        const cellVal = (r << 4) | c;
        state.session.setScalarField(state.activeSlot, 'cell', cellVal);
        summaryBadge.textContent = `cell = ${cellVal}`;
        syncCellGridHighlight(cellVal);
        afterInPlaceInput(box, fieldDef, softNoteEl, [], '');
      };

      rowInp.addEventListener('input', handleCellRC);
      colInp.addEventListener('input', handleCellRC);

      controls.append(
        el('label', { for: inputId, textContent: 'Row:' }),
        rowInp,
        el('label', { for: `${inputId}-col`, textContent: 'Col:' }),
        colInp,
        summaryBadge,
      );
      box.appendChild(controls);
    } else if (fieldDef.id === 'map' && mode === 'rep') {
      const known = fieldsApi.lookupKnownMap(val, NAMES_DATA);
      const textBadge = el('span', {
        className: 'badge badge-offset',
        textContent: known ? `${val} — ${known.name}` : `${val} — Unknown map`,
      });
      const select = el('select', { id: inputId, disabled: isForceReadOnly });
      let hasVal = false;
      for (const m of NAMES_DATA.maps_known) {
        if (m.map === val) hasVal = true;
        select.appendChild(
          el('option', {
            value: m.map,
            textContent: `${m.map} — ${m.name} (automap floor ${m.automap_floor})`,
            selected: m.map === val,
          }),
        );
      }
      if (!hasVal) {
        select.appendChild(el('option', { value: val, textContent: `${val} — Unknown map`, selected: true }));
      }
      select.addEventListener('change', () => {
        const n = Number.parseInt(select.value, 10);
        state.session.setScalarField(state.activeSlot, 'map', n);
        renderPosition();
        syncToolbarState();
        renderSlots();
        renderUnknownHexViewsOnly();
      });
      controls.append(select, textBadge);
      box.appendChild(controls);
    } else {
      // Numeric (u8 or u16) editor (handles Raw mode for everything, Rep mode for numeric fields/appearance)
      const maxVal = fieldDef.type === 'u8' ? 255 : 65535;
      const numInput = el('input', {
        id: inputId,
        type: 'number',
        min: 0,
        max: maxVal,
        value: val,
        disabled: isForceReadOnly,
        dataset: { fieldInput: fieldDef.id === 'facing' ? 'facing-raw' : fieldDef.id },
      });
      const metaBadge = el('span', {
        className: 'badge badge-offset',
        textContent:
          mode === 'raw'
            ? `0x${val.toString(16).toUpperCase().padStart(fieldDef.type === 'u8' ? 2 : 4, '0')}`
            : fieldDef.group === 'Appearance'
              ? `Option #${val} (name unknown)`
              : fieldDef.id === 'gold_hi' || fieldDef.id === 'exp_hi' || fieldDef.id === 'map_hi'
                ? 'Unknown'
                : `${fieldDef.type} (0..${maxVal})`,
      });

      const applyNumeric = (n) => {
        if (!Number.isInteger(n) || n < 0 || n > maxVal) {
          afterInPlaceInput(box, fieldDef, softNoteEl, [], `Enter an integer between 0 and ${maxVal}.`);
          return;
        }
        const { warnings } = state.session.setScalarField(state.activeSlot, fieldDef.id, n);
        if (mode === 'raw') {
          metaBadge.textContent = `0x${n.toString(16).toUpperCase().padStart(fieldDef.type === 'u8' ? 2 : 4, '0')}`;
        } else if (fieldDef.group === 'Appearance') {
          metaBadge.textContent = `Option #${n} (name unknown)`;
        }
        if (fieldDef.id === 'facing') {
          syncCompassHighlight(n);
        } else if (fieldDef.id === 'cell') {
          syncCellGridHighlight(n);
        }
        afterInPlaceInput(box, fieldDef, softNoteEl, warnings, '');
        if (fieldDef.id === 'guild') {
          renderItems();
        }
      };

      numInput.addEventListener('input', () => {
        if (numInput.value === '') return;
        applyNumeric(Number.parseInt(numInput.value, 10));
      });

      if (fieldDef.group === 'Appearance' && mode === 'rep') {
        const decBtn = el('button', { type: 'button', className: 'btn-small', textContent: '−', disabled: isForceReadOnly, 'aria-label': `Decrease ${fieldDef.label}` });
        const incBtn = el('button', { type: 'button', className: 'btn-small', textContent: '+', disabled: isForceReadOnly, 'aria-label': `Increase ${fieldDef.label}` });
        decBtn.addEventListener('click', () => {
          const next = (Number.parseInt(numInput.value, 10) || 0) - 1;
          if (next >= 0) {
            numInput.value = String(next);
            applyNumeric(next);
          }
        });
        incBtn.addEventListener('click', () => {
          const next = (Number.parseInt(numInput.value, 10) || 0) + 1;
          if (next <= 255) {
            numInput.value = String(next);
            applyNumeric(next);
          }
        });
        controls.append(decBtn, numInput, incBtn, metaBadge);
      } else {
        controls.append(numInput, metaBadge);
      }

      if (fieldDef.id === 'curhp' || fieldDef.id === 'curmana') {
        const maxField = fieldDef.id === 'curhp' ? 'maxhp' : 'maxmana';
        const matchBtn = el('button', {
          type: 'button',
          className: 'btn-small',
          textContent: `Match ${maxField === 'maxhp' ? 'Max HP' : 'Max Mana'}`,
        });
        matchBtn.addEventListener('click', () => {
          const curDec = state.session.getDecodedSlot(state.activeSlot);
          const target = curDec.values[maxField];
          state.session.setScalarField(state.activeSlot, fieldDef.id, target);
          numInput.value = String(target);
          afterInPlaceInput(box, fieldDef, softNoteEl, [], '');
        });
        controls.appendChild(matchBtn);
      }

      box.appendChild(controls);
    }

    if (fieldDef.notes) {
      box.appendChild(
        el('div', {
          className: fieldDef.risk === 'caution' ? 'field-soft-note' : 'field-note',
          textContent: fieldDef.notes,
        }),
      );
    }
    if (isLockedField) {
      box.appendChild(
        el('div', {
          className: 'field-note',
          textContent: 'Read-only (risk: locked). Turn on Advanced Mode to edit.',
        }),
      );
    }
    box.appendChild(softNoteEl);
    return box;
  }

  function renderSectionForGroup(group) {
    if (group === 'Identity') renderIdentity();
    else if (group === 'Appearance') renderAppearance();
    else if (group === 'Attributes') renderAttributes();
    else if (group === 'Points' || group === 'Wealth') renderPointsWealth();
    else if (group === 'Position') renderPosition();
    else if (group === 'Unknown') renderUnknown();
  }

  function renderIdentity() {
    const dec = state.session.getDecodedSlot(state.activeSlot);
    const list = FIELDS_SCHEMA.fields.filter((f) => f.group === 'Identity');
    $('fields-identity').replaceChildren(...list.map((f) => createFieldBox(f, dec)));
  }

  function renderAppearance() {
    const dec = state.session.getDecodedSlot(state.activeSlot);
    const list = FIELDS_SCHEMA.fields.filter((f) => f.group === 'Appearance');
    $('fields-appearance').replaceChildren(...list.map((f) => createFieldBox(f, dec)));
  }

  function renderAttributes() {
    const dec = state.session.getDecodedSlot(state.activeSlot);
    const list = FIELDS_SCHEMA.fields.filter((f) => f.group === 'Attributes');
    $('fields-attributes').replaceChildren(...list.map((f) => createFieldBox(f, dec)));
  }

  function renderPointsWealth() {
    const dec = state.session.getDecodedSlot(state.activeSlot);
    const list = FIELDS_SCHEMA.fields.filter((f) => f.group === 'Points' || f.group === 'Wealth');
    $('fields-points-wealth').replaceChildren(
      ...list.map((f) => {
        const readOnly = (f.id === 'gold_hi' || f.id === 'exp_hi') && !state.unlockWealthHi;
        return createFieldBox(f, dec, { readOnly });
      }),
    );
  }

  function syncCompassHighlight(facingVal) {
    for (const btn of document.querySelectorAll('.compass-btn')) {
      const dir = Number.parseInt(btn.dataset.dir, 10);
      const active = dir === facingVal;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    }
  }

  function syncCellGridHighlight(cellVal) {
    for (const btn of document.querySelectorAll('.coord-cell')) {
      const idx = Number.parseInt(btn.dataset.cellIndex, 10);
      const active = idx === cellVal;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    }
  }

  function renderPosition() {
    const dec = state.session.getDecodedSlot(state.activeSlot);
    const list = FIELDS_SCHEMA.fields.filter((f) => f.group === 'Position');
    $('fields-position-scalars').replaceChildren(...list.map((f) => createFieldBox(f, dec)));

    // Compass selector (W=0, S=1, E=2, N=3)
    const compassWrap = el('div', { className: 'field-box' });
    compassWrap.appendChild(el('h3', { textContent: 'Compass Selector (Facing 0xF5)', style: 'margin-top:0;' }));
    compassWrap.appendChild(
      el('p', {
        className: 'field-note',
        textContent: 'Turning left in-game adds +1: West (0) → South (1) → East (2) → North (3). Both this compass and Numeric mode edit byte 0xF5.',
      }),
    );

    const pad = el('div', { className: 'compass-pad' });
    const compassOrder = [
      { id: 3, label: 'N (3)' },
      { id: 0, label: 'W (0)' },
      { id: 2, label: 'E (2)' },
      { id: 1, label: 'S (1)' },
    ];
    for (const dir of compassOrder) {
      const active = dec.values.facing === dir.id;
      const btn = el('button', {
        type: 'button',
        className: `compass-btn${active ? ' active' : ''}`,
        textContent: dir.label,
        'aria-pressed': String(active),
        dataset: { dir: dir.id },
      });
      btn.addEventListener('click', () => {
        state.session.setScalarField(state.activeSlot, 'facing', dir.id);
        renderPosition();
        syncToolbarState();
        renderSlots();
        renderUnknownHexViewsOnly();
      });
      pad.appendChild(btn);
    }
    pad.appendChild(el('div', { className: 'compass-center', textContent: 'Facing' }));
    compassWrap.appendChild(pad);

    // 16x16 Coordinate Grid helper (NOT a map drawing!)
    const gridWrap = el('div', { className: 'field-box' });
    gridWrap.appendChild(el('h3', { textContent: '16×16 Cell Coordinate Grid (0xF4)', style: 'margin-top:0;' }));
    gridWrap.appendChild(
      el('p', {
        className: 'field-note',
        textContent: 'Coordinate selector only (row = cell >> 4, col = cell & 15). Not a dungeon map image — walls are not shown.',
      }),
    );

    const gridScroll = el('div', { className: 'coord-grid-wrap' });
    const grid = el('div', { className: 'coord-grid', role: 'group', 'aria-label': '16 by 16 cell index selector' });
    for (let cell = 0; cell < 256; cell++) {
      const r = cell >> 4;
      const c = cell & 15;
      const active = dec.values.cell === cell;
      const btn = el('button', {
        type: 'button',
        className: `coord-cell${active ? ' active' : ''}`,
        textContent: cell.toString(16).toUpperCase().padStart(2, '0'),
        title: `Cell ${cell} (row ${r}, col ${c})`,
        'aria-label': `Cell ${cell}, row ${r}, column ${c}`,
        'aria-pressed': String(active),
        dataset: { cellIndex: cell },
      });
      btn.addEventListener('click', () => {
        state.session.setScalarField(state.activeSlot, 'cell', cell);
        renderPosition();
        syncToolbarState();
        renderSlots();
        renderUnknownHexViewsOnly();
      });
      grid.appendChild(btn);
    }
    gridScroll.appendChild(grid);
    gridWrap.appendChild(gridScroll);

    $('position-visual-helpers').replaceChildren(compassWrap, gridWrap);
  }

  // ---------- Items (32 Slots + Charges + Searchable Picker) ----------
  function filterItemsList(query) {
    const q = query.trim().toLowerCase();
    if (!q) return NAMES_DATA.items;
    return NAMES_DATA.items.filter((item) => {
      if (String(item.id) === q || item.name.toLowerCase().includes(q)) return true;
      if (item.type_guess && item.type_guess.toLowerCase().includes(q)) return true;
      if (item.allowed_guilds && item.allowed_guilds.toLowerCase().includes(q)) return true;
      if (item.skill_index !== null && NAMES_DATA.skills[item.skill_index]?.name.toLowerCase().includes(q)) return true;
      if (item.spell_index !== null && NAMES_DATA.spells[item.spell_index]?.name.toLowerCase().includes(q)) return true;
      return false;
    });
  }

  function jumpToStatRow(kind, index) {
    const rowId = `${kind}-row-${index}`;
    const row = $(rowId);
    if (!row) return;
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.add('flash-highlight');
    const inp = row.querySelector('input');
    if (inp) inp.focus({ preventScroll: true });
    setTimeout(() => row.classList.remove('flash-highlight'), 1800);
  }

  function openItemPickerDialog(slotIndex) {
    state.pickerTargetSlot = slotIndex;
    $('item-picker-slot-label').textContent = NAMES_DATA.item_slot_labels[slotIndex] || `Slot ${slotIndex}`;
    const searchInput = $('item-picker-search');
    searchInput.value = '';
    renderItemPickerResults('');
    $('item-picker-dialog').showModal();
  }

  function renderItemPickerResults(query) {
    const matches = filterItemsList(query);
    $('item-picker-count').textContent = `${matches.length} of ${NAMES_DATA.items.length} items shown`;

    const dec = state.session.getDecodedSlot(state.activeSlot);
    const guildId = dec.values.guild;

    const listNodes = matches.map((item) => {
      const details = fieldsApi.getItemDetails(item.id, guildId, dec.values.skills, dec.values.spells, NAMES_DATA);
      const parts = [
        `#${item.id}`,
        item.type_guess ? `${item.type_guess} (guess)` : 'type unknown',
        `Guilds: ${item.allowed_guilds}`,
      ];
      if (details.skillLink) parts.push(`Skill: ${details.skillLink.name}`);
      if (details.spellLink) parts.push(`Spell: ${details.spellLink.name}`);
      if (item.default_charges > 0) parts.push(`Default charges: ${item.default_charges}`);
      if (details.forbidBadge) parts.push(`[${details.forbidBadge}]`);

      const btn = el(
        'button',
        { type: 'button', className: 'picker-option-btn', dataset: { pickerItemId: item.id } },
        el('strong', { textContent: `${item.id}: ${item.name}` }),
        el('span', { className: 'picker-option-sub', textContent: parts.join(' · ') }),
      );
      btn.addEventListener('click', () => {
        if (state.pickerTargetSlot !== null) {
          state.session.setArrayElement(state.activeSlot, 'items', state.pickerTargetSlot, item.id);
          $('item-picker-dialog').close('selected');
          renderItems();
          syncToolbarState();
          renderSlots();
          renderUnknownHexViewsOnly();
        }
      });
      return el('li', {}, btn);
    });

    $('item-picker-list').replaceChildren(...listNodes);
  }

  $('item-picker-search').addEventListener('input', (e) => {
    renderItemPickerResults(e.target.value);
  });

  $('item-picker-dialog').addEventListener('close', () => {
    $('item-picker-dialog').returnValue = '';
    state.pickerTargetSlot = null;
  });

  // Inline Quick Item Lookup
  $('inline-item-search-form').addEventListener('submit', (e) => e.preventDefault());
  $('inline-item-search').addEventListener('input', (e) => {
    const q = e.target.value;
    const box = $('inline-item-search-results');
    const countEl = $('inline-item-search-count');
    if (!q.trim()) {
      box.classList.add('hidden');
      box.replaceChildren();
      countEl.textContent = '';
      return;
    }
    const matches = filterItemsList(q);
    countEl.textContent = `${matches.length} match${matches.length === 1 ? '' : 'es'}`;
    box.classList.remove('hidden');

    if (matches.length === 0) {
      box.replaceChildren(el('div', { className: 'field-note', textContent: 'No matching items found.' }));
      return;
    }

    const dec = state.session ? state.session.getDecodedSlot(state.activeSlot) : null;
    const ul = el('ul', { className: 'picker-list', style: 'margin:0;border:none;max-height:190px;' });
    for (const item of matches.slice(0, 60)) {
      const details = dec
        ? fieldsApi.getItemDetails(item.id, dec.values.guild, dec.values.skills, dec.values.spells, NAMES_DATA)
        : null;
      const meta = [
        `id ${item.id}`,
        item.type_guess || '?',
        `Allowed: ${item.allowed_guilds}`,
        details?.skillLink ? `Skill: ${details.skillLink.name}` : null,
        details?.spellLink ? `Spell: ${details.spellLink.name}` : null,
        details?.forbidBadge || null,
      ]
        .filter(Boolean)
        .join(' · ');
      ul.appendChild(
        el(
          'li',
          { style: 'padding:0.25rem 0.4rem;border-bottom:1px solid var(--border);' },
          el('strong', { textContent: `${item.id}: ${item.name}` }),
          el('div', { className: 'picker-option-sub', textContent: meta }),
        ),
      );
    }
    box.replaceChildren(ul);
  });

  function createItemRow(slotInfo, dec, itemsDef, chargesDef) {
    const k = slotInfo.slotIndex;
    const isUnused = k >= 10 && k <= 14;
    const disabledSlot = isUnused && !state.allowUnusedItems;
    const modeKey = `items:${k}`;
    const mode = state.fieldModes.has(modeKey) ? state.fieldModes.get(modeKey) : getMode('items');

    const origItems = fieldsApi.readField(state.session.originalPlainRecords[state.activeSlot], itemsDef);
    const origCharges = fieldsApi.readField(state.session.originalPlainRecords[state.activeSlot], chargesDef);
    const isMod = origItems[k] !== slotInfo.itemId || origCharges[k] !== slotInfo.charges;

    const row = el('div', {
      className: `item-row${isMod ? ' modified' : ''}${isUnused ? ' unused-slot' : ''}`,
      dataset: { itemSlot: k },
    });

    // Column 1: Slot label & offsets
    const col1 = el(
      'div',
      {},
      el('div', { style: 'font-weight:700;', textContent: slotInfo.slotLabel }),
      el(
        'div',
        { className: 'badge-row', style: 'margin-top:0.25rem;' },
        el('span', { className: 'badge badge-offset', textContent: `item ${fieldsApi.formatHexOffset(itemsDef.offset + k * 2)}` }),
        el('span', { className: 'badge badge-offset', textContent: `chg ${fieldsApi.formatHexOffset(chargesDef.offset + k)}` }),
        isMod ? el('span', { className: 'badge badge-modified', textContent: 'modified' }) : null,
      ),
    );
    if (isUnused) {
      col1.appendChild(
        el('div', {
          className: 'field-soft-note',
          style: 'margin-top:0.35rem;',
          textContent: 'Unused slot: cleared by game on save.',
        }),
      );
    }

    // Column 2: Item selector + metadata + skill/spell links
    const col2 = el('div', {});
    const itemInputRow = el('div', { className: 'field-controls' });
    const itemSelectId = `item-slot-select-${k}`;

    if (mode === 'rep') {
      const sel = el('select', {
        id: itemSelectId,
        disabled: disabledSlot,
        'aria-label': `${slotInfo.slotLabel} item`,
        dataset: { itemSelect: k },
      });
      let knownFound = false;
      for (const entry of NAMES_DATA.items) {
        if (entry.id === slotInfo.itemId) knownFound = true;
        sel.appendChild(
          el('option', {
            value: entry.id,
            textContent: entry.id === 0 ? '0: (Empty)' : `${entry.id}: ${entry.name}`,
            selected: entry.id === slotInfo.itemId,
          }),
        );
      }
      if (!knownFound) {
        sel.appendChild(
          el('option', {
            value: slotInfo.itemId,
            textContent: `${slotInfo.itemId}: Unknown Item #${slotInfo.itemId}`,
            selected: true,
          }),
        );
      }
      sel.addEventListener('change', () => {
        const nextId = Number.parseInt(sel.value, 10);
        state.session.setArrayElement(state.activeSlot, 'items', k, nextId);
        renderItems();
        syncToolbarState();
        renderSlots();
        renderUnknownHexViewsOnly();
      });

      const searchBtn = el('button', {
        type: 'button',
        className: 'btn-small',
        textContent: 'Search…',
        disabled: disabledSlot,
        dataset: { openItemSearch: k },
      });
      searchBtn.addEventListener('click', () => openItemPickerDialog(k));
      itemInputRow.append(sel, searchBtn);
    } else {
      const rawInp = el('input', {
        id: itemSelectId,
        type: 'number',
        min: 0,
        max: 65535,
        value: slotInfo.itemId,
        disabled: disabledSlot,
        'aria-label': `${slotInfo.slotLabel} raw item id`,
        dataset: { itemRaw: k },
      });
      rawInp.addEventListener('change', () => {
        if (rawInp.value === '') return;
        const n = Number.parseInt(rawInp.value, 10);
        if (!Number.isInteger(n) || n < 0 || n > 65535) return;
        state.session.setArrayElement(state.activeSlot, 'items', k, n);
        renderItems();
        syncToolbarState();
        renderSlots();
        renderUnknownHexViewsOnly();
      });
      itemInputRow.append(
        rawInp,
        el('span', { className: 'badge badge-offset', textContent: slotInfo.name }),
      );
    }

    const modeBtn = el('button', {
      type: 'button',
      className: 'btn-small',
      textContent: mode === 'rep' ? 'Rep → Raw' : 'Raw → Rep',
      title: 'Switch this item slot between item name and raw ID',
    });
    modeBtn.addEventListener('click', () => {
      state.fieldModes.set(modeKey, mode === 'rep' ? 'raw' : 'rep');
      renderItems();
    });
    itemInputRow.appendChild(modeBtn);
    col2.appendChild(itemInputRow);

    if (!slotInfo.isEmpty) {
      const metaLine = el('div', { className: 'item-meta-line' });
      metaLine.appendChild(
        el('span', {
          className: 'field-note',
          textContent: `Type: ${slotInfo.typeGuess} (guess) · Guilds: ${slotInfo.allowedGuilds}`,
        }),
      );
      if (slotInfo.forbidBadge) {
        metaLine.appendChild(
          el('span', {
            className: 'badge badge-forbid',
            textContent: slotInfo.forbidBadge,
            dataset: { guildForbidden: '1' },
          }),
        );
      }
      if (slotInfo.skillLink) {
        const sBtn = el('button', {
          type: 'button',
          className: 'link-chip',
          textContent: `Uses skill: ${slotInfo.skillLink.name} (level ${slotInfo.skillLink.level})`,
          dataset: { itemSkillLink: slotInfo.skillLink.index },
        });
        sBtn.addEventListener('click', () => jumpToStatRow('skill', slotInfo.skillLink.index));
        metaLine.appendChild(sBtn);
      }
      if (slotInfo.spellLink) {
        const spBtn = el('button', {
          type: 'button',
          className: 'link-chip',
          textContent: `Casts: ${slotInfo.spellLink.name} (level ${slotInfo.spellLink.level})`,
          dataset: { itemSpellLink: slotInfo.spellLink.index },
        });
        spBtn.addEventListener('click', () => jumpToStatRow('spell', slotInfo.spellLink.index));
        metaLine.appendChild(spBtn);
      }
      col2.appendChild(metaLine);
    }

    // Column 3: Charges & Revert
    const col3 = el('div', { className: 'field-controls' });
    const chargeId = `item-charge-${k}`;
    const chargeInp = el('input', {
      id: chargeId,
      type: 'number',
      min: 0,
      max: 255,
      value: slotInfo.charges,
      disabled: disabledSlot,
      style: 'max-width:5.5rem;',
      dataset: { itemCharges: k },
    });
    chargeInp.addEventListener('input', () => {
      if (chargeInp.value === '') return;
      const n = Number.parseInt(chargeInp.value, 10);
      if (!Number.isInteger(n) || n < 0 || n > 255) return;
      state.session.setArrayElement(state.activeSlot, 'charges', k, n);
      row.classList.add('modified');
      syncToolbarState();
      renderSlots();
      renderUnknownHexViewsOnly();
    });

    const defBtn = el('button', {
      type: 'button',
      className: 'btn-small',
      textContent: `Default (${slotInfo.defaultCharges})`,
      disabled: disabledSlot,
    });
    defBtn.addEventListener('click', () => {
      state.session.setArrayElement(state.activeSlot, 'charges', k, slotInfo.defaultCharges);
      renderItems();
      syncToolbarState();
      renderSlots();
      renderUnknownHexViewsOnly();
    });

    const revBtn = el('button', {
      type: 'button',
      className: 'btn-small',
      textContent: 'Revert',
      disabled: !isMod || disabledSlot,
    });
    revBtn.addEventListener('click', () => {
      state.session.revertField(state.activeSlot, 'items', k);
      state.session.revertField(state.activeSlot, 'charges', k);
      renderItems();
      syncToolbarState();
      renderSlots();
      renderUnknownHexViewsOnly();
    });

    col3.append(
      el('label', { for: chargeId, textContent: 'Charges:' }),
      chargeInp,
      defBtn,
      revBtn,
    );

    row.append(col1, col2, col3);
    return row;
  }

  function renderItems() {
    const dec = state.session.getDecodedSlot(state.activeSlot);
    const itemsDef = FIELD_MAP.get('items');
    const chargesDef = FIELD_MAP.get('charges');
    const groups = [
      { title: 'Equipped (15–20) & Ground (31)', indices: [15, 16, 17, 18, 19, 20, 31] },
      { title: 'Inventory (1–10)', indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { title: 'Quest Items (1–10)', indices: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30] },
      { title: 'Unused Slots (10–14 — cleared by game on save)', indices: [10, 11, 12, 13, 14] },
    ];

    const container = $('items-container');
    const nodes = [];
    for (const grp of groups) {
      nodes.push(el('h3', { className: 'item-group-heading', textContent: grp.title }));
      const list = el('div', { className: 'items-list' });
      for (const k of grp.indices) {
        list.appendChild(createItemRow(dec.itemSlots[k], dec, itemsDef, chargesDef));
      }
      nodes.push(list);
    }
    container.replaceChildren(...nodes);
  }

  // ---------- Skills (24) & Spells (24) ----------
  function renderStatColumn(kind, panelEl) {
    const isSkills = kind === 'skill';
    const fieldId = isSkills ? 'skills' : 'spells';
    const namesList = isSkills ? NAMES_DATA.skills : NAMES_DATA.spells;
    const order = isSkills ? state.skillOrder : state.spellOrder;
    const fieldDef = FIELD_MAP.get(fieldId);
    const dec = state.session.getDecodedSlot(state.activeSlot);
    const values = dec.values[fieldId];
    const origValues = fieldsApi.readField(state.session.originalPlainRecords[state.activeSlot], fieldDef);

    // Find items referencing each skill or spell
    const usedByMap = new Map();
    for (const slot of dec.itemSlots) {
      if (slot.isEmpty) continue;
      const link = isSkills ? slot.skillLink : slot.spellLink;
      if (link) {
        if (!usedByMap.has(link.index)) usedByMap.set(link.index, []);
        usedByMap.get(link.index).push(`${slot.slotLabel}: ${slot.name}`);
      }
    }

    const wrapper = el('div', {});
    wrapper.appendChild(
      el('h3', { textContent: isSkills ? 'Skills (24 entries)' : 'Spells (24 entries)' }),
    );

    const buildGroup = (title, indices) => {
      const box = el('div', { style: 'margin-bottom:0.85rem;' });
      box.appendChild(el('div', { className: 'field-note', style: 'font-weight:700;margin-bottom:0.35rem;', textContent: title }));
      const list = el('div', { className: 'stat-list' });

      for (const idx of indices) {
        const entry = namesList[idx];
        const val = values[idx];
        const origVal = origValues[idx];
        const mod = val !== origVal;
        const modeKey = `${fieldId}:${idx}`;
        const mode = state.fieldModes.has(modeKey) ? state.fieldModes.get(modeKey) : getMode(fieldId);
        const offsetHex = fieldsApi.formatHexOffset(fieldDef.offset + idx * 2);
        const rowId = `${kind}-row-${idx}`;
        const inputId = `${kind}-lvl-${idx}`;
        const usedBy = usedByMap.get(idx) || [];

        // True Seeing (spell 23) and Clubs/Axes (skill 1) were confirmed in game; others are supported
        const status =
          (isSkills && idx === 1) || (!isSkills && idx === 23) ? 'confirmed' : 'supported';

        const row = el('div', {
          id: rowId,
          className: `stat-row${mod ? ' modified' : ''}`,
        });

        const info = el(
          'div',
          { className: 'stat-row-info' },
          el(
            'div',
            { className: 'badge-row' },
            el('label', { for: inputId, style: 'font-weight:700;', textContent: `${idx}: ${entry.name}` }),
            el('span', { className: 'badge badge-offset', textContent: offsetHex }),
            makeStatusBadge(status),
            el('span', {
              className: `badge badge-modified${mod ? '' : ' hidden'}`,
              textContent: 'modified',
              dataset: { modBadge: '1' },
            }),
          ),
        );
        if (usedBy.length > 0) {
          info.appendChild(
            el('div', {
              className: 'field-note',
              textContent: `Referenced by item: ${usedBy.join('; ')}`,
            }),
          );
        }

        const rawHexBadge = el('span', {
          className: `badge badge-offset${mode === 'raw' ? '' : ' hidden'}`,
          textContent: `0x${val.toString(16).toUpperCase().padStart(4, '0')}`,
        });

        const lvlInput = el('input', {
          id: inputId,
          type: 'number',
          min: 0,
          max: 65535,
          value: val,
        });

        const softEl = el('div', { className: `field-soft-note${val > 255 ? '' : ' hidden'}` });
        if (val > 255) {
          softEl.textContent = fieldsApi.getFieldSoftNotes(fieldId, val).join(' ');
        }

        const revBtn = el('button', {
          type: 'button',
          className: 'btn-small',
          textContent: 'Revert',
          disabled: !mod,
        });

        lvlInput.addEventListener('input', () => {
          if (lvlInput.value === '') return;
          const n = Number.parseInt(lvlInput.value, 10);
          if (!Number.isInteger(n) || n < 0 || n > 65535) return;
          const { warnings } = state.session.setArrayElement(state.activeSlot, fieldId, idx, n);
          rawHexBadge.textContent = `0x${n.toString(16).toUpperCase().padStart(4, '0')}`;
          if (warnings.length > 0) {
            softEl.textContent = warnings.join(' ');
            softEl.classList.remove('hidden');
          } else {
            softEl.textContent = '';
            softEl.classList.add('hidden');
          }
          const nowMod = n !== origVal;
          row.classList.toggle('modified', nowMod);
          row.querySelector('[data-mod-badge]').classList.toggle('hidden', !nowMod);
          revBtn.disabled = !nowMod;
          // Refresh item skill/spell level labels without disturbing input focus
          refreshItemSkillSpellLabels();
          syncToolbarState();
          renderSlots();
          renderUnknownHexViewsOnly();
        });

        const modeBtn = el('button', {
          type: 'button',
          className: 'btn-small',
          textContent: mode === 'rep' ? 'Rep → Raw' : 'Raw → Rep',
        });
        modeBtn.addEventListener('click', () => {
          state.fieldModes.set(modeKey, mode === 'rep' ? 'raw' : 'rep');
          renderSkillsAndSpells();
        });

        revBtn.addEventListener('click', () => {
          state.session.revertField(state.activeSlot, fieldId, idx);
          renderSkillsAndSpells();
          refreshItemSkillSpellLabels();
          syncToolbarState();
          renderSlots();
          renderUnknownHexViewsOnly();
        });

        const ctrl = el('div', { className: 'stat-row-controls' }, lvlInput, rawHexBadge, modeBtn, revBtn);
        row.append(info, ctrl, softEl);
        list.appendChild(row);
      }
      box.appendChild(list);
      return box;
    };

    const nonZeroIndices = order.filter((i) => values[i] > 0);
    const zeroIndices = order.filter((i) => values[i] === 0);
    if (nonZeroIndices.length > 0) {
      wrapper.appendChild(buildGroup(`Levels > 0 (${nonZeroIndices.length})`, nonZeroIndices));
    }
    wrapper.appendChild(buildGroup(`Level 0 (${zeroIndices.length})`, zeroIndices));

    panelEl.replaceChildren(wrapper);
  }

  function refreshItemSkillSpellLabels() {
    if (!state.session) return;
    const dec = state.session.getDecodedSlot(state.activeSlot);
    for (const chip of document.querySelectorAll('[data-item-skill-link]')) {
      const idx = Number.parseInt(chip.dataset.itemSkillLink, 10);
      const name = NAMES_DATA.skills[idx]?.name;
      if (name) chip.textContent = `Uses skill: ${name} (level ${dec.values.skills[idx]})`;
    }
    for (const chip of document.querySelectorAll('[data-item-spell-link]')) {
      const idx = Number.parseInt(chip.dataset.itemSpellLink, 10);
      const name = NAMES_DATA.spells[idx]?.name;
      if (name) chip.textContent = `Casts: ${name} (level ${dec.values.spells[idx]})`;
    }
  }

  function renderSkillsAndSpells() {
    renderStatColumn('skill', $('skills-panel'));
    renderStatColumn('spell', $('spells-panel'));
  }

  // ---------- Unknown / Hex Inspector ----------
  function renderHexDump(targetEl, bytes, startOffset, origBytes, highlightOffsets = new Set()) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < bytes.length; i += 16) {
      const absRow = startOffset + i;
      const linePrefix = `${absRow.toString(16).toUpperCase().padStart(3, '0')}: `;
      frag.appendChild(document.createTextNode(linePrefix));
      const rowEnd = Math.min(i + 16, bytes.length);
      for (let j = i; j < rowEnd; j++) {
        const absOff = startOffset + j;
        const hex = bytes[j].toString(16).toUpperCase().padStart(2, '0');
        const changed = origBytes && bytes[j] !== origBytes[absOff];
        if (changed || highlightOffsets.has(absOff)) {
          frag.appendChild(
            el('span', {
              className: changed ? 'hex-changed' : 'hex-flag',
              textContent: hex,
              title: `Offset ${fieldsApi.formatHexOffset(absOff)}`,
            }),
          );
        } else {
          frag.appendChild(document.createTextNode(hex));
        }
        if (j + 1 < rowEnd) frag.appendChild(document.createTextNode(' '));
      }
      frag.appendChild(document.createTextNode('\n'));
    }
    targetEl.replaceChildren(frag);
  }

  function renderUnknownHexViewsOnly() {
    if (!state.session) return;
    const orig = state.session.originalPlainRecords[state.activeSlot];
    const work = state.session.workingPlainRecords[state.activeSlot];
    const unkF6Def = FIELD_MAP.get('unkF6');
    const validAOff = FIELD_MAP.get('valid_a').offset;
    const validBOff = FIELD_MAP.get('valid_b').offset;
    const flagsSet = new Set([validAOff, validBOff]);

    renderHexDump(
      $('unkf6-hex'),
      work.subarray(unkF6Def.offset, unkF6Def.offset + fieldsApi.fieldByteSize(unkF6Def.type)),
      unkF6Def.offset,
      orig,
      flagsSet,
    );
    renderHexDump($('full-record-hex'), work, 0, orig, flagsSet);
  }

  function renderUnknown() {
    const dec = state.session.getDecodedSlot(state.activeSlot);
    const list = FIELDS_SCHEMA.fields.filter(
      (f) => f.group === 'Unknown' && f.id !== 'unkF6',
    );
    $('fields-unknown').replaceChildren(...list.map((f) => createFieldBox(f, dec)));
    renderUnknownHexViewsOnly();
  }

  function renderAll() {
    if (!state.session) return;
    renderSlots();
    syncToolbarState();
    renderIdentity();
    renderAppearance();
    renderAttributes();
    renderPointsWealth();
    renderPosition();
    renderItems();
    renderSkillsAndSpells();
    renderUnknown();
  }

  // ---------- Diff Review, Self-Check & Export ----------
  $('review-diff-btn').addEventListener('click', () => {
    if (!state.session) return;
    const result = state.session.reviewDiffAndVerify();
    const panel = $('diff-panel');
    panel.classList.remove('hidden');

    const banner = $('self-check-banner');
    if (result.ok) {
      banner.className = 'alert alert-ok';
      banner.textContent = result.diff.hasChanges
        ? `Self-check PASSED: Re-decrypted output equals your edited records byte-for-byte (${result.diff.modifiedSlots.length} modified slot(s), ${result.diff.byteDiffs.length} plaintext byte(s) changed; unmodified slots & header copied verbatim).`
        : 'Self-check PASSED: 0 bytes changed — output file is byte-identical to your uploaded MYCHARS.DAT.';
    } else {
      banner.className = 'alert alert-error';
      banner.textContent = result.error;
    }

    const summary = $('diff-summary-content');
    if (!result.diff.hasChanges) {
      summary.replaceChildren(
        el('p', {
          className: 'field-note',
          textContent: 'No field differences. Downloading now will produce an exact byte-for-byte copy of the uploaded file.',
        }),
      );
    } else {
      const wrap = el('div', { className: 'diff-table-wrap' });
      const table = el('table', { className: 'diff-table' });
      table.appendChild(
        el(
          'thead',
          {},
          el(
            'tr',
            {},
            el('th', { textContent: 'Slot' }),
            el('th', { textContent: 'Field' }),
            el('th', { textContent: 'Offset' }),
            el('th', { textContent: 'Old Value' }),
            el('th', { textContent: 'New Value' }),
            el('th', { textContent: 'Notes' }),
          ),
        ),
      );
      const tbody = el('tbody');
      for (const d of result.diff.fieldDiffs) {
        tbody.appendChild(
          el(
            'tr',
            {},
            el('td', { textContent: d.slotLabel }),
            el('td', { textContent: d.label }),
            el('td', { className: 'mono', textContent: d.offsetHex }),
            el('td', { textContent: d.oldRep === d.oldRaw ? d.oldRaw : `${d.oldRep} [raw: ${d.oldRaw}]` }),
            el('td', { textContent: d.newRep === d.newRaw ? d.newRaw : `${d.newRep} [raw: ${d.newRaw}]` }),
            el('td', { textContent: d.note || '' }),
          ),
        );
      }
      table.appendChild(tbody);
      wrap.appendChild(table);

      const byteText = result.diff.byteDiffs
        .map(
          (b) =>
            `Slot ${b.slotIndex} @ ${b.offsetHex}: 0x${b.oldByte.toString(16).toUpperCase().padStart(2, '0')} -> 0x${b.newByte.toString(16).toUpperCase().padStart(2, '0')}`,
        )
        .join('\n');
      summary.replaceChildren(
        wrap,
        el('details', { style: 'margin-top:0.65rem;' },
          el('summary', { style: 'cursor:pointer;font-weight:600;', textContent: `Raw plaintext byte diff (${result.diff.byteDiffs.length} bytes)` }),
          el('pre', { className: 'hex-dump', style: 'margin-top:0.4rem;', textContent: byteText }),
        ),
      );
    }

    updateExportControls();
  });

  $('download-btn').addEventListener('click', () => {
    if (!state.session || !state.session.canExport()) return;
    try {
      const outBytes = state.session.getVerifiedOutputBytes();
      const blob = new Blob([outBytes], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Mychars.dat';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      showGlobalError(`Download blocked: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  $('overwrite-btn').addEventListener('click', () => {
    if (!state.session || !state.session.canExport() || !state.openedFileHandle) return;
    $('overwrite-filename').textContent = state.openedFileName || 'Mychars.dat';
    const dialog = $('overwrite-confirm-dialog');
    dialog.returnValue = '';
    dialog.showModal();
  });

  $('overwrite-confirm-dialog').addEventListener('close', async () => {
    const dialog = $('overwrite-confirm-dialog');
    const action = dialog.returnValue;
    dialog.returnValue = '';
    if (action !== 'overwrite') return;
    if (!state.session || !state.session.canExport() || !state.openedFileHandle) return;

    try {
      const outBytes = state.session.getVerifiedOutputBytes();
      const writable = await state.openedFileHandle.createWritable();
      await writable.write(outBytes);
      await writable.close();
      $('dat-status').className = 'alert alert-ok';
      $('dat-status').textContent = `Saved ${outBytes.length} bytes back to ${state.openedFileName}.`;
    } catch (err) {
      showGlobalError(`Overwrite failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
})();
