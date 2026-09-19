const GAMES_PATH = '/games'

function gamesLink(className = '') {
  const link = document.createElement('a')
  link.href = GAMES_PATH
  link.textContent = 'Games'
  link.className = className
  link.dataset.gamesLink = 'true'
  return link
}

function addGamesNavigation() {
  const desktop = document.querySelector('[data-source-loc="src/components/Navbar.jsx:101:10"]')
  if (desktop && !desktop.querySelector('[data-games-link]')) desktop.appendChild(gamesLink('px-2.5 py-2 rounded-lg hover:text-brand hover:bg-brand/8 transition'))
  const mobile = document.querySelector('[data-source-loc="src/components/Navbar.jsx:134:8"]')
  if (mobile && !mobile.querySelector('[data-games-link]')) mobile.prepend(gamesLink('block px-3 py-2.5 rounded-xl font-medium hover:bg-paper'))
  const footer = document.querySelector('[data-source-loc="src/components/Footer.jsx:50:10"]')
  if (footer && !footer.querySelector('[data-games-link]')) {
    const item = document.createElement('li')
    item.appendChild(gamesLink('hover:text-gold'))
    footer.prepend(item)
  }
}

function addDashboardGameCard() {
  if (location.pathname !== '/') return
  const grid = document.querySelector('[data-source-loc="src/pages/Home.jsx:170:8"]')
  if (!grid || grid.querySelector('[data-games-dashboard]')) return
  const card = gamesLink('sg-game-dashboard-card')
  card.dataset.gamesDashboard = 'true'
  card.innerHTML = '<span>🎮</span><h3>Student Games</h3><p>Eleven quick games: strategy, memory, words, reactions, typing, and more.</p><b>Play now →</b>'
  grid.appendChild(card)
}

function winner(board) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  for (const [a,b,c] of lines) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  return board.every(Boolean) ? 'draw' : ''
}

function bestComputerMove(board) {
  const open = board.map((value, index) => value ? -1 : index).filter((index) => index >= 0)
  for (const index of open) { const next = [...board]; next[index] = 'O'; if (winner(next) === 'O') return index }
  for (const index of open) { const next = [...board]; next[index] = 'X'; if (winner(next) === 'X') return index }
  if (open.includes(4)) return 4
  const corners = open.filter((index) => [0,2,6,8].includes(index))
  return (corners.length ? corners : open)[Math.floor(Math.random() * (corners.length ? corners.length : open.length))]
}

function createTicTacToe() {
  const section = document.createElement('section')
  section.className = 'sg-game-card'
  section.innerHTML = '<div class="sg-game-card__heading"><span>Classic</span><h2>Tic-Tac-Toe</h2><p>You are X. Get three in a row before the computer.</p></div><div class="sg-ttt-board"></div><p class="sg-game-status"></p><button type="button" class="sg-game-reset">New game</button>'
  const boardElement = section.querySelector('.sg-ttt-board')
  const status = section.querySelector('.sg-game-status')
  let board = Array(9).fill('')
  let locked = false
  function render() {
    boardElement.replaceChildren(...board.map((value, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = value
      button.className = value ? `is-${value.toLowerCase()}` : ''
      button.disabled = Boolean(value) || locked
      button.addEventListener('click', () => play(index))
      return button
    }))
  }
  function finish(result) {
    if (!result) return false
    locked = true
    if (result === 'X') {
      status.textContent = 'You won! Great move.'
      const wins = Number(localStorage.getItem('sg-game-wins') || 0) + 1
      localStorage.setItem('sg-game-wins', String(wins))
    } else if (result === 'O') status.textContent = 'Computer won. Try again!'
    else status.textContent = 'It is a draw. One more round?'
    render()
    return true
  }
  function play(index) {
    if (locked || board[index]) return
    board[index] = 'X'
    render()
    if (finish(winner(board))) return
    locked = true
    status.textContent = 'Computer is thinking…'
    setTimeout(() => {
      const move = bestComputerMove(board)
      if (Number.isInteger(move)) board[move] = 'O'
      locked = false
      status.textContent = 'Your turn'
      render()
      finish(winner(board))
    }, 320)
  }
  function reset() { board = Array(9).fill(''); locked = false; status.textContent = 'Your turn'; render() }
  section.querySelector('.sg-game-reset').addEventListener('click', reset)
  reset()
  return section
}

