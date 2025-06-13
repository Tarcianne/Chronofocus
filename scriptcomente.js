// Pomodoro avançado com XP, metas, histórico e controle de foco

// 🕒 Constantes e variáveis globais
const WORK_TIME = 25 * 60; // Tempo de trabalho: 25 minutos em segundos
const BREAK_TIME = 5 * 60;  // Tempo de pausa: 5 minutos em segundos
let timer = WORK_TIME;      // Tempo restante atual
let timerInterval = null;   // Intervalo do cronômetro
let isRunning = false;      // Status do cronômetro
let phase = 'trabalho';     // Fase atual: 'trabalho' ou 'pausa'
let xp = parseInt(localStorage.getItem('pomodoroXp')) || 0; // XP salvo ou 0
let taskName = '';          // Nome da tarefa atual
let taskSaved = false;      // Status se a tarefa foi salva
let focusTimeoutId = null;  // ID do timeout de foco

// Histórico e metas salvos no localStorage
let history = JSON.parse(localStorage.getItem('pomodoroHistory')) || [];
let metas = JSON.parse(localStorage.getItem('pomodoroMetas')) || [];

// 🕒 Converte segundos para MM:SS
function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
}

// 🕒 Atualiza o visor do cronômetro e a barra de progresso
function updateTimerDisplay() {
  document.getElementById('timerDisplay').textContent = formatTime(timer);
  const total = phase === 'trabalho' ? WORK_TIME : BREAK_TIME;
  const percent = ((total - timer) / total) * 100;
  document.getElementById('progress').style.width = percent + '%';
}

// ⭐ Atualiza o visor de XP
function updateXpDisplay() {
  document.getElementById('xp').textContent = 'XP: ' + xp;
}

// 📋 Salva o nome da tarefa e atualiza interface
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

// ▶️ Inicia a fase de trabalho
function startWork() {
  if (!taskSaved) {
    alert('Salve o nome da tarefa antes de iniciar.');
    return;
  }
  phase = 'trabalho';
  timer = WORK_TIME;
  startTimer();
}

// ☕ Inicia a fase de pausa
function startBreak() {
  pauseTimer();
  phase = 'pausa';
  timer = BREAK_TIME;
  startTimer();
}

// ▶️ Inicia o cronômetro com XP e foco
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

// ⏸️ Pausa o cronômetro e o timeout de foco
function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  clearTimeout(focusTimeoutId);
  resetFocusAlert();
}

// 🔄 Reseta o cronômetro para o início da fase atual
function resetTimer() {
  pauseTimer();
  timer = phase === 'trabalho' ? WORK_TIME : BREAK_TIME;
  updateTimerDisplay();
  resetFocusAlert();
}

// 💾 Salva o histórico no localStorage e atualiza a interface
function saveHistory() {
 localStorage.setItem('pomodoroHistory', JSON.stringify(history));
 renderHistory();
 }

// 📚 Exibe o histórico de sessões na interface
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

// 🗑️ Limpa todo o histórico e reseta XP
function clearHistory() {
   if (!confirm('Apagar histórico? XP será zerado.')) return;
   history = [];
   xp = 0;
   updateXpDisplay();
   saveXp();
   saveHistory();
  }

// 🎯 Exibe a lista de metas com opções de marcar ou excluir
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

// ➕ Adiciona nova meta
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

// ✔️ Alterna estado de concluída de uma meta
function toggleMeta(idx) {
  metas[idx].completed = !metas[idx].completed;
  saveMetas();
  renderMetas();
}

// 🗑️ Remove uma meta
function deleteMeta(idx) {
  metas.splice(idx, 1);
  saveMetas();
  renderMetas();
}

// 💾 Salva metas no localStorage
function saveMetas() {
  localStorage.setItem('pomodoroMetas', JSON.stringify(metas));
}

// 💾 Salva XP no localStorage
function saveXp() {
localStorage.setItem('pomodoroXp', xp);
}

// 🔔 Foco
const FOCUS_LOST_TIME = 5 * 60 * 1000; // 5 minutos

// ⏲️ Cria o timeout que alerta se perder o foco
function updateFocusTimers() {
  clearTimeout(focusTimeoutId);
  resetFocusAlert();
  focusTimeoutId = setTimeout(() => {
    showFocusAlert('Volte ao foco! Você está longe do computador.');
  }, FOCUS_LOST_TIME);
}

// 🧼 Esconde alerta de foco
function resetFocusAlert() {
  const alertDiv = document.getElementById('focusAlert');
  alertDiv.style.display = 'none';
  alertDiv.textContent = '';
}

// 🚨 Mostra mensagem de alerta na interface
function showFocusAlert(msg) {
  const alertDiv = document.getElementById('focusAlert');
  alertDiv.style.display = 'block';
  alertDiv.textContent = msg;
}

// 🧠 Quando sai da aba, reinicia o timer de foco
window.addEventListener('blur', () => {
  if (isRunning && phase === 'trabalho') updateFocusTimers();
});

// 👀 Quando volta para aba, reseta e reinicia o timer de foco
window.addEventListener('focus', () => {
  if (isRunning) {
    clearTimeout(focusTimeoutId);
    resetFocusAlert();
    updateFocusTimers();
  }
});

// 🧭 Controla troca de abas na interface
function showTab(tabId, evt) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  evt.target.classList.add('active');
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
}

// 🚀 Inicialização da interface
function init() {
  updateTimerDisplay();
  updateXpDisplay();
  renderHistory();
  renderMetas();
}

init();
