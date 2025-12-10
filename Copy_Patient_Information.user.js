// ==UserScript==
// @name         Assign helper|copy
// @namespace    http://tampermonkey.net/
// @version      2.21.1
// @description  Great tool for best team
// @match        https://emdspc.emsow.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/StiFlerrl/Complete/main/Copy_Patient_Information.user.js
// @downloadURL  https://raw.githubusercontent.com/StiFlerrl/Complete/main/Copy_Patient_Information.user.js
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_VERSION = '2.21.1';

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
            'PELV2': 'R10.20','Cigna_ABD':'R10.84'
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
            'ABDO3cpt',
            'Retroperetonial3',
            'PELV2',
        ],
        eligibilityMaxDays: 30,
        repeatInsuranceRules: {
            'DEFAULT_DAYS': {
                days: 180,
                studyOverrides: {
                    'PEL2': 90,
                    'PELV3': 90,
                    'PELV2': 90,
                    'Pelvic TV2': 90,
                    'Scrotal': 90,
                }
            },
            '$medicaid of new york$': {
                days: 365,
                studyOverrides: {
                }
            },
        },

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
            '$bcbs somos$': { 'ABD2': 'ABDO2' },
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
                'Pelvic TV2': 'PEL TV',
            },
            '$essential plan$': {
                'Retroperetonial2': 'Retroperetonial3',
                'Pelvic TV2': 'PEL TV',
            },
            'wellcare': {
                'Retroperetonial2': 'Retro',
            },
            'cigna': {
                'ABD2': 'Cigna_ABD',
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
            'hip': ['Echocardiogram'],
            'hcp ipa': ['Echocardiogram'],
            'emblemhealth': ['Echocardiogram'],
            '$hf medicare$': ['SUDO3'],
            '$hf essential$': ['Echocardiogram', 'SUDO3'],
            '$hf medicaid$': ['Echocardiogram', 'SUDO3'],
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
            '$villagecare max$': "Cardio OK, ABD PEL THY only after approve thru FAX",
            '$medicaid$': "Repeat period 1 year!",
            '$hcp ipa$': "Нужна авторизация на все тесты!Можем взять сами",
            },
        memberIdPrefixWarnings: {
            'DZG': "ONLY WITH MEDICAL NOTES",
            'ADP': "Только с ноутсами в тот же день!",
            'D2W': "YES, IF PLAN HAS COVERAGE OUT OF STATE NJ",
            'ETRBJ': "Авторизацию можно взять только день в день!",
        },
        facilityInsuranceProhibitions: {
            'ling lu': ['$medicare$'],
            'filzas': ['$medicare$'],
        },

        primaryStatusWarnings: {
            'eligibility was not performed': 'ПРЕДУПРЕЖДЕНИЕ: Не проводилась проверка статуса Primary (Eligibility).',
            'insurance is inactive': 'ПРЕДУПРЕЖДЕНИЕ: Primary страховка неактивна.',
            'invalid/missing subscriber/insured id': 'ПРЕДУПРЕЖДЕНИЕ: Неверный ID Primary страховки.'
        },

        secondaryInsuranceRules: {
            secondaryStatusWarnings: {
                'insurance is inactive': 'ПРЕДУПРЕЖДЕНИЕ: Secondary страховка неактивна.',
                'eligibility was not performed': 'ПРЕДУПРЕЖДЕНИЕ: Не проводилась проверка статуса Secondary (Eligibility).',
                'invalid/missing subscriber/insured id': 'ПРЕДУПРЕЖДЕНИЕ: Неверный ID Secondary страховки.'
            },

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
                newStudyName: 'PELV2',
                newDiagnosisCode: ['R10.20', 'R10.84'],
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
            { type: 'conflict', insurance: ['aetna', '$fidelis$', 'humana', '$bcbs medicaid$','$bcbs somos$','$empire etrbj$' , 'molina', 'wellcare', 'hf', 'uhc', 'essential plan','$emblemhealth$'], studies: [['ABD2','ABDO3','Ab2','Abdominal'], 'Renal Doppler'], message: "КОНФЛИКТ: Для этой страховки нельзя в один день делать ABD и Renal Doppler." },
            { type: 'conflict', insurance: 'aetna', studies: ['ABI', ['Echocardiogram','Carotid','Abdominal Aorta2','LEA','LEV']], message: "КОНФЛИКТ: Для AETNA нельзя в один день делать эти исследования и ABI." },
            { type: 'conflict', studies: [['ABD2','ABDO3','Ab2','Abdominal'],['PELV2','PEL2','Pelvic TV2','Scrotal','PEL TV']], message: "КОНФЛИКТ: Тесты ABD и PEL не могут быть вместе." },
            { type: 'conflict',studies: [["Carotid"],["UEA"]],"message":"КОНФЛИКТ: Тесты Carotid и UEA не могут быть вместе."},
            { type: 'conflict',studies: [["Carotid"],["Soft tissue"]],"message":"КОНФЛИКТ: Тесты Carotid и Soft tissue не могут быть вместе."},
            { type: 'conflict',studies: [["Carotid"],["Thyroid"]],"message":"КОНФЛИКТ: Тесты Carotid и THY не могут быть вместе."},
            { type: 'conflict',studies: [["Soft tissue"],["Thyroid"]],"message":"КОНФЛИКТ: Тесты Soft Tissue и THY не могут быть вместе."},
            { type: 'conflict',studies: [["LEA"],["Abdominal Aorta2"]],"message":"КОНФЛИКТ: Тесты LEA и AORTA не могут быть вместе."},
            { type: 'conflict',studies: [["UEA"],["Soft tissue"]],"message":"КОНФЛИКТ: Тесты UEA и Soft tissue не могут быть вместе."},
            { type: 'conflict',studies: [["UEA"],["Abdominal Aorta2"]],"message":"КОНФЛИКТ: Тесты UEA и AORTA не могут быть вместе."},
            { type: 'conflict',studies: [["LEV"],["Abdominal Aorta2"]],"message":"КОНФЛИКТ: Тесты LEV и AORTA не могут быть вместе."},
            { type: 'conflict',studies: [["Soft tissue"],["ABI"]],"message":"КОНФЛИКТ: Тесты Soft tissue и ABI не могут быть вместе."},
            { type: 'conflict',studies: [["Soft tissue"],["Abdominal Aorta2"]],"message":"КОНФЛИКТ: Тесты Soft tissue и AORTA не могут быть вместе."},
            { type: 'conflict',studies: [['ABD2','ABDO3','Ab2','Abdominal'],['Retroperetonial2','Retroperetonial3','Retro']],"message":"КОНФЛИКТ: Тесты ABD и Renal Bladder не могут быть вместе."},
            { type: 'conflict',studies: [['ABD2','ABDO3','Ab2','Abdominal'],['Retroperetonial2','Retroperetonial3','Retro']],"message":"КОНФЛИКТ: Тесты ABD и AORTA не могут быть вместе."},
            { type: 'conflict',studies: [["Renal Doppler"],['Retroperetonial2','Retroperetonial3','Retro']],"message":"КОНФЛИКТ: Тесты REN DOPPLER и REN BLADDER не могут быть вместе."},
            { type: 'conflict',studies: [["Renal Doppler"],['PELV2','PEL2','Pelvic TV2','Scrotal','PEL TV']],"message":"КОНФЛИКТ: Тесты REN DOPPLER и PELV не могут быть вместе."},
            { type: 'conflict',studies: [["Renal Doppler"],["Abdominal Aorta2"]],"message":"КОНФЛИКТ: Тесты REN DOPPLER и AORTA не могут быть вместе."},
            { type: 'conflict',studies: [['Retroperetonial2','Retroperetonial3','Retro'],['PELV2','PEL2','Pelvic TV2','Scrotal','PEL TV']],"message":"КОНФЛИКТ: Тесты REN BLADDER и PELV не могут быть вместе."},
            { type: 'conflict',studies: [['Retroperetonial2','Retroperetonial3','Retro'],["Abdominal Aorta2"]],"message":"КОНФЛИКТ: Тесты REN BLADDER и AORTA не могут быть вместе."},
            { type: 'conflict',studies: [['PELV2','PEL2','Pelvic TV2','Scrotal','PEL TV'],["Abdominal Aorta2"]],"message":"КОНФЛИКТ: Тесты PELV и AORTA не могут быть вместе."},
        ],
        warnings: [
            {
                insurance: 'oxford',
                study: 'Echocardiogram',
                message: "Для ECHO for Oxford требуется Auth!"
            },
            ],
        facilityWarnings: {
            'hong ye': "ПРЕДУПРЕЖДЕНИЕ: Проверить и выставить доктора согласно логу.",
            'lin gong': "ПРЕДУПРЕЖДЕНИЕ: Проверить и выставить доктора согласно логу.",
            'el nunu': "ПРЕДУПРЕЖДЕНИЕ: Проверить и выставить доктора согласно логу.",
            'urgent care': "ПРЕДУПРЕЖДЕНИЕ: Проверить и выставить доктора согласно логу.",
        },
        allReadingDoctors: [
            'Hikin, D.',
            'Mittal, H.K.',
            'Zakheim, A.R.',
            'Complete PC',
        ],
        facilityInsuranceStudyProhibitions: [
            {
                facility: 'Ling Lu MD',
                insurance: 'hf',
                prohibitedStudies: ['Echocardiogram']
            },
                        {
                facility: 'Jose Aristy, MD',
                insurance: 'hf',
                prohibitedStudies: ['Echocardiogram']
            },
                        {
                facility: 'Jin Song, MD',
                insurance: 'hf',
                prohibitedStudies: ['Echocardiogram']
            },
                        {
                facility: 'lin gong, md',
                insurance: 'hf',
                prohibitedStudies: ['Echocardiogram']
            },
                        {
                facility: 'Jun Kang, MD',
                insurance: 'hf',
                prohibitedStudies: ['Echocardiogram']
            },
                        {
                facility: 'Rui Er Teng MD',
                insurance: 'hf',
                prohibitedStudies: ['Echocardiogram']
            },
                        {
                facility: 'Hong Ye, MD',
                insurance: 'hf',
                prohibitedStudies: ['Echocardiogram']
            },
                        {
                facility: 'Gregory Rivera, MD',
                insurance: 'hf',
                prohibitedStudies: ['Echocardiogram']
            },
                        {
                facility: 'Dr. Yana Ryzhakova NP',
                insurance: 'hf',
                prohibitedStudies: ['Echocardiogram']
            },
                        {
                facility: 'Juan Cortes, MD',
                insurance: 'hf',
                prohibitedStudies: ['Echocardiogram']
            },
                        {
                facility: 'Tamira Vannoy, MD',
                insurance: 'hf',
                prohibitedStudies: ['Echocardiogram']
            },
            {
                facility: 'Wei Tan, MD',
                insurance: 'hf',
                prohibitedStudies: ['Echocardiogram']
            },
        ],
        specificDoctorStudyRules: [
            {
                doctor: 'Mittal, H.K.',
                insurance: '$BCBS Medicaid$',
                allowedStudies: ['Echocardiogram']
            }
        ],
        doctorRestrictions: {
            'Mittal, H.K.': { prohibits: ['$ABD2$', 'Ab2', '$Abdominal$', 'PEL2', 'PELV2', 'PEL TV','Pelvic TV2','PELV3', 'Thyroid', 'Retroperetonial2','Retroperetonial3','Retro'] },
            'Zakheim, A.R.': { prohibits: ['Echocardiogram'] },
            'Hikin, D.':     { prohibits: ['Echocardiogram', 'ABI', 'SUDO3', 'SUDO', 'VNG3'] },
            'Complete PC':   { prohibits: ['Echocardiogram', 'Thyroid', 'SUDO3', 'SUDO', 'ABI', 'VNG3'] }
        },
        readingAccountRules: [
            { insurance: '$1199$', account: '1199' },
            { insurance: '$medicare$', account: 'SF Medicare'},
            { insurance: 'hf essential', account: 'SF HF' },
            { insurance: 'metroplus', account: 'MetroPlus QHP' },
            { insurance: 'uhc', account: 'UHC' },
            { insurance: 'essential plan', account: 'UHC' },
            { insurance: 'oxford', account: 'UHC' },
        ],
        defaultReadingAccount: 'Complete PC',

        doctorInsuranceRestrictions: {
            '$1199$': ['Mittal, H.K.', 'Zakheim, A.R.'],
            'molina': ['Mittal, H.K.', 'Zakheim, A.R.'],
            'aetna': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.', 'Complete PC'],
            '$bcbs medicaid$': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.'],
            '$bcbs somos$': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.'],
            '$empire y8e$': ['Complete PC'],
            '$empire vof$': ['Mittal, H.K.', 'Hikin, D.', 'Complete PC'],
            '$centers plan for healthy living$': ['Zakheim, A.R.'],
            '$cigna$': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.', 'Complete PC'],
            '$elderplan$': ['Mittal, H.K.', 'Zakheim, A.R.'],
            '$fidelis$': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.', 'Complete PC'],
            '$hf essential$': ['Zakheim, A.R.'],
            '$hf medicare$': ['Mittal, H.K.', 'Zakheim, A.R.', 'Hikin, D.', 'Complete PC'],
            '$hf medicaid$': ['Zakheim, A.R.', 'Hikin, D.', 'Complete PC'],
            '$humana$': ['Mittal, H.K.', 'Zakheim, A.R.'],
            '$emblemhealth$': ['Hikin, D.'], //HIP Somos
            'hip': ['Hikin, D.'],
            '$hcp ipa$': ['Hikin, D.'], // HealthCare Partners
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
            { insurance: '$hf medicare$', study: ['PEL2', 'Pelvic TV2','Retroperetonial2'], requiredReading: 'SF HF / Zakheim, A.R.' },
            { insurance: '$hf medicaid$', study: ['PEL2', 'Pelvic TV2','Retroperetonial2'], requiredReading: 'SF HF / Zakheim, A.R.' },
            { insurance: '$hf essential$', study: ['PEL2', 'Pelvic TV2','Retroperetonial2'], requiredReading: 'SF HF / Zakheim, A.R.' },
            { facility: 'Ling Lu MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Jose Aristy, MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Jin Song, MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Lin Gong, MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Jun Kang, MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Rui Er Teng MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Hong Ye, MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Wei Tan, MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},            
            { facility: 'Gregory Rivera, MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'}, // клиенты
            { facility: 'Dr. Yana Ryzhakova NP', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Juan Cortes, MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Tamira Vannoy, MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Ramsey H Joudeh', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Dr. Mahshid Assadi', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Kerah Williams, MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Lima Jorge', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Maximo B Julian Sr MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Nick Nicoloff, PA', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Dr. Olugbenga Dawodu', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Ramy George Geris Massoud, MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Roman Rolando R MD', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
            { facility: 'Vine Mark H', insurance: 'hf', requiredReading: 'SF HF / Zakheim, A.R.'},
        ]
    };


    // =======================================
    // Механика получения основной информации
    // =======================================

    function copyToClipboard(text) {
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

    function getAllowedDoctorsForIns(insName) {
        if (!insName || insName === 'n/a') return validationRules.allReadingDoctors || [];
        const findKey = Object.keys(validationRules.doctorInsuranceRestrictions).find(k => {
            const keyLower = k.toLowerCase();
            if (keyLower.startsWith('$') && keyLower.endsWith('$')) return keyLower.slice(1, -1) === insName;
            return insName.includes(keyLower);
        });
        if (findKey) return validationRules.doctorInsuranceRestrictions[findKey];
        return validationRules.allReadingDoctors || [];
    }

    function getInsuranceSubtype(insuranceName, memberId) {
        const name = (insuranceName || '').toLowerCase();
        const id = memberId || '';

        if (name.includes('healthfirst')) {
            if (['11', '12', '13', '14'].some(p => id.startsWith(p))) return 'hf medicare';
            if (['8', '42'].some(p => id.startsWith(p))) return 'hf essential';
            if (id.match(/^[a-zA-Z]/)) return 'hf medicaid';
        } else if (name.includes('empire')) {
            if (id.startsWith('DZG')) return 'empire dzg';
            if (id.startsWith('Y8E')) return 'empire y8e';
            if (id.startsWith('Y7N')) return 'empire y7n';
            if (id.startsWith('VOF')) return 'empire vof';
            if (id.startsWith('JWX')) return 'empire jwx';
            if (id.startsWith('D2W')) return 'empire d2W';
            if (id.startsWith('ADP')) return 'empire adp';
            if (id.startsWith('ETRBJ')) return 'empire etrbj';
        }
        return name;
    }

    function extractAnswerInfo(rowElement) {
        const patientNameElement = rowElement.querySelector('.x-grid3-td-3 .text-bold span');
        let patientName = patientNameElement ? patientNameElement.textContent.trim() : '';
        if (patientName.includes(',')) {
            const parts = patientName.split(',').map(p => p.trim());
            patientName = `${parts[0]}, ${parts[1]}`;
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
            if (ruleKeyLower.startsWith('$') && ruleKeyLower.endsWith('$')) return ruleKeyLower.slice(1, -1) === subtypeLower;
            return subtypeLower.includes(ruleKeyLower);
        });
    }

    function checkFacilityMatch(ruleFacility, facilitySubtype) {
        if (!ruleFacility) return true;
        const facilityLower = facilitySubtype.toLowerCase();
        const ruleKeyLower = ruleFacility.toLowerCase();
        if (ruleKeyLower.startsWith('$') && ruleKeyLower.endsWith('$')) return ruleKeyLower.slice(1, -1) === facilityLower;
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

    function calculateAge(dobString) {
        const match = dobString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (!match) return null;
        try {
            const birthDate = new Date(match[3], match[1] - 1, match[2]);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        } catch (e) {
            console.error("Error parsing DoB:", e);
            return null;
        }
    }

    function parseDate(dateString) {
        if (!dateString) return null;
        let match = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) return new Date(match[1], match[2] - 1, match[3]);
        match = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (match) return new Date(match[3], match[1] - 1, match[2]);
        match = dateString.match(/(\d{2})\.(\d{2})\.(\d{4})/);
        if (match) return new Date(match[3], match[2] - 1, match[1]);
        return null;
    }

    function getDaysBetweenDates(date1, date2) {
        if (!date1 || !date2) return null;
        const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
        const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
        const differenceInMs = d1.getTime() - d2.getTime();
        return Math.round(differenceInMs / (1000 * 60 * 60 * 24));
    }

    function formatDaysToMonthsAndDays(totalDays) {
        if (totalDays === null || totalDays === undefined) return "N/A";
        if (totalDays < 0) totalDays = 0;
        const avgDaysInMonth = 30.4375;
        const months = Math.floor(totalDays / avgDaysInMonth);
        const remainingDays = Math.round(totalDays % avgDaysInMonth);
        let result = "";
        if (months > 0) result += `${months} m.`;
        if (remainingDays > 0) {
            if (result.length > 0) result += " ";
            result += `${remainingDays} d.`;
        }
        if (result.length === 0) return "0 d.";
        return result;
    }

    // =================
    // Проверка истории
    // =================

    async function fetchHistoryData(historyUrl) {
        if (!historyUrl) return [];
        const fullUrl = new URL(historyUrl, window.location.origin).href;
        const historyEntries = [];
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) return [];
            const jsonData = await response.json();
            if (!jsonData || !jsonData.success || !jsonData.data) return [];

            for (const service of jsonData.data) {
                const dos = service.order_dos;
                if (!dos) continue;
                const studiesOnDate = [];
                for (const study of service.studies) {
                    if (study.study_short_name) studiesOnDate.push(study.study_short_name);
                }
                const insurancesOnDate = [];
                for (const ins of service.insurances) {
                    if (ins.insurance_full_name) insurancesOnDate.push(ins.insurance_full_name.toLowerCase());
                    else if (ins.insurance_short_name) insurancesOnDate.push(ins.insurance_short_name.toLowerCase());
                }
                historyEntries.push({
                    dos: dos,
                    studies: studiesOnDate,
                    insurances: insurancesOnDate
                });
            }
            return historyEntries;
        } catch (e) {
            console.error('Error fetching/parsing history JSON:', e);
            return [];
        }
    }

    function extractPatientData(rowElement) {
        const data = {};
        const historyIcon = rowElement.querySelector('img[lazyqtipapi*="fetchRepeatedStudiesHistory"]');
        if (historyIcon) {
            const historyUrl = historyIcon.getAttribute('lazyqtipapi');
            data['History URL'] = historyUrl;
            const dosMatch = historyUrl.match(/order_dos=(\d{2}\/\d{2}\/\d{4})/);
            data['DOS'] = (dosMatch && dosMatch[1]) ? dosMatch[1] : 'N/A';
        } else {
            const dosCell = rowElement.querySelector('.x-grid3-td-2');
            data['DOS'] = dosCell ? (dosCell.querySelector('.x-grid3-cell-inner')?.textContent.trim() || 'N/A') : 'N/A';
        }

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
        if (insuranceColumn) {
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

    // =========================
    // Основная логика проверки
    // =========================

    function validatePatientData(extractedData, checkDocuments = true) {
        const result = { errors: [], warnings: [] };

        const primaryInsurance = (extractedData['Primary insurance'] || '').toLowerCase();
        const primaryInsuranceSubtype = (extractedData['Insurance Subtype'] || primaryInsurance).toLowerCase();
        const secondaryInsuranceRaw = (extractedData['Secondary insurance'] || 'N/A');
        const secondaryInsurance = secondaryInsuranceRaw.toLowerCase().replace('secondary:', '').trim();
        const secondaryStatusText = (extractedData['Secondary insurance status text'] || '').toLowerCase();
        const patientGender = (extractedData['Sex'] || '').toLowerCase();
        const primaryInsuranceId = extractedData['Primary insurance ID'] || '';
        const facilityName = (extractedData['Referring facility'] || '').toLowerCase();
        const patientAge = calculateAge(extractedData['DoB']);
        const historyData = extractedData['History Data'] || [];
        const currentOrderDOS = parseDate(extractedData['DOS']);

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
            const newStudyUPPER = newStudy.toUpperCase();
            const index = effectiveAllowedStudiesUPPER.indexOf(studyToReplace.toUpperCase());
            if (index > -1) effectiveAllowedStudiesUPPER.splice(index, 1);
            if (!effectiveAllowedStudiesUPPER.includes(newStudyUPPER)) {
                effectiveAllowedStudiesUPPER.push(newStudyUPPER);
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
        if (validationRules.primaryStatusWarnings) {
            for (const phrase in validationRules.primaryStatusWarnings) {
                if (primaryStatusText.includes(phrase.toLowerCase())) {
                    result.warnings.push(validationRules.primaryStatusWarnings[phrase]);
                }
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
        if (secondaryInsurance !== 'n/a') {
            const statusToWatch = validationRules.secondaryInsuranceRules.secondaryStatusWarnings || validationRules.secondaryInsuranceRules.statusToWatch || {};
            if (typeof statusToWatch === 'object' && !Array.isArray(statusToWatch)) {
                 for (const phrase in statusToWatch) {
                    if (secondaryStatusText.includes(phrase.toLowerCase())) {
                        result.warnings.push(statusToWatch[phrase]);
                    }
                }
            }
            if (checkDateStale(extractedData['Secondary insurance checked date'], validationRules.eligibilityMaxDays)) {
                 result.warnings.push(`ПРЕДУПРЕЖДЕНИЕ: Secondary Eligibility устарел (проверен ${extractedData['Secondary insurance checked date']}).`);
            }
            for (const rule of validationRules.secondaryInsuranceRules.readingOverride) {
                const primaryMatch = checkInsuranceMatch(rule.ifPrimary, primaryInsuranceSubtype);
                const secondaryNameMatch = checkInsuranceMatch(rule.ifSecondaryName, secondaryInsurance);
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
            let conditionalDiagOverride = null;

            if (validationRules.warnings) {
                validationRules.warnings.forEach(rule => {
                    const insMatch = checkInsuranceMatch(rule.insurance, primaryInsuranceSubtype);
                    const studyMatch = studyName.toLowerCase().includes(rule.study.toLowerCase());

                    if (insMatch && studyMatch) {
                        result.warnings.push(`Study${i}: ${rule.message}`);
                    }
                });
            }

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
                              if (rule.newDiagnosisCode) {
                                 conditionalDiagOverride = rule.newDiagnosisCode;
                             }
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
                            if (rule.excludeInsurance && checkInsuranceMatch(rule.excludeInsurance, primaryInsuranceSubtype)) insMatch = false;
                            if (!insMatch) return false;
                            return checkStudyConditions(rule.ifStudyExists, allPatientStudies);
                        });
                        if (!isConditionallyValid) {
                             specificErrorAdded = true;
                             result.errors.push(`ОШИБКА: Study${i} ('${studyName}'): Условия замены не выполнены.`);
                        }
                    }
                    const activeOverridesUPPER = {};
                    for (const key in activeOverrides) { activeOverridesUPPER[key.toUpperCase()] = activeOverrides[key].toUpperCase(); }
                    if (Object.values(activeOverridesUPPER).includes(studyNameUPPER)) {
                        const originalTest = Object.keys(activeOverridesUPPER).find(k => activeOverridesUPPER[k] === studyNameUPPER);
                        if (overrideKey) {
                            if (!allPatientStudies.map(s => s.toUpperCase()).includes(originalTest)) isConditionallyValid = true;
                            else { result.errors.push(`ОШИБКА: Study${i}: Не может быть вместе с "${originalTest}".`); specificErrorAdded = true; }
                        } else {
                             result.errors.push(`ОШИБКА: Study${i}: Замена "${originalTest}" -> "${studyName}" не валидна.`); specificErrorAdded = true;
                        }
                    }
                }
                if (!isConditionallyValid && !conditionalReplacementApplied && !conflictFound && !specificErrorAdded) {
                     const expectedOverride = activeOverrides[studyName];
                     if (expectedOverride) result.errors.push(`Study${i}: Ожидался тест: ${expectedOverride}.`);
                     else result.errors.push(`Study${i} ('${studyName}'): Недопустимый тест для страховки.`);
                }
            }
            if (prohibitedStudies.includes(studyName)) {
                result.errors.push(`Study${i} ('${studyName}'): ЗАПРЕЩЕН для страховки.`);
            }

            if (validationRules.facilityInsuranceStudyProhibitions) {
                for (const rule of validationRules.facilityInsuranceStudyProhibitions) {
                    if (checkFacilityMatch(rule.facility, facilityName) &&
                        checkInsuranceMatch(rule.insurance, primaryInsuranceSubtype) &&
                        rule.prohibitedStudies && rule.prohibitedStudies.includes(expectedStudyName)) {
                        result.errors.push(`ОШИБКА: Study${i} ('${expectedStudyName}'): ЗАПРЕЩЕН (Facility+Ins).`);
                    }
                }
            }


let properDiag = conditionalDiagOverride;

if (!properDiag) {
     const directDiagOverrideRule = validationRules.conditional.find(rule =>
        rule.type === 'replacement' &&
        rule.newDiagnosisCode &&
        (rule.newStudyName === expectedStudyName) &&
        checkInsuranceMatch(rule.insurance, primaryInsuranceSubtype) &&
        (!rule.gender || patientGender === rule.gender.toLowerCase())
    );

    if (directDiagOverrideRule) {
        properDiag = directDiagOverrideRule.newDiagnosisCode;
    }
}

if (!properDiag) {
    properDiag = validationRules.masterStudyList[expectedStudyName];
}
expectedDiagnos = properDiag;

if (expectedDiagnos !== undefined && !compareDiagnoses(actualDiagnos, expectedDiagnos)) {
    if (checkDocuments) {
    const expectedStr = Array.isArray(expectedDiagnos) ? expectedDiagnos.join(', ') : expectedDiagnos;
    result.errors.push(`Study${i} ('${studyName}'): Expected Diag '${expectedStr}', found '${actualDiagnos || "empty"}'.`);
}
}

            if (expectedStudyName === 'Abdominal Aorta2' && patientAge !== null && patientAge < 50) {
                 result.warnings.push(`ПРЕДУПРЕЖДЕНИЕ: Study${i}: Aorta2 для 50+ (Возраст: ${patientAge}).`);
            }

            if (historyData.length > 0 && currentOrderDOS && validationRules.repeatInsuranceRules) {
                const insRuleKey = findRuleKey(validationRules.repeatInsuranceRules, primaryInsuranceSubtype);

                const insRuleConfig = validationRules.repeatInsuranceRules[insRuleKey] || validationRules.repeatInsuranceRules['DEFAULT_DAYS'];

                let baseDays = (typeof insRuleConfig === 'object' && insRuleConfig.days) ? insRuleConfig.days :
                             (typeof insRuleConfig === 'number' ? insRuleConfig : 180); // 180 - безопасный дефолт

                let studyRuleDays = baseDays;
                if (typeof insRuleConfig === 'object' && insRuleConfig.studyOverrides) {
                    const override = insRuleConfig.studyOverrides[expectedStudyName];
                    if (override) {
                        studyRuleDays = override;
                    }
                }

for (const historyEntry of historyData) {
                    const historicalPrimaryIns = historyEntry.insurances[0];
                    if (!historicalPrimaryIns) continue;

                    const nameMatch = checkInsuranceMatch(primaryInsuranceSubtype, historicalPrimaryIns);

                    const isHF = (name) => name.includes('healthfirst') || name.includes('hf ');
                    const hfGroupMatch = isHF(primaryInsuranceSubtype) && isHF(historicalPrimaryIns);

                    if (!nameMatch && !hfGroupMatch) continue;

                    const studyMatch = historyEntry.studies.find(histStudy => histStudy.replace(/\d/g, '').trim() === expectedStudyName.replace(/\d/g, '').trim());
                    if (studyMatch) {
                        const historyDOS = parseDate(historyEntry.dos);
                        const daysDiff = getDaysBetweenDates(currentOrderDOS, historyDOS);

                        if (daysDiff !== null && daysDiff > 0 && daysDiff <= studyRuleDays) {
                            const timeAgo = formatDaysToMonthsAndDays(daysDiff);
                            result.errors.push(`ПОВТОР: Study '${expectedStudyName}' done ${timeAgo} ago (${historyEntry.dos}).`);
                            break;
                        }
                    }
                }
            }

            if (checkDocuments) {
            const reading = extractedData[`Reading for Study${i}`] || 'N/A';
            let specificRuleApplied = false;


            if (globalRequiredReading) {
                if (reading !== globalRequiredReading) {
                    result.errors.push(`ОШИБКА: Study${i}: Неверный Reading (Secondary Override). Ожидается: "${globalRequiredReading}".`);
                }
                specificRuleApplied = true;
            }

            validationRules.specificReadingRules.forEach(rule => {
                if (specificRuleApplied) return;
                const insuranceMatch = checkInsuranceMatch(rule.insurance, primaryInsuranceSubtype);
                const facilityMatch = checkFacilityMatch(rule.facility, facilityName);
                const studyMatch = !rule.study || (Array.isArray(rule.study) ? rule.study.map(s => s.toUpperCase()).includes(expectedStudyName.toUpperCase()) : expectedStudyName.toUpperCase() === rule.study.toUpperCase());
                if (insuranceMatch && studyMatch && facilityMatch) {
                    if (reading !== rule.requiredReading) {
                        result.errors.push(`ОШИБКА: Study${i}: Reading должен быть "${rule.requiredReading}".`);
                    }
                    specificRuleApplied = true;
                }
            });

            if (!specificRuleApplied) {
                const attachments = extractedData.attachmentsByStudy?.[studyName] || [];
                const hasFinalReport = attachments.includes('Final Report');

                if (hasFinalReport) {
                }
                else if (reading === 'N/A' || reading === '' || reading === 'NOT ASSIGNED') {
                    const primaryAllowed = getAllowedDoctorsForIns(primaryInsuranceSubtype);
                    const secondaryAllowed = (secondaryInsurance && secondaryInsurance.length > 2) ? getAllowedDoctorsForIns(secondaryInsurance) : null;

                    let expectedDoctors = primaryAllowed;
                    if (secondaryAllowed) {
                        expectedDoctors = primaryAllowed.filter(d => secondaryAllowed.includes(d));
                    }

                    const studyBaseName = expectedStudyName.toUpperCase();
                    expectedDoctors = expectedDoctors.filter(doctorName => {
                        const rules = validationRules.doctorRestrictions[doctorName];
                        if (!rules) return true;
                        return !rules.prohibits.some(p => {
                            const rule = p.toUpperCase();
                            return studyBaseName.includes(rule) || rule.includes(studyBaseName);
                        });
                    });

                    let hint = `Ожидаемые врачи: ${expectedDoctors.join(', ')}`;
                    if (expectedDoctors.length === 0) hint = "Нет подходящих врачей (с учетом Primary и Secondary)!";

                    result.errors.push(`Study${i} ('${studyName}'): Reading не назначен. ${hint}`);

                }
                else {
                    let account, doctor, doctorToValidate;
                    const readingParts = reading.split(' / ').map(p => p.trim());
                    const readingRule = validationRules.readingAccountRules.find(r => checkInsuranceMatch(r.insurance, primaryInsuranceSubtype));

                    if (readingParts.length > 1) {
                        account = readingParts[0];
                        doctor = readingParts[1];
                        doctorToValidate = doctor;
                    } else {
                        doctor = readingParts[0];
                        doctorToValidate = doctor;
                        account = readingRule ? readingRule.account : validationRules.defaultReadingAccount;
                    }

                    let specificDoctorRuleTriggered = false;
                    if (validationRules.specificDoctorStudyRules) {
                        for (const rule of validationRules.specificDoctorStudyRules) {
                            const doctorMatch = doctorToValidate.includes(rule.doctor);
                            const insuranceMatch = checkInsuranceMatch(rule.insurance, primaryInsuranceSubtype);
                            if (doctorMatch && insuranceMatch) {
                                specificDoctorRuleTriggered = true;
                                const isAllowed = rule.allowedStudies.some(s => expectedStudyName.toUpperCase() === s.toUpperCase());
                                if (!isAllowed) {
                                    result.errors.push(`ОШИБКА: Study${i}: Врач "${rule.doctor}" не может читать этот тест для "${extractedData['Primary insurance']}".`);
                                }
                                break;
                            }
                        }
                    }

                    if (!specificDoctorRuleTriggered) {
                        if (readingParts.length > 1) {
                            if (readingRule) {
                                if (account !== readingRule.account) result.errors.push(`ОШИБКА: Неверный аккаунт "${account}". Ожидался "${readingRule.account}".`);
                            } else {
                                if (account !== validationRules.defaultReadingAccount) result.errors.push(`ОШИБКА: Неверный аккаунт "${account}".`);
                            }
                        }

                        const primaryAllowed = getAllowedDoctorsForIns(primaryInsuranceSubtype);
                        if (!primaryAllowed.some(doc => doctorToValidate.includes(doc))) {
                            result.errors.push(`ОШИБКА: Study${i}: Врач "${doctorToValidate}" запрещен для Primary ("${primaryInsuranceSubtype}").`);
                        }

                        if (secondaryInsurance && secondaryInsurance.length > 2 && secondaryInsurance !== 'n/a') {
                            const secondaryAllowed = getAllowedDoctorsForIns(secondaryInsurance);
                            if (!secondaryAllowed.some(doc => doctorToValidate.includes(doc))) {
                                result.errors.push(`ОШИБКА: Study${i}: Врач "${doctorToValidate}" запрещен для Secondary ("${secondaryInsurance}"). Требуется общий врач!`);
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
                                result.errors.push(`ОШИБКА: Study${i}: Врач "${doctorToValidate}" не читает тест "${expectedStudyName}".`);
                            }
                        }
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
            ...warnings.map(w => `<span style="color: #0075b0 ;">⚠️ ${w}</span>`)
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

    function addVersionDisplay() {
        if (typeof SCRIPT_VERSION === 'undefined' || document.getElementById('helper-version-display')) {
             return;
        }

        const toolbar = document.querySelector('.app-order-tools .x-toolbar-left-row');
        if (!toolbar) return;

        const newCell = document.createElement('td');
        newCell.className = 'x-toolbar-cell';
        newCell.id = 'helper-version-display';

        const versionSpan = document.createElement('span');
        versionSpan.textContent = `Helper v${SCRIPT_VERSION}`;
        versionSpan.style.cssText = `
            font-size: 10px;
            color: #888;
            margin-left: 10px;
            vertical-align: middle;
            font-style: italic;
            line-height: 20px;
        `;

        newCell.appendChild(versionSpan);
        toolbar.appendChild(newCell);
    }

    function addButtonsToRows() {
        const createCopyIconButton = (label, content) => {
            const button = document.createElement('button');
            button.textContent = '📄';
            button.title = `Copy ${label}`;
            button.className = 'inline-copy-button';
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

        const mainGrid = getMainGrid();
        if (!mainGrid) return;

        mainGrid.querySelectorAll('.x-grid3-row').forEach(row => {
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
                    const info = extractAnswerInfo(row);
                    if (info) copyToClipboard(info + ' - ');
                });
                buttonsWrapper.appendChild(copyAnswerButton);

                const checkButton = document.createElement('button');
                checkButton.textContent = 'Check';
                checkButton.style.cssText = `padding: 5px 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #2ECC71; color: white; cursor: pointer; font-size: 12px; width: 95px; text-align: center;`;

                checkButton.addEventListener('click', async () => {
                    observer.disconnect();
                    try {
                        row.style.backgroundColor = '';
                        const notesCell = row.querySelector('.x-grid3-td-8 .x-grid3-cell-inner');
                        if (notesCell) notesCell.innerHTML = '<i>Проверка...</i>';

                        const extractedData = extractPatientData(row);

                        console.log("--- Extracted Data for Validation ---");
                        console.log(`Дата проверки: ${new Date().toLocaleDateString("ru-RU")}`);
                        let logOutput = "";
                        for (const key in extractedData) {
                            if (key !== 'attachmentsByStudy' && Object.prototype.hasOwnProperty.call(extractedData, key)) {
                                logOutput += `${key} - ${extractedData[key] || 'N/A'}\n`;
                            }
                        }
                        console.log(logOutput);

                        if (extractedData['History URL']) {
                             extractedData['History Data'] = await fetchHistoryData(extractedData['History URL']);
                             console.log("History Data:", extractedData['History Data']);
                        }

                        console.log("-------------------------------------");

                        const validationResult = validatePatientData(extractedData, false);
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

            const patientNameCell = row.querySelector('.x-grid3-td-3');
            const memberIdCell = row.querySelector('.x-grid3-td-4');

            if (patientNameCell) {
                const patientNameElement = patientNameCell.querySelector('.text-bold span');
                if (patientNameElement && !patientNameElement.parentNode.querySelector('.inline-copy-button')) {
                    const nameCopyButton = createCopyIconButton('Name', patientNameElement.textContent.trim());
                    patientNameElement.parentNode.style.display = 'flex';
                    patientNameElement.parentNode.appendChild(nameCopyButton);
                }

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
        });
    }

    function runScript() {
        addButtonsToRows();
        addCheckOrderButton();
        addVersionDisplay();
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

    //======================
    // Модуль автоасайнинга
    // =====================

    let autoRunning = false;
    let autoTimer = null;
    const SKIP_KEYWORDS = [];

    function simulateKeyboardInput(element, text, callback, attempt = 1) {
        if (!autoRunning || !element) return;

        console.log(`[Input] Attempt ${attempt}: "${text}"`);

        element.scrollIntoView({ block: 'center' });
        element.focus();
        element.click();

        // очистка поля если чтото есть
        if (!element.closest('.x-superboxselect')) {
             element.value = '';
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));

        let i = 0;
        function typeLoop() {
            if (!autoRunning) return;
            if (i >= text.length) {
                element.dispatchEvent(new Event('input', { bubbles: true }));
                setTimeout(performSelection, 1000); // Пауза перед выбором
                return;
            }
            const char = text[i++];
            const code = char.charCodeAt(0);
            element.dispatchEvent(new KeyboardEvent('keydown', { key: char, keyCode: code, which: code, bubbles: true }));
            element.dispatchEvent(new KeyboardEvent('keypress', { key: char, keyCode: code, which: code, bubbles: true }));
            element.value += char;
            element.dispatchEvent(new InputEvent('input', { bubbles: true }));
            element.dispatchEvent(new KeyboardEvent('keyup', { key: char, keyCode: code, which: code, bubbles: true }));
            setTimeout(typeLoop, 40);
        }

        // логика по выборе Компилт ПС
        function performSelection() {
            if (!autoRunning) return;

            if (text === 'Complete PC') {
                console.log("⚡ Special mode: Complete PC -> Pressing ArrowDown 11 times...");

                let pressCount = 0;
                function pressDownLoop() {
                    if (pressCount < 11) { // нужно опиститься вниз на 11 раз
                        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, which: 40, bubbles: true }));
                        pressCount++;
                        setTimeout(pressDownLoop, 50);
                    } else {
                        console.log("Done 11 presses. Hitting Enter.");
                        setTimeout(pressEnter, 300);
                    }
                }
                pressDownLoop();

            } else {
                console.log("Normal mode: Pressing Enter...");
                pressEnter();
            }
        }

        function pressEnter() {
            element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, which: 13, bubbles: true }));
            element.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', keyCode: 13, which: 13, bubbles: true }));
            element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, which: 13, bubbles: true }));

            setTimeout(() => {
                element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, which: 9, bubbles: true }));
                element.blur();
                try { document.querySelector('.x-window-header').click(); } catch(e){}

                // проверяем асайнинг врача
                setTimeout(() => {
                    const currentValue = element.value || '';
                    const parts = text.split('/');
                    const keyPart = parts.length > 1 ? parts[1].trim() : text.trim();
                    const keyPartLower = keyPart.toLowerCase();

                    let isMatch = currentValue.toLowerCase().includes(keyPartLower);

                    // проверяем дизагноз из плашки
                    if (!isMatch) {
                        const container = element.closest('.x-form-field-wrap') || element.closest('.x-superboxselect') || element.parentElement?.parentElement;
                        if (container) {
                            const chips = Array.from(container.querySelectorAll('.x-superboxselect-item'));
                            const foundChip = chips.find(chip => chip.textContent.toLowerCase().includes(keyPartLower));
                            if (foundChip) isMatch = true;
                        }
                    }

                    if (isMatch) {
                        console.log("✅ Verification Passed.");
                        callback && callback(true);
                    } else {
                        console.warn(`❌ Verification Failed! Expected "${text}", found "${currentValue}".`);
                        if (attempt < 3) {
                            console.log("Retrying input...");
                            setTimeout(() => simulateKeyboardInput(element, text, callback, attempt + 1), 500);
                        } else {
                            console.error("Giving up.");
                            callback && callback(false);
                        }
                    }
                }, 800);
            }, 500);
        }

        typeLoop();
    }

    // Приоритетность врачей
    function selectBestDoctor(allowedDocs, studyName) {
        if (!allowedDocs || !Array.isArray(allowedDocs)) return null;
        const validDocs = allowedDocs.filter(docName => {
            const restrictions = validationRules.doctorRestrictions[docName];
            if (!restrictions) return true;
            return !restrictions.prohibits.some(p => {
                const pClean = p.replace(/\$/g, '').toLowerCase();
                const sClean = (studyName || '').toLowerCase();
                return sClean.includes(pClean);
            });
        });

        if (validDocs.length === 0) return null;

        const priorityDocs = validDocs.filter(d => d.includes('Hikin') || d.includes('Complete PC'));
        const fallbackDocs = validDocs.filter(d => d.includes('Zakheim') || d.includes('Mittal'));
        const others = validDocs.filter(d => !priorityDocs.includes(d) && !fallbackDocs.includes(d));

        if (priorityDocs.length > 0) {
            const hikin = priorityDocs.find(d => d.includes('Hikin'));
            const complete = priorityDocs.find(d => d.includes('Complete PC'));
            if (hikin && complete) return Math.random() < 0.8 ? hikin : complete;
            return priorityDocs[0];
        }
        if (others.length > 0) return others[0];
        if (fallbackDocs.length > 0) return fallbackDocs[0];
        return null;
    }

    // анализ и формирование действий
    function calculateRequiredActions(extractedData) {
        const actions = [];
        const primaryIns = (extractedData['Insurance Subtype'] || '').toLowerCase();
        const secondaryRaw = (extractedData['Secondary insurance'] || 'n/a');
        const secondaryIns = secondaryRaw.toLowerCase().replace('secondary:', '').trim();
        const facility = (extractedData['Referring facility'] || '').toLowerCase();
        const allPatientStudies = Object.keys(extractedData).filter(k => k.startsWith('Study')).map(k => extractedData[k]);
        const patientGender = (extractedData['Sex'] || '').toLowerCase();

for (let i = 1; extractedData[`Study${i}`]; i++) {
        const studyName = extractedData[`Study${i}`];
        const currentDiag = extractedData[`Diagnos for Study${i}`];
        const currentReading = extractedData[`Reading for Study${i}`];

        let expectedStudyName = studyName;
        let conditionalDiagOverride = null;

        for (const rule of validationRules.conditional) {
            if (rule.type === 'replacement') {
                 let genderMatch = !rule.gender || patientGender === rule.gender.toLowerCase();
                 if (!genderMatch) continue;
                 let insuranceMatch = checkInsuranceMatch(rule.insurance, primaryIns);
                 if (rule.excludeInsurance) {
                     if (checkInsuranceMatch(rule.excludeInsurance, primaryIns)) {
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
                     if (rule.newDiagnosisCode) {
                         conditionalDiagOverride = rule.newDiagnosisCode;
                     }
                     break;
                 }
             }
        }

let properDiag = conditionalDiagOverride;

if (!properDiag) {
     const directDiagOverrideRule = validationRules.conditional.find(rule =>
        rule.type === 'replacement' &&
        rule.newDiagnosisCode &&
        (rule.newStudyName === expectedStudyName) &&
        checkInsuranceMatch(rule.insurance, primaryIns) &&
        (!rule.gender || patientGender === rule.gender.toLowerCase())
    );

    if (directDiagOverrideRule) {
        properDiag = directDiagOverrideRule.newDiagnosisCode;
    }
}

if (!properDiag) {
    properDiag = validationRules.masterStudyList[expectedStudyName];
}

        if (properDiag) {
            const diagValues = Array.isArray(properDiag) ? properDiag : [properDiag];
            const isCorrect = currentDiag && diagValues.every(reqCode => currentDiag.includes(reqCode));

            if (!currentDiag || currentDiag === 'N/A' || currentDiag.trim() === '' || !isCorrect) {
                actions.push({ studyName: expectedStudyName, field: 'diag', value: diagValues });
            }
        }

        if (!currentReading || currentReading === 'N/A' || currentReading === 'NOT ASSIGNED') {
            let assignedAccount = validationRules.defaultReadingAccount;

            const specificRule = validationRules.specificReadingRules.find(rule => {
                const insMatch = checkInsuranceMatch(rule.insurance, primaryIns);
                const facMatch = checkFacilityMatch(rule.facility, facility);
                const studyMatch = !rule.study || (Array.isArray(rule.study) ? rule.study.includes(expectedStudyName) : rule.study === expectedStudyName);
                return insMatch && facMatch && studyMatch;
            });

            if (specificRule) {
                actions.push({ studyName, field: 'reading', value: specificRule.requiredReading });
                continue;
            }

            const accountRule = validationRules.readingAccountRules.find(r => checkInsuranceMatch(r.insurance, primaryIns));
            if (accountRule) assignedAccount = accountRule.account;

            let primaryDocs = getAllowedDoctorsForIns(primaryIns);
            let candidateDocs = primaryDocs;

            if (secondaryIns && secondaryIns.length > 2 && secondaryIns !== 'n/a') {
                const secondaryDocs = getAllowedDoctorsForIns(secondaryIns);
                const commonDocs = primaryDocs.filter(d => secondaryDocs.includes(d));

                if (commonDocs.length > 0) {
                    candidateDocs = commonDocs;
                }
            }

            const suitableDoc = selectBestDoctor(candidateDocs, expectedStudyName);

            if (suitableDoc) {
                let finalValue = '';
                if (suitableDoc.includes('Complete PC')) {
                    finalValue = 'Complete PC';
                }
                else if (assignedAccount.trim() === suitableDoc.trim()) {
                    finalValue = suitableDoc;
                } else {
                    finalValue = `${assignedAccount} / ${suitableDoc}`;
                }
                actions.push({ studyName, field: 'reading', value: finalValue });
            }
        }
    }
    return actions;
}

    // Процесс ввода и фиксирования
    function performActionsInModal(actions, callback) {
        if (!autoRunning) return;
        let actionIndex = 0;

        function nextAction() {
            if (!autoRunning) return;
            if (actionIndex >= actions.length) {
                setTimeout(() => callback(), 1000);
                return;
            }
            setTimeout(() => processNext(), 500);
        }

        function processNext() {
            const action = actions[actionIndex++];
            const currentRows = Array.from(document.querySelectorAll('.app-multifield-row'));
            const targetRow = currentRows.find(row => {
                const inputs = Array.from(row.querySelectorAll('input'));
                return inputs.some(inp => inp.value && inp.value.toLowerCase().includes(action.studyName.toLowerCase()));
            });

            if (!targetRow) {
                setTimeout(nextAction, 200);
                return;
            }

            targetRow.click();
            setTimeout(() => applyValues(targetRow, action), 500);
        }

        function applyValues(targetRow, action) {
            if (action.field === 'diag') {
                const inputs = Array.from(targetRow.querySelectorAll('input'));
                const visibleInputs = inputs.filter(i => i.type !== 'hidden' && i.offsetParent !== null);
                let diagInput = (visibleInputs.length >= 3) ? visibleInputs[2] : targetRow.querySelector('li.x-superboxselect-input input');

                if (diagInput) {
                    const container = diagInput.closest('.x-form-field-wrap');
                    const clearBtn = container ? container.querySelector('.x-superboxselect-btn-clear') : null;
                    let delay = 100;
                    if (clearBtn && !clearBtn.classList.contains('x-superboxselect-btn-hide')) {
                        clearBtn.click();
                        delay = 800;
                    }

                    setTimeout(() => {
                         const codes = Array.isArray(action.value) ? action.value : [action.value];
                         let codeIdx = 0;
                         function enterNextCode() {
                             if (!autoRunning) return;
                             if (codeIdx >= codes.length) { nextAction(); return; }
                             simulateKeyboardInput(diagInput, codes[codeIdx++], (success) => {
                                 setTimeout(enterNextCode, 500);
                             });
                         }
                         enterNextCode();
                    }, delay);
                } else { nextAction(); }

            } else if (action.field === 'reading') {
                const inputs = Array.from(targetRow.querySelectorAll('input'));
                const visibleInputs = inputs.filter(i => i.type !== 'hidden' && i.offsetParent !== null);
                const readingInput = visibleInputs[visibleInputs.length - 1];

                if (readingInput) {
                    simulateKeyboardInput(readingInput, action.value, (success) => {
                        if (!success) console.error("Failed to assign reading.");
                        setTimeout(nextAction, 500);
                    });
                } else { nextAction(); }
            } else {
                nextAction();
            }
        }
        nextAction();
    }

    function findMainGridSelectedRow() {
        try {
            const allSelected = Array.from(document.querySelectorAll('.x-grid3-row-selected'));
            const patientRow = allSelected.find(row => row.querySelectorAll('td.x-grid3-cell').length > 5);
            return patientRow || null;
        } catch (e) { return null; }
    }

    function processCurrentPatient(callback) {
        if (!autoRunning) return;

        const row = findMainGridSelectedRow();
        if (!row) return callback(false);

        const rowText = row.innerText || '';
        const matchedSkip = SKIP_KEYWORDS.find(k => rowText.includes(k));
        if (matchedSkip) {
            console.log(`Skipping: ${matchedSkip}`);
            return callback(true);
        }

        const extractedData = extractPatientData(row);
        let missingDocs = false;
        try {
            for (let i = 1; extractedData[`Study${i}`]; i++) {
                const studyName = extractedData[`Study${i}`];
                const attachments = extractedData.attachmentsByStudy?.[studyName] || [];
                if (!attachments.includes('Images') || !attachments.includes('Preliminary report')) {
                    missingDocs = true;
                    break;
                }
            }
        } catch(e) { }

        if (missingDocs) return callback(true);

        const actions = calculateRequiredActions(extractedData);
        if (actions.length === 0) return callback(true);

        const editBtn = Array.from(document.querySelectorAll('button.icon-edit'))
            .find(b => b.offsetParent !== null && b.textContent.trim() === 'Edit');

        if (!editBtn) return callback(true);

        setTimeout(() => {
            editBtn.click();

            setTimeout(() => {
                if (!autoRunning) return;
                if (!document.querySelector('.app-multifield-row')) {
                    setTimeout(() => performActionsInModal(actions, finishSave), 1000);
                } else {
                    performActionsInModal(actions, finishSave);
                }

                function finishSave() {
                    setTimeout(() => {
                        if (!autoRunning) return;
                        const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Save');
                        if (saveBtn) saveBtn.click();

                        setTimeout(() => {
                            const noBtn = Array.from(document.querySelectorAll('.x-window-footer button')).find(b => b.textContent.trim() === 'No');
                            if(noBtn) noBtn.click();
                            const okBtn = Array.from(document.querySelectorAll('.x-window-footer button')).find(b => b.textContent.trim() === 'OK');
                            if(okBtn) okBtn.click();
                            setTimeout(() => callback(true), 2500);
                        }, 2000);
                    }, 1000);
                }
            }, 1500);
        }, 500);
    }

    function moveToNextRow() {
        const rows = Array.from(document.querySelectorAll('.x-grid3-row'));
        const currentIdx = rows.findIndex(r => r.classList.contains('x-grid3-row-selected'));
        if (currentIdx === -1) return false;
        for (let i = currentIdx + 1; i < rows.length; i++) {
            const nextRow = rows[i];
            if (nextRow.querySelectorAll('td.x-grid3-cell').length > 5) {
                rows[currentIdx].classList.remove('x-grid3-row-selected', 'x-grid-row-selected');
                nextRow.scrollIntoView({ block: 'center' });
                ['mousedown', 'mouseup', 'click'].forEach(e => nextRow.dispatchEvent(new MouseEvent(e, { bubbles: true })));
                nextRow.classList.add('x-grid3-row-selected', 'x-grid-row-selected');
                return true;
            }
        }
        return false;
    }

    function autoAssignLoop() {
        if (!autoRunning) return;
        processCurrentPatient((shouldContinue) => {
            if (!autoRunning) return;
            if (shouldContinue) {
                const hasNext = moveToNextRow();
                if (hasNext) {
                    autoTimer = setTimeout(autoAssignLoop, 1500);
                } else {
                    stopAutoAssign();
                }
            } else {
                stopAutoAssign();
            }
        });
    }

    function startAutoAssign() {
        if (autoRunning) return;
        autoRunning = true;
        const btn = document.getElementById('magic-btn');
        if (btn) {
            btn.textContent = '⏹️ Stop Magic';
            btn.style.backgroundColor = '#dc3545';
        }
        autoAssignLoop();
    }

    function stopAutoAssign() {
        autoRunning = false;
        clearTimeout(autoTimer);
        const btn = document.getElementById('magic-btn');
        if (btn) {
            btn.textContent = '✨ Make magic!';
            btn.style.backgroundColor = '#9B59B6';
        }
        console.log("Stopped");
    }

    function addMagicButton() {
        if (document.getElementById('magic-btn')) return;
        const toolbar = document.querySelector('.app-order-tools .x-toolbar-left-row');
        if (!toolbar) return;
        const newCell = document.createElement('td');
        newCell.className = 'x-toolbar-cell';
        const btn = document.createElement('button');
        btn.id = 'magic-btn';
        btn.textContent = '✨ Make magic!';
        btn.style.cssText = `padding: 3px 8px; border: 1px solid #ccc; border-radius: 3px; background-color: #9B59B6; color: white; cursor: pointer; font-size: 11px; font-weight: bold; margin-left: 5px;`;
        btn.addEventListener('click', () => {
            if (autoRunning) stopAutoAssign(); else startAutoAssign();
        });
        const table = document.createElement('table');
        table.className = 'x-btn x-btn-text-icon';
        table.innerHTML = `<tbody class="x-btn-small x-btn-icon-small-left"><tr><td class="x-btn-ml"><i>&nbsp;</i></td><td class="x-btn-mc"></td><td class="x-btn-mr"><i>&nbsp;</i></td></tr></tbody>`;
        table.querySelector('.x-btn-mc').appendChild(btn);
        newCell.appendChild(table);
        const versionCell = document.getElementById('helper-version-display');
        if (versionCell && versionCell.parentNode === toolbar) {
            toolbar.insertBefore(newCell, versionCell);
        } else {
            toolbar.appendChild(newCell);
        }
    }

    setTimeout(addMagicButton, 2000);

})();
