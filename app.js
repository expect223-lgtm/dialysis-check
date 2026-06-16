// Remember user rule: import antigravity
// import antigravity

// --- Core Data Schema & Initial Items ---
const DEFAULT_ITEMS = {
    r1: [
        { id: "r1_kelly", name: "Kelly (止血鉗)", defaultVal: "34", type: "number" },
        { id: "r1_kelly_a", name: "A車 Kelly", defaultVal: "2", type: "number" },
        { id: "r1_pillow", name: "乳膠枕", defaultVal: "35", type: "number" },
        { id: "r1_emerg", name: "急救包", defaultVal: "45", type: "number" },
        { id: "r1_remote", name: "遙控器+抽屜", defaultVal: "34", type: "number" },
        { id: "r1_remote_extra", name: "額外遙控器", defaultVal: "2", type: "number" },
        { id: "r1_tourniquet", name: "A車止血帶", defaultVal: "2", type: "number" },
        { id: "r1_ab_tubes", name: "AB管 (依現場)", defaultVal: "N27機台*2", type: "text" },
        { id: "r1_DL_expiry", name: "確認D/L效期 (打勾)", defaultVal: "checked", type: "checkbox" }
    ],
    r2: [
        { id: "r2_kelly", name: "Kelly (止血鉗)", defaultVal: "18", type: "number" },
        { id: "r2_pillow", name: "乳膠枕", defaultVal: "17", type: "number" },
        { id: "r2_emerg", name: "急救包", defaultVal: "20", type: "number" },
        { id: "r2_remote", name: "遙控器", defaultVal: "20", type: "number" },
        { id: "r2_ab_tubes", name: "AB管 (1台)", defaultVal: "2條", type: "text" },
        { id: "r2_n27", name: "N27機台*2 (確認)", defaultVal: "checked", type: "checkbox" }
    ],
    meds: [
        { id: "med_heparin", name: "Heparin 25000u/5cc", defaultVal: "60", type: "number" },
        { id: "med_medason", name: "Medason", defaultVal: "2", type: "number" },
        { id: "med_tramtor", name: "Tramtor (止痛)", defaultVal: "3", type: "number" },
        { id: "med_vena", name: "Vena (抗敏)", defaultVal: "3", type: "number" },
        { id: "med_gw", name: "50% G/W (高張糖水)", defaultVal: "60", type: "number" },
        { id: "med_anxicam", name: "Anxicam (鎮靜)", defaultVal: "2", type: "number" },
        { id: "med_lidocaine", name: "Lidocaine 20ml (注意開封起訖)", defaultVal: "2", type: "number" },
        { id: "med_norepi", name: "Norepinephrine (Levophed)", defaultVal: "3", type: "number" },
        { id: "med_heparin_elec", name: "Heparin電子點班單 (250u/1cc)", defaultVal: "checked", type: "checkbox" }
    ],
    devices: [
        { id: "dev_oximeter", name: "手指型血氧機", defaultVal: "2", type: "number" }
    ],
    instruments: [
        { id: "inst_scissors_curved", name: "彎式小尖剪", defaultVal: "2", type: "number" },
        { id: "inst_suture_kit", name: "縫合包", defaultVal: "3", type: "number" },
        { id: "inst_forceps_toothed", name: "有齒短鑷", defaultVal: "2", type: "number" },
        { id: "inst_scissors_suture", name: "線剪", defaultVal: "3", type: "number" },
        { id: "inst_forceps_mosquito", name: "蚊式止血鉗", defaultVal: "2", type: "number" },
        { id: "inst_needle_holder", name: "持針器", defaultVal: "1", type: "number" },
        { id: "inst_forceps_curved", name: "止血鉗 (彎)", defaultVal: "2", type: "number" },
        { id: "inst_forceps_straight", name: "止血鉗 (直)", defaultVal: "2", type: "number" },
        { id: "inst_dressing_jar", name: "敷料罐", defaultVal: "64", type: "number" },
        { id: "inst_scissors_bandage", name: "繃帶剪", defaultVal: "1", type: "number" },
        { id: "inst_o2_flow", name: "O2 流量表", defaultVal: "12", type: "number" },
        { id: "inst_suction", name: "中央抽吸系統", defaultVal: "2", type: "number" },
        { id: "inst_gown", name: "無菌隔離衣", defaultVal: "2", type: "number" },
        { id: "inst_check_expiry", name: "確認器械有效期限 (打勾)", defaultVal: "checked", type: "checkbox" },
        { id: "inst_fabric_expiry", name: "確認布品有效期限 (打勾)", defaultVal: "checked", type: "checkbox" }
    ]
};

// --- Mock Employee Database ---
const DEFAULT_EMPLOYEES = {};

// --- Cloud Database Configuration ---
// 請在此處貼上您的 Google Apps Script 部署網頁應用程式 URL (Web App URL)
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwdpsAHdtwiQA6ADy5uU-WQ69axP9OTdSIgsEsYQAGGryB7yw8JJv2WzRPCJpbv2POP/exec";

// Global State
let currentUserRole = "staff"; // "staff" or "admin"
let currentTheme = localStorage.getItem("theme") || "light";
let handoverLogs = JSON.parse(localStorage.getItem("handoverLogs")) || [];
let employeeDb = JSON.parse(localStorage.getItem("employeeDb")) || {};

// --- Cloud Syncing Logic ---
async function syncDataFromCloud() {
    if (!GAS_API_URL) {
        updateCloudStatus("inactive", "尚未設定雲端 URL");
        return;
    }

    updateCloudStatus("syncing", "雲端同步中...");

    try {
        const response = await fetch(`${GAS_API_URL}?action=getData`, {
            method: "GET",
            mode: "cors"
        });

        if (!response.ok) throw new Error("HTTP error " + response.status);

        const res = await response.json();
        if (res.status === "success") {
            // Update employees
            if (res.employees && Object.keys(res.employees).length > 0) {
                employeeDb = res.employees;
                localStorage.setItem("employeeDb", JSON.stringify(employeeDb));
                triggerAllLookups();
                if (elements.tbodyEmployees && elements.employeeModal.classList.contains("active")) {
                    renderEmployeeTable();
                }
            }

            // Update logs
            if (res.logs) {
                handoverLogs = res.logs;
                localStorage.setItem("handoverLogs", JSON.stringify(handoverLogs));
                // Reload current day's record
                const date = elements.dateInput.value;
                if (date) {
                    loadRecordForDate(date);
                }
                initHistoryTab(); // Refresh calendar & log list
            }

            // Update checklist items
            if (res.checklistItems && Object.keys(res.checklistItems).length > 0) {
                activeItems = res.checklistItems;
                localStorage.setItem("checklistItems", JSON.stringify(activeItems));
                renderAllChecklists();
                performCalculations();
                if (elements.itemsModal && elements.itemsModal.classList.contains("active")) {
                    renderConfigItemsList();
                }
            } else {
                // If cloud is empty, sync our local activeItems to cloud
                postToCloud({ action: "syncChecklistItems", checklistItems: activeItems });
            }

            // Update print footers
            if (res.printFooters && Object.keys(res.printFooters).length > 0) {
                printFooters = res.printFooters;
                localStorage.setItem("printFooters", JSON.stringify(printFooters));
            } else {
                // If cloud is empty, sync our local printFooters to cloud
                postToCloud({ action: "syncPrintFooters", printFooters: printFooters });
            }

            updateCloudStatus("success", "雲端已同步");
        } else {
            throw new Error(res.message || "Unknown error");
        }
    } catch (error) {
        console.error("Cloud sync failed:", error);
        updateCloudStatus("error", "同步失敗 (使用本地資料)");
    }
}

function updateCloudStatus(status, text) {
    const indicator = document.getElementById("cloud-sync-status");
    if (!indicator) return;

    indicator.className = `badge cloud-status-${status}`;

    let icon = "fa-cloud";
    if (status === "syncing") icon = "fa-spinner fa-spin";
    else if (status === "success") icon = "fa-cloud-arrow-up";
    else if (status === "error") icon = "fa-triangle-exclamation";
    else if (status === "inactive") icon = "fa-cloud-slash";

    indicator.innerHTML = `<i class="fa-solid ${icon}"></i> ${text}`;
}

