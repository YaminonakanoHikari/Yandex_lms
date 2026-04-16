const API = 'https://likeable-shauna-interjectionally.ngrok-free.dev'

// ── Auth guard ──
const urlParams = new URLSearchParams(window.location.search)
const urlToken = urlParams.get('token')
const urlUsername = urlParams.get('username')
if (urlToken) {
  localStorage.setItem('lms_token', urlToken)
  localStorage.setItem('lms_username', urlUsername)
  window.history.replaceState({}, '', window.location.pathname)
}

const token = localStorage.getItem('lms_token')
if (!token) window.location.href = 'login.html'

const username = localStorage.getItem('lms_username') || 'Пользователь'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

function logout() {
  localStorage.clear()
  window.location.href = 'login.html'
}

// ── Защита от XSS ──
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ── Rate limit на фронте — не чаще 1 раза в 3 сек ──
let lastSubmitTime = 0
function canSubmit() {
  const now = Date.now()
  if (now - lastSubmitTime < 3000) return false
  lastSubmitTime = now
  return true
}

// ── State ──
let tasks = []
let activeTask = null
let solved = {}
let scores = {}
let currentTab = 'tests'
let lastResults = []
let lastReview = ''

// ── Init ──
async function init() {
  try {
    const [tasksRes, progressRes] = await Promise.all([
      fetch(`${API}/tasks`),
      fetch(`${API}/progress`, { headers: authHeaders() })
    ])

    if (progressRes.status === 401) {
      localStorage.clear()
      window.location.href = 'login.html'
      return
    }

    tasks = await tasksRes.json()
    const progress = await progressRes.json()

    Object.entries(progress).forEach(([taskId, p]) => {
      if (p.solved) {
        solved[taskId] = true
        scores[taskId] = p.score
      }
    })

    document.getElementById('userName').textContent = escapeHtml(username)
    renderSidebar()
    updateTotalScore()
    checkEasterEgg()
  } catch (e) {
    console.error('Ошибка загрузки:', e)
  }
}

// ── Sidebar ──
function renderSidebar() {
  const topics = {}
  tasks.forEach(t => {
    if (!topics[t.topic]) topics[t.topic] = []
    topics[t.topic].push(t)
  })

  let html = ''
  for (const [topic, list] of Object.entries(topics)) {
    const total = list.length
    const done = list.filter(t => solved[t.id]).length
    const pct = total ? Math.round(done / total * 100) : 0

    html += `
      <div class="topic-group">
        <div class="topic-title">
          <span>📂 ${escapeHtml(topic)}</span>
          <span class="topic-progress-text">${done}/${total}</span>
        </div>
        <div class="topic-progress-bar">
          <div class="topic-progress-fill" style="width:${pct}%"></div>
        </div>`

    list.forEach(task => {
      const isSolved = solved[task.id]
      const isActive = activeTask?.id === task.id
      html += `
        <div class="task-item ${isActive ? 'active' : ''} ${isSolved ? 'solved' : ''}"
             onclick="openTask('${escapeHtml(task.id)}')">
          <div class="task-status-dot"></div>
          ${escapeHtml(task.title)}
          <span class="task-pts">${task.points}б</span>
        </div>`
    })
    html += `</div>`
  }
  document.getElementById('taskList').innerHTML = html

  requestAnimationFrame(() => {
    document.querySelectorAll('.topic-progress-fill').forEach(el => {
      el.style.transition = 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    })
  })
}

// ── Open task ──
function openTask(taskId) {
  activeTask = tasks.find(t => t.id === taskId)
  if (!activeTask) return
  lastResults = []
  lastReview = ''
  renderSidebar()
  renderTaskView()
  document.getElementById('sidebar').classList.remove('open')
  document.getElementById('overlay').classList.remove('open')
}

function backToList() {
  activeTask = null
  renderSidebar()
  document.getElementById('main').innerHTML = `
    <div class="empty-state animate-fade">
      <div class="empty-icon">🐍</div>
      <div class="empty-title">Выбери задачу слева</div>
      <div class="empty-sub">Реши задачу — получи баллы и AI-ревью от преподавателя</div>
    </div>`
}

