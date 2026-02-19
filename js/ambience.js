/* --- CONFIGURAÇÃO --- */
const themesConfig = [
    { id: 'dark', type: 'color', bg: '#1a1a1a', card: '#252525', text: '#e0e0e0', accent: '#4CAF50' },
    { id: 'pastel-red', type: 'color', bg: '#FFADAD', card: 'rgba(255,255,255,0.85)', text: '#4A4A4A', accent: '#D32F2F' },
    { id: 'pastel-orange', type: 'color', bg: '#FFD6A5', card: 'rgba(255,255,255,0.85)', text: '#4A4A4A', accent: '#E65100' },
    { id: 'pastel-yellow', type: 'color', bg: '#FDFFB6', card: 'rgba(255,255,255,0.85)', text: '#4A4A4A', accent: '#FBC02D' },
    { id: 'pastel-green', type: 'color', bg: '#CAFFBF', card: 'rgba(255,255,255,0.85)', text: '#4A4A4A', accent: '#388E3C' },
    { id: 'pastel-cyan', type: 'color', bg: '#9BF6FF', card: 'rgba(255,255,255,0.85)', text: '#4A4A4A', accent: '#0097A7' },
    { id: 'pastel-blue', type: 'color', bg: '#A0C4FF', card: 'rgba(255,255,255,0.85)', text: '#4A4A4A', accent: '#1976D2' },
    { id: 'pastel-purple', type: 'color', bg: '#BDB2FF', card: 'rgba(255,255,255,0.85)', text: '#4A4A4A', accent: '#7B1FA2' },
    { id: 'pastel-pink', type: 'color', bg: '#FFC6FF', card: 'rgba(255,255,255,0.85)', text: '#4A4A4A', accent: '#C2185B' },
    { id: 'bg01', type: 'image', bg: 'url("img/bg-ambience-01.webp")', card: '#252525', text: '#e0e0e0', accent: '#4CAF50' },
    { id: 'bg02', type: 'image', bg: 'url("img/bg-ambience-02.webp")', card: '#252525', text: '#e0e0e0', accent: '#C2185B' },
    { id: 'bg03', type: 'image', bg: 'url("img/bg-ambience-03.webp")', card: '#252525', text: '#e0e0e0', accent: '#4CAF50' }
];

// Sons Ambientes (Carregam sob demanda agora - Lazy Loading)
const soundsData = [
    { key: 'chuva', url: 'img/chuva.ogg' },
    { key: 'floresta', url: 'img/floresta.ogg' },
    { key: 'fogo', url: 'img/fogo.ogg' },
    { key: 'cidade', url: 'img/cidade.ogg' },
    { key: 'lago', url: 'img/lago.ogg' },
    { key: 'mar', url: 'img/mar.ogg' },
    { key: 'tempestade', url: 'img/tempestade.ogg' },
    { key: 'sinos', url: 'img/sinos.ogg' }
];

// Sons Lo-fi (Grandes - Streaming on-demand)
const lofiData = {
    zelda: 'img/zelda.ogg',
    medieval: 'img/medieval.ogg',
    donkeykong: 'img/donkeykong.ogg',
    ghibli: 'img/ghibli.ogg'
};

let audioCtx;
const sounds = {}; 

// Estado do Lo-fi (Stream)
let currentLofiState = {
    key: null,
    audioElement: null, // Elemento HTML <audio>
    mediaNode: null,    // Nó do WebAudio
    gain: null,
    isPlaying: false
};

function initAudioContext() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

// Removemos o preload pesado e apenas escondemos a tela de carregamento
function hideLoader() {
    initAudioContext();
    const loader = document.getElementById('app-loader');
    if(loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }
}