function shuffle(items) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

function createMemoryGame() {
  const section = document.createElement('section')
  section.className = 'sg-game-card'
  section.innerHTML = '<div class="sg-game-card__heading"><span>Focus</span><h2>Memory Match</h2><p>Find all matching campus pairs in the fewest moves.</p></div><div class="sg-memory-board"></div><p class="sg-game-status"></p><button type="button" class="sg-game-reset">Shuffle cards</button>'
  const boardElement = section.querySelector('.sg-memory-board')
  const status = section.querySelector('.sg-game-status')
  const icons = ['📚','🎓','🧪','💻','✏️','🏫']
  let cards = []
  let open = []
  let matched = new Set()
  let moves = 0
  let locked = false
  function render() {
    boardElement.replaceChildren(...cards.map((icon, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      const visible = open.includes(index) || matched.has(index)
      button.textContent = visible ? icon : '?'
      button.className = matched.has(index) ? 'is-matched' : visible ? 'is-open' : ''
      button.disabled = visible || locked
      button.addEventListener('click', () => reveal(index))
      return button
    }))
  }
  function reveal(index) {
    if (locked || open.includes(index) || matched.has(index)) return
    open.push(index)
    render()
    if (open.length < 2) return
    moves += 1
    const [first, second] = open
    if (cards[first] === cards[second]) {
      matched.add(first); matched.add(second); open = []
      status.textContent = matched.size === cards.length ? `Completed in ${moves} moves!` : `${moves} moves · pair found!`
      render()
    } else {
      locked = true
      status.textContent = `${moves} moves · try again`
      setTimeout(() => { open = []; locked = false; render() }, 650)
    }
  }
  function reset() { cards = shuffle([...icons, ...icons]); open = []; matched = new Set(); moves = 0; locked = false; status.textContent = '0 moves · find a pair'; render() }
  section.querySelector('.sg-game-reset').addEventListener('click', reset)
  reset()
  return section
}

function createWordScramble() {
  const words = [
    ['CAMPUS', 'Where students attend lectures'],
    ['LIBRARY', 'A quiet place for books and study'],
    ['LECTURE', 'A class taught by a lecturer'],
    ['SCIENCE', 'Study of the natural world'],
    ['STUDENT', 'A person learning at school'],
    ['EXAM', 'A test of what you have learned'],
    ['COURSE', 'A subject in your programme'],
    ['DEGREE', 'The qualification earned at university'],
  ]
  const section = document.createElement('section')
  section.className = 'sg-game-card'
  section.innerHTML = '<div class="sg-game-card__heading"><span>Words</span><h2>Word Scramble</h2><p>Unscramble student-life words and build your streak.</p></div><div class="sg-word-scramble"></div><p class="sg-game-status"></p><div class="sg-word-actions"><button type="button" class="sg-word-check">Check word</button><button type="button" class="sg-word-hint">Show hint</button><button type="button" class="sg-word-next">Next word</button></div>'
  const game = section.querySelector('.sg-word-scramble')
  const status = section.querySelector('.sg-game-status')
  let current = null
  let score = 0
  function mixedWord(word) {
    let mixed = word
    for (let tries = 0; tries < 8 && mixed === word; tries += 1) mixed = shuffle(word.split('')).join('')
    return mixed
  }
  function next() {
    current = words[Math.floor(Math.random() * words.length)]
    game.innerHTML = ''
    const scrambled = document.createElement('strong')
    scrambled.textContent = mixedWord(current[0])
    const input = document.createElement('input')
    input.placeholder = 'Type the correct word'
    input.autocomplete = 'off'
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter') check() })
    game.append(scrambled, input)
    status.textContent = `Score: ${score}`
  }
  function check() {
    const input = game.querySelector('input')
    if (!input.value.trim()) { status.textContent = 'Type your answer first.'; return }
    if (input.value.trim().toUpperCase() === current[0]) {
      score += 1
      status.textContent = `Correct! Score: ${score}`
      input.disabled = true
    } else status.textContent = `Not yet — try again. Score: ${score}`
  }
  section.querySelector('.sg-word-check').addEventListener('click', check)
  section.querySelector('.sg-word-hint').addEventListener('click', () => { status.textContent = `Hint: ${current[1]}` })
  section.querySelector('.sg-word-next').addEventListener('click', next)
  next()
  return section
}

