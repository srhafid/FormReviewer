class QuizManager {
    constructor() {
        this.questions = [];
        this.shuffledQuestions = [];
        this.answers = {};
        this.userSelections = {};
        this.points = 0;
        this.streak = 0;
        this.currentQuestion = 1;
        this.totalQuestions = 0;
        this.selectedDifficulty = 'medium';

        this.timers = {
            global: null,
            question: null
        };

        this.timePerQuestion = {
            easy: 30,
            medium: 20,
            hard: 10
        };

        this.speech = {
            utterance: null,
            isReading: false,
            isPaused: false
        };

        this.contextParagraphs = [];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateProgress();
    }

    setupEventListeners() {
        document.getElementById('loadLessonBtn').addEventListener('click', () => this.handleLoadLesson());
        document.getElementById('startQuizBtn').addEventListener('click', () => this.startQuiz());
        document.getElementById('submitBtn').addEventListener('click', () => this.submitQuiz());
        document.getElementById('resetBtn').addEventListener('click', () => window.location.reload());
        document.getElementById('showDifficultyBtn').addEventListener('click', () => this.showDifficultySelector());
        document.getElementById('floatingReadBtn').addEventListener('click', () => this.handleFloatingReadButton());

        document.querySelectorAll('input[name="difficulty"]').forEach(input => {
            input.addEventListener('change', () => this.handleDifficultyChange(input.value));
        });
    }

    async handleLoadLesson() {
        const selectedFile = document.getElementById('lessonSelector').value;
        if (!selectedFile) {
            alert('Por favor, selecciona una lección.');
            return;
        }
        await this.loadQuestions(selectedFile);
    }

    async loadQuestions(jsonFile) {
        try {
            const response = await fetch(`lessons/${jsonFile}`);
            if (!response.ok) throw new Error('No se pudo cargar el archivo JSON');

            const data = await response.json();
            this.processQuestionData(data, jsonFile);
            this.hideSelectors();
        } catch (error) {
            console.error('Error al cargar el JSON:', error);
            alert('Error al cargar la lección. Asegúrate de que el archivo JSON exista y esté correctamente formateado.');
        }
    }

    processQuestionData(data, jsonFile) {
        let context = [];
        let questionsData = [];

        if (Array.isArray(data)) {
            questionsData = data;
        } else {
            context = data.context || [];
            questionsData = data.questions || [];
        }

        this.questions = questionsData;
        this.contextParagraphs = context;
        this.displayContext(context, jsonFile);
    }

    displayContext(context, jsonFile) {
        const fileName = this.formatFileName(jsonFile);
        const contextDiv = document.getElementById('lessonContext');

        if (contextDiv && context.length > 0) {
            contextDiv.innerHTML = `
                <div class="flex items-center mb-4">
                    <h2 class="text-2xl font-bold text-[#ed8936] mr-4">${fileName}</h2>
                </div>
                <div id="lessonContextText">
                    ${context.map(p => `<p class="mb-4">${p}</p>`).join('')}
                </div>
            `;
            contextDiv.classList.remove('hidden');
            this.showFloatingReadBtn(true);
        } else {
            this.showFloatingReadBtn(false);
        }
    }

    formatFileName(jsonFile) {
        return jsonFile.replace('.json', '')
            .replace(/_/g, ' ')
            .replace(/^\w/, c => c.toUpperCase());
    }

    hideSelectors() {
        document.getElementById('lessonSelector').parentElement.classList.add('hidden');
        document.getElementById('difficultySelector').classList.add('hidden');
        document.getElementById('showDifficultyBtn').classList.remove('hidden');
    }

    showDifficultySelector() {
        document.getElementById('showDifficultyBtn').classList.add('hidden');
        document.getElementById('lessonContext').classList.add('hidden');
        document.getElementById('difficultySelector').classList.remove('hidden');
        this.showFloatingReadBtn(false);
    }

    handleDifficultyChange(difficulty) {
        this.selectedDifficulty = difficulty;
        document.getElementById('startQuizBtn').disabled = false;
    }

    startQuiz() {
        if (!this.selectedDifficulty) {
            alert('Por favor, selecciona un nivel de dificultad.');
            return;
        }

        this.prepareQuiz();
        this.renderQuestions();
        this.initializeQuizState();
        this.showQuizContainer();
        this.startGlobalTimer();
        this.startQuestionTimer(0);
    }

    prepareQuiz() {
        document.getElementById('difficultySelector').classList.add('hidden');
        document.getElementById('timePerQuestion').innerText = this.timePerQuestion[this.selectedDifficulty];

        this.shuffledQuestions = this.shuffle([...this.questions]);
        this.shuffledQuestions.forEach(question => {
            question.options = this.shuffle([...question.options]);
        });

        this.generateAnswers();
        this.totalQuestions = this.shuffledQuestions.length;
        document.getElementById('totalQuestions').innerText = this.totalQuestions;
    }

    generateAnswers() {
        this.answers = {};
        this.shuffledQuestions.forEach(question => {
            const correctOption = question.options.find(opt => opt.correct);
            this.answers[question.id] = correctOption ? correctOption.value : '';
        });
    }

    renderQuestions() {
        const form = document.getElementById('quizForm');
        form.innerHTML = '';

        this.shuffledQuestions.forEach((question, index) => {
            const questionElement = this.createQuestionElement(question, index);
            form.appendChild(questionElement);
        });

        this.setupQuestionListeners();
    }

    createQuestionElement(question, index) {
        const div = document.createElement('div');
        div.id = question.id;
        div.className = `outline-box ${index === 0 ? 'visible' : 'hidden'}`;
        div.innerHTML = `
            <p class="font-semibold text-lg mb-4">${index + 1}. ${question.text}</p>
            ${question.options.map(opt => `
                <label class="text-base">
                    <input type="radio" name="${question.id}" value="${opt.value}"> ${opt.text}
                </label><br>
            `).join('')}
            <div id="feedback${question.id}" class="mt-4"></div>
            <div id="questionTimer${question.id}" class="question-timer"></div>
        `;
        return div;
    }

    setupQuestionListeners() {
        document.querySelectorAll('input[type="radio"]').forEach(input => {
            input.addEventListener('change', () => {
                const questionId = input.name;
                this.userSelections[questionId] = input.value;
                this.evaluateAndMoveToNext(questionId);
            });
        });
    }

    initializeQuizState() {
        this.points = 0;
        this.streak = 0;
        this.currentQuestion = 1;
        this.userSelections = {};

        document.getElementById('points').innerText = this.points;
        document.getElementById('streak').innerText = this.streak;
        document.getElementById('score').innerText = '';
        document.getElementById('summary').innerHTML = '';
        document.getElementById('progressFill').style.width = '0%';
        this.updateProgress();
    }

    showQuizContainer() {
        document.getElementById('quizContainer').style.display = 'block';
    }

    startGlobalTimer() {
        let globalTimeLeft = 600;
        document.getElementById('timer').innerText = 'Tiempo Total: 10:00';

        this.timers.global = setInterval(() => {
            globalTimeLeft--;
            const timeString = this.formatTime(globalTimeLeft);
            document.getElementById('timer').innerText = `Tiempo Total: ${timeString}`;

            if (globalTimeLeft <= 0) {
                this.clearTimers();
                document.getElementById('submitBtn').click();
            }
        }, 1000);
    }

    startQuestionTimer(index) {
        this.clearQuestionTimer();

        let timeLeft = this.timePerQuestion[this.selectedDifficulty];
        const questionId = this.shuffledQuestions[index].id;
        const timerDisplay = document.getElementById(`questionTimer${questionId}`);

        timerDisplay.innerText = `Tiempo restante: ${timeLeft}s`;

        this.timers.question = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = `Tiempo restante: ${timeLeft}s`;

            if (timeLeft <= 0) {
                this.clearQuestionTimer();
                this.evaluateAndMoveToNext(questionId, true);
            }
        }, 1000);
    }

    evaluateAndMoveToNext(questionId, timedOut = false) {
        const index = this.shuffledQuestions.findIndex(q => q.id === questionId);
        const feedback = document.getElementById(`feedback${questionId}`);

        this.processAnswer(questionId, feedback, timedOut);
        this.moveToNextQuestion(index);
    }

    processAnswer(questionId, feedback, timedOut) {
        if (this.userSelections[questionId]) {
            if (this.userSelections[questionId] === this.answers[questionId]) {
                const pointsEarned = 10 * Math.min(this.streak + 1, 5);
                this.points += pointsEarned;
                this.streak++;
                feedback.innerHTML = `<span class="correct">¡Correcto! +${pointsEarned} puntos (Racha x${Math.min(this.streak, 5)})</span>`;
            } else {
                this.streak = 0;
                feedback.innerHTML = `<span class="incorrect">Incorrecto.</span>`;
            }
        } else {
            this.streak = 0;
            const message = timedOut ? 'Tiempo agotado.' : 'No respondida.';
            feedback.innerHTML = `<span class="incorrect">${message}</span>`;
        }

        document.getElementById('points').innerText = this.points;
        document.getElementById('streak').innerText = this.streak;
    }

    moveToNextQuestion(index) {
        if (index < this.totalQuestions - 1) {
            this.hideCurrentQuestion(index);
            this.showNextQuestion(index + 1);
            this.currentQuestion = index + 2;
            this.startQuestionTimer(index + 1);
            this.updateProgress();
        } else {
            this.finishQuestions();
        }
    }

    hideCurrentQuestion(index) {
        const currentQuestionId = this.shuffledQuestions[index].id;
        document.getElementById(currentQuestionId).classList.remove('visible');
        document.getElementById(currentQuestionId).classList.add('hidden');
    }

    showNextQuestion(index) {
        const nextQuestionId = this.shuffledQuestions[index].id;
        document.getElementById(nextQuestionId).classList.remove('hidden');
        document.getElementById(nextQuestionId).classList.add('visible');
    }

    finishQuestions() {
        this.currentQuestion = this.totalQuestions;
        this.updateProgress();
        this.clearQuestionTimer();
        document.getElementById('submitBtn').disabled = false;
    }

    submitQuiz() {
        this.clearTimers();
        const results = this.calculateResults();
        this.displayFinalResults(results);
        this.showSummary(results);
    }

    calculateResults() {
        let correctAnswers = 0;
        const results = [];

        this.shuffledQuestions.forEach(question => {
            const selectedValue = this.userSelections[question.id];
            const isCorrect = selectedValue === this.answers[question.id];

            if (isCorrect) correctAnswers++;

            this.displayQuestionFeedback(question, selectedValue, isCorrect);
            results.push({ correct: isCorrect });
        });

        return { results, correctAnswers };
    }

    displayQuestionFeedback(question, selectedValue, isCorrect) {
        const feedback = document.getElementById(`feedback${question.id}`);

        if (selectedValue) {
            const selectedOption = question.options.find(opt => opt.value === selectedValue);
            const explanation = selectedOption?.explanation || '';

            if (isCorrect) {
                feedback.innerHTML = `<span class="correct">¡Correcto!</span><br><span class="text-sm">${explanation}</span>`;
            } else {
                feedback.innerHTML = `<span class="incorrect">Incorrecto.</span><br><span class="text-sm">${explanation}</span>`;
            }
        } else {
            const correctOption = question.options.find(opt => opt.correct);
            const explanation = correctOption?.explanation || '';
            feedback.innerHTML = `<span class="incorrect">No respondida.</span><br><span class="text-sm">${explanation}</span>`;
        }
    }

    displayFinalResults({ correctAnswers }) {
        document.getElementById('score').innerText = `Puntuación Final: ${correctAnswers} / ${this.totalQuestions} (Total: ${this.points} puntos)`;
    }

    showSummary({ results }) {
        const summaryDiv = document.getElementById('summary');
        summaryDiv.innerHTML = `
            <h2 class="text-2xl font-bold text-center text-[#ed8936] mb-6">Resumen de Respuestas</h2>
            ${results.map((result, index) => `
                <a href="#header-smoth-scroll">
                    <button class="summary-item ${result.correct ? 'correct' : 'incorrect'}" 
                            data-question-id="${this.shuffledQuestions[index].id}">
                        Pregunta ${index + 1}: ${result.correct ? 'Correcta' : 'Incorrecta o no respondida'}
                    </button>
                </a>
            `).join('')}
        `;

        this.setupSummaryListeners();
    }

    setupSummaryListeners() {
        document.querySelectorAll('.summary-item').forEach(button => {
            button.addEventListener('click', () => {
                const questionId = button.getAttribute('data-question-id');
                this.showSpecificQuestion(questionId);
            });
        });
    }

    showSpecificQuestion(questionId) {
        this.shuffledQuestions.forEach(q => {
            document.getElementById(q.id).classList.add('hidden');
        });

        document.getElementById(questionId).classList.remove('hidden');
        document.getElementById(questionId).classList.add('visible');
        this.currentQuestion = this.shuffledQuestions.findIndex(q => q.id === questionId) + 1;
        this.updateProgress();
    }

    updateProgress() {
        const progressPercent = this.totalQuestions > 0 ? (this.currentQuestion / this.totalQuestions) * 100 : 0;
        document.getElementById('progressFill').style.width = `${progressPercent}%`;
        document.getElementById('currentQuestion').innerText = this.currentQuestion;
    }

    // Utilidades
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    }

    clearTimers() {
        if (this.timers.global) clearInterval(this.timers.global);
        if (this.timers.question) clearInterval(this.timers.question);
    }

    clearQuestionTimer() {
        if (this.timers.question) clearInterval(this.timers.question);
    }

    // Funcionalidad de texto a voz CORREGIDA
    showFloatingReadBtn(show = true) {
        const btn = document.getElementById('floatingReadBtn');
        if (btn) btn.classList.toggle('hidden', !show);
    }

    handleFloatingReadButton() {
        if (this.speech.isPaused) {
            // Si está pausado, reanudar
            window.speechSynthesis.resume();
        } else if (this.speech.isReading) {
            // Si está leyendo, pausar
            window.speechSynthesis.pause();
        } else {
            // Si no está activo, iniciar lectura
            this.startReadingContext();
        }
    }

    startReadingContext() {
        if (!('speechSynthesis' in window) || !this.contextParagraphs.length) return;

        window.speechSynthesis.cancel();

        // Limpiar texto de marcadores inclusivos molestos
        const cleanText = this.cleanInclusiveLanguage(this.contextParagraphs.join(' '));

        this.speech.utterance = new window.SpeechSynthesisUtterance(cleanText);
        this.speech.utterance.rate = 0.9;
        this.speech.utterance.pitch = 1.0;
        this.speech.utterance.lang = 'es-ES';
        this.speech.utterance.volume = 1.0;

        this.selectBestSpanishVoice();
        this.setupSpeechEvents();

        window.speechSynthesis.speak(this.speech.utterance);
    }

    cleanInclusiveLanguage(text) {
        return text
            // Remover marcadores @, x, e inclusivos
            .replace(/\b(l@s|l[ao]s\/las|las\/los|el\/la|la\/el|un@|un[ao]\/una|una\/un[ao]|niñ@s|tod@s|alumn@s)\b/gi, match => {
                // Convertir a forma masculina por defecto para fluidez
                const conversions = {
                    'l@s': 'los', 
                    'los/las': 'los', 
                    'las/los': 'los',
                    'el/la': 'el', 
                    'la/el': 'el',
                    'un@': 'un', 
                    'uno/una': 'un', 
                    'una/uno': 'un',
                    'una/un': 'un',
                    'niñ@s': 'niños', 
                    'tod@s': 'todos',
                    'alumn@s': 'alumnos'
                };
                return conversions[match.toLowerCase()] || match.replace(/@/g, 'o');
            })
            // Remover x inclusiva (todxs, niñxs, etc.)
            .replace(/\b(\w+)x(es|as|os)?\b/gi, (match, base) => {
                return base + 'os';
            })
            // Remover e inclusiva solo en casos obvios (todes, niñes, alumnes)
            .replace(/\b(todes|niñes|alumnes|profesores|estudiantes|compañeres)\b/gi, (match) => {
                const conversions = {
                    'todes': 'todos',
                    'niñes': 'niños', 
                    'alumnes': 'alumnos',
                    'compañeres': 'compañeros'
                };
                return conversions[match.toLowerCase()] || match.replace(/e([s]?)$/, 'o$1');
            })
            // Limpiar patrones como "él o ella", "nosotros y nosotras"
            .replace(/\b(él o ella|ella o él)\b/gi, 'él')
            .replace(/\b(nosotros y nosotras|nosotras y nosotros)\b/gi, 'nosotros')
            .replace(/\b(ellos y ellas|ellas y ellos)\b/gi, 'ellos');
    }

    selectBestSpanishVoice() {
        const voices = window.speechSynthesis.getVoices();

        // Buscar voces en orden de preferencia
        const voicePreferences = [
            v => v.lang.startsWith('es') && v.name.toLowerCase().includes('paloma'),
            v => v.lang.startsWith('es') && v.name.toLowerCase().includes('esperanza'),
            v => v.lang.startsWith('es') && v.name.toLowerCase().includes('isabela'),
            v => v.lang.startsWith('es') && v.name.toLowerCase().includes('feminine'),
            v => v.lang.startsWith('es') && v.name.toLowerCase().includes('female'),
            v => v.lang.startsWith('es') && !v.name.toLowerCase().includes('male'),
            v => v.lang.startsWith('es-ES'),
            v => v.lang.startsWith('es')
        ];

        for (const preference of voicePreferences) {
            const voice = voices.find(preference);
            if (voice) {
                this.speech.utterance.voice = voice;
                break;
            }
        }
    }

    setupSpeechEvents() {
        this.speech.utterance.onstart = () => {
            this.speech.isReading = true;
            this.speech.isPaused = false;
            document.getElementById('floatingReadText').innerText = 'Pausar';
        };

        this.speech.utterance.onpause = () => {
            this.speech.isPaused = true;
            document.getElementById('floatingReadText').innerText = 'Reanudar';
        };

        this.speech.utterance.onresume = () => {
            this.speech.isPaused = false;
            document.getElementById('floatingReadText').innerText = 'Pausar';
        };

        this.speech.utterance.onend = () => {
            this.speech.isReading = false;
            this.speech.isPaused = false;
            document.getElementById('floatingReadText').innerText = 'Leer contexto';
        };

        this.speech.utterance.onerror = () => {
            this.speech.isReading = false;
            this.speech.isPaused = false;
            document.getElementById('floatingReadText').innerText = 'Leer contexto';
        };
    }

    toggleReadContext() {
        // Esta función ya no es necesaria, pero la mantengo por compatibilidad
        if (this.speech.isPaused) {
            window.speechSynthesis.resume();
        } else if (this.speech.isReading) {
            window.speechSynthesis.pause();
        }
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    new QuizManager();
});