// --- MIXER AMBIENTES (Lazy Loading com Buffer) ---
async function toggleSound(key, card) {
    initAudioContext();
    const slider = card.querySelector('.volume-slider');

    // Se o som ainda não existe no nosso objeto, criamos a base dele
    if (!sounds[key]) {
        sounds[key] = { buffer: null, source: null, gain: null, isPlaying: false, isLoading: false };
    }
    const sound = sounds[key];

    if (sound.isPlaying) {
        // Lógica para desligar o som
        if(sound.gain) sound.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        setTimeout(() => {
            if(sound.source) sound.source.stop();
            sound.source = null;
            sound.isPlaying = false;
        }, 200);
        card.classList.remove('active');
    } else {
        // Se o áudio ainda não foi baixado, baixamos agora
        if (!sound.buffer) {
            if (sound.isLoading) return; // Evita cliques duplicados durante o download
            sound.isLoading = true;
            card.classList.add('loading'); // Animação de carregando

            try {
                const soundData = soundsData.find(s => s.key === key);
                const resp = await fetch(soundData.url);
                const arrayBuffer = await resp.arrayBuffer();
                sound.buffer = await audioCtx.decodeAudioData(arrayBuffer);
            } catch (e) {
                console.error(`Erro ao carregar ${key}`, e);
                sound.isLoading = false;
                card.classList.remove('loading');
                return;
            }
            sound.isLoading = false;
            card.classList.remove('loading');
        }
        
        // Toca o som após estar carregado
        const src = audioCtx.createBufferSource();
        src.buffer = sound.buffer;
        src.loop = true;
        const gain = audioCtx.createGain();
        gain.gain.value = slider.value;
        src.connect(gain).connect(audioCtx.destination);
        src.start(0);
        
        sound.source = src;
        sound.gain = gain;
        sound.isPlaying = true;
        card.classList.add('active');
    }
}

// --- LO-FI (Streaming) ---
function toggleLofi(key, card) {
    initAudioContext();
    const slider = card.querySelector('.volume-slider');

    // 1. Se clicou no mesmo que já toca: Pausar
    if (currentLofiState.key === key && currentLofiState.isPlaying) {
        stopCurrentLofi();
        card.classList.remove('active');
        return;
    }

    // 2. Se tem outro tocando: Parar o anterior e liberar conexão
    if (currentLofiState.isPlaying) {
        stopCurrentLofi();
        // Remove visual active de todos
        document.querySelectorAll('.lofi-card').forEach(c => c.classList.remove('active'));
    }

    // 3. Iniciar Streaming do Novo
    card.classList.add('loading'); // Mostra loading visualmente

    // Cria elemento de áudio nativo para streaming
    const audioEl = new Audio(lofiData[key]);
    audioEl.crossOrigin = "anonymous"; // Boa prática para audio context
    audioEl.loop = true;

    // Quando estiver pronto para tocar (buffering inicial concluído)
    audioEl.addEventListener('canplay', () => {
        if (currentLofiState.key === key) { // Verificação de segurança
            card.classList.remove('loading');
            audioEl.play().catch(e => console.log("Erro no play:", e));
        }
    });

    // Conecta ao Web Audio API para controle de volume consistente
    const mediaNode = audioCtx.createMediaElementSource(audioEl);
    const gain = audioCtx.createGain();
    gain.gain.value = slider.value;
    
    mediaNode.connect(gain).connect(audioCtx.destination);

    // Atualiza estado
    currentLofiState = {
        key: key,
        audioElement: audioEl,
        mediaNode: mediaNode,
        gain: gain,
        isPlaying: true
    };

    card.classList.add('active');
}

function stopCurrentLofi() {
    if (currentLofiState.audioElement) {
        // Pausa o áudio
        currentLofiState.audioElement.pause();
        
        // Força o navegador a soltar o buffer e fechar a conexão TCP
        currentLofiState.audioElement.src = ""; 
        currentLofiState.audioElement.load(); 

        // Limpa referências
        currentLofiState.audioElement = null; 
        
        if (currentLofiState.mediaNode) {
            currentLofiState.mediaNode.disconnect();
            currentLofiState.mediaNode = null;
        }
    }
    currentLofiState.isPlaying = false;
    currentLofiState.key = null;
}

// Inicialização alterada
window.addEventListener('DOMContentLoaded', () => {
    hideLoader(); 
    loadSavedData();
    renderThemeSwitcher();
});

// --- SISTEMA DE TEMAS ---
function applyTheme(themeId) {
    const config = themesConfig.find(t => t.id === themeId) || themesConfig[0];
    const root = document.documentElement;

    root.style.setProperty('--card-bg', config.card);
    root.style.setProperty('--text-color', config.text);
    root.style.setProperty('--accent-color', config.accent);
    
    if (config.type === 'image') {
        document.body.style.backgroundImage = config.bg;
        document.body.style.backgroundColor = 'transparent';
    } else {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = config.bg;
    }

    localStorage.setItem('ambience_theme', themeId);
    
    document.querySelectorAll('.theme-dot').forEach(d => {
        d.classList.toggle('active-theme', d.dataset.id === themeId);
    });
}