function renderTaskView() {
  const t = activeTask
  const typeLabel = { classwork: 'Классная работа', homework: 'Домашнее задание', extra: 'Дополнительное' }
  const isSolved = solved[t.id]

  let examplesHtml = t.examples.map(ex => `
    <div class="example-box">
      <table>
        <thead><tr><th>Ввод</th><th>Вывод</th></tr></thead>
        <tbody><tr>
          <td>${escapeHtml(ex.input)}</td>
          <td>${escapeHtml(ex.output)}</td>
        </tr></tbody>
      </table>
    </div>`).join('')

  document.getElementById('main').innerHTML = `
    <div class="task-view animate-fade">
      <div class="task-desc">
        <div class="breadcrumb">
          <span class="breadcrumb-back" onclick="backToList()">‹ Блоки</span>
        </div>
        <div class="task-badges">
          <span class="badge badge-type">${escapeHtml(typeLabel[t.type] || t.type)}</span>
          <span class="badge badge-points">макс. ${t.points} балл.</span>
          ${isSolved ? `<span class="badge badge-solved">✓ Зачтено ${scores[t.id]}/${t.points}</span>` : ''}
        </div>
        <div class="task-title-main">${escapeHtml(t.title)}</div>
        <div class="task-subtitle">${escapeHtml(typeLabel[t.type] || t.type)}</div>
        <hr class="divider">
        <div class="task-body"><p>${escapeHtml(t.desc)}</p></div>
        <div class="section-label">Формат ввода</div>
        <div class="task-body"><p>${escapeHtml(t.input_fmt)}</p></div>
        <div class="section-label">Формат вывода</div>
        <div class="task-body"><p>${escapeHtml(t.output_fmt)}</p></div>
        <div class="section-label">Примеры</div>
        ${examplesHtml}
      </div>

      <div class="code-panel">
        <div class="code-header">
          Решение
          <span class="lang-tag">Python 3</span>
        </div>
        <div class="editor-wrap">
          <div class="line-nums" id="lineNums"><span>1</span></div>
          <textarea id="codeInput" spellcheck="false"
            placeholder="# Напиши своё решение здесь...">${escapeHtml(localStorage.getItem('lms_code_' + t.id) || '')}</textarea>
        </div>
        <div class="code-footer">
          <button class="btn btn-primary" id="submitBtn" onclick="submitCode()">Отправить решение</button>
          <span class="hint-key">Ctrl+Enter</span>
        </div>
        <div class="results-panel" id="resultsPanel">
          <div class="results-tabs">
            <div class="results-tab active" id="tab-tests" onclick="switchTab('tests')">Тесты</div>
            <div class="results-tab" id="tab-ai" onclick="switchTab('ai')">AI-ревью</div>
          </div>
          <div class="results-body" id="resultsBody"></div>
        </div>
      </div>
    </div>`

  setupEditor()
}

// ── Editor ──
function setupEditor() {
  const ta = document.getElementById('codeInput')
  const nums = document.getElementById('lineNums')

  // Восстанавливаем сохранённый код без escaping (это textarea, не innerHTML)
  const saved = localStorage.getItem('lms_code_' + activeTask.id)
  if (saved) ta.value = saved

  function updateNums() {
    const count = ta.value.split('\n').length
    nums.innerHTML = Array.from({length: count}, (_, i) => `<span>${i+1}</span>`).join('')
    nums.scrollTop = ta.scrollTop
  }

  ta.addEventListener('input', updateNums)
  ta.addEventListener('scroll', () => { nums.scrollTop = ta.scrollTop })
  ta.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const s = ta.selectionStart
      ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(ta.selectionEnd)
      ta.selectionStart = ta.selectionEnd = s + 4
      updateNums()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      submitCode()
    }
  })
  updateNums()
}