function createReactionTimer() {
  const section = document.createElement('section')
  section.className = 'sg-game-card'
  section.innerHTML = '<div class="sg-game-card__heading"><span>Speed</span><h2>Reaction Timer</h2><p>Wait for green, then tap as quickly as you can.</p></div><button type="button" class="sg-reaction-zone">Start</button><p class="sg-game-status">Tap Start when you are ready.</p>'
  const zone = section.querySelector('.sg-reaction-zone')
  const status = section.querySelector('.sg-game-status')
  let timer = null
  let readyAt = 0
  let state = 'idle'
  function start() {
    clearTimeout(timer)
    state = 'waiting'
    zone.className = 'sg-reaction-zone is-waiting'
    zone.textContent = 'Wait…'
    status.textContent = 'Do not tap until the box turns green.'
    timer = setTimeout(() => {
      state = 'ready'
      readyAt = performance.now()
      zone.className = 'sg-reaction-zone is-ready'
      zone.textContent = 'TAP!'
    }, 1200 + Math.random() * 2200)
  }
  zone.addEventListener('click', () => {
    if (state === 'idle' || state === 'done') { start(); return }
    if (state === 'waiting') {
      clearTimeout(timer)
      state = 'done'
      zone.className = 'sg-reaction-zone is-early'
      zone.textContent = 'Too soon! Try again'
      status.textContent = 'You tapped before green.'
      return
    }
    const time = Math.round(performance.now() - readyAt)
    state = 'done'
    zone.className = 'sg-reaction-zone is-ready'
    zone.textContent = `${time} ms · Play again`
    status.textContent = time < 250 ? 'Lightning fast!' : time < 400 ? 'Great reaction!' : 'Good try — go again!'
  })
  return section
}

function createNumberGuess() {
  const section = document.createElement('section')
  section.className = 'sg-game-card'
  section.innerHTML = '<div class="sg-game-card__heading"><span>Logic</span><h2>Number Challenge</h2><p>Guess the hidden number from 1 to 50.</p></div><div class="sg-number-game"><input type="number" min="1" max="50" placeholder="Your guess"><button type="button">Check</button></div><p class="sg-game-status"></p><button type="button" class="sg-game-reset">New number</button>'
  const input = section.querySelector('.sg-number-game input')
  const check = section.querySelector('.sg-number-game button')
  const status = section.querySelector('.sg-game-status')
  let target = 0
  let attempts = 0
  function reset() {
    target = Math.floor(Math.random() * 50) + 1
    attempts = 0
    input.value = ''
    input.disabled = false
    status.textContent = 'Make your first guess.'
  }
  function guess() {
    const value = Number(input.value)
    if (!Number.isInteger(value) || value < 1 || value > 50) { status.textContent = 'Enter a whole number from 1 to 50.'; return }
    attempts += 1
    if (value === target) {
      status.textContent = `Correct in ${attempts} attempt${attempts === 1 ? '' : 's'}!`
      input.disabled = true
    } else status.textContent = `${value < target ? 'Too low' : 'Too high'} · ${attempts} attempt${attempts === 1 ? '' : 's'}`
  }
  check.addEventListener('click', guess)
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter') guess() })
  section.querySelector('.sg-game-reset').addEventListener('click', reset)
  reset()
  return section
}