async function postToCloud(payload, successMessage) {
    if (!GAS_API_URL) return true; // Treat as success if cloud is not configured

    try {
        // Use text/plain to avoid CORS preflight OPTIONS request that GAS doesn't support
        const response = await fetch(GAS_API_URL, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("HTTP error " + response.status);

        const res = await response.json();
        if (res.status === "success") {
            if (successMessage) {
                showToast(successMessage, "success");
            }
            return true;
        } else {
            throw new Error(res.message || "Cloud rejected write");
        }
    } catch (error) {
        console.error("Cloud post failed:", error);
        showToast("雲端同步失敗，資料已儲存至此裝置", "warning");
        return false;
    }
}

// Sync default employees from source code defaults to localStorage, preserving custom items added by user
let dbUpdated = false;
Object.keys(DEFAULT_EMPLOYEES).forEach(id => {
    const defaultEmp = DEFAULT_EMPLOYEES[id];
    const existingEmp = employeeDb[id];
    if (!existingEmp || existingEmp.name !== defaultEmp.name || existingEmp.role !== defaultEmp.role) {
        employeeDb[id] = { ...defaultEmp };
        dbUpdated = true;
    }
});

// Migrate employeeDb structure to support roles and titles if needed
Object.keys(employeeDb).forEach(id => {
    const val = employeeDb[id];
    let name = "";
    let role = "staff";
    let title = "護理師";
    let needsUpdate = false;

    if (typeof val === "string") {
        name = val;
        needsUpdate = true;
    } else if (val && typeof val === "object") {
        name = val.name || "";
        role = val.role || "staff";
        title = val.title || "";
    }

    if (!title) {
        if (name.includes("護理長")) {
            title = "護理長";
        } else if (name.includes("組長") || name.includes("組長")) {
            title = "護理組長";
        } else {
            title = "護理師";
        }
        needsUpdate = true;
    }

    // Determine role if not set or legacy check
    if (typeof val === "string" || !val.role) {
        role = (title === "護理長" || title === "護理組長") ? "admin" : "staff";
        needsUpdate = true;
    }

    if (needsUpdate) {
        employeeDb[id] = {
            name: name,
            role: role,
            title: title
        };
        dbUpdated = true;
    }
});
if (dbUpdated || !localStorage.getItem("employeeDb")) {
    localStorage.setItem("employeeDb", JSON.stringify(employeeDb));
}

// Active Checklist Items Schema - Sync defaults from source code defaults
let activeItems = JSON.parse(localStorage.getItem("checklistItems")) || {};
let itemsUpdated = false;
Object.keys(DEFAULT_ITEMS).forEach(cat => {
    if (!activeItems[cat]) {
        activeItems[cat] = [...DEFAULT_ITEMS[cat]];
        itemsUpdated = true;
    } else {
        DEFAULT_ITEMS[cat].forEach(defaultItem => {
            const existingItem = activeItems[cat].find(i => i.id === defaultItem.id);
            if (!existingItem) {
                activeItems[cat].push({ ...defaultItem });
                itemsUpdated = true;
            } else {
                if (existingItem.name !== defaultItem.name || existingItem.type !== defaultItem.type || existingItem.defaultVal !== defaultItem.defaultVal) {
                    existingItem.name = defaultItem.name;
                    existingItem.type = defaultItem.type;
                    existingItem.defaultVal = defaultItem.defaultVal;
                    itemsUpdated = true;
                }
            }
        });
    }
});

// Migrate/Update D/L Item Name if needed
if (activeItems.r1) {
    const dlItem = activeItems.r1.find(i => i.id === "r1_dl_expiry" || i.id === "r1_DL_expiry");
    if (dlItem && dlItem.name.includes("請於到期日7日前提出")) {
        dlItem.name = "確認D/L效期 (打勾)";
        itemsUpdated = true;
    }
}
if (itemsUpdated || !localStorage.getItem("checklistItems")) {
    localStorage.setItem("checklistItems", JSON.stringify(activeItems));
}

// Print Footers Setup
const DEFAULT_PRINT_FOOTERS = {
    sheet1: "備註：KELLY: 55支(A車2支+1R*34+2R*17)；乳膠枕:52顆(1R*35+2R*17)\n確認D/L是否皆在效期內，確認完畢，請於點班單內打〝 V〞(請於到期日7日前提出)",
    sheet2: "",
    sheet3: "確認器械/布品是否皆在效期內，確認完畢，請於點班單內打〝 V〞，(請於器械/布品到期前7日送消/洗)"
};
let printFooters = JSON.parse(localStorage.getItem("printFooters")) || {};
let footersUpdated = false;
Object.keys(DEFAULT_PRINT_FOOTERS).forEach(key => {
    if (printFooters[key] === undefined) {
        printFooters[key] = DEFAULT_PRINT_FOOTERS[key];
        footersUpdated = true;
    }
});
if (footersUpdated || !localStorage.getItem("printFooters")) {
    localStorage.setItem("printFooters", JSON.stringify(printFooters));
}

// DOM Elements
const elements = {
    themeToggle: document.getElementById("theme-toggle-btn"),
    printBtn: document.getElementById("print-report-btn"),
    submitBtn: document.getElementById("submit-handover-btn"),
    dateInput: document.getElementById("handover-date"),

    // View tabs
    tabBtns: document.querySelectorAll(".tab-btn"),
    tabPanes: document.querySelectorAll(".tab-pane"),

    // Tables
    tbodyR1: document.getElementById("tbody-r1"),
    tbodyR2: document.getElementById("tbody-r2"),
    tbodyMeds: document.getElementById("tbody-meds"),
    tbodyMedDevices: document.getElementById("tbody-med-devices"),
    tbodyInstruments: document.getElementById("tbody-instruments"),

    // Verification totals
    valKellyTotal: document.getElementById("val-kelly-total"),
    valPillowTotal: document.getElementById("val-pillow-total"),
    valR1Kelly: document.getElementById("val-r1-kelly"),
    valR2Kelly: document.getElementById("val-r2-kelly"),

    // History calendar & list
    calendarGrid: document.getElementById("calendar-grid-container"),
    calendarMonthTitle: document.getElementById("calendar-month-title"),
    monthSelect: document.getElementById("history-month-select"),
    logListContainer: document.getElementById("log-list-container"),

    // Detail Modal
    detailModal: document.getElementById("detail-modal"),
    modalTitle: document.getElementById("modal-title"),
    modalBody: document.getElementById("modal-body-content"),
    modalDeleteBtn: document.getElementById("modal-delete-btn"),
    modalPrintBtn: document.getElementById("modal-print-btn"),
    modalCloseBtn: document.getElementById("modal-close-btn"),
    modalCloseFooterBtn: document.getElementById("modal-close-footer-btn"),

    // Section specific checkers & notes
    nurseR1Id: document.getElementById("nurse-r1-id"),
    nurseR2Id: document.getElementById("nurse-r2-id"),
    nurseMedsId: document.getElementById("nurse-meds-id"),
    nurseDevicesId: document.getElementById("nurse-devices-id"),
    nurseInstId: document.getElementById("nurse-inst-id"),
    nurseSupervisorId: document.getElementById("nurse-supervisor-id"),

    nurseR1NameDisplay: document.getElementById("nurse-r1-name-display"),
    nurseR2NameDisplay: document.getElementById("nurse-r2-name-display"),
    nurseMedsNameDisplay: document.getElementById("nurse-meds-name-display"),
    nurseDevicesNameDisplay: document.getElementById("nurse-devices-name-display"),
    nurseInstNameDisplay: document.getElementById("nurse-inst-name-display"),
    nurseSupervisorNameDisplay: document.getElementById("nurse-supervisor-name-display"),

    sigR1Status: document.getElementById("sig-r1-status"),
    sigR2Status: document.getElementById("sig-r2-status"),
    sigMedsStatus: document.getElementById("sig-meds-status"),
    sigDevicesStatus: document.getElementById("sig-devices-status"),
    sigInstStatus: document.getElementById("sig-inst-status"),
    sigSupervisorStatus: document.getElementById("sig-supervisor-status"),

    notesR1: document.getElementById("notes-r1"),
    notesR2: document.getElementById("notes-r2"),
    notesMeds: document.getElementById("notes-meds"),
    notesDevices: document.getElementById("notes-devices"),
    notesInst: document.getElementById("notes-inst"),
    notesSupervisor: document.getElementById("notes-supervisor"),

    sigPanel: document.getElementById("shared-signature-panel"),

    // Role & Admin modal DOM elements
    roleBadge: document.getElementById("role-badge"),
    btnSwitchRole: document.getElementById("btn-switch-role"),
    adminAuthModal: document.getElementById("admin-auth-modal"),
    adminAuthCloseBtn: document.getElementById("admin-auth-close-btn"),
    adminPasswordInput: document.getElementById("admin-password-input"),
    adminAuthErrorMsg: document.getElementById("admin-auth-error-msg"),
    btnAdminAuthSubmit: document.getElementById("btn-admin-auth-submit"),
    btnAdminAuthCancel: document.getElementById("btn-admin-auth-cancel"),

    // Section submit buttons & check batch range inputs
    btnSubmitR1: document.getElementById("btn-submit-r1"),
    btnSubmitR2: document.getElementById("btn-submit-r2"),
    btnSubmitMeds: document.getElementById("btn-submit-meds"),
    btnSubmitDevices: document.getElementById("btn-submit-devices"),
    btnSubmitInst: document.getElementById("btn-submit-inst"),
    btnSubmitSupervisor: document.getElementById("btn-submit-supervisor"),
    chkBatchAudit: document.getElementById("chk-batch-audit"),
    batchDateContainer: document.getElementById("batch-date-container"),
    batchStartDate: document.getElementById("batch-start-date"),
    batchEndDate: document.getElementById("batch-end-date"),

    // Employee Modal
    employeeModal: document.getElementById("employee-modal"),
    employeeModalCloseBtn: document.getElementById("employee-modal-close-btn"),
    employeeModalCloseFooterBtn: document.getElementById("employee-modal-close-footer-btn"),
    btnManageEmployeesTrigger: document.getElementById("btn-manage-employees-trigger"),
    newEmpId: document.getElementById("new-emp-id"),
    newEmpName: document.getElementById("new-emp-name"),
    btnAddEmployee: document.getElementById("btn-add-employee"),
    tbodyEmployees: document.getElementById("tbody-employees"),
    empFileImport: document.getElementById("emp-file-import"),

    // Items Modal
    itemsModal: document.getElementById("items-modal"),
    itemsModalCloseBtn: document.getElementById("items-modal-close-btn"),
    itemsModalCloseFooterBtn: document.getElementById("items-modal-close-footer-btn"),
    btnManageItemsTrigger: document.getElementById("btn-manage-items-trigger"),
    itemCatSelect: document.getElementById("item-cat-select"),
    newItemName: document.getElementById("new-item-name"),
    newItemDefault: document.getElementById("new-item-default"),
    newItemType: document.getElementById("new-item-type"),
    btnAddChecklistItem: document.getElementById("btn-add-checklist-item"),
    tbodyChecklistItems: document.getElementById("tbody-checklist-items")
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initDateTime();
    renderAllChecklists();
    initTabNavigation();
    initEmployeeIdLookup();
    initHistoryTab();
    bindEvents();
    performCalculations();
    updateUiForRole();

    // Fetch latest data from Google Sheets cloud
    syncDataFromCloud();
});

// --- Theme Management ---
function initTheme() {
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = elements.themeToggle.querySelector("i");
    if (currentTheme === "dark") {
        icon.className = "fa-solid fa-sun";
    } else {
        icon.className = "fa-solid fa-moon";
    }
}

function toggleTheme() {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    localStorage.setItem("theme", currentTheme);
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeIcon();
}

// --- Date setup ---
function initDateTime() {
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - tzoffset)).toISOString().slice(0, 10);
    elements.dateInput.value = localISOTime;
    elements.monthSelect.value = localISOTime.slice(0, 7);
    loadRecordForDate(localISOTime);
}

function loadRecordForDate(date) {
    const log = handoverLogs.find(l => l.date === date);
    if (log) {
        // Load records
        const categories = ["r1", "r2", "meds", "devices", "instruments"];
        categories.forEach(cat => {
            if (!activeItems[cat]) return;
            activeItems[cat].forEach(item => {
                const inputEl = document.getElementById(`input-${item.id}`);
                if (!inputEl) return;

                const savedVal = log.records[item.id];
                if (savedVal !== undefined) {
                    if (item.type === "checkbox") {
                        inputEl.checked = savedVal === "已確認";
                    } else {
                        inputEl.value = savedVal;
                    }
                } else {
                    if (item.type === "checkbox") {
                        inputEl.checked = item.defaultVal === "checked";
                    } else {
                        inputEl.value = item.defaultVal;
                    }
                }
            });
        });

        // Load checkers
        if (elements.nurseR1Id) elements.nurseR1Id.value = log.r1NurseId || "";
        if (elements.nurseR2Id) elements.nurseR2Id.value = log.r2NurseId || "";
        if (elements.nurseMedsId) elements.nurseMedsId.value = log.medsNurseId || "";
        if (elements.nurseDevicesId) elements.nurseDevicesId.value = log.devicesNurseId || "";
        if (elements.nurseInstId) elements.nurseInstId.value = log.instNurseId || "";
        if (elements.nurseSupervisorId) elements.nurseSupervisorId.value = log.supervisorNurseId || "";

        // Load notes
        if (elements.notesR1) elements.notesR1.value = log.notesR1 || "";
        if (elements.notesR2) elements.notesR2.value = log.notesR2 || "";
        if (elements.notesMeds) elements.notesMeds.value = log.notesMeds || "";
        if (elements.notesDevices) elements.notesDevices.value = log.notesDevices || "";
        if (elements.notesInst) elements.notesInst.value = log.notesInst || "";
        if (elements.notesSupervisor) elements.notesSupervisor.value = log.notesSupervisor || "";
    } else {
        // Reset to defaults
        const categories = ["r1", "r2", "meds", "devices", "instruments"];
        categories.forEach(cat => {
            if (!activeItems[cat]) return;
            activeItems[cat].forEach(item => {
                const inputEl = document.getElementById(`input-${item.id}`);
                if (!inputEl) return;

                if (item.type === "checkbox") {
                    inputEl.checked = item.defaultVal === "checked";
                } else {
                    inputEl.value = item.defaultVal;
                }
            });
        });

        // Clear checkers
        if (elements.nurseR1Id) elements.nurseR1Id.value = "";
        if (elements.nurseR2Id) elements.nurseR2Id.value = "";
        if (elements.nurseMedsId) elements.nurseMedsId.value = "";
        if (elements.nurseDevicesId) elements.nurseDevicesId.value = "";
        if (elements.nurseInstId) elements.nurseInstId.value = "";
        if (elements.nurseSupervisorId) elements.nurseSupervisorId.value = "";

        // Clear notes
        if (elements.notesR1) elements.notesR1.value = "";
        if (elements.notesR2) elements.notesR2.value = "";
        if (elements.notesMeds) elements.notesMeds.value = "";
        if (elements.notesDevices) elements.notesDevices.value = "";
        if (elements.notesInst) elements.notesInst.value = "";
        if (elements.notesSupervisor) elements.notesSupervisor.value = "";
    }

    // Trigger employee lookup displays and validation states
    triggerAllLookups();
    performCalculations();
}

// --- Tab Navigation ---
function initTabNavigation() {
    elements.tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            elements.tabBtns.forEach(b => b.classList.remove("active"));
            elements.tabPanes.forEach(pane => pane.classList.remove("active"));

            btn.classList.add("active");
            const targetPane = document.getElementById(btn.getAttribute("data-target"));
            targetPane.classList.add("active");

            // Re-evaluate UI displays including the supervisor panel based on the newly selected tab
            updateUiForRole();
        });
    });
}

// --- Render Checklists ---
function renderAllChecklists() {
    renderTableRows(activeItems.r1, elements.tbodyR1);
    renderTableRows(activeItems.r2, elements.tbodyR2);
    renderTableRows(activeItems.meds, elements.tbodyMeds);
    renderTableRows(activeItems.devices, elements.tbodyMedDevices);
    renderTableRows(activeItems.instruments, elements.tbodyInstruments);
}