// ── Submit ──
async function submitCode() {
  if (!canSubmit()) {
    showSubmitError('Подожди немного перед следующей отправкой')
    return
  }

  const code = document.getElementById('codeInput').value.trim()
  if (!code) return
  if (code.length > 10000) {
    showSubmitError('Код слишком длинный (максимум 10000 символов)')
    return
  }

  localStorage.setItem('lms_code_' + activeTask.id, code)

  const btn = document.getElementById('submitBtn')
  btn.disabled = true
  btn.innerHTML = '<div class="spinner"></div> Проверка...'

  try {
    const res = await fetch(`${API}/submit`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ task_id: activeTask.id, code })
    })

    if (res.status === 429) {
      showSubmitError('Слишком много попыток, подожди минуту')
      btn.disabled = false
      btn.innerHTML = 'Отправить решение'
      return
    }

    if (res.status === 401) {
      localStorage.clear()
      window.location.href = 'login.html'
      return
    }

    const data = await res.json()

    if (data.error) {
      showSubmitError(data.error)
      btn.disabled = false
      btn.innerHTML = 'Отправить решение'
      return
    }

    lastResults = data.results

    btn.disabled = false
    btn.innerHTML = 'Отправить решение'

    if (data.passed === data.total && data.total > 0) {
      solved[activeTask.id] = true
      scores[activeTask.id] = activeTask.points
      renderSidebar()
      updateTotalScore()

      const badges = document.querySelector('.task-badges')
      if (badges && !badges.querySelector('.badge-solved')) {
        const badge = document.createElement('span')
        badge.className = 'badge badge-solved animate-pop'
        badge.textContent = `✓ Зачтено ${activeTask.points}/${activeTask.points}`
        badges.appendChild(badge)
      }

      checkEasterEgg()
      showConfetti()
    }

    currentTab = 'tests'
    document.getElementById('tab-tests').classList.add('active')
    document.getElementById('tab-ai').classList.remove('active')
    document.getElementById('resultsPanel').classList.add('open')
    renderResultsBody()

    lastReview = 'loading'
    fetchReview(code)

  } catch (e) {
    showSubmitError('Ошибка соединения с сервером')
    btn.disabled = false
    btn.innerHTML = 'Отправить решение'
  }
}

function showSubmitError(msg) {
  const panel = document.getElementById('resultsPanel')
  const body = document.getElementById('resultsBody')
  if (!panel || !body) return
  panel.classList.add('open')
  body.innerHTML = `<div class="verdict fail animate-fade">
    <span>⚠️</span>
    <div><div>${escapeHtml(msg)}</div></div>
  </div>`
}

// ── Конфетти ──
function showConfetti() {
  const colors = ['#ffcc00', '#00b341', '#4285F4', '#ff4444', '#ff9500']
  for (let i = 0; i < 30; i++) {
    const el = document.createElement('div')
    el.style.cssText = `
      position:fixed; top:-10px;
      left:${Math.random()*100}vw;
      width:8px; height:8px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      border-radius:${Math.random()>0.5?'50%':'0'};
      animation:confetti-fall ${1.5+Math.random()}s ease-in forwards;
      animation-delay:${Math.random()*0.5}s;
      z-index:9999;`
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 3000)
  }
}

// ── Пасхалка ──
function checkEasterEgg() {
  const reTaskIds = ['re_umbrella', 're_virus', 're_stars']
  if (reTaskIds.every(id => solved[id]) && !document.getElementById('rover-sticker')) {
    showRoverSticker()
  }
}

function showRoverSticker() {
  const sticker = document.createElement('div')
  sticker.id = 'rover-sticker'
  sticker.innerHTML = `
    <div class="sticker-bubble">
      <svg width="120" height="100" viewBox="0 0 120 100">
        <rect x="25" y="28" width="70" height="44" rx="14" fill="#ffcc00"/>
        <rect x="29" y="22" width="62" height="38" rx="12" fill="#1a1a1a"/>
        <ellipse cx="48" cy="38" rx="9" ry="10" fill="white"/>
        <ellipse cx="72" cy="38" rx="9" ry="10" fill="white"/>
        <ellipse cx="48" cy="39" rx="5" ry="6" fill="#1a1a1a"/>
        <ellipse cx="72" cy="39" rx="5" ry="6" fill="#1a1a1a"/>
        <circle cx="50" cy="37" r="2" fill="white"/>
        <circle cx="74" cy="37" r="2" fill="white"/>
        <path d="M52 52 Q60 60 68 52" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse cx="36" cy="46" rx="6" ry="4" fill="#ff9999" opacity="0.6"/>
        <ellipse cx="84" cy="46" rx="6" ry="4" fill="#ff9999" opacity="0.6"/>
        <circle cx="36" cy="76" r="9" fill="#1a1a1a"/>
        <circle cx="36" cy="76" r="5" fill="#333"/>
        <circle cx="60" cy="78" r="9" fill="#1a1a1a"/>
        <circle cx="60" cy="78" r="5" fill="#333"/>
        <circle cx="84" cy="76" r="9" fill="#1a1a1a"/>
        <circle cx="84" cy="76" r="5" fill="#333"/>
        <line x1="27" y1="76" x2="93" y2="76" stroke="#222" stroke-width="3"/>
        <line x1="60" y1="22" x2="60" y2="10" stroke="#1a1a1a" stroke-width="2"/>
        <circle cx="60" cy="8" r="4" fill="#ffcc00"/>
        <text x="88" y="22" font-size="18">❤️</text>
      </svg>
      <div class="sticker-text">Все RE задачи решены!<br>Так держать! 🎉</div>
      <button class="sticker-close" onclick="document.getElementById('rover-sticker').remove()">✕</button>
    </div>`
  document.body.appendChild(sticker)
}

