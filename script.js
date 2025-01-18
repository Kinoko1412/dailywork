// Firebase 配置和初始化
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// 動態生成表格並添加打勾按鈕
const calendarBody = document.getElementById("calendar-body");
for (let hour = 8; hour <= 22; hour++) {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${hour}:00</td>
        ${'<td contenteditable="true" class="task-cell"><span class="checkmark-btn">✔</span></td>'.repeat(7)}
    `;
    calendarBody.appendChild(row);
}

// 儲存任務到 Firebase
function saveTask(day, time, task) {
    const taskRef = ref(database, `tasks/${day}/${time}`);
    set(taskRef, task).then(() => {
        console.log(`Task saved for ${day} at ${time}: ${task}`);
    }).catch((error) => {
        console.error("Error saving task:", error);
    });
}

// 綁定打勾按鈕事件
document.querySelectorAll(".checkmark-btn").forEach(button => {
    button.addEventListener("click", () => {
        const cell = button.parentElement;
        const row = cell.parentNode;
        const time = row.children[0].textContent; // 獲取時間
        const day = document.querySelectorAll("th")[cell.cellIndex].textContent; // 獲取星期
        const task = cell.textContent.trim(); // 獲取格子中的內容（去除多餘的空白）

        // 儲存任務到 Firebase
        if (task) {
            saveTask(day, time, task);
        }
    });
});

// 從 Firebase 讀取數據並顯示到表格
function loadTasks() {
    const tasksRef = ref(database, "tasks");
    onValue(tasksRef, (snapshot) => {
        const tasks = snapshot.val();
        if (tasks) {
            for (const day in tasks) {
                for (const time in tasks[day]) {
                    const task = tasks[day][time];
                    document.querySelectorAll("tr").forEach(row => {
                        if (row.children[0].textContent === time) {
                            const index = Array.from(document.querySelectorAll("th")).findIndex(th => th.textContent === day);
                            if (index > 0) {
                                row.children[index].textContent = task;
                            }
                        }
                    });
                }
            }
        }
    });
}

// 初始加載數據
loadTasks();