function createRockPaperScissors() {
  const section = document.createElement('section')
  section.className = 'sg-game-card'
  section.innerHTML = '<div class="sg-game-card__heading"><span>Battle</span><h2>Rock Paper Scissors</h2><p>Choose your move and challenge the computer.</p></div><div class="sg-rps"><button type="button" data-move="rock">✊<span>Rock</span></button><button type="button" data-move="paper">✋<span>Paper</span></button><button type="button" data-move="scissors">✌️<span>Scissors</span></button></div><p class="sg-game-status">You 0 · Computer 0</p>'
  const status = section.querySelector('.sg-game-status')
  let student = 0
  let computer = 0
  const beats = { rock: 'scissors', paper: 'rock', scissors: 'paper' }
  section.querySelectorAll('[data-move]').forEach((button) => button.addEventListener('click', () => {
    const playerMove = button.dataset.move
    const computerMove = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)]
    let result = 'Draw'
    if (beats[playerMove] === computerMove) { student += 1; result = 'You win the round!' }
    else if (beats[computerMove] === playerMove) { computer += 1; result = 'Computer wins the round.' }
    status.textContent = `${result} ${playerMove} vs ${computerMove} · You ${student} · Computer ${computer}`
  }))
  return section
}

function createMathSprint() {
  const section = document.createElement('section')
  section.className = 'sg-game-card'
  section.innerHTML = '<div class="sg-game-card__heading"><span>Brain</span><h2>30-Second Math Sprint</h2><p>Solve as many quick calculations as possible.</p></div><div class="sg-math"><strong>Ready?</strong><div><input type="number" placeholder="Answer" disabled><button type="button" disabled>Submit</button></div></div><p class="sg-game-status">Press Start to begin.</p><button type="button" class="sg-game-reset">Start sprint</button>'
  const problem = section.querySelector('.sg-math>strong')
  const input = section.querySelector('.sg-math input')
  const submit = section.querySelector('.sg-math div button')
  const start = section.querySelector('.sg-game-reset')
  const status = section.querySelector('.sg-game-status')
  let answer = 0
  let score = 0
  let time = 30
  let timer = null
  function question() {
    const first = Math.floor(Math.random() * 13) + 2
    const second = Math.floor(Math.random() * 10) + 1
    const operation = ['+', '−', '×'][Math.floor(Math.random() * 3)]
    answer = operation === '+' ? first + second : operation === '−' ? first - second : first * second
    problem.textContent = `${first} ${operation} ${second} = ?`
    input.value = ''
    input.focus()
  }
  function check() {
    if (input.disabled || input.value === '') return
    if (Number(input.value) === answer) score += 1
    question()
    status.textContent = `${time}s left · Score ${score}`
  }
  function finish() {
    clearInterval(timer)
    input.disabled = submit.disabled = true
    problem.textContent = 'Time!'
    status.textContent = `Final score: ${score}`
    start.textContent = 'Play again'
  }
  function begin() {
    clearInterval(timer)
    score = 0
    time = 30
    input.disabled = submit.disabled = false
    start.textContent = 'Restart sprint'
    question()
    status.textContent = `${time}s left · Score ${score}`
    timer = setInterval(() => {
      time -= 1
      status.textContent = `${time}s left · Score ${score}`
      if (time <= 0) finish()
    }, 1000)
  }
  submit.addEventListener('click', check)
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter') check() })
  start.addEventListener('click', begin)
  return section
}

