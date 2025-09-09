function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

let questions = [];
let shuffledQuestions = [];
let answers = {};
let points = 0;
let streak = 0;
let currentQuestion = 1;
let totalQuestions = 0;
let globalTimerInterval;
let questionTimerInterval;
let userSelections = {};

function loadQuestions(jsonFile) {
    fetch("lessons/" + jsonFile)
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar el archivo JSON');
            return response.json();
        })
        .then(data => {
            questions = data;
            shuffledQuestions = shuffle([...questions]);
            shuffledQuestions.forEach(question => {
                question.options = shuffle([...question.options]);
            });

            answers = {};
            shuffledQuestions.forEach(question => {
                const correctOption = question.options.find(opt => opt.correct);
                answers[question.id] = correctOption ? correctOption.value : '';
            });

            totalQuestions = shuffledQuestions.length;
            document.getElementById('totalQuestions').innerText = totalQuestions;

            const form = document.getElementById('quizForm');
            form.innerHTML = '';
            shuffledQuestions.forEach((question, index) => {
                const div = document.createElement('div');
                div.id = question.id;
                div.className = `outline-box ${index === 0 ? 'visible' : 'hidden'}`;
                div.innerHTML = `
                            <p class="font-semibold text-lg mb-4">${index + 1}. ${question.text}</p>
                            ${question.options.map(opt => `
                                <label class="text-base"><input type="radio" name="${question.id}" value="${opt.value}"> ${opt.text}</label><br>
                            `).join('')}
                            <div id="feedback${question.id}" class="mt-4"></div>
                            <div id="questionTimer${question.id}" class="question-timer"></div>
                        `;
                form.appendChild(div);
            });

            points = 0;
            streak = 0;
            currentQuestion = 1;
            userSelections = {};
            document.getElementById('points').innerText = points;
            document.getElementById('streak').innerText = streak;
            document.getElementById('score').innerText = '';
            document.getElementById('summary').innerHTML = '';
            document.getElementById('progressFill').style.width = '0%';
            updateProgress();

            document.querySelectorAll('input[type="radio"]').forEach(input => {
                input.addEventListener('change', () => {
                    const questionId = input.name;
                    userSelections[questionId] = input.value;
                    evaluateAndMoveToNext(questionId);
                });
            });

            document.getElementById('quizContainer').style.display = 'block';

            let globalTimeLeft = 600;
            document.getElementById('timer').innerText = 'Tiempo Total: 10:00';
            globalTimerInterval = setInterval(() => {
                globalTimeLeft--;
                const min = Math.floor(globalTimeLeft / 60);
                const sec = globalTimeLeft % 60;
                document.getElementById('timer').innerText = `Tiempo Total: ${min}:${sec < 10 ? '0' + sec : sec}`;
                if (globalTimeLeft <= 0) {
                    clearInterval(globalTimerInterval);
                    clearInterval(questionTimerInterval);
                    document.getElementById('submitBtn').click();
                }
            }, 1000);

            startQuestionTimer(currentQuestion - 1);
        })
        .catch(error => {
            console.error('Error al cargar el JSON:', error);
            alert('Error al cargar la lección. Asegúrate de que el archivo JSON exista y esté correctamente formateado.');
        });
}