function renderTableRows(items, tbody) {
    tbody.innerHTML = "";
    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:20px;">無點班品項，請點選「設定點班品項」新增！</td></tr>`;
        return;
    }

    items.forEach(item => {
        const tr = document.createElement("tr");
        tr.id = `row-${item.id}`;

        const tdName = document.createElement("td");
        tdName.style.fontWeight = "500";
        if (item.id === "r1_DL_expiry" || item.id === "r1_dl_expiry") {
            let cleanName = item.name.replace(/\s*\(請於到期日7日前提出\)/g, "").trim();
            tdName.innerHTML = `${cleanName}<div class="item-note" style="font-size: 0.82rem; color: var(--text-muted); font-weight: normal; margin-top: 4px; line-height: 1.3;"><i class="fa-solid fa-circle-info" style="font-size: 0.78rem; margin-right: 4px; color: var(--secondary);"></i>(請於到期日7日前提出)</div>`;
        } else {
            tdName.innerHTML = item.name;
        }
        tr.appendChild(tdName);

        const tdDefault = document.createElement("td");
        if (item.type === "checkbox") {
            tdDefault.innerHTML = `<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success);"><i class="fa-solid fa-check-double"></i> 應確認</span>`;
        } else {
            tdDefault.innerHTML = `<span style="font-weight:600; color: var(--text-muted);">${item.defaultVal}</span>`;
        }
        tr.appendChild(tdDefault);

        const tdActual = document.createElement("td");
        if (item.type === "number") {
            tdActual.innerHTML = `<input type="number" id="input-${item.id}" class="num-input" value="${item.defaultVal}" min="0" oninput="performCalculations()">`;
        } else if (item.type === "checkbox") {
            tdActual.innerHTML = `<input type="checkbox" id="input-${item.id}" class="checkbox-custom" checked onchange="performCalculations()">`;
        } else {
            tdActual.innerHTML = `<input type="text" id="input-${item.id}" style="width: 120px; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--input-bg); color: var(--text-main);" value="${item.defaultVal}" oninput="performCalculations()">`;
        }
        tr.appendChild(tdActual);

        const tdStatus = document.createElement("td");
        tdStatus.id = `status-${item.id}`;
        tdStatus.innerHTML = `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> 符合</span>`;
        tr.appendChild(tdStatus);

        tbody.appendChild(tr);
    });
}

// --- Live Validation & Calculations ---
function performCalculations() {
    let hasMismatches = false;

    // Safety calculations looping through all categories
    const categories = ["r1", "r2", "meds", "devices", "instruments"];
    categories.forEach(cat => {
        if (!activeItems[cat]) return;
        activeItems[cat].forEach(item => {
            const inputEl = document.getElementById(`input-${item.id}`);
            if (!inputEl) return;

            if (item.type === "number") {
                validateItem(item.id, getVal(`input-${item.id}`), parseInt(item.defaultVal) || 0);
            } else if (item.type === "checkbox") {
                validateCheckboxItem(item.id);
            } else {
                validateTextItem(item.id, item.defaultVal);
            }
        });
    });

    // Special validation totals (Kelly & Pillow) - check if default items exist
    let r1Kelly = activeItems.r1.find(i => i.id === "r1_kelly") ? getVal("input-r1_kelly") : 0;
    let r1KellyA = activeItems.r1.find(i => i.id === "r1_kelly_a") ? getVal("input-r1_kelly_a") : 0;
    let r2Kelly = activeItems.r2.find(i => i.id === "r2_kelly") ? getVal("input-r2_kelly") : 0;
    let totalKelly = r1Kelly + r1KellyA + r2Kelly;

    let r1Pillow = activeItems.r1.find(i => i.id === "r1_pillow") ? getVal("input-r1_pillow") : 0;
    let r2Pillow = activeItems.r2.find(i => i.id === "r2_pillow") ? getVal("input-r2_pillow") : 0;
    let totalPillow = r1Pillow + r2Pillow;

    if (elements.valKellyTotal) {
        elements.valKellyTotal.innerText = `${totalKelly} / 55 支`;
        if (totalKelly !== 55) {
            elements.valKellyTotal.className = "stat-val error";
            hasMismatches = true;
        } else {
            elements.valKellyTotal.className = "stat-val";
        }
    }

    if (elements.valPillowTotal) {
        elements.valPillowTotal.innerText = `${totalPillow} / 52 顆`;
        if (totalPillow !== 52) {
            elements.valPillowTotal.className = "stat-val error";
            hasMismatches = true;
        } else {
            elements.valPillowTotal.className = "stat-val";
        }
    }

    if (elements.valR1Kelly) {
        elements.valR1Kelly.innerText = `${r1Kelly + r1KellyA} / 36`;
        if ((r1Kelly + r1KellyA) !== 36) elements.valR1Kelly.className = "stat-val error";
        else elements.valR1Kelly.className = "stat-val";
    }

    if (elements.valR2Kelly) {
        elements.valR2Kelly.innerText = `${r2Kelly} / 17 (現場18)`;
        if (r2Kelly !== 18 && r2Kelly !== 17) elements.valR2Kelly.className = "stat-val error";
        else elements.valR2Kelly.className = "stat-val";
    }

    const rowsWithWarnings = document.querySelectorAll(".row-warning");
    return rowsWithWarnings.length > 0;
}

function getVal(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    return parseInt(el.value) || 0;
}

function validateItem(id, actual, expected) {
    const row = document.getElementById(`row-${id}`);
    const statusCell = document.getElementById(`status-${id}`);
    if (!row || !statusCell) return;

    if (actual !== expected) {
        row.classList.add("row-warning");
        statusCell.innerHTML = `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> 不符 (${actual - expected > 0 ? '+' : ''}${actual - expected})</span>`;
    } else {
        row.classList.remove("row-warning");
        statusCell.innerHTML = `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> 符合</span>`;
    }
}

function validateTextItem(id, expectedText) {
    const row = document.getElementById(`row-${id}`);
    const statusCell = document.getElementById(`status-${id}`);
    const input = document.getElementById(`input-${id}`);
    if (!row || !statusCell || !input) return;

    const actualText = input.value.trim();
    if (actualText !== expectedText) {
        row.classList.add("row-warning");
        statusCell.innerHTML = `<span class="badge badge-warning"><i class="fa-solid fa-pen"></i> 已變更</span>`;
    } else {
        row.classList.remove("row-warning");
        statusCell.innerHTML = `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> 符合</span>`;
    }
}

function validateCheckboxItem(id) {
    const row = document.getElementById(`row-${id}`);
    const statusCell = document.getElementById(`status-${id}`);
    const input = document.getElementById(`input-${id}`);
    if (!row || !statusCell || !input) return;

    const isChecked = input.checked;
    if (!isChecked) {
        row.classList.add("row-warning");
        statusCell.innerHTML = `<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> 未確認</span>`;
    } else {
        row.classList.remove("row-warning");
        statusCell.innerHTML = `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> 已確認</span>`;
    }
}

// --- Employee ID Lookup ---
function initEmployeeIdLookup() {
    if (elements.nurseR1Id) {
        elements.nurseR1Id.addEventListener("input", () => {
            lookupEmployee(elements.nurseR1Id.value, elements.nurseR1NameDisplay, elements.sigR1Status);
        });
    }
    if (elements.nurseR2Id) {
        elements.nurseR2Id.addEventListener("input", () => {
            lookupEmployee(elements.nurseR2Id.value, elements.nurseR2NameDisplay, elements.sigR2Status);
        });
    }
    if (elements.nurseMedsId) {
        elements.nurseMedsId.addEventListener("input", () => {
            lookupEmployee(elements.nurseMedsId.value, elements.nurseMedsNameDisplay, elements.sigMedsStatus);
        });
    }
    if (elements.nurseDevicesId) {
        elements.nurseDevicesId.addEventListener("input", () => {
            lookupEmployee(elements.nurseDevicesId.value, elements.nurseDevicesNameDisplay, elements.sigDevicesStatus);
        });
    }
    if (elements.nurseInstId) {
        elements.nurseInstId.addEventListener("input", () => {
            lookupEmployee(elements.nurseInstId.value, elements.nurseInstNameDisplay, elements.sigInstStatus);
        });
    }
    if (elements.nurseSupervisorId) {
        elements.nurseSupervisorId.addEventListener("input", () => {
            lookupEmployee(elements.nurseSupervisorId.value, elements.nurseSupervisorNameDisplay, elements.sigSupervisorStatus);
        });
    }
}

