// ==UserScript==
// @name         Gmail Unread Timer + Custom Sound & Snippets
// @namespace    http://tampermonkey.net/
// @version      1.10
// @description  Popup+buttons
// @match        *://mail.google.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function(){
  'use strict';

  const LIVE_UPDATE_INTERVAL    = 30_000;
  const AUTO_REFRESH_INTERVAL   = 60_000;
  const SOUND_REPEAT_INTERVAL   = 60_000;

  const ALERT_SOUND_URL = 'https://www.dropbox.com/scl/fi/k88gz5nhulea05xx529ot/plyus_org-z_uk-u_edomleniya-2.mp3?e=1';

  const SNIPPETS = {
    referralHip: `We can only accept the patient after the referring office sends the referral with the following details:

Dr. Hikin Dimitry
NPI: 1457619017
3047 Ave U, 2nd Fl, Brooklyn, NY 11229

Unfortunately, we won’t be able to proceed without the referral.
Please let us know once it has been submitted.

Thank you for your understanding!`,
    referralUhc: `We can only accept the patient after the referring office sends the referral with the following details:

Dr. Racanelli
NPI: 1639194921
3047 Ave U, 2nd Fl, Brooklyn, NY 11229

Unfortunately, we won’t be able to proceed without the referral.

Please let us know once it has been submitted.
Thank you for your understanding!`,
    answers: ` `
  };

  const CATEGORIES = [
    { name:'under5',  max:5,        color:'#4CAF50', label:'< 5 мин'  },
    { name:'under10', max:10,       color:'#2196F3', label:'5–10 мин' },
    { name:'over10',  max:Infinity, color:'#F44336', label:'> 10 мин' },
  ];

  let popup, dragData = {},
      prevCounts = null,
      prevOverCount = 0,
      lastSoundTime = 0,
      lastChangeTime = Date.now();

  function playCustomSound(){
    const now = Date.now();
    if(now - lastSoundTime < SOUND_REPEAT_INTERVAL) return;
    lastSoundTime = now;
    const audio = new Audio(ALERT_SOUND_URL);
    audio.play().catch(e => console.warn('Sound play failed:', e));
  }

  function insertSnippet(key){
    const text = SNIPPETS[key];
    const editor = document.querySelector('div[aria-label="Message Body"]')
                  || document.querySelector('div[role="textbox"]');
    if(editor){
      editor.focus();
      document.execCommand('insertText', false, text);
    } else console.warn('Compose editor not found');
  }

  function createPopup(){
    if(popup) return;
    popup = document.createElement('div');
    Object.assign(popup.style,{
      position:'fixed', top:'80px', right:'20px', zIndex:9999,
      background:'rgba(255,255,255,0.95)', boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
      padding:'8px', borderRadius:'6px', fontFamily:'Arial, sans-serif',
      fontSize:'14px', minWidth:'140px', cursor:'move', userSelect:'none'
    });
    const header = document.createElement('div');
    header.style.cssText = 'height:6px; margin-bottom:4px;';
    popup.appendChild(header);
    const refreshBtn = document.createElement('div');
    refreshBtn.textContent = '⟳';
    Object.assign(refreshBtn.style,{
      position:'absolute', top:'4px', right:'6px', cursor:'pointer', fontWeight:'bold'
    });
    refreshBtn.title = 'Обновить список писем';
    refreshBtn.addEventListener('click', clickGmailRefresh);
    popup.appendChild(refreshBtn);
    CATEGORIES.forEach(cat => {
      const box = document.createElement('div');
      box.id = `tm-cat-${cat.name}`;
      Object.assign(box.style,{
        background:cat.color, color:'#fff', padding:'4px 6px',
        borderRadius:'4px', margin:'4px 0', textAlign:'center'
      });
      box.textContent = `${cat.label}: 0`;
      popup.appendChild(box);
    });
    Object.entries({
      'Referral Hip':'referralHip',
      'Referral Uhc':'referralUhc',
      'Answers':'answers'
    }).forEach(([label,key])=>{
      const btn = document.createElement('button');
      btn.textContent = label;
      Object.assign(btn.style,{
        width:'100%', margin:'4px 0', padding:'4px',
        border:'none', borderRadius:'4px', cursor:'pointer', background:'#eee', textAlign:'left'
      });
      btn.addEventListener('click', ()=>insertSnippet(key));
      popup.appendChild(btn);
    });
    document.body.appendChild(popup);
    makeDraggable(popup, header);
  }

  function clickGmailRefresh(){
    const btn = document.querySelector('div[aria-label="Refresh"]')
              || document.querySelector('div[aria-label="Обновить"]');
    if(btn) btn.click();
  }

  function makeDraggable(el, handle){
    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      dragData.startX = e.clientX;
      dragData.startY = e.clientY;
      const rect = el.getBoundingClientRect();
      dragData.origX = rect.left;
      dragData.origY = rect.top;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }
  function onMouseMove(e){
    popup.style.left = (dragData.origX + (e.clientX - dragData.startX)) + 'px';
    popup.style.top  = (dragData.origY + (e.clientY - dragData.startY)) + 'px';
  }
  function onMouseUp(){
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  function getMessageDate(row){
    const span = row.querySelector('span[title]');
    return span? new Date(span.getAttribute('title')) : null;
  }

  function refreshAll(){
    createPopup();
    const counts = {under5:0, under10:0, over10:0};
    document.querySelectorAll('tr.zA.zE').forEach(row => {
      const date = getMessageDate(row);
      if(!date) return;
      const mins = Math.floor((Date.now() - date.getTime())/60000);
      if(mins < CATEGORIES[0].max)      counts.under5++;
      else if(mins < CATEGORIES[1].max) counts.under10++;
      else                               counts.over10++;
    });
    CATEGORIES.forEach(cat => {
      const el = document.getElementById(`tm-cat-${cat.name}`);
      if(el) el.textContent = `${cat.label}: ${counts[cat.name]}`;
    });
    if(counts.over10 > prevOverCount) playCustomSound();
    prevOverCount = counts.over10;
    const snap = JSON.stringify(counts);
    if(prevCounts===null || snap!==prevCounts){
      prevCounts = snap;
      lastChangeTime = Date.now();
    } else if(Date.now() - lastChangeTime > AUTO_REFRESH_INTERVAL){
      clickGmailRefresh();
      lastChangeTime = Date.now();
    }
  }

  function observeMailList(){
    const main = document.querySelector('div[role="main"]');
    if(!main) return;
    let deb;
    new MutationObserver(()=>{
      clearTimeout(deb);
      deb = setTimeout(refreshAll, 500);
    }).observe(main,{childList:true,subtree:true});
  }

  setTimeout(()=>{
    refreshAll();
    observeMailList();
    setInterval(refreshAll, LIVE_UPDATE_INTERVAL);
  },3000);

})();
