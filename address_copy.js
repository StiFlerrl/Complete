// ==UserScript==
// @name         Facility Address Copy
// @namespace    http://tampermonkey.net/
// @version      1.01
// @description  Great tool for best team
// @match        https://emdspc.emsow.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/StiFlerrl/Complete/main/address_copy.js
// @downloadURL  https://raw.githubusercontent.com/StiFlerrl/Complete/main/address_copy.js
// ==/UserScript==

(function() {
    'use strict';

    // --- ⚙️ НАСТРОЙКИ (МОЖНО МЕНЯТЬ) ---
    const CONFIG = {
        DELAY_AFTER_WINDOW_CLOSE: 2000,  // Пауза после закрытия окна (мс)
        DELAY_BETWEEN_PATIENTS:   1500,  // Пауза перед переключением на следующего (мс)
        DELAY_OPEN_WINDOW:        3000   // Сколько ждать открытия окна после Ctrl+E (мс)
    };
    // -------------------------------------

    let autoRunning = false;
    let lockedGridBody = null;
    let currentGlobalIndex = -1;
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // --- 1. ПОИСК ТАБЛИЦЫ ---

    function findAndLockPatientGrid() {
        const allSelected = Array.from(document.querySelectorAll('.x-grid3-row-selected'));
        if (allSelected.length === 0) {
            alert("❌ Ничего не выделено!");
            return false;
        }

        let patientRow = null;
        for (const row of allSelected) {
            if (row.querySelector('.view-dicomfiles-link') ||
                row.innerText.includes('Images') ||
                row.innerText.includes('Report') ||
                row.innerText.includes('Demographics')) {
                patientRow = row;
                break;
            }
        }

        if (!patientRow) {
            alert("❌ Выделено не то (Офис?). Выделите пациента!");
            return false;
        }

        const gridWrapper = patientRow.closest('.x-grid3');
        if (!gridWrapper) return false;

        gridWrapper.style.border = "5px solid #27ae60";
        gridWrapper.style.boxSizing = "border-box";
        lockedGridBody = gridWrapper;
        console.log("🔒 Grid Locked.");
        return true;
    }

    function getLockedRows() {
        if (!lockedGridBody) return [];
        return Array.from(lockedGridBody.querySelectorAll('.x-grid3-row'));
    }

    function updateCurrentIndex() {
        const rows = getLockedRows();
        const selected = lockedGridBody.querySelector('.x-grid3-row-selected');
        if (selected) {
            currentGlobalIndex = rows.indexOf(selected);
        } else if (currentGlobalIndex === -1) {
            currentGlobalIndex = 0;
        }
        return currentGlobalIndex;
    }

    // --- 2. ДЕЙСТВИЯ ---

    function findSpecificButton(text, context = document) {
        const candidates = Array.from(context.querySelectorAll('button, .x-btn-text'));
        return candidates.find(el => {
            return el.textContent.trim() === text && el.offsetParent !== null;
        });
    }

    function triggerCtrlE(targetElement) {
        const event = new KeyboardEvent('keydown', {
            key: 'e', code: 'KeyE', keyCode: 69, which: 69,
            ctrlKey: true, bubbles: true, cancelable: true, view: window
        });
        targetElement.dispatchEvent(event);
    }

    async function aggressiveClick(row) {
        if (!row) return;
        row.scrollIntoView({ block: 'center', behavior: 'auto' });

        const targets = [
            row.querySelector('.x-grid3-col-1 .x-grid3-cell-inner'),
            row.querySelector('.x-grid3-col-3 .x-grid3-cell-inner'),
            row
        ];

        for (const target of targets) {
            if (target) {
                ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(type => {
                    target.dispatchEvent(new MouseEvent(type, {
                        bubbles: true, cancelable: true, view: window, buttons: 1
                    }));
                });
                await sleep(50);
                if (row.classList.contains('x-grid3-row-selected')) return;
            }
        }
    }

    // --- 3. ОКНА ---

    async function handlePostSaveLogic() {
        console.log("⏳ Waiting for window close...");
        const warningTextPart = "Insurance information in the following future services";

        for (let i = 0; i < 100; i++) {
            const saveBtn = findSpecificButton('Save');
            if (!saveBtn) return "SUCCESS";

            const messageBoxes = Array.from(document.querySelectorAll('.ext-mb-text, .x-window-body'));
            const warningBox = messageBoxes.find(el => el.innerText.includes(warningTextPart) && el.offsetParent !== null);

            if (warningBox) {
                console.warn("⚠️ Warning detected.");
                const parentWindow = warningBox.closest('.x-window') || document;
                const noBtn = findSpecificButton('No', parentWindow);
                if (noBtn) {
                    noBtn.click();
                    await sleep(800);
                }
            }
            await sleep(100);
        }
    }

    // --- 4. ПРОЦЕСС ---

    async function processSequence() {
        if (!autoRunning) return;
        if (!lockedGridBody) { stopAutoAssign(); return; }

        const rows = getLockedRows();
        if (currentGlobalIndex >= rows.length) {
            stopAutoAssign();
            alert("🏁 Список закончен!");
            return;
        }

        const currentRow = rows[currentGlobalIndex];
        console.log(`▶ Processing Row #${currentGlobalIndex}`);

        // 1. ВЫДЕЛЕНИЕ
        await aggressiveClick(currentRow);
        await sleep(500);

        // 2. ПРОВЕРКА
        const hasData = currentRow.innerHTML.includes('view-dicomfiles-link') ||
                        currentRow.innerText.includes('Images') ||
                        currentRow.innerText.includes('Report');

        if (!hasData) {
            console.log(`⏭️ Skipping (No Data)`);
            currentGlobalIndex++;
            await processSequence(); // Рекурсия без задержек для пустых строк
            return;
        }

        // 3. ОТКРЫТИЕ
        triggerCtrlE(currentRow);
        console.log(`⏳ Waiting ${CONFIG.DELAY_OPEN_WINDOW}ms for window...`);
        await sleep(CONFIG.DELAY_OPEN_WINDOW);

        // 4. КОПИРОВАНИЕ
        const copyLink = document.querySelector('a.action-copy-ref-address') ||
                         Array.from(document.querySelectorAll('a')).find(a => a.innerText.includes('Copy from facility'));

        if (copyLink) {
            copyLink.click();
            await sleep(1000);

            const yesBtn = findSpecificButton('Yes');
            if (yesBtn) {
                yesBtn.click();
                await sleep(1000);
            }

            const saveBtn = findSpecificButton('Save');
            if (saveBtn) {
                saveBtn.click();
                await handlePostSaveLogic();

                // === ЗАДЕРЖКА ПОСЛЕ ЗАКРЫТИЯ ОКНА ===
                console.log(`☕ Resting after close (${CONFIG.DELAY_AFTER_WINDOW_CLOSE}ms)...`);
                await sleep(CONFIG.DELAY_AFTER_WINDOW_CLOSE);

            } else {
                const closeBtn = document.querySelector('.x-window-header-close-btn');
                if (closeBtn) closeBtn.click();
                await sleep(CONFIG.DELAY_AFTER_WINDOW_CLOSE);
            }
        } else {
            console.log("ℹ️ Copy link missing.");
            const closeBtn = document.querySelector('.x-window-header-close-btn');
            if (closeBtn) closeBtn.click();
            await sleep(CONFIG.DELAY_AFTER_WINDOW_CLOSE);
        }

        // === ЗАДЕРЖКА ПЕРЕД СЛЕДУЮЩИМ ПАЦИЕНТОМ ===
        console.log(`🐢 Slowing down before next (${CONFIG.DELAY_BETWEEN_PATIENTS}ms)...`);
        await sleep(CONFIG.DELAY_BETWEEN_PATIENTS);

        currentGlobalIndex++;
        await processSequence();
    }

    // --- UI ---

    function startAutoAssign() {
        if (!findAndLockPatientGrid()) return;

        const idx = updateCurrentIndex();
        if (idx === -1) {
             currentGlobalIndex = 0;
        }

        autoRunning = true;
        updateUI();
        processSequence();
    }

    function stopAutoAssign() {
        autoRunning = false;
        if (lockedGridBody) {
            lockedGridBody.style.border = "";
            lockedGridBody = null;
        }
        updateUI();
    }

    function updateUI() {
        const btn = document.getElementById('magic-copy-btn');
        if (btn) {
            btn.textContent = autoRunning ? '🛑 STOP' : '🚀 START';
            btn.style.backgroundColor = autoRunning ? '#c0392b' : '#27ae60';
        }
    }

    function addControlButton() {
        if (document.getElementById('magic-copy-btn')) return;
        const toolbar = document.querySelector('.app-order-tools .x-toolbar-left-row') ||
                        document.querySelector('.x-toolbar-left-row');
        if (!toolbar) return;

        const newCell = document.createElement('td');
        const btn = document.createElement('button');
        btn.id = 'magic-copy-btn';
        btn.textContent = '🚀 START';
        btn.style.cssText = `padding: 4px 12px; border: 1px solid #ccc; border-radius: 4px; background-color: #27ae60; color: white; cursor: pointer; font-weight: bold; margin-left: 10px;`;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (autoRunning) stopAutoAssign(); else startAutoAssign();
        });

        newCell.appendChild(btn);
        toolbar.appendChild(newCell);
    }

    setInterval(addControlButton, 2000);
})();