function lookupEmployee(idVal, nameDisplay, statusBadge) {
    if (!nameDisplay || !statusBadge) return;
    const cleanId = idVal.trim();
    const isSupervisor = statusBadge.id === "sig-supervisor-status";

    if (cleanId === "") {
        nameDisplay.innerText = "—";
        statusBadge.className = "badge badge-danger";
        statusBadge.innerHTML = isSupervisor ? `<i class="fa-solid fa-circle-xmark"></i> 未核簽` : `<i class="fa-solid fa-circle-xmark"></i> 未驗證`;
        return;
    }

    const emp = employeeDb[cleanId];
    if (emp) {
        if (isSupervisor && emp.role !== "admin" && emp.title !== "護理長" && emp.title !== "護理組長") {
            nameDisplay.innerText = emp.name + " (無主管權限)";
            statusBadge.className = "badge badge-warning";
            statusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> 權限不足`;
            return;
        }
        nameDisplay.innerText = emp.name;
        statusBadge.className = "badge badge-success";
        statusBadge.innerHTML = isSupervisor ? `<i class="fa-solid fa-circle-check"></i> 已核簽` : `<i class="fa-solid fa-circle-check"></i> 已驗證`;
    } else {
        nameDisplay.innerText = "找不到該員工";
        statusBadge.className = "badge badge-warning";
        statusBadge.innerHTML = `<i class="fa-solid fa-question"></i> 未註冊`;
    }
}

function checkSectionMismatch(cat) {
    let mismatch = false;
    if (!activeItems[cat]) return false;
    activeItems[cat].forEach(item => {
        const inputEl = document.getElementById(`input-${item.id}`);
        if (!inputEl) return;
        if (item.type === "number") {
            const act = parseInt(inputEl.value) || 0;
            const def = parseInt(item.defaultVal) || 0;
            if (act !== def) mismatch = true;
        } else if (item.type === "checkbox") {
            if (!inputEl.checked) mismatch = true;
        } else {
            if (inputEl.value.trim() !== item.defaultVal) mismatch = true;
        }
    });
    return mismatch;
}

// --- Role Management ---
function updateUiForRole() {
    const activeTabBtn = document.querySelector(".tab-btn.active");
    const isHistoryTab = activeTabBtn ? activeTabBtn.getAttribute("data-target") === "pane-history" : false;

    if (currentUserRole === "admin") {
        // Admin Role
        elements.roleBadge.className = "badge role-admin";
        elements.roleBadge.innerHTML = `<i class="fa-solid fa-user-shield"></i> 管理人員`;
        elements.btnSwitchRole.innerHTML = `<i class="fa-solid fa-lock"></i> 登出管理員`;
        elements.btnSwitchRole.title = "登出管理權限";

        if (elements.btnManageItemsTrigger) elements.btnManageItemsTrigger.style.display = "inline-flex";
        if (elements.btnManageEmployeesTrigger) elements.btnManageEmployeesTrigger.style.display = "inline-flex";
        if (elements.modalDeleteBtn) elements.modalDeleteBtn.style.display = "inline-flex";

        // Show supervisor audit block only for Admin, and hide it on the history tab
        if (elements.sigPanel) {
            elements.sigPanel.style.display = isHistoryTab ? "none" : "block";
        }
    } else {
        // Staff Role
        elements.roleBadge.className = "badge";
        elements.roleBadge.style.background = "rgba(14, 165, 233, 0.1)";
        elements.roleBadge.style.color = "var(--secondary)";
        elements.roleBadge.innerHTML = `<i class="fa-solid fa-user-nurse"></i> 一般人員`;
        elements.btnSwitchRole.innerHTML = `<i class="fa-solid fa-key"></i> 切換身分`;
        elements.btnSwitchRole.title = "切換管理人員身分";

        if (elements.btnManageItemsTrigger) elements.btnManageItemsTrigger.style.display = "none";
        if (elements.btnManageEmployeesTrigger) elements.btnManageEmployeesTrigger.style.display = "none";
        if (elements.modalDeleteBtn) elements.modalDeleteBtn.style.display = "none";

        // Hide supervisor audit block completely for non-admin users
        if (elements.sigPanel) {
            elements.sigPanel.style.display = "none";
        }
    }
}

function openAdminAuthModal() {
    if (currentUserRole === "admin") {
        currentUserRole = "staff";
        updateUiForRole();
        showToast("已登出管理人員權限", "info");
        return;
    }
    elements.adminPasswordInput.value = "";
    elements.adminAuthErrorMsg.style.display = "none";
    elements.adminAuthModal.classList.add("active");
    elements.adminPasswordInput.focus();
}

function closeAdminAuthModal() {
    elements.adminAuthModal.classList.remove("active");
}

function handleAdminAuthSubmit() {
    const pw = elements.adminPasswordInput.value.trim();
    if (pw === "admin" || pw === "8888") {
        currentUserRole = "admin";
        updateUiForRole();
        closeAdminAuthModal();
        showToast("管理人員身分驗證成功！", "success");
    } else {
        elements.adminAuthErrorMsg.innerText = "密碼錯誤，請重新輸入！";
        elements.adminAuthErrorMsg.style.display = "block";
        elements.adminPasswordInput.select();
    }
}

// --- Save Handover Log (By Specific Check Section) ---
function saveSectionData(category) {
    const date = elements.dateInput.value;
    if (!date) {
        showToast("請選擇日期！", "warning");
        return;
    }

    let nurseId = "";
    let nurseName = "";
    let notes = "";
    let title = "";

    if (category === "r1") {
        nurseId = elements.nurseR1Id.value.trim();
        nurseName = employeeDb[nurseId] ? employeeDb[nurseId].name : "";
        notes = elements.notesR1.value.trim();
        title = "第一洗腎室";
    } else if (category === "r2") {
        nurseId = elements.nurseR2Id.value.trim();
        nurseName = employeeDb[nurseId] ? employeeDb[nurseId].name : "";
        notes = elements.notesR2.value.trim();
        title = "第二洗腎室";
    } else if (category === "meds") {
        nurseId = elements.nurseMedsId.value.trim();
        nurseName = employeeDb[nurseId] ? employeeDb[nurseId].name : "";
        notes = elements.notesMeds.value.trim();
        title = "常備藥品";
    } else if (category === "devices") {
        nurseId = elements.nurseDevicesId.value.trim();
        nurseName = employeeDb[nurseId] ? employeeDb[nurseId].name : "";
        notes = elements.notesDevices.value.trim();
        title = "儀器設備";
    } else if (category === "instruments") {
        nurseId = elements.nurseInstId.value.trim();
        nurseName = employeeDb[nurseId] ? employeeDb[nurseId].name : "";
        notes = elements.notesInst.value.trim();
        title = "器械與隔離衣";
    }

    if (!nurseId) {
        showToast(`請輸入${title}點班人員工號！`, "warning");
        return;
    }
    if (!nurseName) {
        showToast(`${title}點班人員工號未驗證！`, "warning");
        return;
    }

    if (checkSectionMismatch(category) && !notes) {
        showToast(`${title}清點數量不符，請於備註欄填寫「異常說明或點班數量不符合說明」！`, "warning");
        if (category === "r1") elements.notesR1.focus();
        else if (category === "r2") elements.notesR2.focus();
        else if (category === "meds") elements.notesMeds.focus();
        else if (category === "devices") elements.notesDevices.focus();
        else if (category === "instruments") elements.notesInst.focus();
        return;
    }

    let logIdx = handoverLogs.findIndex(l => l.date === date);
    let log;

    if (logIdx !== -1) {
        log = JSON.parse(JSON.stringify(handoverLogs[logIdx]));
    } else {
        const initialRecords = {};
        const categories = ["r1", "r2", "meds", "devices", "instruments"];
        categories.forEach(cat => {
            activeItems[cat].forEach(item => {
                initialRecords[item.id] = item.type === "checkbox" ? (item.defaultVal === "checked" ? "已確認" : "未確認") : item.defaultVal;
            });
        });

        log = {
            id: "log_" + Date.now(),
            date: date,
            r1NurseId: "",
            r1NurseName: "",
            r2NurseId: "",
            r2NurseName: "",
            medsNurseId: "",
            medsNurseName: "",
            devicesNurseId: "",
            devicesNurseName: "",
            instNurseId: "",
            instNurseName: "",
            supervisorNurseId: "",
            supervisorNurseName: "",
            notesR1: "",
            notesR2: "",
            notesMeds: "",
            notesDevices: "",
            notesInst: "",
            notesSupervisor: "",
            hasDiscrepancy: false,
            records: initialRecords,
            timestamp: new Date().toLocaleString()
        };
    }

    activeItems[category].forEach(item => {
        const inputEl = document.getElementById(`input-${item.id}`);
        if (inputEl) {
            if (item.type === "checkbox") {
                log.records[item.id] = inputEl.checked ? "已確認" : "未確認";
            } else {
                log.records[item.id] = inputEl.value;
            }
        }
    });

    if (category === "r1") {
        log.r1NurseId = nurseId;
        log.r1NurseName = nurseName;
        log.notesR1 = notes;
    } else if (category === "r2") {
        log.r2NurseId = nurseId;
        log.r2NurseName = nurseName;
        log.notesR2 = notes;
    } else if (category === "meds") {
        log.medsNurseId = nurseId;
        log.medsNurseName = nurseName;
        log.notesMeds = notes;
    } else if (category === "devices") {
        log.devicesNurseId = nurseId;
        log.devicesNurseName = nurseName;
        log.notesDevices = notes;
    } else if (category === "instruments") {
        log.instNurseId = nurseId;
        log.instNurseName = nurseName;
        log.notesInst = notes;
    }

    let hasDiscrepancy = false;
    const allCats = ["r1", "r2", "meds", "devices", "instruments"];
    allCats.forEach(c => {
        activeItems[c].forEach(item => {
            const savedVal = log.records[item.id];
            if (item.type === "number") {
                const act = parseInt(savedVal) || 0;
                const def = parseInt(item.defaultVal) || 0;
                if (act !== def) hasDiscrepancy = true;
            } else if (item.type === "checkbox") {
                if (savedVal === "未確認") hasDiscrepancy = true;
            } else {
                if (savedVal !== item.defaultVal) hasDiscrepancy = true;
            }
        });
    });
    log.hasDiscrepancy = hasDiscrepancy;
    log.timestamp = new Date().toLocaleString();

    if (logIdx !== -1) {
        handoverLogs[logIdx] = log;
    } else {
        handoverLogs.push(log);
    }

    localStorage.setItem("handoverLogs", JSON.stringify(handoverLogs));
    showToast(`${title}點班提交成功！`, "success");

    // Sync to Cloud
    postToCloud({ action: "saveLog", log: log });

    renderHistoryCalendar();
    renderHistoryList();
    loadRecordForDate(date);
}

function handleSupervisorSubmit() {
    const supervisorId = elements.nurseSupervisorId.value.trim();
    const emp = employeeDb[supervisorId];
    const supervisorName = emp ? emp.name : "";
    const notesSupervisor = elements.notesSupervisor.value.trim();

    if (!supervisorId) {
        showToast("請輸入單位主管工號！", "warning");
        return;
    }
    if (!emp) {
        showToast("單位主管工號未驗證！", "warning");
        return;
    }
    if (emp.role !== "admin" && emp.title !== "護理長" && emp.title !== "護理組長") {
        showToast("此工號人員無主管權限，無法進行主管核簽！", "warning");
        return;
    }

    const now = new Date();
    const rocYear = now.getFullYear() - 1911;
    const rocDateStr = `${rocYear}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

    if (elements.chkBatchAudit.checked) {
        // Batch Audit Range
        const startStr = elements.batchStartDate.value;
        const endStr = elements.batchEndDate.value;

        if (!startStr || !endStr) {
            showToast("請選擇批次查核的開始與結束日期！", "warning");
            return;
        }
        if (startStr > endStr) {
            showToast("開始日期不能晚於結束日期！", "warning");
            return;
        }

        const start = new Date(startStr);
        const end = new Date(endStr);
        let count = 0;
        const updatedLogs = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0, 10);
            let logIdx = handoverLogs.findIndex(l => l.date === dateStr);
            let log;

            if (logIdx !== -1) {
                log = JSON.parse(JSON.stringify(handoverLogs[logIdx]));
                log.supervisorNurseId = supervisorId;
                log.supervisorNurseName = supervisorName;
                log.notesSupervisor = notesSupervisor;
                log.supervisorAuditDate = rocDateStr;
                log.timestamp = new Date().toLocaleString();
                handoverLogs[logIdx] = log;
            } else {
                const initialRecords = {};
                const categories = ["r1", "r2", "meds", "devices", "instruments"];
                categories.forEach(cat => {
                    activeItems[cat].forEach(item => {
                        initialRecords[item.id] = item.type === "checkbox" ? (item.defaultVal === "checked" ? "已確認" : "未確認") : item.defaultVal;
                    });
                });

                log = {
                    id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
                    date: dateStr,
                    r1NurseId: "", r1NurseName: "",
                    r2NurseId: "", r2NurseName: "",
                    medsNurseId: "", medsNurseName: "",
                    devicesNurseId: "", devicesNurseName: "",
                    instNurseId: "", instNurseName: "",
                    supervisorNurseId: supervisorId,
                    supervisorNurseName: supervisorName,
                    notesR1: "", notesR2: "", notesMeds: "", notesDevices: "", notesInst: "",
                    notesSupervisor: notesSupervisor,
                    supervisorAuditDate: rocDateStr,
                    hasDiscrepancy: false,
                    records: initialRecords,
                    timestamp: new Date().toLocaleString()
                };
                handoverLogs.push(log);
            }
            updatedLogs.push(log);
            count++;
        }

        localStorage.setItem("handoverLogs", JSON.stringify(handoverLogs));
        showToast(`成功批次核簽 ${count} 日之點班單！`, "success");

        // Sync batch to Cloud
        if (updatedLogs.length > 0) {
            postToCloud({ action: "saveLogs", logs: updatedLogs });
        }
    } else {
        // Single Day Audit
        const date = elements.dateInput.value;
        if (!date) {
            showToast("請選擇日期！", "warning");
            return;
        }

        let logIdx = handoverLogs.findIndex(l => l.date === date);
        let log;

        if (logIdx !== -1) {
            log = JSON.parse(JSON.stringify(handoverLogs[logIdx]));
            log.supervisorNurseId = supervisorId;
            log.supervisorNurseName = supervisorName;
            log.notesSupervisor = notesSupervisor;
            log.supervisorAuditDate = rocDateStr;
            log.timestamp = new Date().toLocaleString();
            handoverLogs[logIdx] = log;
        } else {
            const initialRecords = {};
            const categories = ["r1", "r2", "meds", "devices", "instruments"];
            categories.forEach(cat => {
                activeItems[cat].forEach(item => {
                    initialRecords[item.id] = item.type === "checkbox" ? (item.defaultVal === "checked" ? "已確認" : "未確認") : item.defaultVal;
                });
            });

            log = {
                id: "log_" + Date.now(),
                date: date,
                r1NurseId: "", r1NurseName: "",
                r2NurseId: "", r2NurseName: "",
                medsNurseId: "", medsNurseName: "",
                devicesNurseId: "", devicesNurseName: "",
                instNurseId: "", instNurseName: "",
                supervisorNurseId: supervisorId,
                supervisorNurseName: supervisorName,
                notesR1: "", notesR2: "", notesMeds: "", notesDevices: "", notesInst: "",
                notesSupervisor: notesSupervisor,
                supervisorAuditDate: rocDateStr,
                hasDiscrepancy: false,
                records: initialRecords,
                timestamp: new Date().toLocaleString()
            };
            handoverLogs.push(log);
        }

        localStorage.setItem("handoverLogs", JSON.stringify(handoverLogs));
        showToast("主管查核此日核簽成功！", "success");

        // Sync to Cloud
        postToCloud({ action: "saveLog", log: log });
    }

    renderHistoryCalendar();
    renderHistoryList();
    if (elements.dateInput) {
        loadRecordForDate(elements.dateInput.value);
    }
}

// --- History Views ---
function initHistoryTab() {
    renderHistoryCalendar();
    renderHistoryList();

    elements.monthSelect.addEventListener("change", () => {
        renderHistoryCalendar();
        renderHistoryList();
    });
}

