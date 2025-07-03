// ==UserScript==
// @name         Gmail helper
// @namespace    http://tampermonkey.net/
// @version      1.04
// @description  Gmail Check helper for best team
// @match        *://mail.google.com/*
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/StiFlerrl/Complete/main/gmail_unread_timer_with_sound.user.js
// @downloadURL  https://raw.githubusercontent.com/StiFlerrl/Complete/main/gmail_unread_timer_with_sound.user.js
// ==/UserScript==

(function(){
  'use strict';

  const LIVE_UPDATE_INTERVAL  = 1000;
  const SOUND_REPEAT_INTERVAL = 10000;
  const ALERT_SOUND_URL       = 'https://raw.githubusercontent.com/StiFlerrl/Complete/main/plyus_org-z_uk-u_edomleniya-2.mp3';
  const STORAGE_KEY_POSITION  = 'gmail-helper-position';
  const STORAGE_KEY_WIDTH     = 'gmail-helper-width';

  const SNIPPETS = {
    referralHip: `We can only accept the patient after the referring office sends the referral with the following details:\n\nDr. Hikin Dimitry\nNPI: 1457619017\n3047 Ave U, 2nd Fl, Brooklyn, NY 11229\n\nUnfortunately, we won’t be able to proceed without the referral.\nPlease let us know once it has been submitted.\n\nThank you for your understanding!`,
    referralUhc: `We can only accept the patient after the referring office sends the referral with the following details:\n\nDr. Racanelli\nNPI: 1639194921\n3047 Ave U, 2nd Fl, Brooklyn, NY 11229\n\nUnfortunately, we won’t be able to proceed without the referral.\n\nPlease let us know once it has been submitted.\nThank you for your understanding!`,
    needTime: `Apologies, I need a little more time to give you an accurate response. I am already working on your request!`,
    authorizationHcp: `Authorization is required through the EZ Net portal for this patient. Please submit the authorization. Unfortunately, we cannot accept the patient without it.\n\nDr. Zakheim Alan,\nNPI is 1033165774\nAddress is 3047 Ave U, 2nd Fl, Brooklyn, NY 11229`,
    highCopay: `The patient's plan has a copay of ... dollars.`,
    highDed: `The patient's deductible is ... dollars. We can only accept the patient as self-pay.`,
    memberIdCard: `To verify the patient's insurance, we need a scan of their ID card. Please provide it.`,
    medicareIdCard: `Please provide the Medicare ID card.`
  };

  const CATEGORIES = [
    { name:'under5',  max:5,        color:'#4CAF50', label:'< 5 мин'  },
    { name:'under10', max:10,       color:'#2196F3', label:'5–10 мин' },
    { name:'over10',  max:Infinity, color:'#F44336', label:'> 10 мин' },
  ];

  let popup;
  let dragOffsetX = 0, dragOffsetY = 0;
  let soundEnabled = true;
  let lastSoundTime = 0;
  let prevCounts = null;
  let audio = null;
  let answersExpanded = false;

  function playCustomSound(){
    if (!soundEnabled) return;
    const now = Date.now();
    if (now - lastSoundTime < SOUND_REPEAT_INTERVAL) return;
    lastSoundTime = now;
    if (!audio) {
      audio = new Audio(ALERT_SOUND_URL);
      audio.volume = 0.6;
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
    audio.play().catch(err => { console.warn('Audio playback failed:', err); });
  }

  function insertSnippet(key){
    const text = SNIPPETS[key];
    const editor = document.querySelector('div[aria-label="Message Body"]') || document.querySelector('div[role="textbox"]');
    if(editor){ editor.focus(); document.execCommand('insertText', false, text); }
  }

  function createPopup(){
    if(popup) return;
    popup = document.createElement('div');

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_POSITION) || '{}');
    const savedWidth = localStorage.getItem(STORAGE_KEY_WIDTH);

    Object.assign(popup.style, {
      position:'fixed', top: saved.top || '80px', left: saved.left || '', right: saved.right || '20px',
      zIndex:9999, background:'rgba(255,255,255,0.95)', boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
      padding:'8px', borderRadius:'6px', fontFamily:'Arial,sans-serif', fontSize:'14px',
      width: savedWidth || '240px', userSelect:'none', resize:'horizontal', overflow:'auto'
    });

    popup.addEventListener('mouseup', () => {
      const rect = popup.getBoundingClientRect();
      localStorage.setItem(STORAGE_KEY_WIDTH, rect.width + 'px');
    });

    const header = document.createElement('div');
    header.style.cssText = 'height:10px; margin-bottom:4px; cursor:move';
    popup.appendChild(header);

    const headerBar = document.createElement('div');
    Object.assign(headerBar.style, {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'
    });

    const title = document.createElement('div');
    title.textContent = 'Gmail Helper';
    Object.assign(title.style, { fontWeight: 'bold', fontSize: '16px', color: '#333' });

    const soundBtn = document.createElement('div');
    soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
    Object.assign(soundBtn.style, { cursor:'pointer', fontSize:'16px' });
    soundBtn.title = 'Toggle sound';
    soundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
      if (audio) audio.volume = soundEnabled ? 0.6 : 0.0;
    });

    headerBar.appendChild(title);
    headerBar.appendChild(soundBtn);
    popup.appendChild(headerBar);

    CATEGORIES.forEach(cat => {
      const box = document.createElement('div'); box.id = `tm-cat-${cat.name}`;
      Object.assign(box.style, { background:cat.color, color:'#fff', padding:'4px 6px', borderRadius:'4px', margin:'4px 0', textAlign:'center' });
      box.textContent = `${cat.label}: 0`; popup.appendChild(box);
      if (cat.name === 'over10') {
        const openBtn = document.createElement('button');
        openBtn.textContent = 'Открыть первое';
        Object.assign(openBtn.style, {
          width:'100%', margin:'4px 0', padding:'4px',
          border:'none', borderRadius:'4px', cursor:'pointer',
          background:'#ffdddd', fontWeight:'bold'
        });
        openBtn.addEventListener('click', () => {
          const rows = Array.from(document.querySelectorAll('tr.zA.zE'));
          const sorted = rows.map(row => ({ row, date: getMessageDate(row) }))
                            .filter(x => x.date && (Date.now() - x.date.getTime())/60000 > 10)
                            .sort((a, b) => a.date - b.date);
          if (sorted.length > 0) {
            const link = sorted[0].row.querySelector('td a') || sorted[0].row;
            if (link) link.click();
          }
        });
        popup.appendChild(openBtn);
      }
    });

    const buttons = [
      ['Need time', 'needTime'],
      ['Referral Hip','referralHip'],
      ['Referral Uhc','referralUhc'],
      ['Answers','answers']
    ];
    buttons.forEach(([label, key]) => {
      const btn = document.createElement('button'); btn.textContent = label;
      Object.assign(btn.style, {
        width:'100%', margin:'4px 0', padding:'4px', border:'none', borderRadius:'4px', cursor:'pointer', background:'#eee', textAlign:'center'
      });
      btn.addEventListener('click', () => {
        if (key === 'answers') {
          if (!answersExpanded) {
            const subButtons = [
              ['Authorization HCP', 'authorizationHcp'],
              ['High Copay', 'highCopay'],
              ['High Ded', 'highDed'],
              ['Member id card', 'memberIdCard'],
              ['Medicare id card', 'medicareIdCard']
            ];
            subButtons.forEach(([subLabel, subKey]) => {
              const subBtn = document.createElement('button');
              subBtn.textContent = subLabel;
              Object.assign(subBtn.style, {
                width:'100%', margin:'2px 0', padding:'4px', border:'none', borderRadius:'4px', cursor:'pointer', background:'#f9f9f9', textAlign:'center'
              });
              subBtn.addEventListener('click', () => {
                insertSnippet(subKey);
                subButtons.forEach(([lbl]) => {
                  const b = Array.from(popup.querySelectorAll('button')).find(x => x.textContent === lbl);
                  if (b) b.remove();
                });
                answersExpanded = false;
              });
              popup.appendChild(subBtn);
            });
            answersExpanded = true;
          }
        } else {
          insertSnippet(key);
        }
      });
      popup.appendChild(btn);
    });

    document.body.appendChild(popup);
    makeDraggable(popup, header);
  }

  function makeDraggable(el, handle){
    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      el.style.left = rect.left + 'px';
      el.style.top  = rect.top  + 'px';
      el.style.right = 'auto';
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  function onMouseMove(e){
    const maxX = window.innerWidth - popup.offsetWidth;
    const maxY = window.innerHeight - popup.offsetHeight;
    let newLeft = Math.min(Math.max(0, e.clientX - dragOffsetX), maxX);
    let newTop  = Math.min(Math.max(0, e.clientY - dragOffsetY), maxY);
    popup.style.left = newLeft + 'px';
    popup.style.top  = newTop + 'px';
  }

  function onMouseUp(){
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    const rect = popup.getBoundingClientRect();
    localStorage.setItem(STORAGE_KEY_POSITION, JSON.stringify({ top: popup.style.top, left: popup.style.left, right: popup.style.right }));
    localStorage.setItem(STORAGE_KEY_WIDTH, rect.width + 'px');
  }

  function getMessageDate(row){ const span=row.querySelector('span[title]'); return span?new Date(span.getAttribute('title')):null; }

  function refreshAll(){
    createPopup(); const counts={under5:0,under10:0,over10:0};
    document.querySelectorAll('tr.zA.zE').forEach(row=>{ const d=getMessageDate(row); if(!d)return; const m=Math.floor((Date.now()-d.getTime())/60000);
      if(m<CATEGORIES[0].max) counts.under5++; else if(m<CATEGORIES[1].max) counts.under10++; else counts.over10++; });
    CATEGORIES.forEach(cat=>{ const el=document.getElementById(`tm-cat-${cat.name}`); if(el) el.textContent=`${cat.label}: ${counts[cat.name]}`; });
    if(counts.over10>0) playCustomSound(); const snap=JSON.stringify(counts); if(prevCounts===null||snap!==prevCounts) prevCounts=snap; }

  function observeMailList(){ const main=document.querySelector('div[role="main"]'); if(!main)return; let t; new MutationObserver(()=>{clearTimeout(t);t=setTimeout(refreshAll,500);}).observe(main,{childList:true,subtree:true}); }

  setTimeout(() => { refreshAll(); observeMailList(); setInterval(refreshAll,LIVE_UPDATE_INTERVAL); },3000);
})();
