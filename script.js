let calendar;
let historyTasks = JSON.parse(localStorage.getItem('historyTasks')) || [];

function showToast(message = "Saved!") {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 3000);
}

document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    editable: true,
    selectable: true,
    eventClick: function (info) {
      if (confirm(`Mark task "${info.event.title}" as done?`)) {
        moveToHistory(info.event);
      }
    },
    events: loadEvents()
  });
  calendar.render();
  displayTaskList();
  displayHistory();

  document.getElementById('historyBtn').onclick = () => {
    document.getElementById('historyModal').style.display = 'flex';
  };
  document.getElementById('closeHistory').onclick = () => {
    document.getElementById('historyModal').style.display = 'none';
  };
  window.onclick = (e) => {
    if (e.target === document.getElementById('historyModal')) {
      document.getElementById('historyModal').style.display = 'none';
    }
  };
});

document.getElementById('taskForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const task = document.getElementById('task').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;

  const dateTime = `${date}T${time}`;
  calendar.addEvent({
    title: task,
    start: dateTime
  });

  saveEvents();
  displayTaskList();
  showToast("Task added!");
  this.reset();
});

function saveEvents() {
  const events = calendar.getEvents().map(e => ({
    title: e.title,
    start: e.start.toISOString()
  }));
  localStorage.setItem('calendarEvents', JSON.stringify(events));
}
function loadEvents() {
  return JSON.parse(localStorage.getItem('calendarEvents') || '[]');
}

function displayTaskList() {
  const todayList = document.getElementById('todayList');
  const upcomingList = document.getElementById('upcomingList');
  todayList.innerHTML = '';
  upcomingList.innerHTML = '';

  const events = calendar.getEvents();
  const today = new Date().toDateString();

  events.forEach((e, index) => {
    const li = document.createElement('li');
    const date = e.start.toLocaleDateString();
    const time = e.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let badge = '';

    if (e.start.toDateString() === today) {
      badge = `<span class="task-badge">Today</span>`;
      li.innerHTML = `
        ${badge}
        <span><strong>${date}</strong> @ ${time} — ${e.title}</span>
        <div>
          <button class="delete-btn" onclick="moveToHistory(calendar.getEvents()[${index}])">Done</button>
        </div>
      `;
      todayList.appendChild(li);
    } else if (e.start > new Date()) {
      badge = `<span class="task-badge">Upcoming</span>`;
      li.innerHTML = `
        ${badge}
        <span><strong>${date}</strong> @ ${time} — ${e.title}</span>
        <div>
          <button class="delete-btn" onclick="moveToHistory(calendar.getEvents()[${index}])">Done</button>
        </div>
      `;
      upcomingList.appendChild(li);
    }
  });
}

function moveToHistory(event) {
  historyTasks.push({
    title: event.title,
    start: event.start.toISOString()
  });
  event.remove();
  saveEvents();
  saveHistory();
  displayTaskList();
  displayHistory();
  showToast("Moved to History!");
}

function displayHistory() {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = '';
  historyTasks.forEach((task, index) => {
    const date = new Date(task.start);
    const li = document.createElement('li');
    li.innerHTML = `<span><strong>${date.toLocaleDateString()}</strong> @ ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${task.title}</span>
                    <div>
                      <button class="restore-btn" onclick="restoreTask(${index})">Restore</button>
                      <button class="permanent-btn" onclick="deleteForever(${index})">Delete</button>
                    </div>`;
    historyList.appendChild(li);
  });
}
function restoreTask(index) {
  const task = historyTasks[index];
  calendar.addEvent(task);
  historyTasks.splice(index, 1);
  saveEvents();
  saveHistory();
  displayTaskList();
  displayHistory();
  showToast("Task restored!");
}
function deleteForever(index) {
  historyTasks.splice(index, 1);
  saveHistory();
  displayHistory();
  showToast("Task permanently deleted!");
}
function saveHistory() {
  localStorage.setItem('historyTasks', JSON.stringify(historyTasks));
}