function createTypingChallenge() {
  const phrases = [
    'Small steps every day build excellent results.',
    'The library is a quiet place for focused study.',
    'Students learn faster when they practise consistently.',
    'A clear goal makes every study session more useful.',
  ]
  const section = document.createElement('section')
  section.className = 'sg-game-card'
  section.innerHTML = '<div class="sg-game-card__heading"><span>Typing</span><h2>Typing Challenge</h2><p>Copy the sentence accurately and test your speed.</p></div><div class="sg-typing"><strong></strong><textarea placeholder="Start typing here…"></textarea></div><p class="sg-game-status"></p><button type="button" class="sg-game-reset">New sentence</button>'
  const phrase = section.querySelector('.sg-typing strong')
  const input = section.querySelector('.sg-typing textarea')
  const status = section.querySelector('.sg-game-status')
  let startedAt = 0
  function reset() {
    phrase.textContent = phrases[Math.floor(Math.random() * phrases.length)]
    input.value = ''
    startedAt = 0
    status.textContent = 'Type the sentence exactly as shown.'
  }
  input.addEventListener('input', () => {
    if (!startedAt) startedAt = performance.now()
    const expected = phrase.textContent
    const correct = expected.startsWith(input.value)
    input.classList.toggle('has-error', !correct)
    if (input.value === expected) {
      const minutes = Math.max((performance.now() - startedAt) / 60000, .01)
      const speed = Math.round(expected.trim().split(/\s+/).length / minutes)
      status.textContent = `Complete! ${speed} words per minute.`
    } else status.textContent = correct ? `${input.value.length} of ${expected.length} characters` : 'Check the highlighted typing mistake.'
  })
  section.querySelector('.sg-game-reset').addEventListener('click', reset)
  reset()
  return section
}

function createColorFocus() {
  const colors = { RED: '#ef4444', BLUE: '#3b82f6', GREEN: '#22c55e', GOLD: '#d4a017' }
  const names = Object.keys(colors)
  const section = document.createElement('section')
  section.className = 'sg-game-card'
  section.innerHTML = '<div class="sg-game-card__heading"><span>Focus</span><h2>Color Focus</h2><p>Choose the ink color, not the word that is written.</p></div><div class="sg-color-focus"><strong></strong><div></div></div><p class="sg-game-status"></p><button type="button" class="sg-game-reset">Restart</button>'
  const word = section.querySelector('.sg-color-focus strong')
  const choices = section.querySelector('.sg-color-focus div')
  const status = section.querySelector('.sg-game-status')
  let answer = ''
  let score = 0
  let round = 0
  function question() {
    const shown = names[Math.floor(Math.random() * names.length)]
    answer = names[Math.floor(Math.random() * names.length)]
    word.textContent = shown
    word.style.color = colors[answer]
    choices.replaceChildren(...names.map((name) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = name
      button.addEventListener('click', () => choose(name))
      return button
    }))
  }
  function choose(name) {
    if (round >= 10) return
    round += 1
    if (name === answer) score += 1
    status.textContent = round === 10 ? `Finished! ${score} of 10 correct.` : `Round ${round} of 10 · Score ${score}`
    if (round < 10) question()
  }
  function reset() { score = 0; round = 0; status.textContent = 'Round 0 of 10 · Score 0'; question() }
  section.querySelector('.sg-game-reset').addEventListener('click', reset)
  reset()
  return section
}

