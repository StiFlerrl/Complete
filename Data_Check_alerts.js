// ==UserScript==
// @name         Info check + alerts (v1.3)
// @namespace    http://tampermonkey.net/
// @version      1.31
// @description  Info check + alerts with field comparison and plan detection
// @match        https://emdspc.emsow.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/StiFlerrl/Complete/main/Data_Check_alerts.js
// @downloadURL  https://raw.githubusercontent.com/StiFlerrl/Complete/main/Data_Check_alerts.js

// ==/UserScript==

(function() {
  'use strict';

  function waitForContent(node, cb) {
    let iv = setInterval(() => {
      if (node.querySelector('table.eligibility-info tr')) {
        clearInterval(iv);
        cb();
      }
    }, 200);
    setTimeout(() => clearInterval(iv), 5000);
  }

  new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        const hdr = node.querySelector('th[colspan="2"]');
        if (hdr?.textContent.trim().startsWith('Subscriber:')) {
          waitForContent(node, () => compareData(node));
        }
      });
    });
  }).observe(document.body, { childList: true, subtree: true });

  function compareData(modal) {
    const sel = document.querySelector('div.x-grid3-row-selected .column-patient.app-overaction-body');
    if (!sel) return;
    const title = sel.querySelector('span[qtitle]')?.textContent.trim() || '';
    let [gridLast, gridFirst] = title.includes(',')
      ? title.split(',').map(s => s.trim())
      : (() => { const p = title.split(/\s+/); return [p.pop(), p.join(' ')]; })();

    let procDOB = '';
    sel.querySelectorAll('table.app-tip-table tr').forEach(r => {
      if (r.querySelector('th')?.textContent.trim().toLowerCase() === 'dob:')
        procDOB = r.querySelector('td')?.textContent.trim() || '';
    });
    const procGender = sel.querySelector('img[qtip]')?.getAttribute('qtip').trim() || '';

    const raw = modal.querySelector('th[colspan="2"]').textContent.replace('Subscriber:', '').trim();
    const [insLast, insFirst] = raw.split(',').map(s => s.trim());
    let insDOB = '', insGender = '';
    modal.querySelectorAll('table.eligibility-info tr').forEach(r => {
      const [lbl, val] = r.querySelectorAll('td');
      if (!lbl || !val) return;
      const key = lbl.textContent.trim().toLowerCase();
      if (key === 'date of birth') insDOB    = val.textContent.trim();
      if (key === 'gender')        insGender = val.textContent.trim();
    });

    const mismatches = [];
    if (gridFirst.toLowerCase()  !== insFirst.toLowerCase())  mismatches.push(`First name: "${gridFirst}" ≠ "${insFirst}"`);
    if (gridLast.toLowerCase()   !== insLast.toLowerCase())   mismatches.push(`Last name: "${gridLast}" ≠ "${insLast}"`);
    if (procDOB.trim()           !== insDOB.trim())           mismatches.push(`Date of birth: "${procDOB}" ≠ "${insDOB}"`);
    if (procGender.toLowerCase() !== insGender.toLowerCase()) mismatches.push(`Gender: "${procGender}" ≠ "${insGender}"`);

    const winBody = modal.closest('div.x-window-body') || modal;
    const detailsTable = winBody.querySelector('table.eligibility-details');

    let combinedText = modal.textContent.toLowerCase();
    if (detailsTable) combinedText += ' ' + detailsTable.textContent.toLowerCase();

    const planMap = {
      'somos ipa':                         'SOMOS IPA план обнаружен! Не стадии можем разрешить',
      'homefirst':                         'HOMEFIRST план обнаружен! Elderplan HOMEFIRST cant accept',
      'benefit risk management services':  'Benefit & Risk management services план обнаружен!',
      'vip reserve hmo':                   'VIP RESERVE HMO план обнаружен!',
      'vip dual reverse':                  'VIP DUAL REVERSE план обнаружен!',
      'senior health partners':            'SENIOR HEALTH PARTNERS план обнаружен!',
      'small group epo':                   'Small Group EPO план обнаружен!',
      'platinum total epo':                'Platinum Total EPO план обнаружен!',
      'signature':                         'Signature план обнаружен! Copay 7-$25, 9-$60',
      'lppo aarp':                         'Lppo AARP план обнаружен! Проверить Network Participation/Copay',
      'giveback open':                     'Giveback open план обнаружен! Wellcare Copay $350',
      'premium open':                      'Premium Open план обнаружен! Wellcare Copay $150',
      'premium':                           'Premium план обнаружен! Wellcare Copay $250',
      'assist open':                       'ASSIST OPEN обнаружен! Wellcare Copay $100',
      'simple open':                       'Simple Open план обнаружен! Wellcare Copay $500',
      'simple':                            'Simple план обнаружен! Wellcare Copay $500',
      'payor identification c7':           'Payor Identification: C7 план обнаружен! Out of network with Centers Plan',
      'ny community plan for adults':      'Plan for Adults - Возможно требуется направление, необходимо проверить PCP',
      'plan for adults':                   'Plan for Adults - Возможно требуется направление, необходимо проверить PCP',
      'hip hmo preferred':                 'HIP HMO PREFERRED - Возможно требуется направление, необходимо проверить PCP./n Если это HIP, необходимо страховку выбрать HIP SOMOS '
    };

    const plans = [];
    Object.entries(planMap).forEach(([key, message]) => {
      if (combinedText.includes(key)) plans.push(message);
    });

    let hasPair = false;
    if (detailsTable) {
      const row2 = detailsTable.querySelector('tbody tr:nth-child(2)');
      if (row2) {
        const firstTxt  = row2.querySelector('td:first-child .eligibility-service-type')?.textContent.trim();
        const secondTxt = row2.querySelector('td:last-child div:nth-child(2)')?.textContent.trim();
        if (
          firstTxt === '30: Health Benefit Plan Coverage' &&
          secondTxt?.startsWith('Eligibility: Contact Following Entity for Eligibility or Benefit Information')
        ) {
          hasPair = true;
        }
      }
    }

    modal.querySelector('.piv-alert-container')?.remove();
    const container = document.createElement('div');
    container.className = 'piv-alert-container';
    container.style.cssText = 'display:flex;align-items:stretch;gap:10px;margin:8px 0;';

    const mainBox = document.createElement('div');
    mainBox.style.cssText = `
      flex:none;
      background:${mismatches.length ? '#fdd' : '#dfd'};
      color:${mismatches.length ? '#900' : '#060'};
      border:2px solid ${mismatches.length ? '#900' : '#060'};
      padding:10px;border-radius:4px;font-size:14px;line-height:1.4;
    `;
    mainBox.innerHTML = mismatches.length
      ? `<strong>⚠️ Расхождения:</strong><br>${mismatches.join('<br>')}`
      : `✅ <strong>Все поля совпадают.</strong>`;
    container.appendChild(mainBox);

    plans.forEach(txt => {
      const box = document.createElement('div');
      box.style.cssText = `
        flex:none;
        background:#eef;color:#036;border:2px solid #036;
        padding:10px;border-radius:4px;font-size:14px;line-height:1.4;
      `;
      box.innerHTML = `<strong>ℹ️ План:</strong><br>${txt}`;
      container.appendChild(box);
    });

    if (hasPair) {
      const orange = document.createElement('div');
      orange.style.cssText = `
        flex:none;
        background:#ffa500;color:#000;border:2px solid #e68a00;
        padding:10px;border-radius:4px;font-size:14px;line-height:1.4;
      `;
      orange.textContent = 'Обнаружена дополнительная страховка!';
      container.appendChild(orange);
    }

    modal.insertBefore(container, modal.firstChild);
  }
})();
