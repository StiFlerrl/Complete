// ==UserScript==
// @name         Copy Patient Information
// @namespace    http://tampermonkey.net/
// @version      1.11
// @description  Adds buttons to copy patient information for each patient in a grid view.
// @match        https://emdspc.emsow.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/StiFlerrl/Complete/main/Copy_Patient_Information.user.js
// @downloadURL  https://raw.githubusercontent.com/StiFlerrl/Complete/main/Copy_Patient_Information.user.js
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

        return result;
    }

    /**
     * Creates and adds buttons to each table row for copying information.
     */
    function addButtonsToRows() {
        const container = document.querySelector('.x-grid-group-body');
        if (!container) {
            return;
        }

        const rows = container.querySelectorAll('.x-grid3-row');

        rows.forEach(row => {
            const copyAllCell = row.querySelector('.x-grid3-td-1');
            const patientNameCell = row.querySelector('.x-grid3-td-3');
            const memberIdCell = row.querySelector('.x-grid3-td-4');
            const dobCell = row.querySelector('.x-grid3-td-3');

            // Check if buttons have already been added to this row
            if (row.querySelector('.copy-buttons-wrapper')) {
                return;
            }

            // Create a wrapper for all buttons in the first column
            if (copyAllCell) {
                const buttonsWrapper = document.createElement('div');
                buttonsWrapper.className = 'copy-buttons-wrapper';
                buttonsWrapper.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 5px;
                    margin-top: 5px;
                `;
                copyAllCell.appendChild(buttonsWrapper);

                // Create and add "Copy answer" button with old style
                const copyAnswerButton = document.createElement('button');
                copyAnswerButton.className = 'copy-answer-button';
                copyAnswerButton.textContent = 'Copy answer';
                copyAnswerButton.style.cssText = `
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
                        copyToClipboard(info + ' - ');
                    }
                };
                buttonsWrapper.appendChild(copyAnswerButton);
            }

            // Create a helper function to create small copy buttons
            const createCopyIconButton = (label, content) => {
                const button = document.createElement('button');
                button.textContent = '📄';
                button.title = `Copy ${label}`;
                button.style.cssText = `
                    background: none;
                    border: none;
                    font-size: 1em;
                    cursor: pointer;
                    margin-left: 5px;
                `;
                button.onclick = (e) => {
                    e.stopPropagation();
                    copyToClipboard(content);
                };
                return button;
            };

            // Add buttons to individual cells
            if (patientNameCell) {
                const patientNameElement = patientNameCell.querySelector('.text-bold span');
                if (patientNameElement) {
                    const nameCopyButton = createCopyIconButton('Name', patientNameElement.textContent.trim());
                    patientNameElement.parentNode.style.display = 'flex';
                    patientNameElement.parentNode.appendChild(nameCopyButton);
                }
                const dobElement = dobCell.querySelector('.app-tip-table-th + td');
                if (dobElement) {
                    const dobCopyButton = createCopyIconButton('DOB', dobElement.textContent.trim());
                    dobElement.parentNode.style.display = 'flex';
                    dobElement.appendChild(dobCopyButton);
                }
            }

            if (memberIdCell) {
                const memberIdTh = Array.from(memberIdCell.querySelectorAll('.app-tip-table-th')).find(th => th.textContent.includes('Member ID:'));
                if (memberIdTh) {
                    const memberIdTd = memberIdTh.nextElementSibling;
                    const memberIdElement = memberIdTd ? memberIdTd.querySelector('span') : null;
                    if (memberIdElement) {
                        const memberIdCopyButton = createCopyIconButton('Member ID', memberIdElement.textContent.trim());
                        memberIdTd.style.display = 'flex';
                        memberIdTd.appendChild(memberIdCopyButton);
                    }
                }
            }
        });
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                if (document.querySelector('.x-grid3-row')) {
                    addButtonsToRows();
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    addButtonsToRows();
})();