function createCoinCatch() {
  const section = document.createElement('section')
  section.className = 'sg-game-card'
  section.innerHTML = '<div class="sg-game-card__heading"><span>Arcade</span><h2>Coin Catch</h2><p>Catch as many moving coins as you can in 20 seconds.</p></div><div class="sg-coin-field"><button type="button">🪙</button></div><p class="sg-game-status">Tap Start to begin.</p><button type="button" class="sg-game-reset">Start game</button>'
  const field = section.querySelector('.sg-coin-field')
  const coin = field.querySelector('button')
  const status = section.querySelector('.sg-game-status')
  const start = section.querySelector('.sg-game-reset')
  let score = 0
  let time = 20
  let timer = null
  let active = false
  function move() {
    coin.style.left = `${Math.floor(Math.random() * 78) + 4}%`
    coin.style.top = `${Math.floor(Math.random() * 70) + 5}%`
  }
  coin.addEventListener('click', () => {
    if (!active) return
    score += 1
    status.textContent = `${time}s left · ${score} coins`
    move()
  })
  start.addEventListener('click', () => {
    clearInterval(timer)
    score = 0
    time = 20
    active = true
    coin.disabled = false
    start.textContent = 'Restart'
    move()
    status.textContent = `${time}s left · 0 coins`
    timer = setInterval(() => {
      time -= 1
      status.textContent = `${time}s left · ${score} coins`
      if (time <= 0) {
        clearInterval(timer)
        active = false
        coin.disabled = true
        status.textContent = `Time! You caught ${score} coin${score === 1 ? '' : 's'}.`
        start.textContent = 'Play again'
      }
    }, 1000)
  })
  return section
}

function createSequenceGame() {
  const section = document.createElement('section')
  section.className = 'sg-game-card'
  section.innerHTML = '<div class="sg-game-card__heading"><span>Memory</span><h2>Sequence Lights</h2><p>Watch the color sequence, then repeat it correctly.</p></div><div class="sg-sequence"><button type="button" data-color="0"></button><button type="button" data-color="1"></button><button type="button" data-color="2"></button><button type="button" data-color="3"></button></div><p class="sg-game-status">Press Start to see the first sequence.</p><button type="button" class="sg-game-reset">Start sequence</button>'
  const buttons = [...section.querySelectorAll('[data-color]')]
  const status = section.querySelector('.sg-game-status')
  const start = section.querySelector('.sg-game-reset')
  let sequence = []
  let entered = []
  let accepting = false
  function flash(index, delay) {
    setTimeout(() => {
      buttons[index].classList.add('is-lit')
      setTimeout(() => buttons[index].classList.remove('is-lit'), 320)
    }, delay)
  }
  function showSequence() {
    accepting = false
    entered = []
    status.textContent = `Watch ${sequence.length} light${sequence.length === 1 ? '' : 's'}…`
    sequence.forEach((value, index) => flash(value, index * 520))
    setTimeout(() => { accepting = true; status.textContent = 'Your turn — repeat the sequence.' }, sequence.length * 520 + 200)
  }
  function nextRound() {
    sequence.push(Math.floor(Math.random() * 4))
    showSequence()
  }
  buttons.forEach((button) => button.addEventListener('click', () => {
    if (!accepting) return
    const value = Number(button.dataset.color)
    entered.push(value)
    button.classList.add('is-lit')
    setTimeout(() => button.classList.remove('is-lit'), 180)
    if (value !== sequence[entered.length - 1]) {
      accepting = false
      status.textContent = `Wrong light. You reached level ${sequence.length}.`
      start.textContent = 'Try again'
    } else if (entered.length === sequence.length) {
      accepting = false
      status.textContent = `Level ${sequence.length} complete!`
      setTimeout(nextRound, 650)
    }
  }))
  start.addEventListener('click', () => { sequence = []; start.textContent = 'Restart'; nextRound() })
  return section
}

function renderGamesPage() {
  if (location.pathname !== GAMES_PATH) return
  const main = document.querySelector('main[data-source-loc="src/App.tsx:51:6"]')
  if (!main || main.querySelector('.sg-games-page')) return
  main.innerHTML = '<section class="sg-games-page"><header><p>Student break room</p><h1>Play, reset, return refreshed.</h1><span>Quick campus-friendly games. Your progress stays on this device.</span></header><div class="sg-games-grid"></div><a class="sg-games-home" href="/">← Back to Studentsguide</a></section>'
  const grid = main.querySelector('.sg-games-grid')
  grid.append(createTicTacToe(), createMemoryGame(), createWordScramble(), createReactionTimer(), createNumberGuess(), createRockPaperScissors(), createMathSprint(), createTypingChallenge(), createColorFocus(), createCoinCatch(), createSequenceGame())
}

