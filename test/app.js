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
let draggedTask = null;


// 初始化日曆

// 初始化日曆
function initializeCalendar() {
    const calendarBody = document.getElementById("calendar-body");
    updateWeekDisplay();
    loadWeekDate();

    // 生成時間格子
    for (let hour = 8; hour <= 22; hour++) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${hour}:00</td>`;
        
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement("td");
            cell.className = "task-cell";
            cell.contentEditable = true;
            cell.draggable = true;
            cell.dataset.day = getDayName(i);
            cell.dataset.time = `${hour}:00`;
            cell.addEventListener('dragstart', handleDragStart);
            cell.addEventListener('dragend', handleDragEnd);
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('drop', handleDrop);
            row.appendChild(cell);
        }
        calendarBody.appendChild(row);
    }

    loadTasks();
}

// 拖拽相關函數
function handleDragStart(e) {
    draggedTask = {
        content: this.textContent,
        color: this.style.backgroundColor,
        sourceDay: this.dataset.day,
        sourceTime: this.dataset.time
    };
    this.classList.add('dragging');
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const targetCell = e.target;
    if (draggedTask && targetCell.classList.contains('task-cell')) {
        // 刪除原始任務
        deleteTask(draggedTask.sourceDay, draggedTask.sourceTime);
        
        // 保存到新位置
        saveTask(targetCell.dataset.day, targetCell.dataset.time, draggedTask.content, draggedTask.color);
        
        // 更新UI
        targetCell.textContent = draggedTask.content;
        targetCell.style.backgroundColor = draggedTask.color;
        
        // 清空原始位置
        const sourceCell = document.querySelector(
            `td[data-day="${draggedTask.sourceDay}"][data-time="${draggedTask.sourceTime}"]`
        );
        if (sourceCell) {
            sourceCell.textContent = '';
            sourceCell.style.backgroundColor = '';
        }
        
        draggedTask = null;
    }
}

// 保存週次日期
async function saveWeekDate(date) {
    try {
        await set(ref(database, `weekDates/${currentWeek}`), date);
        console.log("Week date saved successfully");
    } catch (error) {
        console.error("Error saving week date:", error);
    }
}

// 載入週次日期
async function loadWeekDate() {
    try {
        const snapshot = await get(ref(database, `weekDates/${currentWeek}`));
        if (snapshot.exists()) {
            document.getElementById('week-date').value = snapshot.val();
        }
    } catch (error) {
        console.error("Error loading week date:", error);
    }
}

// 保存任務
async function saveTask(day, time, content, color) {
    if (!content.trim()) return;

    try {
        await set(ref(database, `tasks/${currentWeek}/${day}/${time}`), {
            content: content,
            color: color || '#f0f0f0',
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
                        cell.style.backgroundColor = taskData.color;
                    }
                });
            });
        }
    } catch (error) {
        console.error("Error loading tasks:", error);
    }
}

// 設置事件監聽器
function setupEventListeners() {
    const saveBtn = document.getElementById('save-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const colorPicker = document.getElementById('color-picker');
    const weekDateInput = document.getElementById('week-date');
    
    // 顏色選擇器事件
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            if (selectedCell) {
                selectedCell.style.backgroundColor = option.dataset.color;
                colorPicker.style.display = 'none';
            }
        });
    });

    // 自定義顏色選擇器事件
    document.getElementById('custom-color').addEventListener('change', (e) => {
        if (selectedCell) {
            selectedCell.style.backgroundColor = e.target.value;
            colorPicker.style.display = 'none';
        }
    });

    // 週次日期輸入事件
    weekDateInput.addEventListener('change', (e) => {
        saveWeekDate(e.target.value);
    });

    document.querySelectorAll('.task-cell').forEach(cell => {
        cell.addEventListener('focus', () => {
            selectedCell = cell;
            saveBtn.style.display = 'block';
            deleteBtn.style.display = 'block';
            colorPicker.style.display = 'block';
        });
    });

    saveBtn.addEventListener('click', async () => {
        if (selectedCell) {
            const content = selectedCell.textContent;
            const color = selectedCell.style.backgroundColor;
            const { day, time } = selectedCell.dataset;
            await saveTask(day, time, content, color);
            saveBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
            colorPicker.style.display = 'none';
        }
    });

    deleteBtn.addEventListener('click', async () => {
        if (selectedCell) {
            const { day, time } = selectedCell.dataset;
            await deleteTask(day, time);
            selectedCell.textContent = '';
            selectedCell.style.backgroundColor = '';
            saveBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
            colorPicker.style.display = 'none';
        }
    });

    prevWeekBtn.addEventListener('click', () => {
        currentWeek--;
        updateWeekDisplay();
        loadTasks();
        loadWeekDate();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentWeek++;
        updateWeekDisplay();
        loadTasks();
        loadWeekDate();
    });

    // 點擊空白處時隱藏按鈕和顏色選擇器
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.task-cell') && 
            !e.target.closest('.action-btn') &&
            !e.target.closest('.color-picker')) {
            saveBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
            colorPicker.style.display = 'none';
            selectedCell = null;
        }
    });
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

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    initializeCalendar();
    setupEventListeners();
});