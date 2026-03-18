const taskForm = document.querySelector('#taskForm');
const taskBoard = document.querySelector('#taskBoard');
const template = document.querySelector('#taskItemTemplate');
const previewTitle = document.querySelector('#previewTitle');
const previewMessage = document.querySelector('#previewMessage');
const previewClock = document.querySelector('#previewClock');
const previewChannels = document.querySelector('#previewChannels');
const completePreview = document.querySelector('#completePreview');
const snoozePreview = document.querySelector('#snoozePreview');
const completionRate = document.querySelector('#completionRate');
const channelPills = Array.from(document.querySelectorAll('.channel-pill'));

const state = {
  tasks: [
    {
      id: crypto.randomUUID(),
      title: '운동 가기',
      message: '지금 출발하지 않으면 오늘도 미뤄집니다.',
      time: '19:00',
      snooze: '10',
      channels: ['sms', 'email'],
      completed: false,
    },
    {
      id: crypto.randomUUID(),
      title: '영어 회화 30분',
      message: '오늘 목표는 짧게라도 시작하는 것입니다.',
      time: '21:00',
      snooze: '15',
      channels: ['email'],
      completed: false,
    },
  ],
};

const channelNames = {
  sms: 'SMS',
  email: '이메일',
  kakao: '카카오 알림톡',
};

function selectedChannels() {
  return Array.from(taskForm.querySelectorAll('input[name="channels"]:checked')).map(function (input) {
    return input.value;
  });
}

function syncPills() {
  channelPills.forEach(function (pill) {
    const checked = pill.querySelector('input').checked;
    pill.classList.toggle('selected', checked);
  });
}

function renderPreview() {
  const title = document.querySelector('#taskTitle').value.trim() || '운동 가기';
  const message = document.querySelector('#taskMessage').value.trim() || '지금 출발하지 않으면 오늘도 미뤄집니다.';
  const time = document.querySelector('#taskTime').value || '19:00';
  const snooze = document.querySelector('#snoozeTime').value;
  const channels = selectedChannels();

  previewTitle.textContent = title;
  previewMessage.textContent = message;
  previewClock.textContent = time;
  snoozePreview.textContent = snooze + '분 뒤 다시';
  previewChannels.innerHTML = '';

  const fallback = channels.length ? channels : ['sms'];
  fallback.forEach(function (channel) {
    const span = document.createElement('span');
    span.textContent = channelNames[channel];
    previewChannels.appendChild(span);
  });
}

function calculateCompletionRate() {
  if (!state.tasks.length) {
    completionRate.textContent = '0%';
    return;
  }

  const completed = state.tasks.filter(function (task) {
    return task.completed;
  }).length;
  const rate = Math.round((completed / state.tasks.length) * 100);
  completionRate.textContent = String(rate) + '%';
}

function renderTasks() {
  taskBoard.innerHTML = '';

  state.tasks
    .slice()
    .sort(function (a, b) {
      return a.time.localeCompare(b.time);
    })
    .forEach(function (task) {
      const fragment = template.content.cloneNode(true);
      const card = fragment.querySelector('.task-card');
      const time = fragment.querySelector('.task-time');
      const title = fragment.querySelector('.task-title');
      const note = fragment.querySelector('.task-note');
      const channels = fragment.querySelector('.task-channels');
      const completeBtn = fragment.querySelector('.complete-btn');
      const snoozeBtn = fragment.querySelector('.snooze-btn');

      time.textContent = '예약 시간 ' + task.time;
      title.textContent = task.title;
      note.textContent = task.completed
        ? '완료 처리되었습니다. 실행 로그에 반영됩니다.'
        : task.message + ' · 미응답 시 ' + task.snooze + '분 뒤 재알림';

      task.channels.forEach(function (channel) {
        const span = document.createElement('span');
        span.textContent = channelNames[channel];
        channels.appendChild(span);
      });

      if (task.completed) {
        card.classList.add('completed');
        completeBtn.disabled = true;
        completeBtn.textContent = '완료됨';
      }

      completeBtn.addEventListener('click', function () {
        markComplete(task.id);
      });
      snoozeBtn.addEventListener('click', function () {
        snoozeTask(task.id);
      });
      taskBoard.appendChild(fragment);
    });

  calculateCompletionRate();
}

function markComplete(taskId) {
  state.tasks = state.tasks.map(function (task) {
    if (task.id === taskId) {
      return { ...task, completed: true };
    }
    return task;
  });
  renderTasks();
}

function snoozeTask(taskId) {
  state.tasks = state.tasks.map(function (task) {
    if (task.id !== taskId || task.completed) {
      return task;
    }

    const parts = task.time.split(':').map(Number);
    const totalMinutes = parts[0] * 60 + parts[1] + Number(task.snooze);
    const nextHours = String(Math.floor((totalMinutes % 1440) / 60)).padStart(2, '0');
    const nextMinutes = String(totalMinutes % 60).padStart(2, '0');

    return { ...task, time: nextHours + ':' + nextMinutes };
  });

  renderTasks();
}

function createTask(event) {
  event.preventDefault();

  const formData = new FormData(taskForm);
  const channels = selectedChannels();

  if (!channels.length) {
    window.alert('최소 1개의 발송 채널을 선택해야 합니다.');
    return;
  }

  state.tasks.unshift({
    id: crypto.randomUUID(),
    title: String(formData.get('title')).trim(),
    message: String(formData.get('message')).trim() || '지금 시작해야 오늘 할 일이 끝납니다.',
    time: String(formData.get('time')),
    snooze: String(formData.get('snooze')),
    channels: channels,
    completed: false,
  });

  taskForm.reset();
  document.querySelector('#taskTime').value = '19:00';
  document.querySelector('#snoozeTime').value = '10';
  taskForm.querySelector('input[value="sms"]').checked = true;
  taskForm.querySelector('input[value="email"]').checked = true;
  taskForm.querySelector('input[value="kakao"]').checked = false;
  syncPills();
  renderPreview();
  renderTasks();
}

channelPills.forEach(function (pill) {
  pill.addEventListener('change', function () {
    syncPills();
    renderPreview();
  });
});

['#taskTitle', '#taskMessage', '#taskTime', '#snoozeTime'].forEach(function (selector) {
  document.querySelector(selector).addEventListener('input', renderPreview);
});

completePreview.addEventListener('click', function () {
  if (state.tasks[0]) {
    markComplete(state.tasks[0].id);
  }
});

snoozePreview.addEventListener('click', function () {
  if (state.tasks[0]) {
    snoozeTask(state.tasks[0].id);
  }
});

taskForm.addEventListener('submit', createTask);

syncPills();
renderPreview();
renderTasks();
