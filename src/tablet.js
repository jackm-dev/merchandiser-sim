const TASKS = [
  {
    type: 'OSA Check',
    location: 'Aisle 7 — Cough, Cold & Allergy',
    detail: 'Walk the aisle, identify gaps, restock from backroom',
    status: 'pending',
    accentColor: '#1565C0',
  },
  {
    type: 'PDQ Endcap Setup',
    location: 'Receiving → Main Aisle Endcap',
    detail: 'Collect AllerClear 24HR display from receiving area and set up',
    status: 'pending',
    accentColor: '#E65100',
  },
  {
    type: 'Category Reset',
    location: 'OTC Allergy — Aisle 7',
    detail: 'Pull all product and re-slot to planogram spec',
    status: 'pending',
    accentColor: '#2E7D32',
  },
];

const BADGE = {
  pending: { label: 'PENDING',     cls: 'badge-pending' },
  active:  { label: 'IN PROGRESS', cls: 'badge-active'  },
  done:    { label: 'COMPLETE',    cls: 'badge-done'    },
};

export class Tablet {
  constructor(controls) {
    this.controls       = controls;
    this.isOpen         = false;
    this.activeTaskIdx  = null;

    this._overlay    = document.getElementById('tablet-overlay');
    this._statusTime = document.getElementById('tablet-status-time');
    this._listEl     = document.getElementById('tablet-task-list');
    this._hudEl      = document.getElementById('hud');

    this._renderTasks();
    this._updateClock();
    setInterval(() => this._updateClock(), 30000);

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        this._onTab();
      }
    });
  }

  _onTab() {
    if (this.isOpen) {
      this.close();
    } else if (this.controls.isLocked) {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this._hudEl.classList.add('hidden');
    this._overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._overlay.classList.add('tablet-open');
      });
    });
    this.controls.unlock();
  }

  close() {
    this.isOpen = false;
    this._overlay.classList.remove('tablet-open');
    this._overlay.addEventListener('transitionend', () => {
      this._overlay.style.display = 'none';
    }, { once: true });
    this.controls.lock();
  }

  _updateClock() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    if (this._statusTime) this._statusTime.textContent = `${h}:${m}`;
  }

  _renderTasks() {
    this._listEl.innerHTML = TASKS.map((task, i) => {
      const badge = BADGE[task.status];
      const activeClass = task.status === 'active' ? ' active' : '';
      return `
        <div class="task-card${activeClass}" data-idx="${i}" style="border-left-color: ${task.accentColor}">
          <div class="task-card-top">
            <div class="task-type">${task.type}</div>
            <div class="task-badge ${badge.cls}">${badge.label}</div>
          </div>
          <div class="task-location">${task.location}</div>
          <div class="task-detail">${task.detail}</div>
        </div>`;
    }).join('');

    this._listEl.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('click', () => {
        const i = parseInt(card.dataset.idx, 10);
        this._selectTask(i);
      });
    });
  }

  _selectTask(i) {
    if (this.activeTaskIdx === i) return;

    if (this.activeTaskIdx !== null) {
      TASKS[this.activeTaskIdx].status = 'pending';
    }
    TASKS[i].status = 'active';
    this.activeTaskIdx = i;
    this._renderTasks();
  }
}