function renderHistoryCalendar() {
    const selectedMonthStr = elements.monthSelect.value;
    if (!selectedMonthStr) return;

    const [year, month] = selectedMonthStr.split("-").map(Number);
    elements.calendarMonthTitle.innerText = `${year}年 ${month}月 點班曆`;

    elements.calendarGrid.innerHTML = "";

    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    weekdays.forEach(day => {
        const header = document.createElement("div");
        header.className = "calendar-day-header";
        header.innerText = day;
        elements.calendarGrid.appendChild(header);
    });

    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        elements.calendarGrid.appendChild(empty);
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const cell = document.createElement("div");
        cell.className = "calendar-cell active-day";
        if (cellDate === todayStr) cell.classList.add("today");

        const dayNum = document.createElement("span");
        dayNum.className = "day-num";
        dayNum.innerText = day;
        cell.appendChild(dayNum);

        const dayLogs = handoverLogs.filter(log => log.date === cellDate);
        const dotsContainer = document.createElement("div");
        dotsContainer.className = "shift-status-container";

        dayLogs.forEach(log => {
            const dot = document.createElement("span");
            dot.className = log.hasDiscrepancy ? "dot dot-error" : "dot dot-day";

            // Format mouseover text showing checkers for each of the 5 roles
            const checkers = [];
            if (log.r1NurseName) checkers.push(`第一室: ${log.r1NurseName.split(' ')[0]}`);
            if (log.r2NurseName) checkers.push(`第二室: ${log.r2NurseName.split(' ')[0]}`);
            if (log.medsNurseName) checkers.push(`常備藥: ${log.medsNurseName.split(' ')[0]}`);
            if (log.devicesNurseName) checkers.push(`血氧機: ${log.devicesNurseName.split(' ')[0]}`);
            if (log.instNurseName) checkers.push(`器械: ${log.instNurseName.split(' ')[0]}`);
            const checkersStr = checkers.length > 0 ? checkers.join('\n- ') : '無點班人員';

            dot.title = `點班員:\n- ${checkersStr}\n${log.hasDiscrepancy ? '(申報異常)' : '(符合預設)'}`;
            dotsContainer.appendChild(dot);
        });

        cell.appendChild(dotsContainer);

        cell.addEventListener("click", () => {
            if (dayLogs.length > 0) {
                openRecordDetails(dayLogs[0]);
            } else {
                elements.dateInput.value = cellDate;
                showToast(`已自動選擇日期：${cellDate}，您可以開始填寫此日點班單。`, "info");
                elements.tabBtns[0].click();
            }
        });

        elements.calendarGrid.appendChild(cell);
    }
}

function renderHistoryList() {
    const selectedMonthStr = elements.monthSelect.value;
    elements.logListContainer.innerHTML = "";

    const filteredLogs = handoverLogs
        .filter(log => log.date.startsWith(selectedMonthStr))
        .sort((a, b) => b.date.localeCompare(a.date));

    if (filteredLogs.length === 0) {
        elements.logListContainer.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.95rem;">本月尚無點班交接紀錄。</div>`;
        return;
    }

    filteredLogs.forEach(log => {
        const item = document.createElement("div");
        item.className = "log-item";

        const iconColorClass = log.hasDiscrepancy ? "text-danger" : "text-success";
        const statusBadge = log.hasDiscrepancy
            ? `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> 異常申報</span>`
            : `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> 正常無誤</span>`;

        // Build checker list
        const checkers = [];
        if (log.r1NurseName) checkers.push(`1R: ${log.r1NurseName.split(' ')[0]}`);
        if (log.r2NurseName) checkers.push(`2R: ${log.r2NurseName.split(' ')[0]}`);
        if (log.medsNurseName) checkers.push(`藥: ${log.medsNurseName.split(' ')[0]}`);
        if (log.devicesNurseName) checkers.push(`氧: ${log.devicesNurseName.split(' ')[0]}`);
        if (log.instNurseName) checkers.push(`器: ${log.instNurseName.split(' ')[0]}`);
        const checkersStr = checkers.join(' | ');

        // Notes summary
        const notes = [];
        if (log.notesR1) notes.push(`1R: ${log.notesR1}`);
        if (log.notesR2) notes.push(`2R: ${log.notesR2}`);
        if (log.notesMeds) notes.push(`藥: ${log.notesMeds}`);
        if (log.notesDevices) notes.push(`氧: ${log.notesDevices}`);
        if (log.notesInst) notes.push(`器: ${log.notesInst}`);
        if (log.notesSupervisor) notes.push(`主管: ${log.notesSupervisor}`);
        const notesStr = notes.join('; ');

        item.innerHTML = `
            <div class="log-info">
                <h4 style="display:flex; align-items:center; gap:8px;">
                    <i class="fa-solid fa-file-medical ${iconColorClass}"></i> 
                    ${log.date} 點班明細
                </h4>
                <p style="margin-top: 4px; line-height: 1.4;">
                    <span>點班人: <strong>${checkersStr || '無'}</strong></span>
                </p>
                ${notesStr ? `<p style="margin-top: 4px; font-size:0.8rem; font-style:italic; color: #b45309;"><i class="fa-solid fa-quote-left"></i> ${notesStr}</p>` : ''}
            </div>
            <div class="log-status">
                ${statusBadge}
                <i class="fa-solid fa-chevron-right" style="color: var(--text-muted)"></i>
            </div>
        `;

        item.addEventListener("click", () => openRecordDetails(log));
        elements.logListContainer.appendChild(item);
    });
}

function openRecordDetails(log) {
    selectedLogIdForModal = log.id;
    elements.modalTitle.innerText = `${log.date} 點班明細`;

    let detailsHtml = `
        <div style="background: var(--bg-main); padding: 14px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border-color); display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 0.92rem;">
            <div><strong>點班日期:</strong> ${log.date}</div>
            <div><strong>核對狀態:</strong> ${log.hasDiscrepancy ? '<span class="badge badge-danger">異常申報</span>' : '<span class="badge badge-success">正常符合</span>'}</div>
            <div style="grid-column: span 2;"><strong>提交時間:</strong> ${log.timestamp}</div>
        </div>
        
        <div style="background: var(--bg-main); padding: 14px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border-color); font-size: 0.92rem; display:flex; flex-direction:column; gap:8px;">
            <strong>點班人員名冊核章：</strong>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                <span>• 第一室物資點班人:</span>
                <strong>${log.r1NurseName ? `${log.r1NurseName} (${log.r1NurseId})` : '—'}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                <span>• 第二室物資點班人:</span>
                <strong>${log.r2NurseName ? `${log.r2NurseName} (${log.r2NurseId})` : '—'}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                <span>• 常備藥點班人員:</span>
                <strong>${log.medsNurseName ? `${log.medsNurseName} (${log.medsNurseId})` : '—'}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                <span>• 血氧機/設備點班人:</span>
                <strong>${log.devicesNurseName ? `${log.devicesNurseName} (${log.devicesNurseId})` : '—'}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                <span>• 器械與隔離衣點班人:</span>
                <strong>${log.instNurseName ? `${log.instNurseName} (${log.instNurseId})` : '—'}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding-bottom:4px; border-top: 1px dashed var(--border-color); padding-top: 6px; margin-top: 2px;">
                <span style="color: var(--primary); font-weight: bold;"><i class="fa-solid fa-user-tie"></i> 單位主管查核:</span>
                <strong>${log.supervisorNurseName ? `${log.supervisorNurseName} (${log.supervisorNurseId})` : '<span class="badge badge-danger" style="font-size:0.8rem; padding: 2px 6px;">未核簽</span>'}</strong>
            </div>
        </div>
    `;

    // Notes
    let hasNotes = log.notesR1 || log.notesR2 || log.notesMeds || log.notesDevices || log.notesInst || log.notesSupervisor;
    if (hasNotes) {
        detailsHtml += `
            <div style="background: rgba(245, 158, 11, 0.08); padding: 14px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid var(--warning); font-size: 0.92rem; display: flex; flex-direction: column; gap: 6px;">
                <strong>分區點班備註 / 異常記錄說明：</strong>
                ${log.notesR1 ? `<div>• 第一室: ${log.notesR1}</div>` : ''}
                ${log.notesR2 ? `<div>• 第二室: ${log.notesR2}</div>` : ''}
                ${log.notesMeds ? `<div>• 常備藥: ${log.notesMeds}</div>` : ''}
                ${log.notesDevices ? `<div>• 血氧機: ${log.notesDevices}</div>` : ''}
                ${log.notesInst ? `<div>• 器械隔離衣: ${log.notesInst}</div>` : ''}
                ${log.notesSupervisor ? `<div style="border-top:1px dashed rgba(245,158,11,0.3); padding-top:4px; margin-top:2px; font-weight: bold; color: var(--primary);">• 主管查核意見: ${log.notesSupervisor}</div>` : ''}
            </div>
        `;
    }

    detailsHtml += `<h4>清點明細數據：</h4>`;

    // Loop active items categories
    const categories = [
        { title: "第一洗腎室", items: activeItems.r1 },
        { title: "第二洗腎室", items: activeItems.r2 },
        { title: "常備藥品", items: activeItems.meds },
        { title: "儀器設備", items: activeItems.devices },
        { title: "包盤器械與布品", items: activeItems.instruments }
    ];

    categories.forEach(cat => {
        let catRows = "";
        if (!cat.items || cat.items.length === 0) {
            catRows = `<tr><td colspan="4" style="text-align:center; padding:10px; color:var(--text-muted);">此類別無品項</td></tr>`;
        } else {
            cat.items.forEach(item => {
                const actualVal = log.records[item.id] || "N/A";
                const isCheckbox = item.type === "checkbox";

                let mismatch = false;
                let diffText = "";

                if (isCheckbox) {
                    mismatch = actualVal === "未確認";
                } else if (item.type === "number") {
                    const act = parseInt(actualVal) || 0;
                    const def = parseInt(item.defaultVal) || 0;
                    if (act !== def) {
                        mismatch = true;
                        diffText = ` (${act - def > 0 ? '+' : ''}${act - def})`;
                    }
                } else {
                    mismatch = actualVal !== item.defaultVal;
                }

                const warningStyle = mismatch ? 'style="background-color: var(--danger-light); color: var(--danger); font-weight:600;"' : '';
                const statusLabel = mismatch ? `<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> 不符${diffText}</span>` : `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> 符合</span>`;

                catRows += `
                    <tr ${mismatch ? 'class="row-warning"' : ''}>
                        <td style="padding: 8px 12px; font-size: 0.88rem;">${item.name}</td>
                        <td style="padding: 8px 12px; font-size: 0.88rem; font-weight: 600;">${isCheckbox ? '應確認' : item.defaultVal}</td>
                        <td style="padding: 8px 12px; font-size: 0.88rem; font-weight: 600;" ${warningStyle}>${actualVal}</td>
                        <td style="padding: 8px 12px; font-size: 0.88rem;">${statusLabel}</td>
                    </tr>
                `;
            });
        }

        detailsHtml += `
            <div style="margin-top: 14px; margin-bottom: 14px;">
                <h5 style="margin-bottom: 6px; color: var(--primary); font-size: 0.95rem;">${cat.title}</h5>
                <table style="width:100%; border-collapse: collapse; border: 1px solid var(--border-color); font-size: 0.88rem;">
                    <thead>
                        <tr style="background: var(--table-header-bg); text-align:left;">
                            <th style="padding: 8px 12px; font-size:0.8rem;">品項</th>
                            <th style="padding: 8px 12px; font-size:0.8rem;">預設值</th>
                            <th style="padding: 8px 12px; font-size:0.8rem;">實點數</th>
                            <th style="padding: 8px 12px; font-size:0.8rem;">狀態</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${catRows}
                    </tbody>
                </table>
            </div>
        `;
    });

    elements.modalBody.innerHTML = detailsHtml;
    elements.detailModal.classList.add("active");
}

function closeDetailsModal() {
    elements.detailModal.classList.remove("active");
    selectedLogIdForModal = null;
}

function handleDeleteLog() {
    if (!selectedLogIdForModal) return;

    if (confirm("您確定要刪除這筆點班紀錄嗎？此操作將無法還原！")) {
        const targetId = selectedLogIdForModal;
        handoverLogs = handoverLogs.filter(log => log.id !== targetId);
        localStorage.setItem("handoverLogs", JSON.stringify(handoverLogs));
        closeDetailsModal();
        showToast("紀錄已刪除", "info");

        // Sync to Cloud
        postToCloud({ action: "deleteLog", logId: targetId });

        renderHistoryCalendar();
        renderHistoryList();
    }
}

// --- Employee Database Actions ---
function openEmployeeModal() {
    renderEmployeeTable();
    elements.employeeModal.classList.add("active");
}

function closeEmployeeModal() {
    elements.employeeModal.classList.remove("active");
    elements.newEmpId.value = "";
    elements.newEmpName.value = "";
    elements.empFileImport.value = ""; // clear file input
}

