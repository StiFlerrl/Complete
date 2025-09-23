// ==UserScript==
// @name         Copy Patient Information
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  
// @author       Gemini
// @match        https://emdspc.emsow.com/*
// @grant        GM_setClipboard
// @updateURL    https://raw.githubusercontent.com/StiFlerrl/Complete/main/CopyPatientInformation.js
// @downloadURL  https://raw.githubusercontent.com/StiFlerrl/Complete/main/CopyPatientInformation.js
// ==/UserScript==

(function() {
    'use strict';

    /**
     * Cleans up the study text, removing numbers and special characters.
     * @param {string} text The raw text from the study cell.
     * @returns {string} The cleaned study text.
     */
    function cleanStudyText(text) {
        // Remove numbers and specific characters from the end of the string.
        return text.replace(/[\d\-(),\/.,#@!%^&*]|\s+$/g, '').trim();
    }

    /**
     * Copies the given text to the clipboard.
     * @param {string} text The text to copy.
     */
    function copyToClipboard(text) {
        GM_setClipboard(text);
    }

    /**
     * Extracts patient, insurance, and study information from a table row.
     * @param {HTMLElement} rowElement The table row element (tr or equivalent).
     * @returns {string} The formatted information string.
     */
    function extractAnswerInfo(rowElement) {
        const patientNameElement = rowElement.querySelector('.x-grid3-td-3 .text-bold span');
        const insuranceNameElement = rowElement.querySelector('.x-grid3-td-4 .text-bold span');
        const studyElements = rowElement.querySelectorAll('.x-grid3-td-7 b');
        const selectedEmoji = localStorage.getItem('selectedEmoji') || '';

        const patientName = patientNameElement ? patientNameElement.textContent.trim() : '';
        const insuranceName = insuranceNameElement ? insuranceNameElement.textContent.trim().replace(/^Primary:\s*/, '') : '';

        const studies = [];
        studyElements.forEach(el => {
            const studyText = el.textContent.trim();
            if (studyText) {
                studies.push(cleanStudyText(studyText));
            }
        });

        const uniqueStudies = [...new Set(studies)];

        let result = patientName;
        if (insuranceName) {
            result += ` - ${insuranceName}`;
        }
        uniqueStudies.forEach(study => {
            if (study) {
                result += ` - ${study}`;
            }
        });

        result += ' - ';

        if (selectedEmoji) {
            result += `\n${selectedEmoji}`;
        }

        return result;
    }

    /**
     * Creates and adds the settings modal to the document.
     */
    function createSettingsModal() {
        const modalId = 'copy-info-settings-modal';
        let modal = document.getElementById(modalId);
        if (modal) {
            return modal;
        }

        modal = document.createElement('div');
        modal.id = modalId;
        modal.style.cssText = `
            display: none;
            position: absolute;
            bottom: 30px;
            right: 0px;
            width: 200px;
            background-color: #fff;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 1000;
            font-family: sans-serif;
        `;

        modal.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px;">Настройки</div>
            <div style="font-size: 12px; margin-bottom: 10px;">Выберите эмодзи для второй строки:</div>
            <div id="emoji-list" style="display: flex; gap: 10px;">
                <button data-emoji="✅" class="emoji-btn">✅</button>
                <button data-emoji="👍" class="emoji-btn">👍</button>
                <button data-emoji="⭐" class="emoji-btn">⭐</button>
                <button data-emoji="🔥" class="emoji-btn">🔥</button>
                <button data-emoji="❤️" class="emoji-btn">❤️</button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('.emoji-btn').forEach(button => {
            button.style.cssText = `
                background: #f0f0f0;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 5px;
                cursor: pointer;
                font-size: 16px;
            `;
            button.onclick = () => {
                const emoji = button.getAttribute('data-emoji');
                localStorage.setItem('selectedEmoji', emoji);
                modal.style.display = 'none';
            };
        });

        return modal;
    }

    /**
     * Creates and adds buttons to each table row for copying information.
     */
    function addButtonsToRows() {
        // Find the specific container and add buttons only to rows within it
        const container = document.getElementById('ext-gen268-gp-service_status_system-performed-bd');
        if (!container) {
            return;
        }

        // Add a settings button to the container
        let settingsButton = container.querySelector('.settings-button');
        if (!settingsButton) {
            container.style.position = 'relative';

            settingsButton = document.createElement('button');
            settingsButton.className = 'settings-button';
            settingsButton.textContent = '⚙️';
            settingsButton.style.cssText = `
                position: absolute;
                bottom: 5px;
                right: 5px;
                background: none;
                border: none;
                cursor: pointer;
                font-size: 16px;
                z-index: 1001;
            `;
            const settingsModal = createSettingsModal();
            settingsButton.onclick = (e) => {
                e.stopPropagation();
                settingsModal.style.display = settingsModal.style.display === 'none' ? 'block' : 'none';
            };
            container.appendChild(settingsButton);
        }

        const rows = container.querySelectorAll('.x-grid3-row');

        rows.forEach(row => {
            const targetCell = row.querySelector('.x-grid3-td-1');
            const patientNameElement = row.querySelector('.x-grid3-td-3 .text-bold span');
            const dobElement = row.querySelector('.x-grid3-td-3 .app-tip-table-th + td');
            let memberIdElement = null;

            // More robust way to find the Member ID element
            const insuranceCell = row.querySelector('.x-grid3-td-4');
            if (insuranceCell) {
                const memberIdTh = Array.from(insuranceCell.querySelectorAll('.app-tip-table-th')).find(th => th.textContent.includes('Member ID:'));
                if (memberIdTh) {
                    const memberIdTd = memberIdTh.nextElementSibling;
                    if (memberIdTd) {
                        memberIdElement = memberIdTd.querySelector('span');
                    }
                }
            }

            if (targetCell) {
                // Check if the button has already been added to this cell
                const existingButton = targetCell.querySelector('.copy-answer-button');
                if (existingButton) {
                    return;
                }

                // Create and add "Copy answer" button
                const copyAnswerButton = document.createElement('button');
                copyAnswerButton.className = 'copy-answer-button';
                copyAnswerButton.textContent = 'Copy answer';
                copyAnswerButton.style.cssText = `
                    margin-left: 10px;
                    padding: 5px 10px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    background-color: #e0e0e0;
                    cursor: pointer;
                    font-size: 12px;
                `;
                copyAnswerButton.onclick = () => {
                    const info = extractAnswerInfo(row);
                    if (info) {
                        copyToClipboard(info);
                    }
                };

                targetCell.appendChild(copyAnswerButton);
            }

            // Add individual copy buttons for Name, DOB and Member ID
            const createCopyIconButton = (content) => {
                const button = document.createElement('button');
                button.textContent = '📄';
                button.title = 'Copy';
                button.style.cssText = `
                    background: none;
                    border: none;
                    font-size: 10px;
                    cursor: pointer;
                    margin-left: 5px;
                    padding: 0;
                    color: #555;
                `;
                button.onclick = (e) => {
                    e.stopPropagation();
                    copyToClipboard(content);
                };
                return button;
            };

            if (patientNameElement && !patientNameElement.parentNode.querySelector('.copy-icon-button')) {
                const nameCopyButton = createCopyIconButton(patientNameElement.textContent.trim());
                nameCopyButton.className = 'copy-icon-button';
                patientNameElement.parentNode.appendChild(nameCopyButton);
            }

            if (dobElement && !dobElement.querySelector('.copy-icon-button')) {
                const dobCopyButton = createCopyIconButton(dobElement.textContent.trim());
                dobCopyButton.className = 'copy-icon-button';
                dobElement.appendChild(dobCopyButton);
            }

            if (memberIdElement && !memberIdElement.querySelector('.copy-icon-button')) {
                const memberIdCopyButton = createCopyIconButton(memberIdElement.textContent.trim());
                memberIdCopyButton.className = 'copy-icon-button';
                memberIdElement.parentNode.appendChild(memberIdCopyButton);
            }
        });
    }

    const observer = new MutationObserver(() => {
        addButtonsToRows();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    addButtonsToRows();
})();