function startQuestionTimer(index) {
    if (questionTimerInterval) clearInterval(questionTimerInterval);
    let timeLeft = 30;
    const questionId = shuffledQuestions[index].id;
    const timerDisplay = document.getElementById(`questionTimer${questionId}`);
    timerDisplay.innerText = `Tiempo restante: ${timeLeft}s`;
    questionTimerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = `Tiempo restante: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(questionTimerInterval);
            evaluateAndMoveToNext(questionId, true);
        }
    }, 1000);
}

function evaluateAndMoveToNext(questionId, timedOut = false) {
    const index = shuffledQuestions.findIndex(q => q.id === questionId);
    const feedback = document.getElementById(`feedback${questionId}`);
    let isCorrect = false;

    if (userSelections[questionId]) {
        if (userSelections[questionId] === answers[questionId]) {
            points += 10 * Math.min(streak + 1, 5);
            streak++;
            feedback.innerHTML = `<span class="correct">¡Correcto! +${10 * Math.min(streak, 5)} puntos (Racha x${Math.min(streak, 5)})</span>`;
            isCorrect = true;
        } else {
            streak = 0;
            feedback.innerHTML = `<span class="incorrect">Incorrecto.</span>`;
        }
    } else {
        streak = 0;
        feedback.innerHTML = `<span class="incorrect">${timedOut ? 'Tiempo agotado.' : 'No respondida.'}</span>`;
    }

    if (index < totalQuestions - 1) {
        document.getElementById(questionId).classList.remove('visible');
        document.getElementById(questionId).classList.add('hidden');
        const nextQuestionId = shuffledQuestions[index + 1].id;
        document.getElementById(nextQuestionId).classList.remove('hidden');
        document.getElementById(nextQuestionId).classList.add('visible');
        currentQuestion = index + 2;
        startQuestionTimer(index + 1);
        updateProgress();
    } else {
        currentQuestion = totalQuestions;
        updateProgress();
        clearInterval(questionTimerInterval);
        document.getElementById('submitBtn').disabled = false;
    }
}

function updateProgress() {
    const progressPercent = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
    document.getElementById('currentQuestion').innerText = currentQuestion;
}

function showSummary(results) {
    const summaryDiv = document.getElementById('summary');
    summaryDiv.innerHTML = `
                <h2 class="text-2xl font-bold text-center text-[#ed8936] mb-6">Resumen de Respuestas</h2>
                ${results.map((result, index) => `
                    <a href="#header-smoth-scroll">
                        <button class="summary-item ${result.correct ? 'correct' : 'incorrect'}" data-question-id="${shuffledQuestions[index].id}">
                            Pregunta ${index + 1}: ${result.correct ? 'Correcta' : 'Incorrecta o no respondida'}
                        </button>
                    </a>
                `).join('')}
            `;
    document.querySelectorAll('.summary-item').forEach(button => {
        button.addEventListener('click', () => {
            const questionId = button.getAttribute('data-question-id');
            shuffledQuestions.forEach(q => {
                document.getElementById(q.id).classList.add('hidden');
            });
            document.getElementById(questionId).classList.remove('hidden');
            document.getElementById(questionId).classList.add('visible');
            currentQuestion = shuffledQuestions.findIndex(q => q.id === questionId) + 1;
            updateProgress();
        });
    });
}

document.getElementById('loadLessonBtn').addEventListener('click', () => {
    const selectedFile = document.getElementById('lessonSelector').value;
    if (selectedFile) {
        loadQuestions(selectedFile);
    } else {
        alert('Por favor, selecciona una lección.');
    }
});

document.getElementById('submitBtn').addEventListener('click', () => {
    clearInterval(globalTimerInterval);
    clearInterval(questionTimerInterval);
    let correctAnswers = 0;
    const results = [];

    shuffledQuestions.forEach((question, index) => {
        const selectedValue = userSelections[question.id];
        const feedback = document.getElementById(`feedback${question.id}`);
        let isCorrect = false;

        if (selectedValue) {
            const selectedOption = question.options.find(opt => opt.value === selectedValue);
            const exp = selectedOption.explanation || '';
            if (selectedValue === answers[question.id]) {
                correctAnswers++;
                isCorrect = true;
                feedback.innerHTML = `<span class="correct">¡Correcto! +${10 * Math.min(streak, 5)} puntos (Racha x${Math.min(streak, 5)})</span><br><span class="text-sm">${exp}</span>`;
            } else {
                feedback.innerHTML = `<span class="incorrect">Incorrecto.</span><br><span class="text-sm">${exp}</span>`;
            }
        } else {
            const correctOption = question.options.find(opt => opt.correct);
            const exp = correctOption.explanation || '';
            feedback.innerHTML = `<span class="incorrect">No respondida.</span><br><span class="text-sm">${exp}</span>`;
        }
        results.push({ correct: isCorrect });
    });

    document.getElementById('points').innerText = points;
    document.getElementById('streak').innerText = streak;
    document.getElementById('score').innerText = `Puntuación Final: ${correctAnswers} / ${totalQuestions} (Total: ${points} puntos)`;
    showSummary(results);
});

document.getElementById('resetBtn').addEventListener('click', () => {
    window.location.reload();
});

updateProgress();