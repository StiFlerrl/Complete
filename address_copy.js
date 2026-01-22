// ==UserScript==
// @name         Facility Address Copy 
// @namespace    http://tampermonkey.net/
// @version      1.00
// @description  Great tool for best team
// @match        https://emdspc.emsow.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/StiFlerrl/Complete/main/address_copy.js
// @downloadURL  https://raw.githubusercontent.com/StiFlerrl/Complete/main/address_copy.js
// ==/UserScript==

(function() {
    'use strict';

    let autoRunning = false;
    let lockedGridBody = null; // Ссылка на контейнер с пациентами
    let currentGlobalIndex = -1;
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // --- 1. ЛОГИКА ПОИСКА ПРАВИЛЬНОЙ ТАБЛИЦЫ ---

    function findAndLockPatientGrid() {
        // Находим ВСЕ выделенные строки на странице (и в офисах, и в ордерах, и в пациентах)
        const allSelected = Array.from(document.querySelectorAll('.x-grid3-row-selected'));

        if (allSelected.length === 0) {
            alert("❌ Ничего не выделено!");
            return false;
        }

        let patientRow = null;

        // Перебираем выделенные строки, чтобы найти ту, которая похожа на пациента
        for (const row of allSelected) {
            // Признаки пациента: ссылка на файлы, текст "Images", "Report" или "Demographics"
            if (row.querySelector('.view-dicomfiles-link') ||
                row.innerText.includes('Images') ||
                row.innerText.includes('Report') ||
                row.innerText.includes('Demographics')) {

                patientRow = row;
                break; // Нашли!
            }
        }

        if (!patientRow) {
            alert("❌ Выделено что-то (Офис/Ордер), но строка пациента не найдена. Выделите пациента!");
            return false;
        }

        // Находим родительский контейнер ИМЕННО ЭТОЙ таблицы
        // Ищем ближайший .x-grid3 (обертка таблицы ExtJS)
        const gridWrapper = patientRow.closest('.x-grid3');
        if (!gridWrapper) {
            alert("Ошибка структуры ExtJS");
            return false;
        }

        // Визуализируем захват
        gridWrapper.style.border = "5px solid #27ae60"; // Зеленая рамка
        gridWrapper.style.boxSizing = "border-box";

        lockedGridBody = gridWrapper;
        console.log("🔒 Tabled Locked:", lockedGridBody);
        return true;
    }

    // --- 2. РАБОТА С ЗАХВАЧЕННЫМ СПИСКОМ ---

    // Возвращает плоский список всех строк ТОЛЬКО внутри захваченной таблицы
    // Это позволяет игнорировать группировку (даты, статусы) и переходить сквозь них
    function getLockedRows() {
        if (!lockedGridBody) return [];
        return Array.from(lockedGridBody.querySelectorAll('.x-grid3-row'));
    }

    function updateCurrentIndex() {
        const rows = getLockedRows();
        // Ищем выделенную строку внутри НАШЕЙ таблицы
        const selected = lockedGridBody.querySelector('.x-grid3-row-selected');

        if (selected) {
            currentGlobalIndex = rows.indexOf(selected);
        } else {
            // Если выделение слетело, но мы знаем предыдущий индекс - не сбрасываем его
            if (currentGlobalIndex === -1) currentGlobalIndex = 0;
        }
        return currentGlobalIndex;
    }

    // --- 3. ДЕЙСТВИЯ ---

    function findSpecificButton(text, context = document) {
        const candidates = Array.from(context.querySelectorAll('button, .x-btn-text'));
        return candidates.find(el => {
            return el.textContent.trim() === text && el.offsetParent !== null; // offsetParent checks visibility
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

        // Пытаемся кликнуть по разным элементам внутри строки, чтобы ExtJS "понял"
        const targets = [
            row.querySelector('.x-grid3-col-1 .x-grid3-cell-inner'), // ID column
            row.querySelector('.x-grid3-col-3 .x-grid3-cell-inner'), // Name column
            row // Сама строка
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

    // --- 4. ОКНА ---

    async function handlePostSaveLogic() {
        console.log("⏳ Waiting...");
        const warningTextPart = "Insurance information in the following future services";

        for (let i = 0; i < 100; i++) {
            const saveBtn = findSpecificButton('Save');
            if (!saveBtn) return "SUCCESS"; // Окно закрылось

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

    // --- 5. ЦИКЛ ОБРАБОТКИ ---

    async function processSequence() {
        if (!autoRunning) return;
        if (!lockedGridBody) { stopAutoAssign(); return; }

        const rows = getLockedRows();

        if (currentGlobalIndex >= rows.length) {
            stopAutoAssign();
            alert("🏁 Список в этой таблице закончен!");
            return;
        }

        const currentRow = rows[currentGlobalIndex];

        console.log(`▶ Processing Row #${currentGlobalIndex}`);

        // 1. ВЫДЕЛЕНИЕ
        await aggressiveClick(currentRow);
        await sleep(500);

        // 2. ПРОВЕРКА ДАННЫХ (Есть ли смысл открывать?)
        // Проверяем наличие "Images" или "Report"
        const hasData = currentRow.innerHTML.includes('view-dicomfiles-link') ||
                        currentRow.innerText.includes('Images') ||
                        currentRow.innerText.includes('Report');

        if (!hasData) {
            console.log(`⏭️ Skipping Row #${currentGlobalIndex} (Empty/Header)`);
            currentGlobalIndex++;
            await processSequence();
            return;
        }

        // 3. ОТКРЫТИЕ (Ctrl+E)
        triggerCtrlE(currentRow);
        await sleep(2500);

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
                await sleep(1000);
            } else {
                const closeBtn = document.querySelector('.x-window-header-close-btn');
                if (closeBtn) closeBtn.click();
                await sleep(1000);
            }
        } else {
            console.log("ℹ️ Copy link missing or already done.");
            const closeBtn = document.querySelector('.x-window-header-close-btn');
            if (closeBtn) closeBtn.click();
            await sleep(1000);
        }

        // 5. ПЕРЕХОД
        currentGlobalIndex++;
        await processSequence();
    }

    // --- UI ---

    function startAutoAssign() {
        // 1. Пытаемся найти и захватить правильную таблицу
        if (!findAndLockPatientGrid()) return;

        // 2. Определяем текущий индекс ВНУТРИ этой таблицы
        const idx = updateCurrentIndex();
        if (idx === -1) {
            // Если таблица захвачена, но индекс не ясен - пробуем начать с 0
             alert("Таблица захвачена, но строка не выделена. Начинаю сначала.");
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
