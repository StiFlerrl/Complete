// ==UserScript==
// @name         Info check + alerts
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Transfer from billing fix
// @match        https://emdspc.emsow.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/StiFlerrl/Complete/main/Data_Check_alerts.user.js
// @downloadURL  https://raw.githubusercontent.com/StiFlerrl/Complete/main/Data_Check_alerts.user.js
// ==/UserScript==

(function () {
  'use strict';

  const STALE_DAYS = 30;
  const MIN_SCROLL_H = 220;
  const EXTRA_BOTTOM = 16;
  const TAB_LAG = { Primary: 300, Secondary: 800, Tertiary: 600, Additional: 700 };
  const TAB_ORDER = { Primary: 1, Secondary: 2, Tertiary: 3, Additional: 4 };

  const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const isVisible = el => !!(el && el.offsetParent) && getComputedStyle(el).visibility !== 'hidden';

  // ---------- styles ----------
  (function css() {
    const st = document.createElement('style');
    st.textContent = `
      .piv-elig-win .eligibility-coverage, .piv-elig-win .eligibility-coverage *{white-space:normal!important}
      .piv-elig-win .eligibility-details td, .piv-elig-win .eligibility-info td{white-space:normal!important;word-break:break-word!important;overflow-wrap:anywhere!important}
      .piv-agg{display:flex;flex-wrap:wrap;gap:10px;margin:8px 0;align-items:stretch}
      .piv-card{flex:none;padding:10px;border-radius:4px;border:2px solid;line-height:1.4;font-size:14px}
    `;
    document.head.appendChild(st);
  })();

  // ---------- tab helpers ----------
  const canonicalTab = raw => {
    const head = (raw || '').split(':')[0].trim().toLowerCase();
    if (head.startsWith('primary'))   return 'Primary';
    if (head.startsWith('secondary')) return 'Secondary';
    if (head.startsWith('tertiary'))  return 'Tertiary';
    if (head.startsWith('additional'))return 'Additional';
    return 'Primary';
  };

  const getActivePanel = winBody =>
    winBody.querySelector('.x-tab-panel-body:not(.x-hide-display)') || winBody;

  const getActiveTabLabel = winBody => {
    const n = winBody.closest('.x-window')?.querySelector('.x-tab-strip .x-tab-strip-active .x-tab-strip-text');
    return canonicalTab(n?.textContent || '');
  };

  // ---------- readiness waiters ----------
  function waitForReadyChange(winBody, prevPanel, prevSig, cb, timeout = 15000) {
    const t0 = Date.now();
    (function tick() {
      const p = getActivePanel(winBody);
      const sig = norm(p.textContent);
      if (p !== prevPanel || (sig && sig !== prevSig) || Date.now() - t0 > timeout) { cb(); return; }
      setTimeout(tick, 120);
    })();
  }

  function waitStable(panel, cb, timeout = 12000, quietMs = 700) {
    const t0 = Date.now();
    let last = (panel.textContent || '').length;
    let ts = Date.now();
    const iv = setInterval(() => {
      const cur = (panel.textContent || '').length;
      if (cur !== last) { last = cur; ts = Date.now(); }
      if (Date.now() - ts >= quietMs || Date.now() - t0 >= timeout) { clearInterval(iv); cb(); }
    }, 140);
  }

  // ---------- aggregator ----------
  function findTabStripHeader(winBody){
    return winBody.closest('.x-window')?.querySelector('.x-tab-panel-header') ||
           winBody.closest('.x-window')?.querySelector('.x-tab-strip-wrap') ||
           winBody.closest('.x-window')?.querySelector('.x-tab-strip') || null;
  }
  function ensureAgg(winBody) {
    let box = winBody.querySelector('.piv-agg');
    if (box) return box;
    const header = findTabStripHeader(winBody);
    box = document.createElement('div');
    box.className = 'piv-agg';
    if (header && header.parentNode) header.parentNode.insertBefore(box, header);
    else winBody.insertBefore(box, winBody.firstChild);
    return box;
  }
  function reorderAgg(agg) {
    const cards = Array.from(agg.querySelectorAll('.piv-card'));
    cards.sort((a,b)=> (TAB_ORDER[a.dataset.tab]||99)-(TAB_ORDER[b.dataset.tab]||99));
    cards.forEach(c => agg.appendChild(c));
  }
  function renderSection(winBody, tab, cards) {
    const agg = ensureAgg(winBody);
    agg.querySelectorAll(`.piv-card[data-tab="${tab}"]`).forEach(n => n.remove());
    cards.forEach(n => { n.classList.add('piv-card'); n.dataset.tab = tab; agg.appendChild(n); });
    reorderAgg(agg);
  }

  // ---------- scroller sizing ----------
  function getActiveScroller(winBody) {
    const activePanel = getActivePanel(winBody);
    const q = '.x-panel-body.x-panel-body-noheader.x-panel-body-noborder';
    const list = Array.from(activePanel.querySelectorAll(q)).filter(isVisible);
    if (!list.length) {
      const all = Array.from(winBody.querySelectorAll(q)).filter(isVisible);
      if (!all.length) return null;
      return all[0];
    }
    let best = null, bestScore = -1;
    for (const el of list) {
      const rect = el.getBoundingClientRect();
      if (rect.height < 80) continue;
      const score = el.scrollHeight - el.clientHeight;
      if (score > bestScore) { bestScore = score; best = el; }
    }
    return best || list[0];
  }

  function adjustScroller(winBody) {
    try {
      const sc = getActiveScroller(winBody);
      if (!sc) return;
      const winRect = winBody.getBoundingClientRect();
      const scRect = sc.getBoundingClientRect();
      let footerH = 56;
      const foot = winBody.querySelector('.x-window-bbar, .x-panel-bbar, .x-dlg-btm, .x-window-footer, .x-panel-btns');
      if (foot) footerH = Math.max(foot.getBoundingClientRect().height, 40);
      let h = Math.floor(winRect.bottom - scRect.top - footerH - EXTRA_BOTTOM);
      if (h < MIN_SCROLL_H) h = MIN_SCROLL_H;
      sc.style.height = h + 200 +'px';
      sc.style.maxHeight = h + 50 + 'px';
      sc.style.overflow = 'auto';
    } catch {}
  }

  function adjustRepeated(winBody, ms = 1600) {
    if (winBody.__pivAdjTick) clearInterval(winBody.__pivAdjTick);
    const end = Date.now() + ms;
    adjustScroller(winBody);
    winBody.__pivAdjTick = setInterval(() => {
      adjustScroller(winBody);
      if (Date.now() > end) { clearInterval(winBody.__pivAdjTick); winBody.__pivAdjTick = null; }
    }, 150);
  }

  // ---------- text collection ----------
  function collectEligibilityText(panel) {
    const buckets = new Set();
    panel.querySelectorAll('*').forEach(n => {
      const cls = n.className || '';
      if (/\beligibility/i.test(cls) && isVisible(n)) buckets.add(n);
    });
    if (!buckets.size) buckets.add(panel);
    const out = [];
    buckets.forEach(n => { if (!n.closest('.piv-agg')) out.push(n.textContent || ''); });
    return norm(out.join(' '));
  }

  // ---------- history date ----------
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

  function robustHistoryDate(winBody) {
    const root = winBody.closest('.x-window') || document;
    const txt = root.textContent || '';
    const reParen = /\(\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}(?:\s+[0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?\s*(?:AM|PM)?)?)\s*\)/gi;
    let m, best = null;
    while ((m = reParen.exec(txt))) {
      const idx = m.index;
      const ctx = txt.slice(Math.max(0, idx - 160), Math.min(txt.length, idx + 160)).toLowerCase();
      if (/(member\s*id|history|eligibility)/.test(ctx)) {
        const d = parseUSDateTimeFlexible(m[1]);
        if (d && (!best || d > best)) best = d;
      }
    }
    if (!best) { reParen.lastIndex = 0; const m2 = reParen.exec(txt); if (m2) best = parseUSDateTimeFlexible(m2[1]); }
    return best;
  }

  // ---------- main scan ----------
  function scanActiveTab(winBody, { force = false } = {}) {
    const panel = getActivePanel(winBody);
    const tab = getActiveTabLabel(winBody);

    adjustRepeated(winBody);

    if (!force && winBody.__pivScanned?.[tab]) return;

    const sel = document.querySelector('div.x-grid3-row-selected .column-patient.app-overaction-body');
let gridFirst = '', gridLast = '', procDOB = '', procGender = '';

    const winContainer = winBody.closest('.x-window');
    let nameSource = winContainer ? winContainer.querySelector('.x-window-header-text') : null;

    if (nameSource) {
      let titleText = nameSource.textContent.trim();

      // Агрессивная очистка
      titleText = titleText
        .replace(/Processing.*?:|Process.*?:/g, '')
        .replace(/Electronic eligibility for /g, '')
        .replace(/[()#\d{1,}]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (titleText.toLowerCase() === 'error' || titleText.toLowerCase() === 'confirmation' || titleText.toLowerCase() === '') {
          titleText = '';
      }

      if (titleText.includes(',')) {
        [gridLast, gridFirst] = titleText.split(',').map(s => s.trim());
      } else if (titleText.length > 0) {
        const p = titleText.split(/\s+/).filter(s => s.length > 0);
        if (p.length >= 2) {
            gridLast = p.shift() || '';
            gridFirst = p.join(' ');
        } else {
            gridFirst = p[0] || '';
            gridLast = '';
        }
      }
    }

    if (gridFirst.length === 0) {
        const mainTitle = document.title;
        let dtText = mainTitle.split('::')[1] || '';
        dtText = dtText.replace(/Complete Express Medical PC/i, '').trim();

        const dobMatchTitle = dtText.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (dobMatchTitle) {
            procDOB = dobMatchTitle[0];
            dtText = dtText.replace(dobMatchTitle[0], '').trim();
        }

        if (dtText.includes(',')) {
            [gridLast, gridFirst] = dtText.split(',').map(s => s.trim());
        } else {
            const p = dtText.split(/\s+/).filter(s => s.length > 0);
            if (p.length >= 2) {
                gridLast = p.shift() || '';
                gridFirst = p.join(' ');
            } else {
                gridFirst = p[0] || '';
                gridLast = '';
            }
        }
    }

    const targetFirst = norm(gridFirst.split(/\s+/)[0]);
    const targetLast = norm(gridLast.split(/\s+/)[0]);

    if (targetFirst.length > 0 && targetLast.length > 0) {
        const allPatientBlocks = document.querySelectorAll('div.x-grid3-row .column-patient.app-overaction-body');

        for (const block of allPatientBlocks) {
            const rowNameEl = block.querySelector('span[qtitle]');
            if (!rowNameEl) continue;

            const parts = rowNameEl.textContent.trim().replace(/,/g, ' ').split(/\s+/).filter(s => s.length > 0);
            const rowLast = norm(parts[0] || '');
            const rowFirst = norm(parts[1] || '');

            if (rowLast === targetLast && rowFirst === targetFirst) {
                const tip = block.querySelector('table.app-tip-table');

                if (tip) {
                    tip.querySelectorAll('tr').forEach(tr => {
                        const label = tr.querySelector('th, td:nth-child(1)')?.textContent.trim().toLowerCase();
                        const value = tr.querySelector('td:nth-child(2)')?.textContent.trim();

                        if (label === 'dob:' && !procDOB) {
                          procDOB = value || '';
                        }
                        if (label === 'gender:') {
                          procGender = value || '';
                        }
                    });
                }

                if (!procGender) {
                  procGender = block.querySelector('img[qtip]')?.getAttribute('qtip')?.trim() || '';
                }

                break;
            }
        }
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
    add(/\bhome\s*first\b|\bhomefirst\b/i,'HOMEFIRST план обнаружен! Elderplan HOMEFIRST cant accept');
    add(/\bbenefit\s*&?\s*risk\s*management\s*services\b/i,'Benefit & Risk management services план обнаружен!');
    add(/\bvip\s*reserve\s*hmo\b/i,       'VIP RESERVE HMO план обнаружен!');
    add(/\bvip\s*dual\s*reverse\b/i,      'VIP DUAL REVERSE план обнаружен!');
    add(/\bsenior\s*health\s*partners\b/i,'SENIOR HEALTH PARTNERS план обнаружен!');
    add(/\bsmall\s*group\s*epo\b/i,       'Small Group EPO план обнаружен!');
    add(/\bplatinum\s*total\s*epo\b/i,    'Platinum Total EPO план обнаружен!');
    add(/\bsignature\b/i,                  'Signature план обнаружен! Copay 7-$25, 9-$60');
    add(/\blppo\s*aarp\b/i,                'Lppo AARP план обнаружен! Проверить Network Participation/Copay');
    add(/\bgiveback\s*open\b/i,            'Giveback open план обнаружен! Wellcare Copay $350');
    add(/\bpremium\s*open\b/i,             'Premium Open план обнаружен! Wellcare Copay $150');
    add(/\bpremium\b/i,                    'Premium план обнаружен! Wellcare Copay $250', !/\bpremium\s*open\b/i.test(text));
    add(/\bassist\s*open\b/i,              'ASSIST OPEN обнаружен! Wellcare Copay $100');
    add(/\bpayor\s*identification[:\s]*c7\b/i,'Payor Identification: C7 план обнаружен! Out of network with Centers Plan');
    add(/\b(?:ny\s*community\s*)?plan\s*for\s*adults\b/i,'Plan for Adults - Возможно требуется направление, необходимо проверить PCP');
    add(/\bhip\s*hmo\s*preferred\b/i,     'HIP HMO PREFERRED - Возможно требуется направление, необходимо проверить PCP');
    add(/\bbronze\b/i,   'Bronze план обнаружен! Проверь Deductible!');
    add(/\bplatinum\b/i, 'Platinum план обнаружен! Проверь Deductible!', !/\bplatinum\s*total\s*epo\b/i.test(text));
    add(/\bgold\b/i,     'Gold план обнаружен! Проверь Deductible!');
    add(/\bsilver\b/i,   'Silver план обнаружен! Проверь Deductible!');
    add(/\bleaf\b/i,     'Leaf план обнаружен! Проверь Deductible!');

    // доп. страховка (строго рядом: "30:" → "Eligibility: ...")
    const covStr  = '30: health benefit plan coverage';
    const eligTriggers = [
      'eligibility: contact following entity for eligibility or benefit information',
      'eligibility: other or additional payor',
      'eligibility: other or additional payer'
    ];
    let hasPair = false;
    const dt = panel.querySelector('table.eligibility-details');
    if (dt) {
      const row2 = dt.querySelector('tbody tr:nth-child(2)');
      if (row2) {
        const a = norm(row2.querySelector('td:first-child .eligibility-coverage .eligibility-service-type')?.textContent);
        const right = norm(row2.querySelector('td:last-child  .eligibility-coverage')?.textContent);
        const rightHasElig = eligTriggers.some(tr => right?.includes(tr));
        const rightHasCQ = /\bcq:\s*case\s*management\b/i.test(right);
        if (a === covStr && (rightHasElig || (rightHasCQ && /contact\s*following\s*entity/i.test(right)))) hasPair = true;
      }
    }
    if (!hasPair) {
      const t = norm(panel.textContent || '');
      const i1 = t.indexOf(covStr);
      if (i1 !== -1) {
        const after = t.slice(i1, i1 + 800);
        const reAfter = /(?:\bcq:\s*case\s*management\b[\s\S]{0,200})?eligibility:\s*(?:contact\s*following\s*entity\s*for\s*eligibility\s*or\s*benefit\s*information|other\s*or\s*additional\s*pay(?:or|er))/i;
        hasPair = reAfter.test(after);
      }
    }

    // Payor Identification (коды)
    let payorMsg = null;
    const pm = (panel.textContent || '').match(/Payor Identification:\s*([A-Za-z0-9]{2})\b/i);
    if (pm) {
      const code = pm[1].toUpperCase();
      const map = {
        '92':'Payor Identification:92! Mainstream Обнаружен! Проверь Metroplus Health Plan, Inc',
        'AA':'Payor Identification:AA! HARP Обнаружен!',
        'AC':'Payor Identification:AC! LTC Pace Обнаружен! Medicaid включает покрытие',
        'AH':'Payor Identification:AH! Partial LTC Обнаружен! Medicaid включает покрытие',
        'C2':'Payor Identification:C2! Mainstream Обнаружен! Проверь Highmark Western & Northeastern NY',
        'C3':'Payor Identification:C3! HARP Обнаружен!',
        'C7':'Payor Identification:C7! LTC Pace Обнаружен! Medicaid включает покрытие',
        'CC':'Payor Identification:CC! LTC Pace Обнаружен! Medicaid включает покрытие',
        'CD':'Payor Identification:CD! HARP Обнаружен!',
        'CG':'Payor Identification:CG! Mainstream Обнаружен! Проверь Capital District Physician’s Health Plan',
        'CH':'Payor Identification:CH! LTC Pace Обнаружен! Medicaid включает покрытие',
        'CM':'Payor Identification:CM! Medicaid Adv Plus Обнаружен!',
        'CP':'Payor Identification:CP! Partial LTC Обнаружен! Medicaid включает покрытие',
        'E7':'Payor Identification:E7! LTC Pace Обнаружен! Medicaid включает покрытие',
        'EA':'Payor Identification:EA! Medicaid Adv Plus Обнаружен!',
        'ED':'Payor Identification:ED! Partial LTC Обнаружен! Medicaid включает покрытие',
        'EE':'Payor Identification:EE! HARP Обнаружен!',
        'EH':'Payor Identification:EH! Partial LTC Обнаружен! Medicaid включает покрытие',
        'FZ':'Payor Identification:FZ! LTC Pace Обнаружен! Medicaid включает покрытие',
        'GD':'Payor Identification:GD! Partial LTC Обнаружен! Medicaid включает покрытие',
        'H1':'Payor Identification:H1! Partial LTC Обнаружен! Medicaid включает покрытие',
        'HA':'Payor Identification:HA! Medicaid Adv Plus Обнаружен!',
        'HC':'Payor Identification:HC! Partial LTC Обнаружен! Medicaid включает покрытие',
        'HF':'Payor Identification:HF! HARP Обнаружен!',
        'HI':'Payor Identification:HI! HARP Обнаружен!',
        'HT':'Payor Identification:HT! Mainstream Обнаружен! Проверь HIP of Greater NY',
        '98':'Payor Identification:98! Mainstream Обнаружен! Проверь HIP of Greater NY',
        '99':'Payor Identification:99! Mainstream Обнаружен! Проверь HIP of Greater NY',
        'HU':'Payor Identification:HU! LTC Pace Обнаружен! Medicaid включает покрытие',
        'HW':'Payor Identification:HW! Mainstream Обнаружен! Проверь HIP Westchester',
        'HY':'Payor Identification:HY! Mainstream Обнаружен! Проверь HIP Nassau',
        'IC':'Payor Identification:IC! Partial LTC Обнаружен! Medicaid включает покрытие',
        'IE':'Payor Identification:IE! Mainstream Обнаружен! Проверь Independent Health Association',
        'IH':'Payor Identification:IH! HARP Обнаружен!',
        'IL':'Payor Identification:IL! LTC Pace Обнаружен! Medicaid включает покрытие',
        'IS':'Payor Identification:IS! LTC Pace Обнаружен! Medicaid включает покрытие',
        'KP':'Payor Identification:KP! Mainstream Обнаружен! Проверь Anthem HP, LLC',
        'KX':'Payor Identification:KX! Partial LTC Обнаружен! Medicaid включает покрытие',
        'MA':'Payor Identification:MA! HARP Обнаружен!',
        'MC':'Payor Identification:MC! Medicaid Adv Plus Обнаружен!',
        'MH':'Payor Identification:MH! Medicaid Adv Plus Обнаружен!',
        'MO':'Payor Identification:MO! Mainstream Обнаружен! Проверь United HealthCare of NY, Inc.',
        'MP':'Payor Identification:MP! Partial LTC Обнаружен! Medicaid включает покрытие',
        'MR':'Payor Identification:MR! Mainstream Обнаружен! Проверь Excellus',
        'MT':'Payor Identification:MT! HARP Обнаружен!',
        'MV':'Payor Identification:MV! Mainstream Обнаружен! Проверь MVP, Inc.',
        'NC':'Payor Identification:NC! HARP Обнаружен!',
        'OD':'Payor Identification:OD! SNP Обнаружен!',
        'OM':'Payor Identification:OM! SNP Обнаружен!',
        'PO':'Payor Identification:PO! FIDA-IDD Обнаружен!',
        'SF':'Payor Identification:SF! Mainstream Обнаружен! Проверь HealthFirst PHSP, Inc.',
        'SP':'Payor Identification:SP! Mainstream Обнаружен! Проверь Fidelis Care New York',
        'SW':'Payor Identification:SW! Partial LTC Обнаружен! Medicaid включает покрытие',
        'TN':'Payor Identification:TN! HARP Обнаружен!',
        'TO':'Payor Identification:TO! Mainstream Обнаружен! Проверь Molina Healthcare of New York Inc. (TONY)',
        'TS':'Payor Identification:TS! LTC Pace Обнаружен! Medicaid включает покрытие',
        'UC':'Payor Identification:UC! HARP Обнаружен!',
        'UM':'Payor Identification:UM! Medicaid Adv Plus Обнаружен!',
        'VA':'Payor Identification:VA! Partial LTC Обнаружен! Medicaid включает покрытие',
        'VC':'Payor Identification:VC! Partial LTC Обнаружен! Medicaid включает покрытие',
        'VL':'Payor Identification:VL! Partial LTC Обнаружен! Medicaid включает покрытие',
        'VM':'Payor Identification:VM! Medicaid Adv Plus Обнаружен!',
        'VS':'Payor Identification:VS! SNP Обнаружен!',
        'YF':'Payor Identification:YF! Medicaid Adv Plus Обнаружен!',
        'YH':'Payor Identification:YH! Medicaid Adv Plus Обнаружен!',
        'YL':'Payor Identification:YL! Medicaid Adv Plus Обнаружен!',
        'YN':'Payor Identification:YN! Medicaid Adv Plus Обнаружен!',
        'YO':'Payor Identification:YO! Medicaid Adv Plus Обнаружен!'
      };
      if (map[code]) payorMsg = map[code];
    }

    let staleMsg = null;
    const histDate = robustHistoryDate(winBody);
    if (histDate && (Date.now() - histDate.getTime() > STALE_DAYS * 24 * 3600 * 1000)) {
      staleMsg = 'Отображаемая информация устарела, обновите данные через кнопку Update';
    }

    const cards = [];
    const mk = (html, bg, br, col = '#000') => {
      const dv = document.createElement('div');
      dv.style.background = bg; dv.style.borderColor = br; dv.style.color = col;
      dv.innerHTML = html; cards.push(dv);
    };
    mk(mismatches.length
        ? `<strong>[${tab}] ⚠️ Расхождения:</strong><br>${mismatches.join('<br>')}`
        : `<strong>[${tab}] ✅ Все поля совпадают.</strong>`,
       mismatches.length ? '#fdd' : '#dfd',
       mismatches.length ? '#900' : '#060',
       mismatches.length ? '#900' : '#060');
    if (plans.length) mk(`<strong>[${tab}] ℹ️ План:</strong><br>${plans.join('<br>')}`,'#eef','#036','#036');
    if (hasPair)      mk(`<strong>[${tab}]</strong> Обнаружена дополнительная страховка!`,'#ffa500','#e68a00','#000');
    if (payorMsg)     mk(`<strong>[${tab}] 🆔 Payor ID:</strong><br>${payorMsg}`,'#fff8db','#d4a000','#000');
    if (staleMsg)     mk(`<strong>[${tab}] ⏱️ Внимание:</strong><br>${staleMsg}`,'#ffe7ba','#e6a23c','#5a3d00');

    renderSection(winBody, tab, cards.map(c => (c.classList.add('piv-card'), c)));

    if (!winBody.__pivScanned) winBody.__pivScanned = {};
    winBody.__pivScanned[tab] = true;
  }

  // ---------- robust tab detection ----------
  function scheduleScanAfterSwitch(winBody) {
    const tab = getActiveTabLabel(winBody);
    const lag = TAB_LAG[tab] || 300;
    if (winBody.__pivScanTimer) clearTimeout(winBody.__pivScanTimer);
    winBody.__pivScanTimer = setTimeout(() => {
      const panel = getActivePanel(winBody);
      waitStable(panel, () => {
        adjustRepeated(winBody);
        scanActiveTab(winBody, { force: false });
        reorderAgg(ensureAgg(winBody));
      });
    }, lag);
  }

  function bindTabDetectors(winBody) {
    if (winBody.dataset.pivTabsBound === '1') return;
    winBody.dataset.pivTabsBound = '1';

    const xwin = winBody.closest('.x-window');
    const strip = xwin?.querySelector('.x-tab-strip');
    const bodiesWrap = xwin?.querySelector('.x-tab-panel-bwrap') || winBody;

    // 1) Слушатель клика/тача по полосе вкладок (если событие всплывает)
    if (strip) {
      const onPointer = () => {
        const prevPanel = getActivePanel(winBody);
        const prevSig = norm(prevPanel.textContent);
        waitForReadyChange(winBody, prevPanel, prevSig, () => scheduleScanAfterSwitch(winBody));
      };
      strip.addEventListener('click', onPointer, true);
      strip.addEventListener('pointerup', onPointer, true);
      strip.addEventListener('mouseup', onPointer, true);
    }

    // 2) Наблюдение за сменой класса активного таба
    if (strip) {
      const moTabs = new MutationObserver(() => {
        const keyNow = getActiveTabLabel(winBody);
        if (winBody.__pivLastTabKey !== keyNow) {
          winBody.__pivLastTabKey = keyNow;
          scheduleScanAfterSwitch(winBody);
        }
      });
      moTabs.observe(strip, { subtree: true, attributes: true, attributeFilter: ['class'] });
      winBody.__pivMoTabs = moTabs;
    }

    // 3) Наблюдение за видимостью панелей (x-hide-display ↔ выключено)
    if (bodiesWrap) {
      const moBodies = new MutationObserver(recs => {
        let need = false;
        for (const r of recs) {
          if (r.type === 'attributes' && r.target.classList && r.target.classList.contains('x-tab-panel-body')) {
            if (r.attributeName === 'class') { need = true; break; }
          }
          if (r.type === 'childList') { need = true; break; }
        }
        if (need) scheduleScanAfterSwitch(winBody);
      });
      moBodies.observe(bodiesWrap, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
      winBody.__pivMoBodies = moBodies;
    }
  }

  // ---------- init ----------
  function initWin(winBody) {
    if (winBody.dataset.pivInited === '1') return;
    winBody.dataset.pivInited = '1';
    winBody.classList.add('piv-elig-win');

    ensureAgg(winBody);
    bindTabDetectors(winBody);

    try { new ResizeObserver(() => adjustRepeated(winBody, 600)).observe(winBody); }
    catch { window.addEventListener('resize', () => adjustRepeated(winBody, 600)); }

    const p = getActivePanel(winBody);
    setTimeout(() => waitStable(p, () => {
      adjustRepeated(winBody);
      scanActiveTab(winBody, { force: false });
      reorderAgg(ensureAgg(winBody));
    }), 250);
  }

  // уже открытые
  setTimeout(() => {
    document.querySelectorAll('div.x-window-body').forEach(winBody => {
      const subHdr = winBody.querySelector('th[colspan="2"]');
      if (!subHdr || !/^\s*Subscriber:/i.test(subHdr.textContent)) return;
      initWin(winBody);
    });
  }, 0);

  // новые окна
  new MutationObserver(m => {
    for (const r of m) for (const node of r.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      const subHdr = node.querySelector?.('th[colspan="2"]');
      if (!subHdr || !/^\s*Subscriber:/i.test(subHdr.textContent)) continue;
      const winBody = node.closest?.('div.x-window-body') || node;
      if (winBody) initWin(winBody);
    }
  }).observe(document.body, { childList: true, subtree: true });

})();
