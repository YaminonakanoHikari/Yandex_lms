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
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
}
function logout() {
  localStorage.clear()
  window.location.href = 'login.html'
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
    tasks = await tasksRes.json()
    const progress = await progressRes.json()

    Object.entries(progress).forEach(([taskId, p]) => {
      if (p.solved) {
        solved[taskId] = true
        scores[taskId] = p.score
      }
    })

    document.getElementById('userName').textContent = username
    renderSidebar()
    updateTotalScore()
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
    html += `<div class="topic-group"><div class="topic-title">📂 ${topic}</div>`
    list.forEach(task => {
      const isSolved = solved[task.id]
      const isActive = activeTask?.id === task.id
      html += `
        <div class="task-item ${isActive ? 'active' : ''} ${isSolved ? 'solved' : ''}"
             onclick="openTask('${task.id}')">
          <div class="task-status-dot"></div>
          ${task.title}
          <span class="task-pts">${task.points}б</span>
        </div>`
    })
    html += `</div>`
  }
  document.getElementById('taskList').innerHTML = html
}

// ── Open task ──
function openTask(taskId) {
  activeTask = tasks.find(t => t.id === taskId)
  lastResults = []
  lastReview = ''
  renderSidebar()
  renderTaskView()
}

function backToList() {
  activeTask = null
  renderSidebar()
  document.getElementById('main').innerHTML = `
    <div class="empty-state">
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
        <tbody><tr><td>${ex.input}</td><td>${ex.output}</td></tr></tbody>
      </table>
    </div>`).join('')

  document.getElementById('main').innerHTML = `
    <div class="task-view">
      <div class="task-desc">
        <div class="breadcrumb">
          <span class="breadcrumb-back" onclick="backToList()">‹ Блоки</span>
        </div>
        <div class="task-badges">
          <span class="badge badge-type">${typeLabel[t.type] || t.type}</span>
          <span class="badge badge-points">макс. ${t.points} балл.</span>
          ${isSolved ? `<span class="badge badge-solved">✓ Зачтено ${scores[t.id]}/${t.points}</span>` : ''}
        </div>
        <div class="task-title-main">${t.title}</div>
        <div class="task-subtitle">${typeLabel[t.type] || t.type}</div>
        <hr class="divider">
        <div class="task-body"><p>${t.desc}</p></div>
        <div class="section-label">Формат ввода</div>
        <div class="task-body"><p>${t.input_fmt}</p></div>
        <div class="section-label">Формат вывода</div>
        <div class="task-body"><p>${t.output_fmt}</p></div>
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
            placeholder="# Напиши своё решение здесь...">${localStorage.getItem('lms_code_' + t.id) || ''}</textarea>
        </div>
        <div class="code-footer">
          <button class="btn btn-primary" id="submitBtn" onclick="submitCode()">Отправить решение</button>
          <button class="btn btn-ghost" onclick="getHint()">💡 Подсказка</button>
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
  const code = document.getElementById('codeInput').value.trim()
  if (!code) return

  localStorage.setItem('lms_code_' + activeTask.id, code)

  const btn = document.getElementById('submitBtn')
  btn.disabled = true
  btn.innerHTML = '<div class="spinner"></div> Проверка...'

  const res = await fetch(`${API}/submit`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ task_id: activeTask.id, code })
  })
  const data = await res.json()
  lastResults = data.results

  btn.disabled = false
  btn.innerHTML = 'Отправить решение'

  if (data.passed === data.total) {
    solved[activeTask.id] = true
    scores[activeTask.id] = activeTask.points
    renderSidebar()
    updateTotalScore()
    const badges = document.querySelector('.task-badges')
    if (badges && !badges.querySelector('.badge-solved')) {
      badges.innerHTML += `<span class="badge badge-solved">✓ Зачтено ${activeTask.points}/${activeTask.points}</span>`
    }
  }

  currentTab = 'tests'
  document.getElementById('tab-tests').classList.add('active')
  document.getElementById('tab-ai').classList.remove('active')
  document.getElementById('resultsPanel').classList.add('open')
  renderResultsBody()

  lastReview = 'loading'
  fetchReview(code)
}

// ── AI Review ──
async function fetchReview(code) {
  try {
    const res = await fetch(`${API}/review`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ task_id: activeTask.id, code })
    })
    const data = await res.json()
    lastReview = data.review || 'Не удалось получить ревью.'
  } catch {
    lastReview = 'Ошибка соединения с сервером.'
  }
  document.getElementById('tab-ai').textContent = 'AI-ревью ✨'
  if (currentTab === 'ai') renderResultsBody()
}

async function getHint() {
  const code = document.getElementById('codeInput')?.value || ''
  lastReview = 'loading'
  currentTab = 'ai'
  document.getElementById('resultsPanel').classList.add('open')
  document.getElementById('tab-tests').classList.remove('active')
  document.getElementById('tab-ai').classList.add('active')
  renderResultsBody()

  try {
    const res = await fetch(`${API}/review`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ task_id: activeTask.id, code: code || '# пусто' })
    })
    const data = await res.json()
    lastReview = '💡 **Подсказка**\n\n' + (data.review || '')
  } catch {
    lastReview = 'Ошибка соединения.'
  }
  renderResultsBody()
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
      <div class="verdict ${allOk ? 'ok' : 'fail'}">
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
            <div class="test-label">Ввод</div><div>${r.input}</div>
            <div class="test-label">Ожидалось</div><div>${r.expected}</div>
            <div class="test-label">Вывод программы</div>
            <div style="color:${r.ok ? 'var(--green)' : 'var(--red)'}">${r.actual || '(пусто)'}</div>
            ${r.error ? `<div class="test-label">Ошибка</div><div style="color:var(--red)">${r.error}</div>` : ''}
          </div>
        </div>`
    })
    html += `</div>`
    el.innerHTML = html

  } else {
    if (lastReview === 'loading') {
      el.innerHTML = `<div style="display:flex;align-items:center;gap:10px;color:var(--muted);font-size:13px"><div class="spinner"></div> AI анализирует код...</div>`
      return
    }
    if (!lastReview) {
      el.innerHTML = `<div style="color:var(--muted);font-size:13px">Сначала отправь решение</div>`
      return
    }
    el.innerHTML = `<div class="ai-text">${formatMd(lastReview)}</div>`
  }
}

function formatMd(text) {
  return text
    .replace(/```python([\s\S]*?)```/g, '<pre>$1</pre>')
    .replace(/```([\s\S]*?)```/g, '<pre>$1</pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .split('\n\n').map(p => `<p>${p}</p>`).join('')
}

function updateTotalScore() {
  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const el = document.getElementById('totalScore')
  if (el) el.textContent = total
}

init()