function renderEmployeeTable() {
    elements.tbodyEmployees.innerHTML = "";
    Object.keys(employeeDb).sort().forEach(id => {
        const emp = employeeDb[id];
        const name = emp ? emp.name : "";
        const role = emp ? (emp.role || "staff") : "staff";
        const title = emp ? (emp.title || "護理師") : "護理師";

        const tr = document.createElement("tr");

        // Generate role select for inline adjustment
        const roleSelectHtml = `
            <select onchange="updateEmployeeField('${id}', 'role', this.value)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--input-bg); color: var(--text-main); font-size: 0.85rem;">
                <option value="staff" ${role === 'staff' ? 'selected' : ''}>一般人員</option>
                <option value="admin" ${role === 'admin' ? 'selected' : ''}>管理人員</option>
            </select>
        `;

        // Generate title select for inline adjustment
        const titleSelectHtml = `
            <select onchange="updateEmployeeField('${id}', 'title', this.value)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--input-bg); color: var(--text-main); font-size: 0.85rem;">
                <option value="護理師" ${title === '護理師' ? 'selected' : ''}>護理師</option>
                <option value="護理組長" ${title === '護理組長' ? 'selected' : ''}>護理組長</option>
                <option value="護理長" ${title === '護理長' ? 'selected' : ''}>護理長</option>
            </select>
        `;

        tr.innerHTML = `
            <td style="padding: 8px 12px; font-weight: 600;">${id}</td>
            <td style="padding: 8px 12px;">${name}</td>
            <td style="padding: 8px 12px;">${roleSelectHtml}</td>
            <td style="padding: 8px 12px;">${titleSelectHtml}</td>
            <td style="padding: 8px 12px; text-align: center;">
                <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${id}')" style="padding: 4px 8px; font-size: 0.8rem;">
                    <i class="fa-solid fa-trash-can"></i> 刪除
                </button>
            </td>
        `;
        elements.tbodyEmployees.appendChild(tr);
    });
}

window.updateEmployeeField = function (id, field, value) {
    if (employeeDb[id]) {
        employeeDb[id][field] = value;
        // If title is updated to 護理長 or 護理組長, automatically update role to admin, and vice-versa if changed to nurse
        if (field === "title") {
            if (value === "護理長" || value === "護理組長") {
                employeeDb[id].role = "admin";
            } else {
                employeeDb[id].role = "staff";
            }
        }
        localStorage.setItem("employeeDb", JSON.stringify(employeeDb));
        renderEmployeeTable();
        triggerAllLookups();

        // Sync to Cloud
        postToCloud({ action: "syncEmployees", employees: employeeDb });
    }
};

window.deleteEmployee = function (id) {
    const emp = employeeDb[id];
    const name = emp ? emp.name : "";
    if (confirm(`確定要刪除員工 [${id}] ${name} 嗎？`)) {
        delete employeeDb[id];
        localStorage.setItem("employeeDb", JSON.stringify(employeeDb));
        renderEmployeeTable();
        triggerAllLookups();

        // Sync to Cloud
        postToCloud({ action: "syncEmployees", employees: employeeDb });
    }
};

function handleAddEmployee() {
    const id = elements.newEmpId.value.trim();
    const name = elements.newEmpName.value.trim();
    const roleSelect = document.getElementById("new-emp-role");
    const role = roleSelect ? roleSelect.value : "staff";
    const titleSelect = document.getElementById("new-emp-title");
    const title = titleSelect ? titleSelect.value : "護理師";

    if (!id || !name) {
        showToast("請填寫工號與姓名！", "warning");
        return;
    }

    employeeDb[id] = { name: name, role: role, title: title };
    localStorage.setItem("employeeDb", JSON.stringify(employeeDb));
    renderEmployeeTable();

    elements.newEmpId.value = "";
    elements.newEmpName.value = "";
    if (roleSelect) roleSelect.value = "staff"; // reset to default
    if (titleSelect) titleSelect.value = "護理師"; // reset to default
    showToast("員工新增成功！", "success");
    triggerAllLookups();

    // Sync to Cloud
    postToCloud({ action: "syncEmployees", employees: employeeDb });
}

// File Batch Import (CSV / Excel)
function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();

    if (extension === "csv") {
        reader.onload = function (evt) {
            parseCSV(evt.target.result);
        };
        reader.readAsText(file, "UTF-8");
    } else if (extension === "xlsx" || extension === "xls") {
        reader.onload = function (evt) {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                parseExcelJson(jsonData);
            } catch (err) {
                showToast("Excel 解析錯誤：" + err.message, "warning");
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        showToast("檔案格式錯誤，請上傳 CSV 或 Excel 試算表！", "warning");
    }
    elements.empFileImport.value = "";
}