function renderThemeSwitcher() {
    const list = document.getElementById('themeList');
    if(!list) return;

    themesConfig.forEach(theme => {
        const dot = document.createElement('div');
        dot.className = 'theme-dot';
        dot.dataset.id = theme.id;
        dot.title = theme.id;
        
        if (theme.type === 'color') {
            dot.style.backgroundColor = theme.bg;
        } else {
            const cleanUrl = theme.bg.replace('url("', '').replace('")', '');
            dot.style.backgroundImage = `url(${cleanUrl})`;
        }

        dot.addEventListener('click', () => applyTheme(theme.id));
        list.appendChild(dot);
    });

    const toggleBtn = document.getElementById('themeToggleBtn');
    const wrapper = document.querySelector('.theme-wrapper');
    
    if(toggleBtn && wrapper) {
        toggleBtn.addEventListener('click', () => {
            wrapper.classList.toggle('active');
        });
    }
}

// --- PERSISTÊNCIA ---
function loadSavedData() {
    const savedTheme = localStorage.getItem('ambience_theme') || 'dark';
    applyTheme(savedTheme);

    const savedNotes = localStorage.getItem('ambience_notes');
    if (savedNotes && document.getElementById('notepad')) {
        document.getElementById('notepad').value = savedNotes;
    }

    const savedTodos = JSON.parse(localStorage.getItem('ambience_todos')) || [];
    todos = savedTodos;
    renderTodos();
}

// --- EVENT LISTENERS (AMBIENTES) ---
document.querySelectorAll('.sound-card').forEach(card => {
    card.addEventListener('click', e => {
        if (e.target.classList.contains('volume-slider')) return;
        toggleSound(card.dataset.sound, card);
    });
    const slider = card.querySelector('.volume-slider');
    if(slider) {
        slider.addEventListener('input', e => {
            const key = card.dataset.sound;
            if (sounds[key] && sounds[key].gain) {
                sounds[key].gain.gain.setTargetAtTime(e.target.value, audioCtx.currentTime, 0.1);
            }
        });
    }
});

// --- EVENT LISTENERS (LO-FI) ---
document.querySelectorAll('.lofi-card').forEach(card => {
    card.addEventListener('click', e => {
        if (e.target.classList.contains('volume-slider')) return;
        toggleLofi(card.dataset.lofi, card);
    });
    const slider = card.querySelector('.volume-slider');
    if(slider) {
        slider.addEventListener('input', e => {
            if (currentLofiState.key === card.dataset.lofi && currentLofiState.gain) {
                currentLofiState.gain.gain.setTargetAtTime(e.target.value, audioCtx.currentTime, 0.1);
            }
        });
    }
});

// --- TIMER SYSTEM ---
let focusTime = 25, breakTime = 5, completedCycles = 0, timerInterval, timeLeft = focusTime * 60, isRunning = false, isFocusMode = true;
const display = document.getElementById('timer');
const startBtn = document.getElementById('startTimer');
const modeFocusSpan = document.getElementById('modeFocus');
const modeBreakSpan = document.getElementById('modeBreak');
const cyclesContainer = document.getElementById('cyclesContainer');
const settingsToggle = document.getElementById('settingsToggle');
const configPanel = document.getElementById('configPanel');
const saveConfigBtn = document.getElementById('saveConfig');
const focusInput = document.getElementById('focusTimeInput');
const breakInput = document.getElementById('breakTimeInput');

if(settingsToggle && configPanel) {
    settingsToggle.addEventListener('click', () => configPanel.classList.toggle('active'));
}

if(saveConfigBtn) {
    saveConfigBtn.addEventListener('click', () => {
        const newFocus = parseInt(focusInput.value);
        const newBreak = parseInt(breakInput.value);
        if (newFocus > 0 && newBreak > 0) {
            focusTime = newFocus;
            breakTime = newBreak;
            if (!isRunning) {
                timeLeft = (isFocusMode ? focusTime : breakTime) * 60;
                updateDisplay();
            }
            configPanel.classList.remove('active');
        }
    });
}

function updateDisplay() {
    if(!display) return;
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    display.textContent = `${m}:${s}`;
}

