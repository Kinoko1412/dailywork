import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, set, get, remove } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyBY5U4zkq90mE_IardNvQ_1gczcrzmYAbc",
    authDomain: "dailywork-45917.firebaseapp.com",
    databaseURL: "https://dailywork-45917-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dailywork-45917",
    storageBucket: "dailywork-45917.firebasestorage.app",
    messagingSenderId: "143194504484",
    appId: "1:143194504484:web:262ce079f2e9ee8783c7b1",
    measurementId: "G-E6ZDCH3YSQ"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// 全局變量
let currentWeek = getCurrentWeek();
let selectedCell = null;

// 初始化日曆
function initializeCalendar() {
    const calendarBody = document.getElementById("calendar-body");
    updateWeekDisplay();

    // 生成時間格子
    for (let hour = 8; hour <= 22; hour++) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${hour}:00</td>`;
        
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement("td");
            cell.className = "task-cell";
            cell.contentEditable = true;
            cell.dataset.day = getDayName(i);
            cell.dataset.time = `${hour}:00`;
            row.appendChild(cell);
        }
        calendarBody.appendChild(row);
    }

    // 載入當前週的資料
    loadTasks();
}

// 獲取當前週數
function getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diff / oneWeek);
}

// 更新週數顯示
function updateWeekDisplay() {
    const weekDisplay = document.getElementById("week-display");
    weekDisplay.textContent = `Week ${currentWeek}`;
}

// 獲取星期名稱
function getDayName(index) {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[index];
}

// 保存任務
async function saveTask(day, time, content) {
    if (!content.trim()) return;

    try {
        await set(ref(database, `tasks/${currentWeek}/${day}/${time}`), {
            content: content,
            timestamp: new Date().toISOString()
        });
        console.log("Task saved successfully");
    } catch (error) {
        console.error("Error saving task:", error);
    }
}

// 載入任務
async function loadTasks() {
    try {
        const snapshot = await get(ref(database, `tasks/${currentWeek}`));
        clearCalendar();
        
        if (snapshot.exists()) {
            const tasks = snapshot.val();
            Object.entries(tasks).forEach(([day, dayTasks]) => {
                Object.entries(dayTasks).forEach(([time, taskData]) => {
                    const cell = document.querySelector(
                        `td[data-day="${day}"][data-time="${time}"]`
                    );
                    if (cell) {
                        cell.textContent = taskData.content;
                    }
                });
            });
        }
    } catch (error) {
        console.error("Error loading tasks:", error);
    }
}

// 清空日曆
function clearCalendar() {
    document.querySelectorAll('.task-cell').forEach(cell => {
        cell.textContent = '';
    });
}

// 刪除任務
async function deleteTask(day, time) {
    try {
        await remove(ref(database, `tasks/${currentWeek}/${day}/${time}`));
        console.log("Task deleted successfully");
    } catch (error) {
        console.error("Error deleting task:", error);
    }
}

// 事件監聽器設置
function setupEventListeners() {
    const saveBtn = document.getElementById('save-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');

    document.querySelectorAll('.task-cell').forEach(cell => {
        cell.addEventListener('focus', () => {
            selectedCell = cell;
            saveBtn.style.display = 'block';
            deleteBtn.style.display = 'block';
        });
    });

    saveBtn.addEventListener('click', async () => {
        if (selectedCell) {
            const content = selectedCell.textContent;
            const { day, time } = selectedCell.dataset;
            await saveTask(day, time, content);
            saveBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
        }
    });

    deleteBtn.addEventListener('click', async () => {
        if (selectedCell) {
            const { day, time } = selectedCell.dataset;
            await deleteTask(day, time);
            selectedCell.textContent = '';
            saveBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
        }
    });

    prevWeekBtn.addEventListener('click', () => {
        currentWeek--;
        updateWeekDisplay();
        loadTasks();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentWeek++;
        updateWeekDisplay();
        loadTasks();
    });

    // 點擊空白處時隱藏按鈕
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.task-cell') && 
            !e.target.closest('.action-btn')) {
            saveBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
            selectedCell = null;
        }
    });
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    initializeCalendar();
    setupEventListeners();
});