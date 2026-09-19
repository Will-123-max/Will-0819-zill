const API = 'https://studentguide-g5qp.arcada.app/api'
const exact = (value) => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim()
const same = (first, second) => exact(first) === exact(second)
const fold = (value) => exact(value).toLocaleLowerCase()

function isCorrect(selected, question) {
  const answer = question?.correct ?? question?.answer ?? question?.correct_answer ?? ''
  if (same(selected, answer)) return true
  const options = Array.isArray(question?.options) ? question.options : []
  const key = exact(answer).toUpperCase()
  if (options.filter((option) => fold(option) === fold(answer)).length === 1 && fold(selected) === fold(answer)) return true
  if (/^[A-Z]$/.test(key)) {
    const index = key.charCodeAt(0) - 65
    return index >= 0 && index < options.length && same(selected, options[index])
  }
  const index = Number(key)
  return Number.isInteger(index) && (
    (index >= 1 && index <= options.length && same(selected, options[index - 1])) ||
    (index >= 0 && index < options.length && same(selected, options[index]))
  )
}

const quizzes = await fetch(`${API}/quizzes`).then((response) => {
  if (!response.ok) throw new Error(`Could not load quizzes (${response.status})`)
  return response.json()
})

let totalQuestions = 0
for (const quiz of quizzes) {
  const fullQuiz = await fetch(`${API}/quizzes?id=${quiz.id}`).then((response) => response.json())
  const questions = Array.isArray(fullQuiz.questions) ? fullQuiz.questions : []
  const keys = questions.map((question, index) => question.id ?? `quiz-${quiz.id}-${index}`)
  if (new Set(keys).size !== questions.length) throw new Error(`${quiz.title}: duplicate question keys`)

  const score = questions.filter((question) => isCorrect(question.correct ?? question.answer, question)).length
  if (score !== questions.length) throw new Error(`${quiz.title}: correct-answer score was ${score}/${questions.length}`)

  for (const question of questions) {
    const wrongOption = question.options?.find((option) => !same(option, question.correct ?? question.answer))
    if (wrongOption !== undefined && isCorrect(wrongOption, question)) {
      throw new Error(`${quiz.title}: a wrong answer was accepted for “${question.prompt}”`)
    }
  }
  totalQuestions += questions.length
  console.log(`✓ ${quiz.title}: ${score}/${questions.length} correct-answer scoring verified`)
}

console.log(`CBT scoring passed for ${quizzes.length} quizzes and ${totalQuestions} questions.`)