const style = document.createElement('style')
style.textContent = `
.sg-game-dashboard-card{display:block;border:1px solid rgba(15,39,68,.08);border-radius:20px;background:#fff;padding:20px;color:#0f2744;text-decoration:none;box-shadow:0 1px 1px rgba(15,39,68,.03)}.sg-game-dashboard-card>span{font-size:26px}.sg-game-dashboard-card h3{margin:10px 0 0;font-size:18px;font-weight:700}.sg-game-dashboard-card p{margin:5px 0;color:#64748b;font-size:13px}.sg-game-dashboard-card b{display:inline-block;margin-top:12px;color:#1565c8;font-size:13px}.sg-games-page{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:34px 0 64px}.sg-games-page>header{overflow:hidden;border-radius:30px;background:linear-gradient(135deg,#071320,#0f2744 55%,#1565c8);padding:38px;color:#fffdf8}.sg-games-page>header p{margin:0;color:#e8c547;font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}.sg-games-page>header h1{margin:7px 0 0;font-family:'Source Serif 4',Georgia,serif;font-size:43px;line-height:1.05}.sg-games-page>header span{display:block;margin-top:10px;color:rgba(255,253,248,.7);font-size:13px}.sg-games-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:22px}.sg-game-card{border:1px solid rgba(15,39,68,.1);border-radius:24px;background:#fff;padding:22px;box-shadow:0 14px 38px rgba(15,39,68,.09)}.sg-game-card__heading>span{color:#d4a017;font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.sg-game-card__heading h2{margin:3px 0 0;color:#0f2744;font-size:24px}.sg-game-card__heading p{margin:5px 0 16px;color:#64748b;font-size:11px}.sg-ttt-board{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.sg-ttt-board button{aspect-ratio:1;border:0;border-radius:13px;background:#eef3f9;color:#0f2744;font-size:30px;font-weight:800}.sg-ttt-board button.is-x{background:#e0efff;color:#1565c8}.sg-ttt-board button.is-o{background:#fff5d6;color:#a16207}.sg-memory-board{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.sg-memory-board button{aspect-ratio:1;border:0;border-radius:12px;background:#0f2744;color:#fff;font-size:22px;font-weight:800}.sg-memory-board button.is-open{background:#eef6ff}.sg-memory-board button.is-matched{background:#dcfce7}.sg-word-scramble{display:flex;flex-direction:column;gap:10px;border-radius:16px;background:#eef6ff;padding:18px}.sg-word-scramble strong{text-align:center;color:#1565c8;font-size:29px;letter-spacing:.18em}.sg-word-scramble input{height:44px;border:1px solid rgba(15,39,68,.14);border-radius:10px;background:#fff;padding:0 12px;color:#0f2744;font-size:13px;outline:none}.sg-word-actions{display:flex;flex-wrap:wrap;gap:6px}.sg-word-actions button{min-height:38px;flex:1;border:1px solid rgba(15,39,68,.12);border-radius:10px;background:#fff;color:#0f2744;font-size:10px;font-weight:800}.sg-word-actions button:first-child{border-color:#1565c8;background:#1565c8;color:#fff}.sg-reaction-zone{width:100%;min-height:135px;border:0;border-radius:18px;background:#1565c8;color:#fff;font-size:19px;font-weight:800}.sg-reaction-zone.is-waiting{background:#f59e0b}.sg-reaction-zone.is-ready{background:#22c55e}.sg-reaction-zone.is-early{background:#ef4444}.sg-number-game{display:flex;gap:7px}.sg-number-game input{min-width:0;flex:1;height:48px;border:1px solid rgba(15,39,68,.14);border-radius:11px;padding:0 12px;font-size:14px}.sg-number-game button{border:0;border-radius:11px;background:#0f2744;color:#fff;padding:0 16px;font-size:11px;font-weight:800}.sg-rps{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.sg-rps button{display:flex;min-height:90px;align-items:center;justify-content:center;flex-direction:column;border:1px solid rgba(15,39,68,.1);border-radius:14px;background:#eef6ff;font-size:28px}.sg-rps button span{margin-top:5px;color:#0f2744;font-size:9px;font-weight:800}.sg-math{border-radius:16px;background:#eef6ff;padding:17px}.sg-math>strong{display:block;text-align:center;color:#1565c8;font-size:30px}.sg-math>div{display:flex;gap:7px;margin-top:13px}.sg-math input{min-width:0;flex:1;height:43px;border:1px solid rgba(15,39,68,.14);border-radius:10px;padding:0 10px}.sg-math div button{border:0;border-radius:10px;background:#0f2744;color:#fff;padding:0 13px;font-size:10px;font-weight:800}.sg-typing{display:flex;flex-direction:column;gap:9px;border-radius:16px;background:#f8fafc;padding:15px}.sg-typing strong{color:#0f2744;font-size:13px;line-height:1.6}.sg-typing textarea{min-height:86px;border:1px solid rgba(15,39,68,.14);border-radius:10px;padding:10px;color:#0f2744;font:12px/1.5 Outfit,system-ui,sans-serif;resize:none}.sg-typing textarea.has-error{border-color:#ef4444;background:#fff1f2}.sg-color-focus{border-radius:16px;background:#f8fafc;padding:16px}.sg-color-focus>strong{display:block;text-align:center;font-size:34px;font-weight:900;letter-spacing:.05em}.sg-color-focus>div{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:14px}.sg-color-focus button{min-height:38px;border:1px solid rgba(15,39,68,.12);border-radius:9px;background:#fff;color:#0f2744;font-size:10px;font-weight:800}.sg-coin-field{position:relative;height:190px;overflow:hidden;border-radius:18px;background:linear-gradient(135deg,#dbeafe,#ecfeff)}.sg-coin-field button{position:absolute;left:45%;top:42%;width:48px;height:48px;border:0;border-radius:50%;background:#fff7d6;font-size:26px;box-shadow:0 8px 20px rgba(15,39,68,.16);transition:left .12s,top .12s}.sg-sequence{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sg-sequence button{aspect-ratio:1;border:0;border-radius:16px;opacity:.45}.sg-sequence button:nth-child(1){background:#ef4444}.sg-sequence button:nth-child(2){background:#3b82f6}.sg-sequence button:nth-child(3){background:#22c55e}.sg-sequence button:nth-child(4){background:#eab308}.sg-sequence button.is-lit{opacity:1;box-shadow:0 0 0 5px rgba(15,39,68,.12);transform:scale(.97)}.sg-game-status{min-height:20px;margin:12px 0 8px;color:#64748b;font-size:11px;font-weight:700}.sg-game-reset{min-height:40px;border:0;border-radius:11px;background:#1565c8;color:#fff;padding:9px 14px;font-size:11px;font-weight:800}.sg-games-home{display:inline-block;margin-top:22px;color:#1565c8;font-size:12px;font-weight:800;text-decoration:none}.dark .sg-game-dashboard-card,.dark .sg-game-card{border-color:rgba(255,255,255,.1);background:#0b1a2e;color:#fffdf8}.dark .sg-game-card h2{color:#fffdf8}
@media(max-width:980px){.sg-games-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:760px){.sg-games-grid{grid-template-columns:1fr}.sg-games-page>header{padding:28px 23px}.sg-games-page>header h1{font-size:34px}}
`
document.head.appendChild(style)

function enhanceGames() { addGamesNavigation(); addDashboardGameCard(); renderGamesPage() }
const observer = new MutationObserver(enhanceGames)
observer.observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('popstate', enhanceGames)
window.setTimeout(enhanceGames, 400)
