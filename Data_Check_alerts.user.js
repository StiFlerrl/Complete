// ==UserScript==
// @name         Info check + alerts
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  
// @match        https://emdspc.emsow.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const WATCH_WINDOW_MS = 20000;
  const STALE_DAYS = 30;
  const BOTTOM_SPACER_PX = 180;
  const DAY_MS = 24 * 3600 * 1000;

  // ---------- Styles
  (function injectStyles(){
    const css = `
      .x-window-body{ padding-bottom:0 !important; }
      .x-window-body .eligibility-coverage,
      .x-window-body .eligibility-coverage *{ white-space:normal !important; }
      .piv-bottom-spacer{ height:${BOTTOM_SPACER_PX}px; width:100% !important; display:block; flex:0 0 auto; }
    `;
    const style = document.createElement('style');
    style.textContent = css; document.head.appendChild(style);
  })();

  const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

  const isVisible = el => {
    if (!el || !(el instanceof Element)) return false;
    if (el.closest('.x-hide-display')) return false;
    const cs = getComputedStyle(el);
    return !(cs.display === 'none' || cs.visibility === 'hidden');
  };

  const getActivePanel = winBody =>
    winBody.querySelector('.x-tab-panel-body:not(.x-hide-display)') || winBody;

  const getActiveTabLabel = winBody => {
    const n = winBody.closest('.x-window')?.querySelector('.x-tab-strip .x-tab-strip-active .x-tab-strip-text');
    const t = n?.textContent?.trim() || '';
    if (/^Primary/i.test(t)) return 'Primary';
    if (/^Secondary/i.test(t)) return 'Secondary';
    if (/^Tertiary/i.test(t)) return 'Tertiary';
    return t.includes('Secondary') ? 'Secondary' : t.includes('Tertiary') ? 'Tertiary' : 'Primary';
  };

  function waitForReadyChange(winBody, prevPanel, prevSig, cb, timeout = 15000) {
    const start = Date.now();
    (function tick() {
      const p = getActivePanel(winBody);
      const sig = norm(p.textContent);
      const changed = (p !== prevPanel) || (sig && sig !== prevSig);
      if (changed || Date.now() - start > timeout) { cb(); return; }
      setTimeout(tick, 120);
    })();
  }

  function waitStable(panel, cb, timeout = 12000, quietMs = 700) {
    const start = Date.now();
    let lastLen = (panel.textContent || '').length;
    let lastChange = Date.now();
    const iv = setInterval(() => {
      const curLen = (panel.textContent || '').length;
      if (curLen !== lastLen) { lastLen = curLen; lastChange = Date.now(); }
      if (Date.now() - lastChange >= quietMs || Date.now() - start >= timeout) {
        clearInterval(iv); cb();
      }
    }, 120);
  }

  function collectEligibilityText(panel) {
    const buckets = new Set();
    panel.querySelectorAll('*').forEach(n => {
      if (!(n instanceof Element)) return;
      const cls = n.className || '';
      if (/\beligibility/i.test(cls) && isVisible(n)) buckets.add(n);
    });
    if (!buckets.size) buckets.add(panel);
    const out = [];
    buckets.forEach(n => {
      if (n.closest('.piv-agg') || n.closest('.piv-alert-container')) return;
      out.push(n.textContent || '');
    });
    return norm(out.join(' '));
  }

  function ensureAgg(winBody) {
    let box = winBody.querySelector('.piv-agg');
    if (box) return box;
    box = document.createElement('div');
    box.className = 'piv-agg';
    box.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;margin:8px 0 6px;align-items:stretch;';
    winBody.insertBefore(box, winBody.firstChild);
    return box;
  }

  function renderSection(winBody, tab, nodes) {
    const agg = ensureAgg(winBody);
    agg.querySelectorAll(`.piv-sec[data-tab="${tab}"]`).forEach(n => n.remove());
    nodes.forEach(n => { n.classList.add('piv-sec'); n.dataset.tab = tab; agg.appendChild(n); });
  }

  function markTabScanned(winBody, tab) {
    if (!winBody.__pivScanned) winBody.__pivScanned = {};
    winBody.__pivScanned[tab] = true;
  }
  function isTabScanned(winBody, tab) {
    return !!(winBody.__pivScanned && winBody.__pivScanned[tab]);
  }

  function startPanelWatcher(winBody, tab, durationMs = WATCH_WINDOW_MS) {
    if (!winBody.__pivWatches) winBody.__pivWatches = {};
    if (winBody.__pivWatches[tab]) return;

    const panel = getActivePanel(winBody);
    let debounce;
    const mo = new MutationObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        if (!isTabScanned(winBody, tab)) scanActiveTab(winBody, /*internal*/true);
      }, 250);
    });
    mo.observe(panel, { childList: true, subtree: true, characterData: true });
    winBody.__pivWatches[tab] = mo;

    setTimeout(() => {
      try { mo.disconnect(); } catch(_){ }
      markTabScanned(winBody, tab);
      delete winBody.__pivWatches[tab];
    }, durationMs);
  }

  function bindTabClicks(winBody) {
    if (winBody.dataset.pivTabsBound === '1') return;
    winBody.dataset.pivTabsBound = '1';
    const strip = winBody.closest('.x-window')?.querySelector('.x-tab-strip');
    if (!strip) return;

    strip.addEventListener('click', () => {
      const prevPanel = getActivePanel(winBody);
      const prevSig = norm(prevPanel.textContent);
      waitForReadyChange(winBody, prevPanel, prevSig, () => {
        const panel = getActivePanel(winBody);
        const tab = getActiveTabLabel(winBody);
        if (isTabScanned(winBody, tab)) return;
        const extraLag = (tab === 'Secondary' ? 900 : 300);
        setTimeout(() => waitStable(panel, () => {
          scanActiveTab(winBody, /*internal*/false);
          startPanelWatcher(winBody, tab, WATCH_WINDOW_MS);
        }), extraLag);
      });
    }, true);
  }

  new MutationObserver(muts => {
    for (const m of muts) for (const node of m.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      const subHdr = node.querySelector('th[colspan="2"]');
      if (!subHdr?.textContent.trim().startsWith('Subscriber:')) continue;
      const winBody = node.closest('div.x-window-body') || node;
      if (!winBody || winBody.dataset.pivInited === '1') continue;
      winBody.dataset.pivInited = '1';
      ensureAgg(winBody);
      bindTabClicks(winBody);
      const p = getActivePanel(winBody);
      setTimeout(() => waitStable(p, () => {
        const tab = getActiveTabLabel(winBody);
        if (!isTabScanned(winBody, tab)) {
          scanActiveTab(winBody, /*internal*/false);
          startPanelWatcher(winBody, tab, WATCH_WINDOW_MS);
        }
      }), 250);
    }
  }).observe(document.body, { childList: true, subtree: true });

  function parseUSDateTimeFlexible(s) {
    const m = s && s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
    if (!m) return null;
    const MM = +m[1], DD = +m[2], YYYY = +m[3];
    let hh = m[4] ? +m[4] : 12;
    const mm = m[5] ? +m[5] : 0;
    const ss = m[6] ? +m[6] : 0;
    const ampm = (m[7] || '').toUpperCase();
    if (m[4]) hh = hh % 12 + (ampm === 'PM' ? 12 : 0);
    return new Date(YYYY, MM - 1, DD, hh, mm, ss);
  }

  function historyDateFromHistoryStrip(winBody) {
    const winText = ((winBody.closest('.x-window') || document).textContent || '').replace(/\u00A0/g, ' ');
    const idx = winText.toLowerCase().indexOf('history:');
    if (idx !== -1) {
      const seg = winText.slice(idx, idx + 400);
      const m = seg.match(/\(\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}(?:\s+[0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?\s*(?:AM|PM)?)?)\s*\)/i);
      if (m) {
        const d = parseUSDateTimeFlexible(m[1]);
        if (d) return d;
      }
    }
    const m2 = winText.match(/Member\s*ID[^()\n\r]*\(\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}(?:\s+[0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?\s*(?:AM|PM)?)?)\s*\)/i);
    if (m2) return parseUSDateTimeFlexible(m2[1]);
    return null;
  }

  function robustHistoryDate(winBody, panel) {
    const txtPanel = (panel?.textContent || '').replace(/\u00A0/g, ' ');
    const txtWin   = ((winBody.closest('.x-window') || document).textContent || '').replace(/\u00A0/g, ' ');

    const dateRe = /(\d{1,2}\/\d{1,2}\/\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?/gi;
    const negativeCtx = /(date\s*of\s*birth|\bdob\b|birth\s*date|effective\s*date|coverage\s*(?:from|to|through)|eligibility\s*from|eligibility\s*to|start\s*date|end\s*date)/i;
    const positiveCtx = /(member\s*id|history|eligibility|as\s*of|checked|last\s*updated|response|generated|created|update)/i;

    let best = null;
    function scan(raw) {
      let m;
      while ((m = dateRe.exec(raw))) {
        const d = parseUSDateTimeFlexible(m[0]);
        if (!d) continue;
        const idx = m.index;
        const before = raw.slice(Math.max(0, idx - 140), idx).toLowerCase();
        const after  = raw.slice(dateRe.lastIndex, Math.min(raw.length, dateRe.lastIndex + 140)).toLowerCase();
        const ctx = before + ' ' + after;
        if (negativeCtx.test(ctx)) continue;
        if (!positiveCtx.test(ctx)) continue;
        if (!best || d > best) best = d;
      }
    }
    scan(txtPanel); scan(txtWin);
    return best;
  }

  function findScrollContainer(panel) {
    const target = panel.querySelector('table.eligibility-details, table.eligibility-info') || panel;
    let cur = target.parentElement;
    while (cur && cur !== panel && cur instanceof Element) {
      const cs = getComputedStyle(cur);
      const isScroll = /(auto|scroll)/i.test(cs.overflowY) || cur.scrollHeight > cur.clientHeight + 10;
      if (isScroll) return cur;
      cur = cur.parentElement;
    }
    return panel;
  }

  function hasExtraInsuranceStrict(panel) {
    const eligTriggers = [
      /eligibility:\s*contact\s*following\s*entity\s*for\s*eligibility\s*or\s*benefit\s*information/i,
      /eligibility:\s*other\s*or\s*additional\s*pay(?:or|er)/i
    ];
    const blocks = panel.querySelectorAll('.eligibility-coverage');
    for (const b of blocks) {
      const svc = norm(b.querySelector('.eligibility-service-type')?.textContent);
      if (svc !== '30: health benefit plan coverage') continue;
      const txt = norm(b.textContent);
      const cq  = /\bcq:\s*case\s*management\b/i.test(txt);
      const hasElig = eligTriggers.some(re => re.test(txt));
      if (hasElig || (cq && /contact\s*following\s*entity\s*for\s*eligibility\s*or\s*benefit\s*information/i.test(txt))) return true;
    }
    return false;
  }

  function scanActiveTab(winBody, internal) {
    const panel = getActivePanel(winBody);
    const tab = getActiveTabLabel(winBody) || 'Primary';
    if (isTabScanned(winBody, tab) && !internal) return;

    panel.querySelectorAll('.piv-alert-container').forEach(n => n.remove());
    panel.querySelectorAll('.piv-bottom-spacer').forEach(n => n.remove());

    // 1) grid values
    const sel = document.querySelector('div.x-grid3-row-selected .column-patient.app-overaction-body');
    let gridFirst = '', gridLast = '', procDOB = '', procGender = '';
    if (sel) {
      const title = sel.querySelector('span[qtitle]')?.textContent.trim() || '';
      if (title.includes(',')) [gridLast, gridFirst] = title.split(',').map(s => s.trim());
      else { const p = title.split(/\s+/); gridFirst = p.shift() || ''; gridLast = p.join(' '); }
      sel.querySelectorAll('table.app-tip-table tr').forEach(r => {
        if (r.querySelector('th')?.textContent.trim().toLowerCase() === 'dob:')
          procDOB = r.querySelector('td')?.textContent.trim() || '';
      });
      procGender = sel.querySelector('img[qtip]')?.getAttribute('qtip')?.trim() || '';
    }

    const subHeader = panel.querySelector('th[colspan="2"]')?.textContent.replace('Subscriber:', '').trim() || '';
    const [insLast = '', insFirst = ''] = subHeader.split(',').map(s => s.trim());
    let insDOB = '', insGender = '';
    panel.querySelectorAll('table.eligibility-info tr').forEach(r => {
      const [lbl, val] = r.querySelectorAll('td');
      if (!lbl || !val) return;
      const key = (lbl.textContent || '').trim().toLowerCase();
      if (key === 'date of birth') insDOB = (val.textContent || '').trim();
      if (key === 'gender')        insGender = (val.textContent || '').trim();
    });

    const mismatches = [];
    if (sel) {
      if (gridFirst.toLowerCase()  !== insFirst.toLowerCase()) mismatches.push(`First name: "${gridFirst}" ≠ "${insFirst}"`);
      if (gridLast.toLowerCase()   !== insLast.toLowerCase())  mismatches.push(`Last name: "${gridLast}" ≠ "${insLast}"`);
      if ((procDOB || '').trim()   !== (insDOB || '').trim())  mismatches.push(`Date of birth: "${procDOB}" ≠ "${insDOB}"`);
      if ((procGender || '').toLowerCase() !== (insGender || '').toLowerCase()) mismatches.push(`Gender: "${procGender}" ≠ "${insGender}"`);
    }

    const text = collectEligibilityText(panel);
    const plans = [];
    const add = (re, msg, ok = true) => { if (ok && re.test(text) && !plans.includes(msg)) plans.push(msg); };

    let matchedSimple = false;
    if (/simple\W+open\W*\(ppo\)/i.test(text)) { plans.push('Simple Open план обнаружен! Wellcare Copay $500'); matchedSimple = true; }
    if (!matchedSimple && /simple\W+open\b/i.test(text)) { plans.push('Simple Open план обнаружен! Wellcare Copay $500'); matchedSimple = true; }
    if (!matchedSimple && /\bsimple\b/i.test(text))       { plans.push('Simple план обнаружен! Wellcare Copay $500'); }

    add(/\bsomos\b/i,                      'SOMOS IPA план обнаружен! Не стадии можем разрешить');
    add(/\bhome\s*first\b|\bhomefirst\b/i, 'HOMEFIRST план обнаружен! Elderplan HOMEFIRST cant accept');
    add(/\bbenefit\s*&?\s*risk\s*management\s*services\b/i, 'Benefit & Risk management services план обнаружен!');
    add(/\bvip\s*reserve\s*hmo\b/i,        'VIP RESERVE HMO план обнаружен!');
    add(/\bvip\s*dual\s*reverse\b/i,       'VIP DUAL REVERSE план обнаружен!');
    add(/\bsenior\s*health\s*partners\b/i, 'SENIOR HEALTH PARTNERS план обнаружен!');
    add(/\bsmall\s*group\s*epo\b/i,        'Small Group EPO план обнаружен!');
    add(/\bplatinum\s*total\s*epo\b/i,     'Platinum Total EPO план обнаружен!');
    add(/\bsignature\b/i,                  'Signature план обнаружен! Copay 7-$25, 9-$60');
    add(/\blppo\s*aarp\b/i,                'Lppo AARP план обнаружен! Проверить Network Participation/Copay');
    add(/\bgiveback\s*open\b/i,            'Giveback open план обнаружен! Wellcare Copay $350');
    add(/\bpremium\s*open\b/i,             'Premium Open план обнаружен! Wellcare Copay $150');
    add(/\bpremium\b/i,                    'Premium план обнаружен! Проверь Deductible!', !/\bpremium\s*open\b/i.test(text));
    add(/\bassist\s*open\b/i,              'ASSIST OPEN обнаружен! Wellcare Copay $100');
    add(/\bpayor\s*identification[:\s]*c7\b/i, 'Payor Identification: C7 план обнаружен! Out of network with Centers Plan');
    add(/\b(?:ny\s*community\s*)?plan\s*for\s*adults\b/i, 'Plan for Adults - Возможно требуется направление, необходимо проверить PCP');
    add(/\bhip\s*hmo\s*preferred\b/i,      'HIP HMO PREFERRED - Возможно требуется направление, необходимо проверить PCP');

    add(/\bbronze\b/i,   'Bronze план обнаружен! Проверь Deductible!');
    add(/\bplatinum\b/i, 'Platinum план обнаружен! Проверь Deductible!', !/\bplatinum\s*total\s*epo\b/i.test(text));
    add(/\bgold\b/i,     'Gold план обнаружен! Проверь Deductible!');
    add(/\bsilver\b/i,   'Silver план обнаружен! Проверь Deductible!');
    add(/\bleaf\b/i,     'Leaf план обнаружен! Проверь Deductible!');

    // 4) Additional insurance — STRICT within the same coverage block (any column)
    const hasPair = hasExtraInsuranceStrict(panel);

// --- 5) Payor Identification ---
let payorMsg = null;

// ловим буквенно-цифровые коды (1–6 символов)
const pm = (panel.textContent || '').match(/Payor\s*Identification:\s*([A-Za-z0-9]{2})\b/i);
if (pm) {
  const code = pm[1].toUpperCase();

  // словарь расшифровок
  const payorMap = {
    '92': 'Payor Identification:92! Mainstream Обнаружен! Проверь Metroplus Health Plan, Inc',
    'AA': 'Payor Identification:AA! HARP Обнаружен!',
    'AC': 'Payor Identification:AC! LTC Pace Обнаружен! Medicaid включает покрытие',
    'AH': 'Payor Identification:AH! Partial LTC Обнаружен! Medicaid включает покрытие',
    'C2': 'Payor Identification:C2! Mainstream Обнаружен! Проверь Highmark Western & Northeastern NY',
    'C3': 'Payor Identification:C3! HARP Обнаружен!',
    'C7': 'Payor Identification:C7! LTC Pace Обнаружен! Medicaid включает покрытие',
    'CC': 'Payor Identification:CC! LTC Pace Обнаружен! Medicaid включает покрытие',
    'CD': 'Payor Identification:CD! HARP Обнаружен!',
    'CG': 'Payor Identification:CG! Mainstream Обнаружен! Проверь Capital District Physician’s Health Plan',
    'CH': 'Payor Identification:CH! LTC Pace Обнаружен! Medicaid включает покрытие',
    'CM': 'Payor Identification:CM! Medicaid Adv Plus Обнаружен!',
    'CP': 'Payor Identification:CP! Partial LTC Обнаружен! Medicaid включает покрытие',
    'E7': 'Payor Identification:E7! LTC Pace Обнаружен! Medicaid включает покрытие',
    'EA': 'Payor Identification:EA! Medicaid Adv Plus Обнаружен!',
    'ED': 'Payor Identification:ED! Partial LTC Обнаружен! Medicaid включает покрытие',
    'EE': 'Payor Identification:EE! HARP Обнаружен!',
    'EH': 'Payor Identification:EH! Partial LTC Обнаружен! Medicaid включает покрытие',
    'FZ': 'Payor Identification:FZ! LTC Pace Обнаружен! Medicaid включает покрытие',
    'GD': 'Payor Identification:GD! Partial LTC Обнаружен! Medicaid включает покрытие',
    'H1': 'Payor Identification:H1! Partial LTC Обнаружен! Medicaid включает покрытие',
    'HA': 'Payor Identification:HA! Medicaid Adv Plus Обнаружен!',
    'HC': 'Payor Identification:HC! Partial LTC Обнаружен! Medicaid включает покрытие',
    'HF': 'Payor Identification:HF! HARP Обнаружен!',
    'HI': 'Payor Identification:HI! HARP Обнаружен!',
    'HT': 'Payor Identification:HT! Mainstream Обнаружен! Проверь HIP of Greater NY',
    '98': 'Payor Identification:98! Mainstream Обнаружен! Проверь HIP of Greater NY',
    '99': 'Payor Identification:99! Mainstream Обнаружен! Проверь HIP of Greater NY',
    'HU': 'Payor Identification:HU! LTC Pace Обнаружен! Medicaid включает покрытие',
    'HW': 'Payor Identification:HW! Mainstream Обнаружен! Проверь HIP Westchester',
    'HY': 'Payor Identification:HY! Mainstream Обнаружен! Проверь HIP Nassau',
    'IC': 'Payor Identification:IC! Partial LTC Обнаружен! Medicaid включает покрытие',
    'IE': 'Payor Identification:IE! Mainstream Обнаружен! Проверь Independent Health Association',
    'IH': 'Payor Identification:IH! HARP Обнаружен!',
    'IL': 'Payor Identification:IL! LTC Pace Обнаружен! Medicaid включает покрытие',
    'IS': 'Payor Identification:IS! LTC Pace Обнаружен! Medicaid включает покрытие',
    'KP': 'Payor Identification:KP! Mainstream Обнаружен! Проверь Anthem HP, LLC',
    'KX': 'Payor Identification:KX! Partial LTC Обнаружен! Medicaid включает покрытие',
    'MA': 'Payor Identification:MA! HARP Обнаружен!',
    'MC': 'Payor Identification:MC! Medicaid Adv Plus Обнаружен!',
    'MH': 'Payor Identification:MH! Medicaid Adv Plus Обнаружен!',
    'MO': 'Payor Identification:MO! Mainstream Обнаружен! Проверь United HealthCare of NY, Inc.',
    'MP': 'Payor Identification:MP! Partial LTC Обнаружен! Medicaid включает покрытие',
    'MR': 'Payor Identification:MR! Mainstream Обнаружен! Проверь Excellus',
    'MT': 'Payor Identification:MT! HARP Обнаружен!',
    'MV': 'Payor Identification:MV! Mainstream Обнаружен! Проверь MVP, Inc.',
    'NC': 'Payor Identification:NC! HARP Обнаружен!',
    'OD': 'Payor Identification:OD! SNP Обнаружен!',
    'OM': 'Payor Identification:OM! SNP Обнаружен!',
    'PO': 'Payor Identification:PO! FIDA-IDD Обнаружен!',
    'SF': 'Payor Identification:SF! Mainstream Обнаружен! Проверь HealthFirst PHSP, Inc.',
    'SP': 'Payor Identification:SP! Mainstream Обнаружен! Проверь Fidelis Care New York',
    'SW': 'Payor Identification:SW! Partial LTC Обнаружен! Medicaid включает покрытие',
    'TN': 'Payor Identification:TN! HARP Обнаружен!',
    'TO': 'Payor Identification:TO! Mainstream Обнаружен! Проверь Molina Healthcare of New York Inc. (TONY)',
    'TS': 'Payor Identification:TS! LTC Pace Обнаружен! Medicaid включает покрытие',
    'UC': 'Payor Identification:UC! HARP Обнаружен!',
    'UM': 'Payor Identification:UM! Medicaid Adv Plus Обнаружен!',
    'VA': 'Payor Identification:VA! Partial LTC Обнаружен! Medicaid включает покрытие',
    'VC': 'Payor Identification:VC! Partial LTC Обнаружен! Medicaid включает покрытие',
    'VL': 'Payor Identification:VL! Partial LTC Обнаружен! Medicaid включает покрытие',
    'VM': 'Payor Identification:VM! Medicaid Adv Plus Обнаружен!',
    'VS': 'Payor Identification:VS! SNP Обнаружен!',
    'YF': 'Payor Identification:YF! Medicaid Adv Plus Обнаружен!',
    'YH': 'Payor Identification:YH! Medicaid Adv Plus Обнаружен!',
    'YL': 'Payor Identification:YL! Medicaid Adv Plus Обнаружен!',
    'YN': 'Payor Identification:YN! Medicaid Adv Plus Обнаружен!',
    'YO': 'Payor Identification:YO! Medicaid Adv Plus Обнаружен!'
  };

  if (payorMap[code]) payorMsg = payorMap[code];
}


    let staleMsg = null;
    const histDateStrict = historyDateFromHistoryStrip(winBody);
    const histDateFallback = !histDateStrict ? robustHistoryDate(winBody, panel) : null;
    const histDate = histDateStrict || histDateFallback;
    if (histDate) {
      const ageMs = Date.now() - histDate.getTime();
      if (ageMs >= STALE_DAYS * DAY_MS) {
        staleMsg = 'Отображаемая информация устарела, обновите данные через кнопку Update';
      }
    }

    const nodes = [];

    const boxCompare = document.createElement('div');
    boxCompare.style.cssText = `
      flex:none;
      background:${mismatches.length ? '#fdd' : '#dfd'};
      color:${mismatches.length ? '#900' : '#060'};
      border:2px solid ${mismatches.length ? '#900' : '#060'};
      padding:10px;border-radius:4px;font-size:14px;line-height:1.4;`;
    boxCompare.innerHTML = mismatches.length
      ? `<strong>[${tab}] ⚠️ Расхождения:</strong><br>${mismatches.join('<br>')}`
      : `<strong>[${tab}] ✅ Все поля совпадают.</strong>`;
    nodes.push(boxCompare);

    if (plans.length) {
      const boxPlan = document.createElement('div');
      boxPlan.style.cssText = `flex:none;background:#eef;color:#036;border:2px solid #036; padding:10px;border-radius:4px;font-size:14px;line-height:1.4;`;
      boxPlan.innerHTML = `<strong>[${tab}] ℹ️ План:</strong><br>${plans.join('<br>')}`;
      nodes.push(boxPlan);
    }

    if (hasPair) {
      const boxPair = document.createElement('div');
      boxPair.style.cssText = `flex:none;background:#ffa500;color:#000;border:2px solid #e68a00; padding:10px;border-radius:4px;font-size:14px;line-height:1.4;`;
      boxPair.textContent = `[${tab}] Обнаружена дополнительная страховка!`;
      nodes.push(boxPair);
    }

    if (payorMsg) {
      const boxPay = document.createElement('div');
      boxPay.style.cssText = `flex:none;background:#fff8db;color:#000;border:2px solid #d4a000; padding:10px;border-radius:4px;font-size:14px;line-height:1.4;`;
      boxPay.innerHTML = `<strong>[${tab}] 🆔 Payor ID:</strong><br>${payorMsg}`;
      nodes.push(boxPay);
    }

    if (staleMsg) {
      const boxStale = document.createElement('div');
      boxStale.style.cssText = `flex:none;background:#ffe7ba;color:#5a3d00;border:2px solid #e6a23c; padding:10px;border-radius:4px;font-size:14px;line-height:1.4;`;
      boxStale.innerHTML = `<strong>[${tab}] ⏱️ Внимание:</strong><br>${staleMsg}`;
      nodes.push(boxStale);
    }

    renderSection(winBody, tab, nodes);

    const spacer1 = document.createElement('div');
    spacer1.className = 'piv-bottom-spacer';
    panel.appendChild(spacer1);

    const sc = findScrollContainer(panel);
    if (sc && sc !== panel) {
      const spacer2 = document.createElement('div');
      spacer2.className = 'piv-bottom-spacer';
      sc.appendChild(spacer2);
    }
  }
})();
