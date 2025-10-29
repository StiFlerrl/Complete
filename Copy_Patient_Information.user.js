// ==UserScript==
// @name         Assign helper|copy 
// @namespace    http://tampermonkey.net/
// @version      2.01
// @description  Great tool for best team
// @match        https://emdspc.emsow.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/StiFlerrl/Complete/main/Copy_Patient_Information.user.js
// @downloadURL  https://raw.githubusercontent.com/StiFlerrl/Complete/main/Copy_Patient_Information.user.js
// ==/UserScript==

(function() {
    'use strict';

    // ====================================================================
    // RULES CONFIGURATION
    // ====================================================================
    const validationRules = {
        masterStudyList: {
            'Echocardiogram': 'R07.89', 'Carotid': ['R42', 'R09.89', 'I67.848'], 'Abdominal Aorta2': 'R10.84',
            'SUDO3': ['R55', 'G90.09', 'I73.89'], 'VNG3': ['G60.3', 'G90.09'], 'LEA': 'I73.89', 'LEA2': 'I73.89',
            'ABI': 'I73.89', 'LEV': 'M79.89', 'UEA': 'I70.228', 'Renal Doppler': 'R10.84', 'Retroperetonial2': 'R10.84',
            'Retro': 'R10.84', 'Renal': 'R10.84', 'ABD2': 'R10.84', 'Abdominal': 'R10.32', 'ABDO3': 'R10.84',
            'PEL2': 'R10.20', 'Pelvic TV2': 'R10.20', 'Scrotal': 'R10.20', 'Thyroid': 'E07.89', 'Soft tissue': 'R22.1',
            'Ab2': 'R10.84',
            'PELV3': 'R10.20',
            'PEL TV': 'R10.20',
            'ABDO3cpt': 'R10.84',
            'Retroperetonial3': 'R10.84',
            'PELV2': 'R10.20',
        },
        defaultStudies: [
            'Echocardiogram', 'Carotid', 'Abdominal Aorta2', 'SUDO3', 'VNG3', 'LEA', 'LEA2', 'ABI', 'LEV', 'UEA',
            'Renal Doppler', 'Retroperetonial2', 'Renal', 'ABD2', 'ABDO3',
            'PEL2', 'Pelvic TV2', 'Scrotal', 'Thyroid', 'Soft tissue'
        ],
        conditionallyValidStudies: [
            'Abdominal',
            'Ab2',
            'Retro',
            'PELV3',
            'PEL TV',
            'PELV2',
            'ABDO3cpt',
            'Retroperetonial3'
        ],

        insuranceOverrides: {
            '$medicare$': {
                'ABD2': 'ABDO3',
                'PEL2': 'PELV2',
            },

            'hip': {
                'Retroperetonial2': 'Retro',
                'Pelvic TV2': 'PEL TV',
            },
            '1199': {
                'PEL2': 'PELV3',
                'Pelvic TV2': 'PEL TV',
            },
            'molina': { 'Retroperetonial2': 'Retro' },
            'bcbs somos': { 'ABD2': 'ABDO3' },
            '$fidelis$': {
                'Pelvic TV2': 'PEL TV',
                'Retroperetonial2': 'Retro',
            },
            'hf': {'Renal':'Retro'},
            '$medicaid of new york$': { 'PEL2': 'PELV2'},
            'metroplus': {
                'ABD2': 'ABDO3cpt',
                'PEL2': 'PELV2',
            },
            'vns':{
                'PEL2': 'PELV2',
            },
            'uhc': {
                'Retroperetonial2': 'Retroperetonial3',
            },
            'wellcare': {
                'Retroperetonial2': 'Retro',
            },
        },
        prohibitedStudies: {
            'metroplus': ['Echocardiogram'],
            'cigna': ['PEL2', 'Pelvic TV2', 'Scrotal', 'Thyroid'],
            '$empire y7n$': ['Echocardiogram','SUDO3'],
            '$empire vof$': ['ABD2','ABDO3','Ab2','Abdominal','PEL2', 'Pelvic TV2', 'Scrotal', 'Thyroid','SUDO3'],
            '$empire jwx$': ['ABD2','ABDO3','Ab2','Abdominal','PEL2', 'Pelvic TV2', 'Scrotal', 'Thyroid','SUDO3'],
            '$empire y8e$': ['Echocardiogram', 'VNG3','SUDO3'],
            '$bcbs somos$': ['Echocardiogram', 'Carotid', 'Abdominal Aorta2', 'LEA', 'UEA', 'ABI','SUDO3'],
            'empire': ['SUDO3'],
            'bcbs': ['SUDO3'],
            'fidelis': ['VNG3'],
            'ghi': ['SUDO3'],
            '$emblemhealth$': ['Echocardiogram'],
            '$hcp ipa$': ['Echocardiogram'],
            'hf': ['SUDO3'],
            '$centers plan for healthy living$': ['Echocardiogram'],
            'oxford': ['ABD2','ABDO3','Ab2','Abdominal','PEL2', 'Pelvic TV2', 'Scrotal', 'Thyroid','Retroperetonial2','SUDO3'],
            'centerlight': ['Echocardiogram', 'Carotid', 'Abdominal Aorta2', 'SUDO3', 'VNG3', 'LEA', 'LEA2', 'ABI', 'LEV', 'UEA','Renal Doppler', 'Retroperetonial2', 'Renal', 'ABD2', 'ABDO3','PEL2', 'Pelvic TV2', 'Scrotal', 'Thyroid', 'Soft tissue'],
            'wellcare': ['Echocardiogram'],
        },
        insuranceWarnings: {
            'amida care': "We are out of network!",
            '$centers plan for healthy living$': "Нельзя брать без авторизации! Нужны ноутсы и отправить запрос по факсу",
            '$fidelis care new york$': "Выбран не верный план Fidelis! Измени на NYNM Fidelis",
            '$mvp$': "NO MVP essential plan 1 - we are out of network",
            '$riverspring health plan$': "mittal only cardio, abd pel thy Hikin with auth through fax, можно брать",
            '$villagecare max$': "Cardio OK, ABD PEL THY only after approve thru FAX"
            },
        memberIdPrefixWarnings: {
            'DZG': "ONLY WITH MEDICAL NOTES",
            'ADP': "Только с ноутсами в тот же день!",
            'D2W': "YES, IF PLAN HAS COVERAGE OUT OF STATE NJ",
        },
        facilityInsuranceProhibitions: {
            'ling lu': ['$medicare$'],
            'filzas': ['$medicare$'],
        },

        primaryStatusWarnings: {
            'eligibility was not performed': 'ПРЕДУПРЕЖДЕНИЕ: Не проводилась проверка статуса Primary (Eligibility).',
            'insurance is inactive': 'ПРЕДУПРЕЖДЕНИЕ: Primary страховка неактивна.',
        },

        secondaryStatusWarnings: {
            'eligibility was not performed': 'ПРЕДУПРЕЖДЕНИЕ: Не проводилась проверка статуса Secondary (Eligibility).',
            'insurance is inactive': 'ПРЕДУПРЕЖДЕНИЕ: Secondary страховка неактивна.',
            'invalid/missing subscriber/insured id': 'ПРЕДУПРЕЖДЕНИЕ: Неверный ID Secondary страховки.'
        },


        secondaryInsuranceRules: {

            readingOverride: [
                {
                    ifPrimary: 'hf',
                    ifSecondaryName: '$medicaid of new york$',
                    ifSecondaryStatus: ['insurance is inactive'],
                    requiredReading: 'SF HF / Zakheim, A.R.'
                }
            ]
        },

        conditional: [
            {
                type: 'replacement',
                insurance: 'uhc',
                gender: 'Female',
                studyToReplace: 'PEL2',
                newStudyName: 'PELV2'
            },
            {
                type: 'replacement',
                insurance: 'essential plan',
                gender: 'Female',
                studyToReplace: 'PEL2',
                newStudyName: 'PELV2'
            },
            {
                type: 'replacement',
                insurance: '$medicare$',
                ifStudyExists: 'Renal Doppler',
                studyToReplace: ['ABD2', 'ABDO3'],
                newStudyName: 'Ab2'
            },
            {
                type: 'replacement',
                insurance: 'metroplus',
                ifStudyExists: 'Renal Doppler',
                studyToReplace: ['ABD2', 'ABDO3'],
                newStudyName: 'Ab2'
            },
            {
                type: 'replacement',
                excludeInsurance: '$medicare$',
                ifStudyExists: 'Renal Doppler',
                studyToReplace: 'ABD2',
                newStudyName: 'Abdominal'
            },
            {
                type: 'replacement',
                excludeInsurance: 'metroplus',
                ifStudyExists: 'Renal Doppler',
                studyToReplace: 'ABD2',
                newStudyName: 'Abdominal'
            },
            { type: 'conflict', insurance: 'ghi', studies: ['ABD2', 'Renal Doppler'], message: "КОНФЛИКТ: Для GHI нельзя в один день делать ABD2 и Renal Doppler." },
            { type: 'conflict', insurance: '$medicaid of new york$', studies: ['Carotid', 'LEV'], message: "КОНФЛИКТ: Для Medicaid нельзя в один день делать CAR и LEV." },
            { type: 'conflict', insurance: '$medicaid of new york$', studies: ['LEV', 'LEA'], message: "КОНФЛИКТ: Для Medicaid нельзя в один день делать LEV и LEA." },
            { type: 'conflict', insurance: '$empire plan by uhc$', studies: ['LEV', 'LEA'], message: "КОНФЛИКТ: Для Empire Plan By UHC нельзя в один день делать LEV и LEA." },
            { type: 'conflict', insurance: '$emblemhealth$', studies: ['Carotid', ['ABD2','ABDO3','Ab2','Abdominal']], message: "КОНФЛИКТ: Для HIP нельзя в один день делать ABD и CAR." },
            { type: 'conflict', insurance: '$medicaid of new york$', studies: ['UEA', 'LEV'], message: "КОНФЛИКТ: Для Medicaid нельзя в один день делать UEA и LEV." },
            { type: 'conflict', insurance: 'uhc', studies: ['LEV', 'LEA'], message: "КОНФЛИКТ: Для UHC нельзя в один день делать LEV и LEA." },
            { type: 'conflict', insurance: '$essential plan$', studies: ['LEV', 'LEA'], message: "КОНФЛИКТ: Для UHC Essential нельзя в один день делать LEV и LEA." },
            { type: 'conflict', insurance: ['aetna', '$fidelis$', 'humana', '$bcbs medicaid$','$empire etrbj$' , 'molina', 'wellcare', 'hf', 'uhc', 'essential plan','$emblemhealth$'], studies: [['ABD2','ABDO3','Ab2','Abdominal'], 'Renal Doppler'], message: "КОНФЛИКТ: Для этой страховки нельзя в один день делать ABD и Renal Doppler." },
            { type: 'conflict', insurance: 'aetna', studies: ['ABI', ['Echocardiogram','Carotid','Abdominal Aorta2','LEA','LEV']], message: "КОНФЛИКТ: Для AETNA нельзя в один день делать эти исследования и ABI." },
            { type: 'conflict', studies: [['ABD2','ABDO3','Ab2','Abdominal'],['PELV2','PEL2']], message: "КОНФЛИКТ: Тесты ABD и PEL не могут быть вместе." },
            {"type":"conflict","studies":[["Carotid"],["UEA"]],"message":"КОНФЛИКТ: Тесты Carotid и UEA не могут быть вместе."},
{"type":"conflict","studies":[["Carotid"],["Soft tissue"]],"message":"КОНФЛИКТ: Тесты Carotid и Soft tissue не могут быть вместе."},
{"type":"conflict","studies":[["Carotid"],["Thyroid"]],"message":"КОНФЛИКТ: Тесты Carotid и THY не могут быть вместе."},
{"type":"conflict","studies":[["LEA"],["Abdominal Aorta2"]],"message":"КОНФЛИКТ: Тесты LEA и AORTA не могут быть вместе."},
{"type":"conflict","studies":[["UEA"],["Soft tissue"]],"message":"КОНФЛИКТ: Тесты UEA и Soft tissue не могут быть вместе."},
{"type":"conflict","studies":[["UEA"],["Abdominal Aorta2"]],"message":"КОНФЛИКТ: Тесты UEA и AORTA не могут быть вместе."},
{"type":"conflict","studies":[["LEV"],["Abdominal Aorta2"]],"message":"КОНФЛИКТ: Тесты LEV и AORTA не могут быть вместе."},
{"type":"conflict","studies":[["Soft tissue"],["ABI"]],"message":"КОНФЛИКТ: Тесты Soft tissue и ABI не могут быть вместе."},
{"type":"conflict","studies":[["Soft tissue"],["Abdominal Aorta2"]],"message":"КОНФЛИКТ: Тесты Soft tissue и AORTA не могут быть вместе."},
{"type":"conflict","studies":[['ABD2','ABDO3','Ab2','Abdominal'],['Retroperetonial2','Retroperetonial3','Retro']],"message":"КОНФЛИКТ: Тесты ABD и Renal Bladder не могут быть вместе."},
{"type":"conflict","studies":[['ABD2','ABDO3','Ab2','Abdominal'],['Retroperetonial2','Retroperetonial3','Retro']],"message":"КОНФЛИКТ: Тесты ABD и AORTA не могут быть вместе."},
{"type":"conflict","studies":[["Renal Doppler"],['Retroperetonial2','Retroperetonial3','Retro']],"message":"КОНФЛИКТ: Тесты REN DOPPLER и REN BLADDER не могут быть вместе."},
{"type":"conflict","studies":[["Renal Doppler"],['PELV2','PEL2']],"message":"КОНФЛИКТ: Тесты REN DOPPLER и PELV не могут быть вместе."},
{"type":"conflict","studies":[["Renal Doppler"],["Abdominal Aorta2"]],"message":"КОНФЛИКТ: Тесты REN DOPPLER и AORTA не могут быть вместе."},
{"type":"conflict","studies":[['Retroperetonial2','Retroperetonial3','Retro'],['PELV2','PEL2']],"message":"КОНФЛИКТ: Тесты REN BLADDER и PELV не могут быть вместе."},
{"type":"conflict","studies":[['Retroperetonial2','Retroperetonial3','Retro'],["Abdominal Aorta2"]],"message":"КОНФЛИКТ: Тесты REN BLADDER и AORTA не могут быть вместе."},
{"type":"conflict","studies":[['PELV2','PEL2'],["Abdominal Aorta2"]],"message":"КОНФЛИКТ: Тесты PELV и AORTA не могут быть вместе."},
        ],
        facilityWarnings: {
            'hong ye': "ПРЕДУПРЕЖДЕНИЕ: Проверить и выставить доктора согласно логу."
        },
        allReadingDoctors: [
            'Hikin, D.',
            'Mittal, H.K.',
            'Zakheim, A.R.',
            'Complete PC',
        ],

        doctorRestrictions: {
            'Mittal, H.K.': { prohibits: ['ABD', 'PEL', 'THY', 'RETRO'] },
            'Zakheim, A.R.': { prohibits: ['Echocardiogram'] },
            'Hikin, D.':     { prohibits: ['ECHO', 'ABI', 'SUDO', 'VNG'] },
            'Complete PC':   { prohibits: ['ECHO', 'THY', 'SUDO', 'ABI', 'VNG'] }
        },
        readingAccountRules: [
            { insurance: '$1199$', account: '1199' },
            { insurance: '$medicare$', account: 'SF Medicare'},
            { insurance: 'hf essential', account: 'SF HF' },
            { insurance: 'metroplus', account: 'MetroPlus QHP' },
            { insurance: 'uhc', account: 'UHC' },
            { insurance: 'oxford', account: 'MetroPlus QHP' },
        ],
        defaultReadingAccount: 'Complete PC',

        doctorInsuranceRestrictions: {
            '$1199$': ['Mittal, H.K.', 'Zakheim, A.R.'],
            'molina': ['Mittal, H.K.', 'Zakheim, A.R.'],
            'aetna': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.', 'Complete PC'],
            '$bcbs medicaid$': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.'],
            '$empire y8e$': ['Complete PC'],
            '$empire vof$': ['Mittal, H.K.', 'Hikin, D.', 'Complete PC'],
            '$centers plan for healthy living$': ['Zakheim, A.R.'],
            '$cigna$': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.', 'Complete PC'],
            '$elderplan$': ['Mittal, H.K.', 'Zakheim, A.R.'],
            '$fidelis$': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.', 'Complete PC'],
            '$hf essential$': ['Mittal, H.K.', 'Zakheim, A.R.'],
            '$hf medicare$': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.', 'Complete PC'],
            '$hf medicaid$': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.', 'Complete PC'],
            '$humana$': ['Mittal, H.K.', 'Zakheim, A.R.'],
            '$hcp ipa$': ['Mittal, H.K.', 'Hikin, D.'],
            '$emblemhealth$': ['Hikin, D.'],
            '$ghi$': ['Mittal, H.K.', 'Hikin, D.', 'Complete PC'],
            '$medicaid$': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.'],
            '$medicare$': ['Mittal, H.K.', 'Hikin, D.'],
            'metroplus': ['Zakheim, A.R.'],
            '$meritain health$': ['Mittal, H.K.', 'Zakheim, A.R.'],
            '$oxford$': ['Mittal, H.K.'],
            '$villagecare max$': ['Mittal, H.K.', 'Hikin, D.'],
            '$vns$': ['Zakheim, A.R.'],
            'uhc': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.', 'Complete PC'],
            'wellcare': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.', 'Complete PC'],
        },

        specificReadingRules: [
            { insurance: 'healthfirst', study: ['PEL2', 'Pelvic TV2','Retroperetonial2'], requiredReading: 'SF HF / Zakheim, A.R.' },
            { facility: 'Ling Lu MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Jose Aristy, MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Jin Song, MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
        ]
    };


    // ====================================================================
    // CORE UTILITY FUNCTIONS & DATA EXTRACTION
    // ====================================================================

function copyToClipboard(text) {
        // Create a temporary textarea element to copy the text.
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = 0;
        textarea.style.left = 0;
        textarea.style.width = '2em';
        textarea.style.height = '2em';
        textarea.style.padding = 0;
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.boxShadow = 'none';
        textarea.style.background = 'transparent';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(textarea);
    }

    function getTableRowValue(container, labelText) {
        if (!container) return null;
        const row = Array.from(container.querySelectorAll('.app-tip-table tr')).find(tr => tr.querySelector('.app-tip-table-th')?.textContent.includes(labelText.replace(/:$/, '')));
        if (row) {
            const valueCell = row.querySelector('td:not(.app-tip-table-th)');
            if (!valueCell) return null;
            const clone = valueCell.cloneNode(true);
            clone.querySelectorAll('button, .copy-icon-button').forEach(btn => btn.remove());
            return clone.textContent.trim();
        }
        return null;
    }

    function getInsuranceSubtype(insuranceName, memberId) {
        const name = (insuranceName || '').toLowerCase();
        const id = memberId || '';

        if (name.includes('healthfirst')) {
            if (['11', '12', '13', '14'].some(p => id.startsWith(p))) return 'hf medicare';
            if (['8', '42'].some(p => id.startsWith(p))) return 'hf essential';
            if (id.match(/^[a-zA-Z]/)) {
                return 'hf medicaid';
            }
        }
            else if (name.includes('empire')) {


            if (id.startsWith('DZG')) {
                return 'empire dzg';
            }
            if (id.startsWith('Y8E')) {
                return 'empire y8e';
            }
            if (id.startsWith('Y7N')) {
                return 'empire y7n';
            }
            if (id.startsWith('VOF')) {
                return 'empire vof';
            }
            if (id.startsWith('JWX')) {
                return 'empire jwx';
            }
            if (id.startsWith('D2W')) {
                return 'empire d2W';
            }
            if (id.startsWith('ADP')) {
                return 'empire adp';
            }
            if (id.startsWith('ETRBJ')) {
                return 'empire etrbj';
            }
        }
        return name;
    }

function extractAnswerInfo(rowElement) {
        const patientNameElement = rowElement.querySelector('.x-grid3-td-3 .text-bold span');
        let patientName = patientNameElement ? patientNameElement.textContent.trim() : '';
        if (patientName.includes(',')) {
            const parts = patientName.split(',').map(p => p.trim());
            patientName = `${parts[1]} ${parts[0]}`;
        }
        const insuranceNameElement = rowElement.querySelector('.x-grid3-td-4 .text-bold > span');
        let insuranceName = '';
        if (insuranceNameElement) {
             const qtipName = insuranceNameElement.getAttribute('qtip');
             if (qtipName) {
                 insuranceName = qtipName.trim();
             } else {
                const insuranceText = insuranceNameElement.textContent.trim();
                insuranceName = insuranceText.includes(':') ? insuranceText.split(':')[1].trim() : insuranceText;
             }
        }
        const studyElements = rowElement.querySelectorAll('.x-grid3-td-7 b span');

        const uniqueStudies = [...new Set(Array.from(studyElements).map(el => el.textContent.trim().replace(/\d/g, '')).filter(Boolean))];


        let result = patientName;
        if (insuranceName) result += ` - ${insuranceName}`;
        uniqueStudies.forEach(study => { result += ` - ${study}`; });
        return result;
    }

    function extractCheckedDate(statusText) {
        if (!statusText) return null;
        const match = statusText.match(/checked on (\d{2}\/\d{2}\/\d{4})/i);
        return (match && match[1]) ? match[1] : null;
    }

    function extractPatientData(rowElement) {
        const data = {};

        const specialistsColumn = rowElement.querySelector('.x-grid3-td-6');
        if (specialistsColumn) {
             data['Doctor'] = 'N/A';
             data['Referring facility'] = 'N/A';

             const rows = specialistsColumn.querySelectorAll('table.app-tip-table tr');

             rows.forEach(row => {
                 const labelCell = row.querySelector('.app-tip-table-th');
                 if (!labelCell) return;

                 const labelText = labelCell.textContent.toLowerCase();

                 if (labelText.includes('doctor:')) {
                     const doctorSpan = row.querySelector('td span');
                     data['Doctor'] = doctorSpan ? doctorSpan.textContent.trim() : 'N/A';
                 } else if (labelText.includes('facility:')) {
                     const facilitySpan = row.querySelector('td span[qtitle]');
                     data['Referring facility'] = facilitySpan ? facilitySpan.getAttribute('qtitle') : 'N/A';
                 }
             });
        }

        const patientColumn = rowElement.querySelector('.x-grid3-td-3');
        if (patientColumn) {
            data['Sex'] = patientColumn.querySelector('img[qtip="Female"], img[qtip="Male"]')?.getAttribute('qtip') || 'N/A';
            data['DoB'] = getTableRowValue(patientColumn, 'DoB') || 'N/A';
            const homeAddressRow = Array.from(patientColumn.querySelectorAll('table.app-tip-table tr')).find(tr => tr.querySelector('.app-tip-table-th')?.textContent.includes('Home address:'));
            data['Home Address'] = homeAddressRow ? (homeAddressRow.querySelector('td')?.innerHTML || '').replace(/<div>/g, '').replace(/<br>/g, ', ').replace(/<[^>]*>/g, '').replace(/\s\s+/g, ' ').trim() : 'N/A';
        }

        const insuranceColumn = rowElement.querySelector('.x-grid3-td-4');
        if(insuranceColumn){
            data['Primary insurance'] = 'N/A';
            data['Primary insurance ID'] = 'N/A';
            data['Primary insurance status text'] = 'N/A';
            data['Primary insurance checked date'] = null;
            data['Insurance Subtype'] = 'N/A';
            data['Secondary insurance'] = 'N/A';
            data['Secondary insurance status text'] = 'N/A';
            data['Secondary insurance checked date'] = null;

            const allInfoBlocks = insuranceColumn.querySelectorAll('.x-grid3-cell-inner > div');

            allInfoBlocks.forEach(block => {
                const insuranceSpan = block.querySelector('.text-bold.text-center > span');
                if (!insuranceSpan) return;

                const fullText = (insuranceSpan.textContent || '').trim().toLowerCase();
                const qtipAttribute = block.querySelector('.app-eligibility-icon')?.getAttribute('qtip') || '';

                let insuranceName = insuranceSpan.getAttribute('qtip');
                if (!insuranceName || insuranceName.trim() === '') {
                     insuranceName = fullText.includes(':') ? fullText.split(':')[1].trim() : fullText.trim();
                }
                insuranceName = insuranceName.trim();

                if (fullText.startsWith('primary:')) {
                    data['Primary insurance'] = insuranceName;
                    data['Primary insurance ID'] = getTableRowValue(block, 'Member ID') || 'N/A';
                    data['Primary insurance status text'] = qtipAttribute;
                    data['Primary insurance checked date'] = extractCheckedDate(qtipAttribute);
                    data['Insurance Subtype'] = getInsuranceSubtype(data['Primary insurance'], data['Primary insurance ID']);
                } else if (fullText.startsWith('secondary:')) {
                    data['Secondary insurance'] = insuranceName;
                    data['Secondary insurance status text'] = qtipAttribute;
                    data['Secondary insurance checked date'] = extractCheckedDate(qtipAttribute);
                }
            });
        }

        const filesColumn = rowElement.querySelector('.x-grid3-td-5');
        if (filesColumn) {
            const attachmentsByStudy = {};
            filesColumn.querySelectorAll('.grid-record').forEach(record => {
                 const studyName = record.querySelector('span[qtip]:not(.text-green)')?.textContent.trim().replace('~', '').trim();
                 if (!studyName) return;
                 let fileType = '';
                 const link = record.querySelector('a.action-link');
                 const linkText = link?.textContent.trim() || '';
                 if (link?.classList.contains('view-dicomfiles-link')) fileType = 'Images';
                 else if (linkText.includes('Preliminary report')) fileType = 'Preliminary report';
                 else if (linkText.includes('Final Report')) fileType = 'Final Report';
                 else if (linkText) fileType = linkText;
                 if (!attachmentsByStudy[studyName]) attachmentsByStudy[studyName] = [];
                 if (fileType) attachmentsByStudy[studyName].push(fileType);
            });
            data.attachmentsByStudy = attachmentsByStudy;
        }

        const studiesColumn = rowElement.querySelector('.x-grid3-td-7');
        if (studiesColumn) {
            studiesColumn.querySelectorAll('td[style*="vertical-align:top"]').forEach((tableCell, index) => {
                const studyNum = index + 1, studyPrefix = `Study${studyNum}`;

                data[studyPrefix] = tableCell.querySelector('table:nth-child(1) b span')?.textContent.trim() || 'N/A';

                const diagTh = Array.from(tableCell.querySelectorAll('.app-tip-table-th')).find(th => th.textContent.includes('Diag:'));
                if (diagTh) {
                    const diagTd = diagTh.nextElementSibling;
                    const diagSpans = diagTd?.querySelectorAll('a span');
                    if (diagSpans && diagSpans.length > 0) {
                        data[`Diagnos for ${studyPrefix}`] = Array.from(diagSpans).map(span => (span.getAttribute('qtip')?.match(/<b>(.*?)<\/b>/) || [])[1] || span.textContent.trim()).join(', ');
                    } else {
                        data[`Diagnos for ${studyPrefix}`] = 'N/A';
                    }
                } else {
                     data[`Diagnos for ${studyPrefix}`] = 'N/A';
                }

                const readingTh = Array.from(tableCell.querySelectorAll('.app-tip-table-th')).find(th => th.textContent.includes('Reading:'));
                if (readingTh) {
                    const readingTd = readingTh.nextElementSibling;
                    const readingSpans = readingTd?.querySelectorAll('.text-bold span');
                    if (readingSpans && readingSpans.length > 0) {
                        const parts = Array.from(readingSpans).map(span => span.textContent.trim());
                        data[`Reading for ${studyPrefix}`] = parts.filter(p => p).join(' / ');
                    } else if (readingTd?.querySelector('.text-bold')) {
                        data[`Reading for ${studyPrefix}`] = readingTd.querySelector('.text-bold').textContent.trim();
                    } else {
                        data[`Reading for ${studyPrefix}`] = 'N/A';
                    }
                } else {
                    data[`Reading for ${studyPrefix}`] = 'N/A';
                }
            });
        }
        return data;
    }

    function checkStudyConditions(studiesToCheck, allPatientStudies) {
        const conditions = !studiesToCheck ? [] : (Array.isArray(studiesToCheck) ? studiesToCheck : [studiesToCheck]);

        return conditions.every(s => {
            if (Array.isArray(s)) {
                return s.some(studyName => allPatientStudies.includes(studyName));
            } else {
                return allPatientStudies.includes(s);
            }
        });
    }

    function checkInsuranceMatch(ruleInsurance, subtype) {
        if (!ruleInsurance) return true;

        const insurances = Array.isArray(ruleInsurance) ? ruleInsurance : [ruleInsurance];
        const subtypeLower = subtype.toLowerCase();

        return insurances.some(ruleKey => {
            const ruleKeyLower = ruleKey.toLowerCase();

            if (ruleKeyLower.startsWith('$') && ruleKeyLower.endsWith('$')) {
                const exactKey = ruleKeyLower.slice(1, -1);
                return exactKey === subtypeLower;
            }
            return subtypeLower.includes(ruleKeyLower);
        });
    }

    function checkFacilityMatch(ruleFacility, facilitySubtype) {
        if (!ruleFacility) return true;

        const facilityLower = facilitySubtype.toLowerCase();
        const ruleKeyLower = ruleFacility.toLowerCase();

        if (ruleKeyLower.startsWith('$') && ruleKeyLower.endsWith('$')) {
            const exactKey = ruleKeyLower.slice(1, -1);
            return exactKey === facilityLower;
        }
        return facilityLower.includes(ruleKeyLower);
    }

    function checkDateStale(dateString, maxDays) {
        if (!dateString || !maxDays) return false;

        const match = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (!match) return false;

        try {
            const dateParts = match.slice(1);
            const eligibilityDate = new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);
            const today = new Date();

            today.setHours(0, 0, 0, 0);
            eligibilityDate.setHours(0, 0, 0, 0);

            const differenceInMs = today.getTime() - eligibilityDate.getTime();

            if (differenceInMs > 0) {
                const differenceInDays = differenceInMs / (1000 * 3600 * 24);
                return differenceInDays > maxDays;
            }
            return false;

        } catch (e) {
            console.error("Error parsing eligibility date:", e);
            return false;
        }
    }

    function validatePatientData(extractedData, checkDocuments = true) {
        const result = { errors: [], warnings: [] };

        const primaryInsurance = (extractedData['Primary insurance'] || '').toLowerCase();
        const primaryInsuranceSubtype = (extractedData['Insurance Subtype'] || primaryInsurance).toLowerCase();

        const secondaryInsurance = (extractedData['Secondary insurance'] || 'N/A');
        const secondaryStatusText = (extractedData['Secondary insurance status text'] || '').toLowerCase();

        const patientGender = (extractedData['Sex'] || '').toLowerCase();

        const primaryInsuranceId = extractedData['Primary insurance ID'] || '';
        const facilityName = (extractedData['Referring facility'] || '').toLowerCase();

        const findRuleKey = (rulesObject, name) => Object.keys(rulesObject).find(k => {
            const keyLower = k.toLowerCase();
            if (keyLower.startsWith('$') && keyLower.endsWith('$')) {
                const exactKey = keyLower.slice(1, -1);
                return exactKey === name;
            }
            return name.includes(keyLower);
        });

        const overrideKey = findRuleKey(validationRules.insuranceOverrides, primaryInsuranceSubtype);
        const prohibitedKey = findRuleKey(validationRules.prohibitedStudies, primaryInsuranceSubtype);

        const activeOverrides = overrideKey ? validationRules.insuranceOverrides[overrideKey] : {};
        const prohibitedStudies = prohibitedKey ? validationRules.prohibitedStudies[prohibitedKey] : [];

        const allowedStudiesUPPER = validationRules.defaultStudies.map(s => s.toUpperCase());
        const conditionallyValidStudiesUPPER = validationRules.conditionallyValidStudies.map(s => s.toUpperCase());

        const effectiveAllowedStudiesUPPER = [...allowedStudiesUPPER];
        for(const studyToReplace in activeOverrides) {
            const newStudy = activeOverrides[studyToReplace];
            const index = effectiveAllowedStudiesUPPER.indexOf(studyToReplace.toUpperCase());
            if (index > -1) effectiveAllowedStudiesUPPER.splice(index, 1);

            if(!conditionallyValidStudiesUPPER.includes(newStudy.toUpperCase())) {
                effectiveAllowedStudiesUPPER.push(newStudy.toUpperCase());
            }
        }

        const allPatientStudies = Object.keys(extractedData).filter(k => k.startsWith('Study')).map(k => extractedData[k]);
        let conflictFound = false;

        function compareDiagnoses(actual, expected) {
            const clean = (str) => (str || "").toUpperCase().trim();
            const actualArray = clean(actual).split(',').map(d => d.trim()).filter(Boolean).sort();
            const expectedArray = Array.isArray(expected) ? expected.map(clean).sort() : [clean(expected)];
            if (expectedArray.length === 1 && expectedArray[0] === '') return actualArray.length === 0;
            return JSON.stringify(actualArray) === JSON.stringify(expectedArray);
        }


        if (extractedData['Sex'] === 'N/A') {
            result.errors.push('ОШИБКА: Пол пациента не указан.');
        }

        const primaryStatusText = (extractedData['Primary insurance status text'] || '').toLowerCase();
        for (const phrase in validationRules.primaryStatusWarnings) {
            if (primaryStatusText.includes(phrase.toLowerCase())) {
                result.warnings.push(validationRules.primaryStatusWarnings[phrase]);
            }
        }

        if (checkDateStale(extractedData['Primary insurance checked date'], validationRules.eligibilityMaxDays)) {
             result.warnings.push(`ПРЕДУПРЕЖДЕНИЕ: Primary Eligibility устарел (проверен ${extractedData['Primary insurance checked date']}).`);
        }

        for (const facilityKey in validationRules.facilityInsuranceProhibitions) {
            if (checkFacilityMatch(facilityKey, facilityName)) {
                validationRules.facilityInsuranceProhibitions[facilityKey].forEach(prohibitedIns => {
                    if (checkInsuranceMatch(prohibitedIns, primaryInsuranceSubtype)) {
                        result.errors.push(`ОШИБКА: Страховка "${extractedData['Insurance Subtype']}" не принимается в офисе "${extractedData['Referring facility']}".`);
                    }
                });
            }
        }

        for (const facilityKey in validationRules.facilityWarnings) {
            if (checkFacilityMatch(facilityKey, facilityName)) {
                result.warnings.push(validationRules.facilityWarnings[facilityKey]);
            }
        }

        const warningKey = findRuleKey(validationRules.insuranceWarnings, primaryInsuranceSubtype);
        if (warningKey) {
            result.warnings.push(validationRules.insuranceWarnings[warningKey]);
        }

        for (const prefix in validationRules.memberIdPrefixWarnings) {
            if (primaryInsuranceId.startsWith(prefix)) {
                result.warnings.push(validationRules.memberIdPrefixWarnings[prefix]);
            }
        }

        let globalRequiredReading = null;

        if (secondaryInsurance !== 'N/A') {
            for (const phrase in validationRules.secondaryStatusWarnings) {
                if (secondaryStatusText.includes(phrase.toLowerCase())) {
                    result.warnings.push(validationRules.secondaryStatusWarnings[phrase]);
                }
            }

            if (checkDateStale(extractedData['Secondary insurance checked date'], validationRules.eligibilityMaxDays)) {
                 result.warnings.push(`ПРЕДУПРЕЖДЕНИЕ: Secondary Eligibility устарел (проверен ${extractedData['Secondary insurance checked date']}).`);
            }

            for (const rule of validationRules.secondaryInsuranceRules.readingOverride) {
                const primaryMatch = checkInsuranceMatch(rule.ifPrimary, primaryInsuranceSubtype);
                const secondaryNameMatch = checkInsuranceMatch(rule.ifSecondaryName, secondaryInsurance.toLowerCase());
                const secondaryStatusMatch = rule.ifSecondaryStatus.some(s => secondaryStatusText.includes(s));

                if (primaryMatch && secondaryNameMatch && secondaryStatusMatch) {
                    globalRequiredReading = rule.requiredReading;
                    break;
                }
            }
        }

        validationRules.conditional.forEach(rule => {
            if (rule.type === 'conflict') {
                let ruleIsActive = checkInsuranceMatch(rule.insurance, primaryInsuranceSubtype);

                if (ruleIsActive) {
                    const allConflictStudiesPresent = checkStudyConditions(rule.studies, allPatientStudies);
                    if (allConflictStudiesPresent) {
                        result.errors.push(rule.message || `КОНФЛИКТ: Тесты ${rule.studies.join(' и ')} несовместимы.`);
                        conflictFound = true;
                    }
                }
            }
        });


        for (let i = 1; extractedData[`Study${i}`]; i++) {
            let studyName = extractedData[`Study${i}`];
            let actualDiagnos = extractedData[`Diagnos for Study${i}`];
            let expectedDiagnos;
            let expectedStudyName = studyName;
            let conditionalReplacementApplied = false;

            if (!conflictFound) {
                for (const rule of validationRules.conditional) {
                    if (rule.type === 'replacement') {

                         let genderMatch = !rule.gender || patientGender === rule.gender.toLowerCase();
                         if (!genderMatch) continue;

                         let insuranceMatch = checkInsuranceMatch(rule.insurance, primaryInsuranceSubtype);

                         if (rule.excludeInsurance) {
                            if (checkInsuranceMatch(rule.excludeInsurance, primaryInsuranceSubtype)) {
                                insuranceMatch = false;
                            }
                         }

                         if (!insuranceMatch) continue;

                         const allTriggersPresent = checkStudyConditions(rule.ifStudyExists, allPatientStudies);
                         if (!allTriggersPresent) continue;

                         let studyMatches = false;
                         const studiesToReplace = Array.isArray(rule.studyToReplace) ? rule.studyToReplace : [rule.studyToReplace];
                         studyMatches = studiesToReplace.includes(studyName);

                         if (studyMatches) {
                            expectedStudyName = rule.newStudyName;
                            conditionalReplacementApplied = true;
                            break;
                        }
                    }
                }
            }

            const studyNameUPPER = expectedStudyName.toUpperCase();

            if (studyName !== expectedStudyName) { result.errors.push(`Study${i}: Expected '${expectedStudyName}', found '${studyName}'.`); }


            if (!effectiveAllowedStudiesUPPER.includes(studyNameUPPER)) {

                let isConditionallyValid = false;
                let specificErrorAdded = false;

                if (conditionallyValidStudiesUPPER.includes(studyNameUPPER)) {

                    const matchingRepRules = validationRules.conditional.filter(r =>
                        r.type === 'replacement' && r.newStudyName.toUpperCase() === studyNameUPPER
                    );

                    if (matchingRepRules.length > 0) {
                        isConditionallyValid = matchingRepRules.some(rule => {
                            let genderValid = !rule.gender || patientGender === rule.gender.toLowerCase();
                            if (!genderValid) return false;

                            let insMatch = checkInsuranceMatch(rule.insurance, primaryInsuranceSubtype);
                            if (rule.excludeInsurance) {
                                if (checkInsuranceMatch(rule.excludeInsurance, primaryInsuranceSubtype)) {
                                    insMatch = false;
                                }
                            }
                            if (!insMatch) return false;

                            if (!checkStudyConditions(rule.ifStudyExists, allPatientStudies)) {
                                const ifStudyExistsArray = Array.isArray(rule.ifStudyExists) ? rule.ifStudyExists : [rule.ifStudyExists];
                                const conditionText = ifStudyExistsArray.flat().join(', ');

                                result.errors.push(`ОШИБКА: Study${i} ('${studyName}'): Тест "${studyName}" может использоваться только в комбинации с [${conditionText}].`);
                                specificErrorAdded = true;
                                return false;
                            }
                            return true;
                        });

                        if (!isConditionallyValid && !specificErrorAdded) {
                             result.errors.push(`ОШИБКА: Study${i} ('${studyName}'): Тест "${studyName}" не валиден для страховки "${primaryInsuranceSubtype}".`);
                             specificErrorAdded = true;
                        }
                    }

                    const activeOverridesUPPER = {};
                    for (const key in activeOverrides) {
                        activeOverridesUPPER[key.toUpperCase()] = activeOverrides[key].toUpperCase();
                    }

                    if (Object.values(activeOverridesUPPER).includes(studyNameUPPER)) {
                        const originalTest = Object.keys(activeOverridesUPPER).find(k => activeOverridesUPPER[k] === studyNameUPPER);

                        if (overrideKey) {
                            if (!allPatientStudies.map(s => s.toUpperCase()).includes(originalTest)) {
                                isConditionallyValid = true;
                            } else {
                                 result.errors.push(`ОШИБКА: Study${i} ('${studyName}'): Тест "${studyName}" не может использоваться вместе с "${originalTest}".`);
                                 specificErrorAdded = true;
                            }
                        } else {
                            result.errors.push(`ОШИБКА: Study${i} ('${studyName}'): Тест "${studyName}" (замена для "${originalTest}") не валиден для этой страховки.`);
                            specificErrorAdded = true;
                        }
                    }
                }

                if (!isConditionallyValid && !conditionalReplacementApplied && !conflictFound && !specificErrorAdded) {

                    const expectedOverride = activeOverrides[studyName];
                    if (expectedOverride) {
                        result.errors.push(`Study${i} ('${studyName}'): неверный тест для страховки "${extractedData['Insurance Subtype']}". Ожидаемый тест: ${expectedOverride}.`);
                    } else {
                        const allowedStudiesString = validationRules.defaultStudies.join(', ');
                        result.errors.push(`Study${i} ('${studyName}'): не является стандартным тестом для страховки "${extractedData['Insurance Subtype']}". Ожидаемые тесты: ${allowedStudiesString}.`);
                    }
                }
            }

            if (prohibitedStudies.includes(studyName)) {
                result.errors.push(`Study${i} ('${studyName}'): ЗАПРЕЩЕН для страховки "${extractedData['Insurance Subtype']}".`);
            }

            expectedDiagnos = validationRules.masterStudyList[expectedStudyName];
            if (expectedDiagnos === undefined) {
                 if (!prohibitedStudies.includes(studyName) && (effectiveAllowedStudiesUPPER.includes(studyNameUPPER) || conditionalReplacementApplied || conditionallyValidStudiesUPPER.includes(studyNameUPPER)) ) {
                 }
            } else if (!compareDiagnoses(actualDiagnos, expectedDiagnos)) {
                const expectedStr = Array.isArray(expectedDiagnos) ? expectedDiagnos.join(', ') : expectedDiagnos;
                result.errors.push(`Study${i} ('${studyName}'): Expected Diag '${expectedStr}', found '${actualDiagnos || "empty"}'.`);
            }

            const reading = extractedData[`Reading for Study${i}`] || 'N/A';
            let specificRuleApplied = false;

            if (globalRequiredReading) {
                if (reading !== globalRequiredReading) {
                    result.errors.push(`ОШИБКА: Study${i} ('${studyName}'): Неверный Reading. Из-за статуса Secondary страховки ("${secondaryStatusText}"), ожидается: "${globalRequiredReading}".`);
                }
                specificRuleApplied = true;
            }

            validationRules.specificReadingRules.forEach(rule => {
                if (specificRuleApplied) return;

                const insuranceMatch = checkInsuranceMatch(rule.insurance, primaryInsuranceSubtype);
                const facilityMatch = checkFacilityMatch(rule.facility, facilityName);

                const studyMatch = !rule.study ||
                                 (Array.isArray(rule.study) ?
                                  rule.study.map(s => s.toUpperCase()).includes(expectedStudyName.toUpperCase()) :
                                  expectedStudyName.toUpperCase() === rule.study.toUpperCase());

                if (insuranceMatch && studyMatch && facilityMatch) {
                    if (reading !== rule.requiredReading) {
                        let errorMsg = `ОШИБКА: Study${i} ('${studyName}'): Неверный Reading. `;
                        if (rule.facility) {
                            errorMsg += `Для facility "${rule.facility}" и страховки "${rule.insurance}"`;
                        } else {
                            errorMsg += `Для страховки "${rule.insurance}"`;
                        }
                        errorMsg += ` должен быть Reading: "${rule.requiredReading}". Найден: "${reading}".`;
                        result.errors.push(errorMsg);
                    }
                    specificRuleApplied = true;
                }
            });

            if (!specificRuleApplied) {
                if (reading === 'N/A' || reading === '' || reading === 'NOT ASSIGNED') {

                    let expectedDoctors = [];

                    const allDoctorsList = validationRules.allReadingDoctors || [];

                    const insRestrictionKey = findRuleKey(validationRules.doctorInsuranceRestrictions, primaryInsuranceSubtype);
                    let insuranceAllowedDoctors = allDoctorsList;
                    if (insRestrictionKey) {
                        insuranceAllowedDoctors = validationRules.doctorInsuranceRestrictions[insRestrictionKey];
                    }

                    const studyBaseName = expectedStudyName.toUpperCase();
                    let studyAllowedDoctors = allDoctorsList.filter(doctorName => {
                        const rules = validationRules.doctorRestrictions[doctorName];
                        if (!rules) return true;

                        return !rules.prohibits.some(p => {
                            const rule = p.toUpperCase();
                            return studyBaseName.includes(rule) || rule.includes(studyBaseName);
                        });
                    });

                    expectedDoctors = insuranceAllowedDoctors.filter(doc => studyAllowedDoctors.includes(doc));

                    let hint = `Ожидаемые врачи: ${expectedDoctors.join(', ')}`;
                    if (allDoctorsList.length === 0) {
                        hint = "ПРЕДУПРЕЖДЕНИЕ: Блок 'allReadingDoctors' не найден в конфиге. Обновите validationRules.";
                    } else if (expectedDoctors.length === 0) {
                         hint = "Не найдено врачей, которые могут читать этот тест с этой страховкой!";
                    }

                    result.warnings.push(`Study${i} ('${studyName}'): Reading не назначен. ${hint}`);

                } else {
                    const readingParts = reading.split(' / ').map(p => p.trim());
                    const account = readingParts[0];
                    const doctor = readingParts.length > 1 ? readingParts[1] : null;
                    const doctorToValidate = doctor ? doctor : account;

                    const readingRule = validationRules.readingAccountRules.find(r => checkInsuranceMatch(r.insurance, primaryInsuranceSubtype));

                    if (readingRule) {
                        if (account !== readingRule.account) {
                            result.errors.push(`ОШИБКА: Study${i} ('${studyName}'): Для страховки "${primaryInsuranceSubtype}" аккаунт Reading должен быть "${readingRule.account}", а не "${account}".`);
                        }
                    } else {
                        if (account !== validationRules.defaultReadingAccount) {
                            if (account !== 'SF HF') {
                                result.warnings.push(`ПРЕДУПРЕЖДЕНИЕ: Study${i} ('${studyName}'): Нестандартный аккаунт Reading "${account}". Ожидался "${validationRules.defaultReadingAccount}".`);
                            }
                        }
                    }

                    const insRestrictionKey = findRuleKey(validationRules.doctorInsuranceRestrictions, primaryInsuranceSubtype);
                    if (insRestrictionKey) {
                        const allowedDoctors = validationRules.doctorInsuranceRestrictions[insRestrictionKey];
                        if (!allowedDoctors.some(doc => doctorToValidate.includes(doc))) {
                            result.errors.push(`ОШИБКА: Study${i} ('${studyName}'): Для страховки "${primaryInsuranceSubtype}" разрешены только врачи: ${allowedDoctors.join(', ')}. Найден: "${doctorToValidate}".`);
                        }
                    }

                    const doctorRuleKey = Object.keys(validationRules.doctorRestrictions).find(k => doctorToValidate.includes(k));
                    if (doctorRuleKey) {
                        const prohibits = validationRules.doctorRestrictions[doctorRuleKey].prohibits;
                        const studyBaseName = expectedStudyName.toUpperCase();

                        if (prohibits.some(p => {
                            const rule = p.toUpperCase();
                            return studyBaseName.includes(rule) || rule.includes(studyBaseName);
                        })) {
                            result.errors.push(`ОШИБКА: Study${i} ('${studyName}'): Врач "${doctorToValidate}" не читает этот тест.`);
                        }
                    }
                }
            }


            if (checkDocuments) {
                const attachments = extractedData.attachmentsByStudy?.[studyName] || [];
                if (!attachments.includes('Images') || !attachments.includes('Preliminary report')) {
                    let missing = [];
                    if (!attachments.includes('Images')) missing.push('Images');
                    if (!attachments.includes('Preliminary report')) missing.push('Preliminary report');
                    if (missing.length > 0) result.errors.push(`Study${i} ('${studyName}'): Missing ${missing.join(' & ')}.`);
                }
            }
        }

        if (checkDocuments) {
            if (!extractedData['Home Address'] || extractedData['Home Address'] === 'N/A' || extractedData['Home Address'].trim() === '') {
                result.errors.push('ОШИБКА: Home Address не указан.');
            }
        }
        return result;
    }


    function displayValidationResult(row, { errors, warnings }) {
        const notesCell = row.querySelector('.x-grid3-td-8 .x-grid3-cell-inner');
        if (!notesCell) return;
        const allMessages = [
            ...errors.map(e => `<span style="color: #9B0000;">❌ ${e}</span>`),
            ...warnings.map(w => `<span style="color: #b07000;">⚠️ ${w}</span>`)
        ];
        if (errors.length > 0) {
            row.style.backgroundColor = '#FFDDDD';
            notesCell.innerHTML = `<div style="font-weight: bold; font-size: 11px;">${allMessages.join('<br>')}</div>`;
        } else if (warnings.length > 0) {
            row.style.backgroundColor = '#DDFFDD';
            notesCell.innerHTML = `<div style="font-weight: bold; font-size: 11px;"><span style="color: green;">✅ Validated</span><br>${allMessages.join('<br>')}</div>`;
        } else {
            row.style.backgroundColor = '#DDFFDD';
            notesCell.innerHTML = `<div style="color: green; font-weight: bold; font-size: 11px;">✅ Validated</div>`;
        }
    }

    let observer;

    function getMainGrid() {
        const header = Array.from(document.querySelectorAll('.x-grid3-hd-row'))
            .find(h => h.querySelector('[ext\\:qtip="Studies / Details"]'));
        return header ? header.closest('.x-grid3') : null;
    }

    function addCheckOrderButton() {
        if (document.getElementById('check-order-btn')) return;
        const toolbar = document.querySelector('.app-order-tools .x-toolbar-left-row');
        if (!toolbar) return;
        const newCell = document.createElement('td');
        newCell.className = 'x-toolbar-cell';
        const checkOrderBtn = document.createElement('button');
        checkOrderBtn.id = 'check-order-btn';
        checkOrderBtn.textContent = 'Check Order';
        checkOrderBtn.style.cssText = `padding: 3px 8px; border: 1px solid #ccc; border-radius: 3px; background-color: #f0ad4e; color: white; cursor: pointer; font-size: 11px; font-weight: bold;`;
        checkOrderBtn.addEventListener('click', () => {
            const mainGrid = getMainGrid();
            if (!mainGrid) { alert('Could not find the main patient grid.'); return; }
            observer.disconnect();
            try {
                mainGrid.querySelectorAll('.x-grid3-row').forEach(row => {
                    row.style.backgroundColor = '';
                    const notesCell = row.querySelector('.x-grid3-td-8 .x-grid3-cell-inner');
                    if (notesCell) notesCell.innerHTML = '&nbsp;';
                    const extractedData = extractPatientData(row);
                    const validationResult = validatePatientData(extractedData, true);
                    displayValidationResult(row, validationResult);
                });
            } catch (e) {
                console.error("Error during 'Check Order' operation:", e);
            } finally {
                observer.observe(document.body, { childList: true, subtree: true });
            }
        });
        const table = document.createElement('table');
        table.className = 'x-btn x-btn-text-icon';
        table.innerHTML = `<tbody class="x-btn-small x-btn-icon-small-left"><tr><td class="x-btn-ml"><i>&nbsp;</i></td><td class="x-btn-mc"></td><td class="x-btn-mr"><i>&nbsp;</i></td></tr></tbody>`;
        table.querySelector('.x-btn-mc').appendChild(checkOrderBtn);
        newCell.appendChild(table);
        toolbar.appendChild(newCell);
    }

function addButtonsToRows() {
        // --- Новая вспомогательная функция из v1.12 ---
        const createCopyIconButton = (label, content) => {
            const button = document.createElement('button');
            button.textContent = '📄';
            button.title = `Copy ${label}`;
            button.className = 'inline-copy-button'; // Класс для проверки
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
        // --- Конец новой функции ---

        const mainGrid = getMainGrid();
        if (!mainGrid) return;

        mainGrid.querySelectorAll('.x-grid3-row').forEach(row => {
            // --- Логика из v1.76 (наши главные кнопки) ---
            const copyAllCell = row.querySelector('.x-grid3-td-1');
            if (copyAllCell && !copyAllCell.querySelector('.copy-buttons-wrapper[data-source="helper"]')) {
                const buttonsWrapper = document.createElement('div');
                buttonsWrapper.className = 'copy-buttons-wrapper';
                buttonsWrapper.setAttribute('data-source', 'helper');
                buttonsWrapper.style.cssText = `display: flex; flex-direction: column; align-items: stretch; gap: 5px; margin-top: 5px;`;
                copyAllCell.appendChild(buttonsWrapper);

                const copyAnswerButton = document.createElement('button');
                copyAnswerButton.textContent = 'Copy answer';
                copyAnswerButton.style.cssText = `padding: 5px 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #e0e0e0; cursor: pointer; font-size: 12px; width: 95px; text-align: center;`;
                copyAnswerButton.addEventListener('click', () => {
                    const info = extractAnswerInfo(row); // Использует нашу функцию v1.76
                    if (info) copyToClipboard(info + ' - ');
                });
                buttonsWrapper.appendChild(copyAnswerButton);

                const checkButton = document.createElement('button');
                checkButton.textContent = 'Check';
                checkButton.style.cssText = `padding: 5px 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #2ECC71; color: white; cursor: pointer; font-size: 12px; width: 95px; text-align: center;`;
                checkButton.addEventListener('click', () => {
                    observer.disconnect();
                    try {
                        row.style.backgroundColor = '';
                        const notesCell = row.querySelector('.x-grid3-td-8 .x-grid3-cell-inner');
                        if (notesCell) notesCell.innerHTML = '&nbsp;';
                        const extractedData = extractPatientData(row);
                        console.log("--- Extracted Data for Validation ---");
                        let logOutput = "";
                        for (const key in extractedData) {
                            if (key !== 'attachmentsByStudy' && Object.prototype.hasOwnProperty.call(extractedData, key)) {
                                logOutput += `${key} - ${extractedData[key] || 'N/A'}\n`;
                            }
                        }
                        console.log(logOutput);
                        console.log("-------------------------------------");
                        const validationResult = validatePatientData(extractedData, false); // Quick check
                        displayValidationResult(row, validationResult);
                    } catch (e) {
                        console.error("Error during 'Check' operation:", e);
                        row.style.backgroundColor = '#FFFFAA';
                        const notesCell = row.querySelector('.x-grid3-td-8 .x-grid3-cell-inner');
                        if (notesCell) notesCell.innerHTML = `<div style="color: #d9534f; font-weight: bold;">SCRIPT ERROR!</div>`;
                    } finally {
                        observer.observe(document.body, { childList: true, subtree: true });
                    }
                });
                buttonsWrapper.appendChild(checkButton);
            }
            // --- Конец логики v1.76 ---


            // --- Новая логика из v1.12 (иконки 📄) ---
            const patientNameCell = row.querySelector('.x-grid3-td-3');
            const memberIdCell = row.querySelector('.x-grid3-td-4');

            // 1. Кнопка "Имя"
            if (patientNameCell) {
                const patientNameElement = patientNameCell.querySelector('.text-bold span');
                if (patientNameElement && !patientNameElement.parentNode.querySelector('.inline-copy-button')) {
                    const nameCopyButton = createCopyIconButton('Name', patientNameElement.textContent.trim());
                    patientNameElement.parentNode.style.display = 'flex';
                    patientNameElement.parentNode.appendChild(nameCopyButton);
                }

                // 2. Кнопка "Дата рождения (DoB)"
                // (Используем улучшенный поиск, как в v1.12)
                const dobTh = Array.from(patientNameCell.querySelectorAll('.app-tip-table-th')).find(th => th.textContent.includes('DoB:'));
                if (dobTh) {
                    const dobTd = dobTh.nextElementSibling;
                    if (dobTd && !dobTd.querySelector('.inline-copy-button')) {
                         const dobCopyButton = createCopyIconButton('DOB', dobTd.textContent.trim());
                         dobTd.style.display = 'flex';
                         dobTd.appendChild(dobCopyButton);
                    }
                }
            }

            // 3. Кнопка "Member ID"
            if (memberIdCell) {
                const memberIdTh = Array.from(memberIdCell.querySelectorAll('.app-tip-table-th')).find(th => th.textContent.includes('Member ID:'));
                if (memberIdTh) {
                    const memberIdTd = memberIdTh.nextElementSibling;
                    if (memberIdTd && !memberIdTd.querySelector('.inline-copy-button')) {
                        const memberIdCopyButton = createCopyIconButton('Member ID', memberIdTd.textContent.trim());
                        memberIdTd.style.display = 'flex';
                        memberIdTd.appendChild(memberIdCopyButton);
                    }
                }
            }
            // --- Конец новой логики v1.12 ---
        });
    }

    function runScript() {
        addButtonsToRows();
        addCheckOrderButton();
    }

    observer = new MutationObserver((mutations) => {
        const hasRelevantChanges = mutations.some(mutation =>
            Array.from(mutation.addedNodes).some(node =>
                node.nodeType === 1 && (node.querySelector('.x-grid3-row') || node.querySelector('.app-order-tools'))
            )
        );
        if (hasRelevantChanges) {
            setTimeout(runScript, 500);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(runScript, 1000);
})();
