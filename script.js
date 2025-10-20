class SchedEase {
    constructor() {
        this.key = 'schedEase_neon_v2';
        this.tasks = JSON.parse(localStorage.getItem(this.key)) || [];
        this.selectedDate = new Date();
        this.cache();
        this.bind();
        this.updateClock();
        this.renderCalendar();
        this.loadDashboard();
        this.createParticles();
        setInterval(() => this.updateClock(), 60000);
    }

    cache() {
        const q = s => document.querySelector(s);
        this.el = {
            greeting: q('#greeting'),
            date: q('#currentDateTime'),
            month: q('#currentMonthYear'),
            addBtn: q('#addTaskBtn'),
            prevBtn: q('#prevMonthBtn'),
            nextBtn: q('#nextMonthBtn'),
            upcomingList: q('#upcomingTasksList'),
            calendarGrid: q('#calendarGrid'),
            total: q('#totalTasks'),
            done: q('#completedTasks'),
            bar: q('#progressBar'),
            fCat: q('#filterCategory'),
            fPri: q('#filterPriority'),
            viewAll: q('#viewAllTasksBtn'),
            histBtn: q('#taskHistoryBtn'),
            dash: q('#dashboardView'),
            allView: q('#allTasksView'),
            histView: q('#historyView'),
            allBox: q('#allTasksContainer'),
            histBox: q('#historyContainer'),
            search: q('#searchTasks'),
            modal: q('#taskModal'),
            modalTitle: q('#modalTitle'),
            id: q('#taskId'),
            title: q('#taskTitle'),
            desc: q('#taskDescription'),
            due: q('#taskDueDate'),
            cat: q('#taskCategory'),
            pri: q('#taskPriority'),
            save: q('#saveTaskBtn'),
            close: q('#closeModalBtn'),
            cancel: q('#cancelBtn')
        };
    }

    bind() {
        this.el.addBtn.onclick = () => this.openModal('Add Task');
        this.el.save.onclick = () => this.saveTask();
        this.el.close.onclick = this.el.cancel.onclick = () => this.closeModal();
        this.el.prevBtn.onclick = () => this.changeMonth(-1);
        this.el.nextBtn.onclick = () => this.changeMonth(1);
        this.el.viewAll.onclick = () => this.showAll();
        this.el.histBtn.onclick = () => this.showHistory();
        this.el.fCat.onchange = this.el.fPri.onchange = () => this.renderAll();
        if (this.el.search) this.el.search.oninput = () => this.renderAll();

        this.el.modal.addEventListener('click', e => { if (e.target === this.el.modal) this.closeModal(); });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') this.closeModal();
            if (e.key === 'ArrowLeft') this.changeMonth(-1);
            if (e.key === 'ArrowRight') this.changeMonth(1);
            if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.openModal('Quick Add');
            }
        });

        // Delegated handlers for upcoming list
        this.el.upcomingList.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            this.handleAction(action, id);
        });

        // Delegated handlers for All Tasks container
        this.el.allBox.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            this.handleAction(action, id);
        });

        // Delegated handlers for History container
        this.el.histBox.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            this.handleAction(action, id);
        });
    }

    // central action dispatcher
    handleAction(action, id) {
        if (!action || !id) return;
        if (action === 'toggle') this.toggleTask(id);
        else if (action === 'edit') this.editTask(id);
        else if (action === 'delete') this.deleteTask(id);
    }

    updateClock() {
        const n = new Date();
        this.el.date.textContent = n.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + n.toLocaleDateString();
        this.el.month.textContent = this.selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
        const h = n.getHours();
        this.el.greeting.textContent = h < 12 ? 'Good morning ☀' : h < 18 ? 'Good afternoon 🌤' : 'Good evening 🌙';
    }

    changeMonth(d) {
        this.selectedDate.setMonth(this.selectedDate.getMonth() + d);
        this.renderCalendar();
    }

    renderCalendar() {
        const y = this.selectedDate.getFullYear(), m = this.selectedDate.getMonth();
        const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
        this.el.calendarGrid.innerHTML = '';
        for (let i = 0; i < first.getDay(); i++) { this.el.calendarGrid.appendChild(document.createElement('div')); }
        for (let d = 1; d <= days; d++) {
            const cell = document.createElement('div'); cell.textContent = d;
            const date = new Date(y, m, d);
            if (this.isToday(date)) cell.classList.add('today');
            if (this.hasTasks(date)) cell.classList.add('has-tasks');
            cell.onclick = () => this.showDate(date);
            this.el.calendarGrid.appendChild(cell);
        }
    }

    isToday(d) { return d.toDateString() === new Date().toDateString(); }
    hasTasks(d) { return this.tasks.some(t => t.due && new Date(t.due).toDateString() === d.toDateString()); }

    openModal(title) {
        this.el.modal.style.display = 'flex';
        this.el.modalTitle.textContent = title;
        this.el.title.value = this.el.desc.value = '';
        this.el.id.value = '';
        const t = new Date(); t.setDate(t.getDate() + 1);
        this.el.due.value = t.toISOString().split('T')[0];
        this.el.title.focus();
    }
    closeModal() { this.el.modal.style.display = 'none'; }

    saveTask() {
        const id = this.el.id.value || 't' + Date.now();
        const payload = {
            id,
            title: this.el.title.value.trim(),
            description: this.el.desc.value.trim(),
            due: this.el.due.value || null,
            category: this.el.cat.value,
            priority: this.el.pri.value,
            completed: false,
            createdAt: new Date().toISOString()
        };
        if (!payload.title) { alert('Enter task title'); return; }
        const idx = this.tasks.findIndex(x => x.id === id);
        if (idx >= 0) {
            // preserve completed state & timestamps when editing
            payload.completed = this.tasks[idx].completed;
            payload.completedAt = this.tasks[idx].completedAt || null;
            payload.createdAt = this.tasks[idx].createdAt || payload.createdAt;
            this.tasks[idx] = payload;
        } else {
            this.tasks.push(payload);
        }
        this.save(); this.closeModal(); this.loadDashboard();
    }

    editTask(id) {
        const t = this.tasks.find(x => x.id === id); if (!t) return;
        this.openModal('Edit Task');
        this.el.id.value = t.id;
        this.el.title.value = t.title;
        this.el.desc.value = t.description || '';
        this.el.due.value = t.due || '';
        this.el.cat.value = t.category || 'Assignment';
        this.el.pri.value = t.priority || 'medium';
    }

    deleteTask(id) {
        if (!confirm('Delete this task?')) return;
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
        this.loadDashboard(); // refresh all views immediately
    }

    toggleTask(id) {
        const t = this.tasks.find(x => x.id === id);
        if (!t) return;
        t.completed = !t.completed;
        t.completedAt = t.completed ? new Date().toISOString() : null;
        this.save(); this.loadDashboard();
    }

    showDate(d) {
        const list = this.tasks.filter(t => t.due && new Date(t.due).toDateString() === d.toDateString());
        if (!list.length) { alert('No tasks on ' + d.toDateString()); return; }
        alert(list.map(x => `• ${x.title} (${x.category})`).join('\n'));
    }

    loadDashboard() {
        this.hideViews(); this.el.dash.style.display = 'block';
        this.renderCalendar(); this.renderUpcoming(); this.updateStats();
    }

    hideViews() { this.el.dash.style.display = this.el.allView.style.display = this.el.histView.style.display = 'none'; }
    showAll() { this.hideViews(); this.el.allView.style.display = 'block'; this.renderAll(); }
    showHistory() { this.hideViews(); this.el.histView.style.display = 'block'; this.renderHistory(); }

    renderUpcoming() {
        const now = new Date();
        const list = this.tasks.filter(t => !t.completed && t.due && new Date(t.due) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
            .sort((a, b) => new Date(a.due) - new Date(b.due)).slice(0, 7);
        this.el.upcomingList.innerHTML = list.length ? list.map(t => `
            <li class="task-item ${t.completed ? 'completed' : ''} priority-${t.priority}">
                <div>
                    <div class="task-title">${this.escape(t.title)}</div>
                    <div class="task-meta">${t.due ? this.formatDate(t.due) : 'No due'} • ${t.category}</div>
                </div>
                <div class="task-actions">
                    <button data-action="toggle" data-id="${t.id}" class="btn"> ${t.completed ? '↺' : '✓'} </button>
                    <button data-action="edit" data-id="${t.id}" class="btn">✏️</button>
                    <button data-action="delete" data-id="${t.id}" class="btn">🗑️</button>
                </div>
            </li>`).join('') : '<li class="empty">No upcoming tasks</li>';
    }

    renderAll() {
        const c = this.el.fCat.value, p = this.el.fPri.value, s = (this.el.search?.value || '').toLowerCase();
        let list = [...this.tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (c !== 'all') list = list.filter(x => x.category === c);
        if (p !== 'all') list = list.filter(x => x.priority === p);
        if (s) list = list.filter(x => (x.title + ' ' + (x.description || '')).toLowerCase().includes(s));
        this.el.allBox.innerHTML = list.length ? list.map(t => `
            <div class="task-item ${t.completed ? 'completed' : ''} priority-${t.priority}">
                <div>
                    <div class="task-title">${this.escape(t.title)}</div>
                    <div class="task-meta">${t.due ? this.formatDate(t.due) : 'No due'} • ${t.category} • ${t.priority}</div>
                </div>
                <div class="task-actions">
                    <button data-action="toggle" data-id="${t.id}" class="btn">${t.completed ? '↺' : '✓'}</button>
                    <button data-action="edit" data-id="${t.id}" class="btn">✏️</button>
                    <button data-action="delete" data-id="${t.id}" class="btn">🗑️</button>
                </div>
            </div>`).join('') : '<div class="empty">No tasks</div>';
    }

    renderHistory() {
        const l = this.tasks.filter(t => t.completed).sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
        this.el.histBox.innerHTML = l.length ? l.map(t => `
            <div class="task-item completed priority-${t.priority}">
                <div>
                    <div class="task-title">${this.escape(t.title)}</div>
                    <div class="task-meta">${t.due ? this.formatDate(t.due) : 'No due'} • ${t.category}</div>
                </div>
                <div class="task-actions">
                    <button data-action="toggle" data-id="${t.id}" class="btn">↺</button>
                    <button data-action="delete" data-id="${t.id}" class="btn">🗑️</button>
                </div>
            </div>`).join('') : '<div class="empty">No completed</div>';
    }

    updateStats() {
        const total = this.tasks.length, done = this.tasks.filter(t => t.completed).length;
        this.el.total.textContent = total; this.el.done.textContent = done;
        this.el.bar.style.width = total ? Math.round((done / total) * 100) + '%' : '0%';
    }

    save() { localStorage.setItem(this.key, JSON.stringify(this.tasks)); }
    formatDate(d) { if (!d) return 'No due'; const dt = new Date(d); return dt.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); }
    escape(s = '') { return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
    
    createParticles() {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Random position
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            
            // Random size
            const size = Math.random() * 4 + 2;
            
            // Random color from our palette
            const colors = ['#7C4DFF', '#00D4FF', '#FF00E6'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Apply styles
            particle.style.left = `${left}%`;
            particle.style.top = `${top}%`;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = color;
            particle.style.animationDelay = `${Math.random() * 15}s`;
            
            particlesContainer.appendChild(particle);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => window.app = new SchedEase());