function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    let count = 0;

    lines.forEach((line, idx) => {
        if (line.trim() === "") return;
        const columns = line.split(/,|;/);
        if (columns.length >= 2) {
            const id = columns[0].trim().replace(/"/g, '');
            const name = columns[1].trim().replace(/"/g, '');

            if (idx === 0 && (id.toLowerCase().includes("id") || id.includes("工號"))) {
                return;
            }
            if (id && name) {
                let title = "護理師";
                if (name.includes("護理長")) title = "護理長";
                else if (name.includes("組長")) title = "護理組長";
                let role = (title === "護理長" || title === "護理組長") ? "admin" : "staff";

                employeeDb[id] = { name: name, role: role, title: title };
                count++;
            }
        }
    });

    if (count > 0) {
        localStorage.setItem("employeeDb", JSON.stringify(employeeDb));
        renderEmployeeTable();
        showToast(`批次導入成功！共匯入 ${count} 筆員工資料。`, "success");
        triggerAllLookups();

        // Sync to Cloud
        postToCloud({ action: "syncEmployees", employees: employeeDb });
    } else {
        showToast("CSV 解析失敗，未發現有效資料！請使用「工號,姓名」之格式。", "warning");
    }
}

function parseExcelJson(rows) {
    let count = 0;
    rows.forEach((row, idx) => {
        if (!row || row.length < 2) return;
        const id = String(row[0]).trim();
        const name = String(row[1]).trim();

        if (idx === 0 && (id.toLowerCase().includes("id") || id.includes("工號"))) {
            return;
        }
        if (id && name && id !== "undefined" && name !== "undefined") {
            let title = "護理師";
            if (name.includes("護理長")) title = "護理長";
            else if (name.includes("組長")) title = "護理組長";
            let role = (title === "護理長" || title === "護理組長") ? "admin" : "staff";

            employeeDb[id] = { name: name, role: role, title: title };
            count++;
        }
    });

    if (count > 0) {
        localStorage.setItem("employeeDb", JSON.stringify(employeeDb));
        renderEmployeeTable();
        showToast(`Excel 批次導入成功！共匯入 ${count} 筆員工資料。`, "success");
        triggerAllLookups();

        // Sync to Cloud
        postToCloud({ action: "syncEmployees", employees: employeeDb });
    } else {
        showToast("Excel 解析失敗，首張工作表中未偵測到工號與姓名！", "warning");
    }
}

function triggerAllLookups() {
    if (elements.nurseR1Id) lookupEmployee(elements.nurseR1Id.value, elements.nurseR1NameDisplay, elements.sigR1Status);
    if (elements.nurseR2Id) lookupEmployee(elements.nurseR2Id.value, elements.nurseR2NameDisplay, elements.sigR2Status);
    if (elements.nurseMedsId) lookupEmployee(elements.nurseMedsId.value, elements.nurseMedsNameDisplay, elements.sigMedsStatus);
    if (elements.nurseDevicesId) lookupEmployee(elements.nurseDevicesId.value, elements.nurseDevicesNameDisplay, elements.sigDevicesStatus);
    if (elements.nurseInstId) lookupEmployee(elements.nurseInstId.value, elements.nurseInstNameDisplay, elements.sigInstStatus);
    if (elements.nurseSupervisorId) lookupEmployee(elements.nurseSupervisorId.value, elements.nurseSupervisorNameDisplay, elements.sigSupervisorStatus);
}

// --- Checklist Items Schema Actions (Manage Checklist Items) ---
function openItemsModal() {
    renderConfigItemsList();

    // Load print footers to inputs
    const footers = JSON.parse(localStorage.getItem("printFooters")) || DEFAULT_PRINT_FOOTERS;
    if (document.getElementById("edit-footer-sheet1")) {
        document.getElementById("edit-footer-sheet1").value = footers.sheet1 || "";
    }
    if (document.getElementById("edit-footer-sheet2")) {
        document.getElementById("edit-footer-sheet2").value = footers.sheet2 || "";
    }
    if (document.getElementById("edit-footer-sheet3")) {
        document.getElementById("edit-footer-sheet3").value = footers.sheet3 || "";
    }

    elements.itemsModal.classList.add("active");
}

function closeItemsModal() {
    elements.itemsModal.classList.remove("active");
    document.getElementById("new-item-name").value = "";
    document.getElementById("new-item-default").value = "";
}

function renderConfigItemsList() {
    const cat = elements.itemCatSelect.value;
    elements.tbodyChecklistItems.innerHTML = "";

    if (!activeItems[cat] || activeItems[cat].length === 0) {
        elements.tbodyChecklistItems.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:10px;">該類別目前無任何點班品項</td></tr>`;
        return;
    }

    activeItems[cat].forEach((item, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="padding: 8px 12px;"><input type="text" id="edit-name-${item.id}" value="${item.name}" style="width:100%; padding:6px; border:1px solid var(--border-color); border-radius:4px; background:var(--input-bg); color:var(--text-main);"></td>
            <td style="padding: 8px 12px;"><input type="text" id="edit-default-${item.id}" value="${item.defaultVal}" style="width:100%; padding:6px; border:1px solid var(--border-color); border-radius:4px; background:var(--input-bg); color:var(--text-main); font-weight:600;"></td>
            <td style="padding: 8px 12px;">
                <select id="edit-type-${item.id}" style="padding:4px; border:1px solid var(--border-color); border-radius:4px; background:var(--input-bg); color:var(--text-main);">
                    <option value="number" ${item.type === 'number' ? 'selected' : ''}>數字</option>
                    <option value="checkbox" ${item.type === 'checkbox' ? 'selected' : ''}>核取</option>
                    <option value="text" ${item.type === 'text' ? 'selected' : ''}>文字</option>
                </select>
            </td>
            <td style="padding: 8px 12px; text-align: center; display:flex; gap:6px; justify-content:center;">
                <button class="btn btn-sm" onclick="saveItemEdit('${cat}', '${item.id}')" style="padding: 4px 8px; font-size: 0.8rem; background: var(--primary); color:white; border:none; border-radius:4px; cursor:pointer;"><i class="fa-solid fa-floppy-disk"></i> 儲存</button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem('${cat}', '${item.id}')" style="padding: 4px 8px; font-size: 0.8rem;"><i class="fa-solid fa-trash-can"></i> 刪除</button>
            </td>
        `;
        elements.tbodyChecklistItems.appendChild(tr);
    });
}

window.saveItemEdit = function (cat, itemId) {
    const nameVal = document.getElementById(`edit-name-${itemId}`).value.trim();
    const defaultVal = document.getElementById(`edit-default-${itemId}`).value.trim();
    const typeVal = document.getElementById(`edit-type-${itemId}`).value;

    if (!nameVal || !defaultVal) {
        showToast("品項名稱與預設數量不可為空！", "warning");
        return;
    }

    const item = activeItems[cat].find(i => i.id === itemId);
    if (item) {
        item.name = nameVal;
        item.defaultVal = defaultVal;
        item.type = typeVal;

        localStorage.setItem("checklistItems", JSON.stringify(activeItems));
        showToast("品項修改成功！", "success");
        renderAllChecklists();
        performCalculations();
        postToCloud({ action: "syncChecklistItems", checklistItems: activeItems });
    }
};

window.deleteItem = function (cat, itemId) {
    if (confirm("確認要刪除此點班品項嗎？這會直接移除此表單欄位。")) {
        activeItems[cat] = activeItems[cat].filter(i => i.id !== itemId);
        localStorage.setItem("checklistItems", JSON.stringify(activeItems));
        showToast("品項已成功刪除", "info");
        renderConfigItemsList();
        renderAllChecklists();
        performCalculations();
        postToCloud({ action: "syncChecklistItems", checklistItems: activeItems });
    }
};

function handleAddChecklistItem() {
    const cat = elements.itemCatSelect.value;
    const name = elements.newItemName.value.trim();
    const defaultVal = elements.newItemDefault.value.trim();
    const type = elements.newItemType.value;

    if (!name || !defaultVal) {
        showToast("請填寫完整的品項名稱與預設值！", "warning");
        return;
    }

    const newItem = {
        id: `item_${Date.now()}`,
        name: name,
        defaultVal: defaultVal,
        type: type
    };

    activeItems[cat].push(newItem);
    localStorage.setItem("checklistItems", JSON.stringify(activeItems));
    showToast("品項新增成功！", "success");

    elements.newItemName.value = "";
    elements.newItemDefault.value = "";

    renderConfigItemsList();
    renderAllChecklists();
    performCalculations();
    postToCloud({ action: "syncChecklistItems", checklistItems: activeItems });
}

function generateSupervisorSigRowHTML(monthLogs, daysInMonth, selectedMonthStr) {
    const getCleanName = (fullName) => {
        if (!fullName) return "";
        return fullName.split(" ")[0];
    };

    // Build array of supervisor sign-off info for days 1 to daysInMonth
    const daySupervisor = Array(daysInMonth + 1).fill(null);
    monthLogs.forEach(log => {
        const parts = log.date.split("-");
        if (parts.length === 3) {
            const day = parseInt(parts[2], 10);
            if (day >= 1 && day <= daysInMonth) {
                if (log.supervisorNurseName) {
                    daySupervisor[day] = {
                        name: getCleanName(log.supervisorNurseName),
                        date: log.supervisorAuditDate || ""
                    };
                }
            }
        }
    });

    const isSameSupervisor = (sig1, sig2) => {
        if (!sig1 && !sig2) return true;
        if (!sig1 || !sig2) return false;
        return sig1.name === sig2.name && sig1.date === sig2.date;
    };

    let html = "";
    let i = 1;
    while (i <= daysInMonth) {
        let j = i;
        while (j + 1 <= daysInMonth && isSameSupervisor(daySupervisor[i], daySupervisor[j + 1])) {
            j++;
        }

        const span = j - i + 1;
        const item = daySupervisor[i];

        if (item) {
            html += `<td colspan="${span}" style="font-weight: bold; background-color: #f0fdf4 !important; color: #166534 !important; font-size: 7.5pt !important; text-align: center !important; print-color-adjust: exact; -webkit-print-color-adjust: exact;" title="核簽日期: ${item.date}">
                ${item.name}${item.date ? `(${item.date})` : ''}
            </td>`;
        } else {
            html += `<td colspan="${span}"></td>`;
        }

        i = j + 1;
    }

    return html;
}

// --- Printable Setup & Execution ---
function generateMonthlyReportHTML(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const selectedMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    const monthLogs = handoverLogs.filter(log => log.date.startsWith(selectedMonthStr));

    const logsMap = {};
    monthLogs.forEach(log => {
        const day = parseInt(log.date.split("-")[2], 10);
        logsMap[day] = log;
    });

    const getCleanName = (fullName) => {
        if (!fullName) return "";
        return fullName.split(" ")[0];
    };

    const activeDate = elements.dateInput ? elements.dateInput.value : "";
    let supervisorSig = "______________________";
    if (activeDate && activeDate.startsWith(selectedMonthStr)) {
        const activeLog = monthLogs.find(log => log.date === activeDate);
        if (activeLog && activeLog.supervisorNurseName) {
            supervisorSig = getCleanName(activeLog.supervisorNurseName);
        }
    }
    if (supervisorSig === "______________________") {
        const signedLog = monthLogs.slice().sort((a, b) => b.date.localeCompare(a.date)).find(log => log.supervisorNurseName);
        if (signedLog) {
            supervisorSig = getCleanName(signedLog.supervisorNurseName);
        }
    }

    // Load custom footers from LocalStorage
    const footers = JSON.parse(localStorage.getItem("printFooters")) || DEFAULT_PRINT_FOOTERS;
    const sheet1FooterHtml = footers.sheet1 ? footers.sheet1.split('\n').map(line => `<div>${line}</div>`).join('') : "";
    const sheet2FooterHtml = footers.sheet2 ? footers.sheet2.split('\n').map(line => `<div>${line}</div>`).join('') : "";
    const sheet3FooterHtml = footers.sheet3 ? footers.sheet3.split('\n').map(line => `<div>${line}</div>`).join('') : "";

    // Build Sheet 1: 一般物資點班單 (r1 and r2)
    let sheet1Html = `
    <div class="monthly-report-page">
        <div class="monthly-report-header">
            <h2>血液透析室 第一與第二洗腎室一般物資點班單</h2>
            <div class="monthly-report-meta">
                <span>年份：${year} 年</span>
                <span>月份：${month} 月</span>
            </div>
        </div>
        <table class="monthly-table">
            <thead>
                <tr>
                    <th class="item-name-col">品項</th>
                    <th class="default-val-col">數量</th>
                    ${Array.from({ length: daysInMonth }, (_, i) => `<th class="day-col">${i + 1}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                <tr class="category-row"><td colspan="${daysInMonth + 2}">第一洗腎室</td></tr>
    `;

    activeItems.r1.forEach(item => {
        let displayName = item.name;
        if (item.id === "r1_DL_expiry" || item.id === "r1_dl_expiry") {
            let cleanName = item.name.replace(/\s*\(請於到期日7日前提出\)/g, "").trim();
            displayName = `${cleanName}<div style="font-size: 7.5pt; color: #64748b; font-weight: normal; margin-top: 2px;">(請於到期日7日前提出)</div>`;
        }
        sheet1Html += `<tr><td class="item-name-col">${displayName}</td><td class="default-val-col">${item.type === 'checkbox' ? '確認' : item.defaultVal}</td>`;
        for (let d = 1; d <= daysInMonth; d++) {
            const log = logsMap[d];
            let val = "";
            if (log && log.records[item.id] !== undefined) {
                const saved = log.records[item.id];
                if (item.type === 'checkbox') {
                    val = saved === '已確認' ? 'V' : '';
                } else {
                    val = saved;
                }
            }
            let style = "";
            if (val !== "" && item.type !== 'checkbox') {
                if (val !== item.defaultVal) {
                    style = `style="color:red; font-weight:bold; text-decoration:underline;"`;
                }
            }
            sheet1Html += `<td class="day-col" ${style}>${val}</td>`;
        }
        sheet1Html += `</tr>`;
    });

    sheet1Html += `<tr class="signature-row"><td class="sig-label-col">點班人員簽名</td><td></td>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const log = logsMap[d];
        sheet1Html += `<td class="day-col">${log ? getCleanName(log.r1NurseName) : ''}</td>`;
    }
    sheet1Html += `</tr>`;

    // Supervisor Row for R1
    sheet1Html += `<tr class="signature-row"><td class="sig-label-col" style="color: var(--primary) !important;">主管查核</td><td></td>`;
    sheet1Html += generateSupervisorSigRowHTML(monthLogs, daysInMonth, selectedMonthStr);
    sheet1Html += `</tr>`;

    sheet1Html += `<tr class="category-row"><td colspan="${daysInMonth + 2}">第二洗腎室</td></tr>`;
    activeItems.r2.forEach(item => {
        sheet1Html += `<tr><td class="item-name-col">${item.name}</td><td class="default-val-col">${item.type === 'checkbox' ? '確認' : item.defaultVal}</td>`;
        for (let d = 1; d <= daysInMonth; d++) {
            const log = logsMap[d];
            let val = "";
            if (log && log.records[item.id] !== undefined) {
                const saved = log.records[item.id];
                if (item.type === 'checkbox') {
                    val = saved === '已確認' ? 'V' : '';
                } else {
                    val = saved;
                }
            }
            let style = "";
            if (val !== "" && item.type !== 'checkbox') {
                if (val !== item.defaultVal) {
                    style = `style="color:red; font-weight:bold; text-decoration:underline;"`;
                }
            }
            sheet1Html += `<td class="day-col" ${style}>${val}</td>`;
        }
        sheet1Html += `</tr>`;
    });

    sheet1Html += `<tr class="signature-row"><td class="sig-label-col">點班人員簽名</td><td></td>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const log = logsMap[d];
        sheet1Html += `<td class="day-col">${log ? getCleanName(log.r2NurseName) : ''}</td>`;
    }
    sheet1Html += `</tr>`;

    // Supervisor Row for R2
    sheet1Html += `<tr class="signature-row"><td class="sig-label-col" style="color: var(--primary) !important;">主管查核</td><td></td>`;
    sheet1Html += generateSupervisorSigRowHTML(monthLogs, daysInMonth, selectedMonthStr);
    sheet1Html += `</tr>`;

    sheet1Html += `
            </tbody>
        </table>
    `;

    let sheet1Notes = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const log = logsMap[d];
        if (log) {
            if (log.notesR1) sheet1Notes.push(`<li><strong>${month}/${d} (第一室):</strong> ${log.notesR1} (${getCleanName(log.r1NurseName)})</li>`);
            if (log.notesR2) sheet1Notes.push(`<li><strong>${month}/${d} (第二室):</strong> ${log.notesR2} (${getCleanName(log.r2NurseName)})</li>`);
            if (log.notesSupervisor) sheet1Notes.push(`<li><strong>${month}/${d} (主管意見):</strong> ${log.notesSupervisor} (${getCleanName(log.supervisorNurseName)})</li>`);
        }
    }

    sheet1Html += `
        <div class="monthly-footer-notes">
            ${sheet1FooterHtml}
            ${sheet1Notes.length > 0 ? `
            <div style="margin-top: 4px; font-weight: bold;">異常事件或點班備註說明：</div>
            <ul class="monthly-notes-list">${sheet1Notes.join('')}</ul>
            ` : ''}
        </div>
        <div class="monthly-supervisor-block">
            單位主管核章：${supervisorSig}
        </div>
    </div>
    `;

    // Build Sheet 2: 常備藥品與血氧機點班單 (meds and devices)
    let sheet2Html = `
    <div class="monthly-report-page">
        <div class="monthly-report-header">
            <h2>血液透析室 常備藥與血氧機點班單</h2>
            <div class="monthly-report-meta">
                <span>年份：${year} 年</span>
                <span>月份：${month} 月</span>
            </div>
        </div>
        <table class="monthly-table">
            <thead>
                <tr>
                    <th class="item-name-col">品項</th>
                    <th class="default-val-col">數量</th>
                    ${Array.from({ length: daysInMonth }, (_, i) => `<th class="day-col">${i + 1}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                <tr class="category-row"><td colspan="${daysInMonth + 2}">常備藥品清點</td></tr>
    `;

    activeItems.meds.forEach(item => {
        sheet2Html += `<tr><td class="item-name-col">${item.name}</td><td class="default-val-col">${item.type === 'checkbox' ? '確認' : item.defaultVal}</td>`;
        for (let d = 1; d <= daysInMonth; d++) {
            const log = logsMap[d];
            let val = "";
            if (log && log.records[item.id] !== undefined) {
                const saved = log.records[item.id];
                if (item.type === 'checkbox') {
                    val = saved === '已確認' ? 'V' : '';
                } else {
                    val = saved;
                }
            }
            let style = "";
            if (val !== "" && item.type !== 'checkbox') {
                if (val !== item.defaultVal) {
                    style = `style="color:red; font-weight:bold; text-decoration:underline;"`;
                }
            }
            sheet2Html += `<td class="day-col" ${style}>${val}</td>`;
        }
        sheet2Html += `</tr>`;
    });

    sheet2Html += `<tr class="signature-row"><td class="sig-label-col">常備藥點班人員簽名</td><td></td>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const log = logsMap[d];
        sheet2Html += `<td class="day-col">${log ? getCleanName(log.medsNurseName) : ''}</td>`;
    }
    sheet2Html += `</tr>`;

    // Supervisor Row for Meds
    sheet2Html += `<tr class="signature-row"><td class="sig-label-col" style="color: var(--primary) !important;">主管查核</td><td></td>`;
    sheet2Html += generateSupervisorSigRowHTML(monthLogs, daysInMonth, selectedMonthStr);
    sheet2Html += `</tr>`;

    sheet2Html += `<tr class="category-row"><td colspan="${daysInMonth + 2}">儀器設備清點</td></tr>`;
    activeItems.devices.forEach(item => {
        sheet2Html += `<tr><td class="item-name-col">${item.name}</td><td class="default-val-col">${item.type === 'checkbox' ? '確認' : item.defaultVal}</td>`;
        for (let d = 1; d <= daysInMonth; d++) {
            const log = logsMap[d];
            let val = "";
            if (log && log.records[item.id] !== undefined) {
                const saved = log.records[item.id];
                if (item.type === 'checkbox') {
                    val = saved === '已確認' ? 'V' : '';
                } else {
                    val = saved;
                }
            }
            let style = "";
            if (val !== "" && item.type !== 'checkbox') {
                if (val !== item.defaultVal) {
                    style = `style="color:red; font-weight:bold; text-decoration:underline;"`;
                }
            }
            sheet2Html += `<td class="day-col" ${style}>${val}</td>`;
        }
        sheet2Html += `</tr>`;
    });

    sheet2Html += `<tr class="signature-row"><td class="sig-label-col">血氧機點班人員簽名</td><td></td>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const log = logsMap[d];
        sheet2Html += `<td class="day-col">${log ? getCleanName(log.devicesNurseName) : ''}</td>`;
    }
    sheet2Html += `</tr>`;

    // Supervisor Row for Devices
    sheet2Html += `<tr class="signature-row"><td class="sig-label-col" style="color: var(--primary) !important;">主管查核</td><td></td>`;
    sheet2Html += generateSupervisorSigRowHTML(monthLogs, daysInMonth, selectedMonthStr);
    sheet2Html += `</tr>`;

    sheet2Html += `
            </tbody>
        </table>
    `;

    let sheet2Notes = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const log = logsMap[d];
        if (log) {
            if (log.notesMeds) sheet2Notes.push(`<li><strong>${month}/${d} (常備藥):</strong> ${log.notesMeds} (${getCleanName(log.medsNurseName)})</li>`);
            if (log.notesDevices) sheet2Notes.push(`<li><strong>${month}/${d} (血氧機):</strong> ${log.notesDevices} (${getCleanName(log.devicesNurseName)})</li>`);
            if (log.notesSupervisor) sheet2Notes.push(`<li><strong>${month}/${d} (主管意見):</strong> ${log.notesSupervisor} (${getCleanName(log.supervisorNurseName)})</li>`);
        }
    }

    sheet2Html += `
        <div class="monthly-footer-notes">
            ${sheet2FooterHtml}
            ${sheet2Notes.length > 0 ? `
            <div style="margin-top: 4px; font-weight: bold;">異常事件或點班備註說明：</div>
            <ul class="monthly-notes-list">${sheet2Notes.join('')}</ul>
            ` : ''}
        </div>
        <div class="monthly-supervisor-block">
            單位主管核章：${supervisorSig}
        </div>
    </div>
    `;

    // Build Sheet 3: 器械與布品點班單 (instruments)
    let sheet3Html = `
    <div class="monthly-report-page">
        <div class="monthly-report-header">
            <h2>血液透析室 包盤器械與布品點班單</h2>
            <div class="monthly-report-meta">
                <span>年份：${year} 年</span>
                <span>月份：${month} 月</span>
            </div>
        </div>
        <table class="monthly-table">
            <thead>
                <tr>
                    <th class="item-name-col">品項</th>
                    <th class="default-val-col">數量</th>
                    ${Array.from({ length: daysInMonth }, (_, i) => `<th class="day-col">${i + 1}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                <tr class="category-row"><td colspan="${daysInMonth + 2}">包盤器械及布品項目</td></tr>
       `;

    activeItems.instruments.forEach(item => {
        sheet3Html += `<tr><td class="item-name-col">${item.name}</td><td class="default-val-col">${item.type === 'checkbox' ? '確認' : item.defaultVal}</td>`;
        for (let d = 1; d <= daysInMonth; d++) {
            const log = logsMap[d];
            let val = "";
            if (log && log.records[item.id] !== undefined) {
                const saved = log.records[item.id];
                if (item.type === 'checkbox') {
                    val = saved === '已確認' ? 'V' : '';
                } else {
                    val = saved;
                }
            }
            let style = "";
            if (val !== "" && item.type !== 'checkbox') {
                if (val !== item.defaultVal) {
                    style = `style="color:red; font-weight:bold; text-decoration:underline;"`;
                }
            }
            sheet3Html += `<td class="day-col" ${style}>${val}</td>`;
        }
        sheet3Html += `</tr>`;
    });

    sheet3Html += `<tr class="signature-row"><td class="sig-label-col">器械點班人員簽名</td><td></td>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const log = logsMap[d];
        sheet3Html += `<td class="day-col">${log ? getCleanName(log.instNurseName) : ''}</td>`;
    }
    sheet3Html += `</tr>`;

    // Supervisor Row for Instruments
    sheet3Html += `<tr class="signature-row"><td class="sig-label-col" style="color: var(--primary) !important;">主管查核</td><td></td>`;
    sheet3Html += generateSupervisorSigRowHTML(monthLogs, daysInMonth, selectedMonthStr);
    sheet3Html += `</tr>`;

    sheet3Html += `
               </tbody>
           </table>
       `;

    let sheet3Notes = [];
    for (let d = 1; d <= daysInMonth; d++) {
        const log = logsMap[d];
        if (log) {
            if (log.notesInst) sheet3Notes.push(`<li><strong>${month}/${d} (器械):</strong> ${log.notesInst} (${getCleanName(log.instNurseName)})</li>`);
            if (log.notesSupervisor) sheet3Notes.push(`<li><strong>${month}/${d} (主管意見):</strong> ${log.notesSupervisor} (${getCleanName(log.supervisorNurseName)})</li>`);
        }
    }

    sheet3Html += `
           <div class="monthly-footer-notes">
               ${sheet3FooterHtml}
               ${sheet3Notes.length > 0 ? `
               <div style="margin-top: 4px; font-weight: bold;">異常事件或點班備註說明：</div>
               <ul class="monthly-notes-list">${sheet3Notes.join('')}</ul>
               ` : ''}
           </div>
           <div class="monthly-supervisor-block">
               單位主管核章：${supervisorSig}
           </div>
       </div>
       `;

    return sheet1Html + sheet2Html + sheet3Html;
}

function handlePrint() {
    const date = elements.dateInput.value;
    if (!date) {
        showToast("請選擇日期！", "warning");
        return;
    }
    const [year, month] = date.split("-").map(Number);
    const monthlyContainer = document.getElementById("print-monthly-container");
    if (monthlyContainer) {
        monthlyContainer.innerHTML = generateMonthlyReportHTML(year, month);
        window.print();
    }
}

function handlePrintSelectedLog() {
    if (!selectedLogIdForModal) return;
    const log = handoverLogs.find(l => l.id === selectedLogIdForModal);
    if (!log) return;

    const [year, month] = log.date.split("-").map(Number);
    const monthlyContainer = document.getElementById("print-monthly-container");
    if (monthlyContainer) {
        monthlyContainer.innerHTML = generateMonthlyReportHTML(year, month);
        window.print();
    }
}

// --- Toast Utilities ---
function showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toast-message");
    const toastIcon = document.getElementById("toast-icon");

    toastMsg.innerText = message;

    if (type === "success") {
        toast.style.borderLeft = "5px solid var(--success)";
        toastIcon.className = "fa-solid fa-circle-check";
        toastIcon.style.color = "var(--success)";
    } else if (type === "warning") {
        toast.style.borderLeft = "5px solid var(--danger)";
        toastIcon.className = "fa-solid fa-triangle-exclamation";
        toastIcon.style.color = "var(--danger)";
    } else {
        toast.style.borderLeft = "5px solid var(--secondary)";
        toastIcon.className = "fa-solid fa-circle-info";
        toastIcon.style.color = "var(--secondary)";
    }

    toast.style.opacity = "1";
    toast.style.pointerEvents = "all";

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.pointerEvents = "none";
    }, 4000);
}

// --- Bind Button Event Handlers ---
function bindEvents() {
    elements.themeToggle.addEventListener("click", toggleTheme);
    elements.printBtn.addEventListener("click", handlePrint);

    // Switch role triggers
    if (elements.btnSwitchRole) elements.btnSwitchRole.addEventListener("click", openAdminAuthModal);
    if (elements.adminAuthCloseBtn) elements.adminAuthCloseBtn.addEventListener("click", closeAdminAuthModal);
    if (elements.btnAdminAuthSubmit) elements.btnAdminAuthSubmit.addEventListener("click", handleAdminAuthSubmit);
    if (elements.btnAdminAuthCancel) elements.btnAdminAuthCancel.addEventListener("click", closeAdminAuthModal);
    if (elements.adminPasswordInput) {
        elements.adminPasswordInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleAdminAuthSubmit();
        });
    }

    // Date range checker checkbox toggle
    if (elements.chkBatchAudit) {
        elements.chkBatchAudit.addEventListener("change", () => {
            if (elements.chkBatchAudit.checked) {
                elements.batchDateContainer.style.display = "flex";
                // Pre-populate range dates with the active date
                const activeVal = elements.dateInput.value;
                elements.batchStartDate.value = activeVal;
                elements.batchEndDate.value = activeVal;
            } else {
                elements.batchDateContainer.style.display = "none";
            }
        });
    }

    // Section submit buttons
    if (elements.btnSubmitR1) elements.btnSubmitR1.addEventListener("click", () => saveSectionData("r1"));
    if (elements.btnSubmitR2) elements.btnSubmitR2.addEventListener("click", () => saveSectionData("r2"));
    if (elements.btnSubmitMeds) elements.btnSubmitMeds.addEventListener("click", () => saveSectionData("meds"));
    if (elements.btnSubmitDevices) elements.btnSubmitDevices.addEventListener("click", () => saveSectionData("devices"));
    if (elements.btnSubmitInst) elements.btnSubmitInst.addEventListener("click", () => saveSectionData("instruments"));
    if (elements.btnSubmitSupervisor) elements.btnSubmitSupervisor.addEventListener("click", handleSupervisorSubmit);

    // Save print footers
    const savePrintFootersBtn = document.getElementById("btn-save-print-footers");
    if (savePrintFootersBtn) {
        savePrintFootersBtn.addEventListener("click", () => {
            const sheet1 = document.getElementById("edit-footer-sheet1").value.trim();
            const sheet2 = document.getElementById("edit-footer-sheet2").value.trim();
            const sheet3 = document.getElementById("edit-footer-sheet3").value.trim();

            const newFooters = { sheet1, sheet2, sheet3 };
            localStorage.setItem("printFooters", JSON.stringify(newFooters));
            printFooters = newFooters;
            showToast("列印報表備註說明儲存成功！", "success");
            postToCloud({ action: "syncPrintFooters", printFooters: newFooters });
        });
    }

    // Date input change
    if (elements.dateInput) {
        elements.dateInput.addEventListener("change", () => {
            loadRecordForDate(elements.dateInput.value);
        });
    }

    // Monthly print button in history tab
    const printMonthlyBtn = document.getElementById("print-monthly-report-btn");
    if (printMonthlyBtn) {
        printMonthlyBtn.addEventListener("click", () => {
            const monthVal = elements.monthSelect.value;
            if (!monthVal) {
                showToast("請選擇月份！", "warning");
                return;
            }
            const [year, month] = monthVal.split("-").map(Number);
            const monthlyContainer = document.getElementById("print-monthly-container");
            if (monthlyContainer) {
                monthlyContainer.innerHTML = generateMonthlyReportHTML(year, month);
                window.print();
            }
        });
    }

    // Detail Modal actions
    elements.modalCloseBtn.addEventListener("click", closeDetailsModal);
    elements.modalCloseFooterBtn.addEventListener("click", closeDetailsModal);
    elements.modalDeleteBtn.addEventListener("click", handleDeleteLog);
    elements.modalPrintBtn.addEventListener("click", handlePrintSelectedLog);

    elements.detailModal.addEventListener("click", (e) => {
        if (e.target === elements.detailModal) {
            closeDetailsModal();
        }
    });

    // Employee modal triggers
    elements.btnManageEmployeesTrigger.addEventListener("click", openEmployeeModal);
    elements.employeeModalCloseBtn.addEventListener("click", closeEmployeeModal);
    elements.employeeModalCloseFooterBtn.addEventListener("click", closeEmployeeModal);
    elements.employeeModal.addEventListener("click", (e) => {
        if (e.target === elements.employeeModal) {
            closeEmployeeModal();
        }
    });
    elements.btnAddEmployee.addEventListener("click", handleAddEmployee);
    elements.empFileImport.addEventListener("change", handleFileImport);

    // Items modal triggers
    elements.btnManageItemsTrigger.addEventListener("click", openItemsModal);
    elements.itemsModalCloseBtn.addEventListener("click", closeItemsModal);
    elements.itemsModalCloseFooterBtn.addEventListener("click", closeItemsModal);
    elements.itemsModal.addEventListener("click", (e) => {
        if (e.target === elements.itemsModal) {
            closeItemsModal();
        }
    });
    elements.itemCatSelect.addEventListener("change", renderConfigItemsList);
    elements.btnAddChecklistItem.addEventListener("click", handleAddChecklistItem);
}