// ── AI Review ──
async function fetchReview(code) {
  try {
    const res = await fetch(`${API}/review`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ task_id: activeTask.id, code })
    })
    if (!res.ok) {
      lastReview = 'Не удалось получить ревью.'
    } else {
      const data = await res.json()
      lastReview = data.review || 'Не удалось получить ревью.'
    }
  } catch {
    lastReview = 'Ошибка соединения с сервером.'
  }
  const tabEl = document.getElementById('tab-ai')
  if (tabEl) tabEl.textContent = 'AI-ревью ✨'
  if (currentTab === 'ai') renderResultsBody()
}

// ── Results ──
function switchTab(tab) {
  currentTab = tab
  document.getElementById('tab-tests').classList.toggle('active', tab === 'tests')
  document.getElementById('tab-ai').classList.toggle('active', tab === 'ai')
  renderResultsBody()
}

function renderResultsBody() {
  const el = document.getElementById('resultsBody')
  if (!el) return

  if (currentTab === 'tests') {
    if (!lastResults.length) { el.innerHTML = ''; return }
    const allOk = lastResults.every(r => r.ok)
    let html = `
      <div class="verdict ${allOk ? 'ok' : 'fail'} animate-fade">
        <span>${allOk ? '✅' : '❌'}</span>
        <div>
          <div>${allOk ? 'Все тесты пройдены!' : 'Есть ошибки'}</div>
          <div class="verdict-sub">${lastResults.filter(r => r.ok).length} / ${lastResults.length} тестов</div>
        </div>
      </div>
      <div class="test-list">`

    lastResults.forEach((r, i) => {
      html += `
        <div class="test-item" onclick="this.classList.toggle('open')">
          <div class="test-item-head">
            <span class="test-status ${r.ok ? 'ok' : 'fail'}">${r.ok ? '✓ OK' : '✗ WA'}</span>
            <span class="test-num">Тест #${i + 1}</span>
          </div>
          <div class="test-detail">
            <div class="test-label">Ввод</div>
            <div>${escapeHtml(String(r.input || ''))}</div>
            <div class="test-label">Ожидалось</div>
            <div>${escapeHtml(String(r.expected || ''))}</div>
            <div class="test-label">Вывод программы</div>
            <div style="color:${r.ok ? 'var(--green)' : 'var(--red)'}">
              ${escapeHtml(String(r.actual || '(пусто)'))}
            </div>
            ${r.error ? `<div class="test-label">Ошибка</div><div style="color:var(--red)">${escapeHtml(String(r.error))}</div>` : ''}
          </div>
        </div>`
    })
    html += `</div>`
    el.innerHTML = html

  } else {
    if (lastReview === 'loading') {
      el.innerHTML = `<div style="display:flex;align-items:center;gap:10px;color:var(--muted);font-size:13px">
        <div class="spinner"></div> AI анализирует код...
      </div>`
      return
    }
    if (!lastReview) {
      el.innerHTML = `<div style="color:var(--muted);font-size:13px">Сначала отправь решение</div>`
      return
    }
    el.innerHTML = `<div class="ai-text animate-fade">${formatMd(lastReview)}</div>`
  }
}

function formatMd(text) {
  return text
    .replace(/```python([\s\S]*?)```/g, (_, code) => `<pre>${escapeHtml(code)}</pre>`)
    .replace(/```([\s\S]*?)```/g, (_, code) => `<pre>${escapeHtml(code)}</pre>`)
    .replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .split('\n\n').map(p => `<p>${p}</p>`).join('')
}

function updateTotalScore() {
  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const el = document.getElementById('totalScore')
  if (el) {
    el.textContent = total
    el.classList.add('score-pop')
    setTimeout(() => el.classList.remove('score-pop'), 400)
  }
}

init()