function renderCycles() {
    if(!cyclesContainer) return;
    cyclesContainer.innerHTML = '';
    const totalDots = Math.max(4, completedCycles); 
    for (let i = 0; i < totalDots; i++) {
        const dot = document.createElement('div');
        dot.className = 'cycle-dot';
        if (i < completedCycles) dot.classList.add('completed');
        cyclesContainer.appendChild(dot);
    }
}

function playBeep(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    if (type === 'start') {
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } else { 
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(160, audioCtx.currentTime + 2);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3);
        osc.start();
        osc.stop(audioCtx.currentTime + 3);
    }
    osc.connect(gain).connect(audioCtx.destination);
}

function completeTimer() {
    clearInterval(timerInterval);
    playBeep('alarm');
    if (isFocusMode) {
        completedCycles++;
        renderCycles();
        setMode('break');
    } else {
        setMode('focus');
    }
    startTimerInternal();
}

function startTimerInternal() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (timeLeft > 0) { timeLeft--; updateDisplay(); } else { completeTimer(); }
    }, 1000);
    if(startBtn) startBtn.textContent = "Pausar";
    isRunning = true;
}

function toggleTimer() {
    initAudioContext(); 
    if (isRunning) {
        clearInterval(timerInterval);
        if(startBtn) startBtn.textContent = "Continuar";
        isRunning = false;
        playBeep('start');
    } else {
        startTimerInternal();
        playBeep('start');
    }
}

function setMode(mode) {
    if(isRunning) toggleTimer();
    isFocusMode = (mode === 'focus');
    if (isFocusMode) {
        if(modeFocusSpan) modeFocusSpan.classList.add('mode-active');
        if(modeBreakSpan) modeBreakSpan.classList.remove('mode-active');
        timeLeft = focusTime * 60;
    } else {
        if(modeFocusSpan) modeFocusSpan.classList.remove('mode-active');
        if(modeBreakSpan) modeBreakSpan.classList.add('mode-active');
        timeLeft = breakTime * 60;
    }
    updateDisplay();
}

if(startBtn) startBtn.addEventListener('click', toggleTimer);
const resetBtn = document.getElementById('resetTimer');
if(resetBtn) resetBtn.addEventListener('click', () => setMode(isFocusMode ? 'focus' : 'break'));
if(modeFocusSpan) modeFocusSpan.addEventListener('click', () => setMode('focus'));
if(modeBreakSpan) modeBreakSpan.addEventListener('click', () => setMode('break'));

const notepad = document.getElementById('notepad');
const todoListEl = document.getElementById('todoList');
const newTodoInput = document.getElementById('newTodoInput');
let todos = [];

if(notepad) notepad.addEventListener('input', () => { localStorage.setItem('ambience_notes', notepad.value); });
function saveTodos() { localStorage.setItem('ambience_todos', JSON.stringify(todos)); }
function renderTodos() {
    if(!todoListEl) return;
    todoListEl.innerHTML = '';
    todos.forEach((todo, index) => {
        const div = document.createElement('div');
        div.className = `todo-item ${todo.done ? 'completed' : ''}`;
        div.innerHTML = `<input type="checkbox" class="todo-checkbox" ${todo.done ? 'checked' : ''}><span class="todo-text">${todo.text}</span><button class="todo-delete">×</button>`;
        div.querySelector('.todo-checkbox').addEventListener('change', () => { todos[index].done = !todos[index].done; saveTodos(); renderTodos(); });
        div.querySelector('.todo-delete').addEventListener('click', () => { todos.splice(index, 1); saveTodos(); renderTodos(); });
        todoListEl.appendChild(div);
    });
}

if(newTodoInput) {
    newTodoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && newTodoInput.value.trim()) {
            todos.push({ text: newTodoInput.value, done: false });
            newTodoInput.value = '';
            saveTodos(); renderTodos();
        }
    });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const notepad = document.getElementById('notepad');
        const todoContainer = document.getElementById('todoContainer');
        
        if (btn.dataset.tab === 'text') {
            if(notepad) notepad.classList.add('active');
            if(todoContainer) todoContainer.classList.remove('active');
        } else {
            if(notepad) notepad.classList.remove('active');
            if(todoContainer) todoContainer.classList.add('active');
        }
    });
});

const zenBtn = document.getElementById('zenToggle');
function toggleZenMode() { document.body.classList.toggle('zen-active'); }
if(zenBtn) zenBtn.addEventListener('click', toggleZenMode);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.body.classList.remove('zen-active'); });