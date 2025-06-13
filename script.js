const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;
let timer = WORK_TIME;
let timerInterval = null;
let isRunning = false;
let phase = 'trabalho';
let xp = parseInt(localStorage.getItem('pomodoroXp')) || 0;
let taskName = '';
let taskSaved = false;
let focusTimeoutId = null;

let history = JSON.parse(localStorage.getItem('pomodoroHistory')) || [];
let metas = JSON.parse(localStorage.getItem('pomodoroMetas')) || [];

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
}

function updateTimerDisplay() {
  document.getElementById('timerDisplay').textContent = formatTime(timer);
  // document.getElementById('logo').textContent = 'Chronofocus - ' + (phase === 'trabalho' ? 'Foco' : 'Descanso'); 
  const total = phase === 'trabalho' ? WORK_TIME : BREAK_TIME;
  const percent = ((total - timer) / total) * 100;
  document.getElementById('progress').style.width = percent + '%';
}

function updateXpDisplay() {
  document.getElementById('xp').textContent = 'XP: ' + xp;
}

function saveTaskName() {
  const input = document.getElementById('taskInput');
  const name = input.value.trim();
  if (!name) {
    alert('Digite o nome da tarefa antes de salvar.');
    return;
  }
  taskName = name;
  taskSaved = true;
  input.style.display = 'none';
  document.querySelector('#pomodoroTab button[onclick="saveTaskName()"]').style.display = 'none';
  const display = document.getElementById('taskNameDisplay');
  display.textContent = 'Tarefa: ' + taskName;
  display.style.display = 'block';
}

function startWork() {
  if (!taskSaved) {
    alert('Salve o nome da tarefa antes de iniciar.');
    return;
  }
  phase = 'trabalho';
  timer = WORK_TIME;
  startTimer();
}

// CORREÇÃO AQUI
function startBreak() {
  pauseTimer();      // para qualquer timer que estiver rodando
  phase = 'pausa';
  timer = BREAK_TIME;
  startTimer();
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  clearInterval(timerInterval);
  updateFocusTimers();
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timer--;
    updateTimerDisplay();
    if (phase === 'trabalho') {
     xp++;
     updateXpDisplay();
     saveXp();
     }

    if (timer <= 0) {
      pauseTimer();
      alert(`Tempo de ${phase} encerrado.`);
      history.push({
        task: phase === 'trabalho' ? taskName : 'Descanso',
        phase: phase,
        duration: phase === 'trabalho' ? WORK_TIME : BREAK_TIME,
        timestamp: Date.now()
      });
      saveHistory();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  clearTimeout(focusTimeoutId);
  resetFocusAlert();
}

function resetTimer() {
  pauseTimer();
  timer = phase === 'trabalho' ? WORK_TIME : BREAK_TIME;
  updateTimerDisplay();
  resetFocusAlert();
}


function saveHistory() {
 localStorage.setItem('pomodoroHistory', JSON.stringify(history));
 renderHistory();
 }


function renderHistory() {
  const ul = document.getElementById('history');
 ul.innerHTML = '';
 history.forEach(entry => {
 const li = document.createElement('li');
 const date = new Date(entry.timestamp);
 li.textContent = `${entry.phase} da tarefa "${entry.task}" em ${date.toLocaleString()}`;
 ul.appendChild(li);
 })
}


 function clearHistory() {
   if (!confirm('Apagar histórico? XP será zerado.')) return;
   history = [];
   xp = 0;
   updateXpDisplay();
   saveXp(); // ← Aqui
   saveHistory();
  }

function renderMetas() {
  const ul = document.getElementById('metaList');
  ul.innerHTML = '';
  metas.forEach((meta, idx) => {
    const li = document.createElement('li');
    li.textContent = meta.text;
    if (meta.completed) li.style.textDecoration = 'line-through';
    li.onclick = () => toggleMeta(idx);
    const btn = document.createElement('button');
    btn.textContent = '🗑️';
    btn.className = 'lixeira';
    btn.onclick = e => {
      e.stopPropagation();
      deleteMeta(idx);
    };
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

function addMeta() {
  const input = document.getElementById('metaInput');
  const text = input.value.trim();
  if (!text) {
    alert('Digite uma meta.');
    return;
  }
  metas.push({ text, completed: false });
  input.value = '';
  saveMetas();
  renderMetas();
}

function toggleMeta(idx) {
  metas[idx].completed = !metas[idx].completed;
  saveMetas();
  renderMetas();
}

function deleteMeta(idx) {
  metas.splice(idx, 1);
  saveMetas();
  renderMetas();
}

function saveMetas() {
  localStorage.setItem('pomodoroMetas', JSON.stringify(metas));
}

function saveXp() {
localStorage.setItem('pomodoroXp', xp);
}


// Foco
const FOCUS_LOST_TIME = 5 * 60 * 1000;
function updateFocusTimers() {
  clearTimeout(focusTimeoutId);
  resetFocusAlert();
  focusTimeoutId = setTimeout(() => {
    showFocusAlert('Volte ao foco! Você está longe do computador.');
  }, FOCUS_LOST_TIME);
}

function resetFocusAlert() {
  const alertDiv = document.getElementById('focusAlert');
  alertDiv.style.display = 'none';
  alertDiv.textContent = '';
}

function showFocusAlert(msg) {
  const alertDiv = document.getElementById('focusAlert');
  alertDiv.style.display = 'block';
  alertDiv.textContent = msg;
}

window.addEventListener('blur', () => {
  if (isRunning && phase === 'trabalho') updateFocusTimers();
});

window.addEventListener('focus', () => {
  if (isRunning) {
    clearTimeout(focusTimeoutId);
    resetFocusAlert();
    updateFocusTimers();
  }
});

function showTab(tabId, evt) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  evt.target.classList.add('active');
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
}

function init() {
  updateTimerDisplay();
  updateXpDisplay();
  renderHistory();
  renderMetas();
}

init();