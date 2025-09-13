class QuizManager {
    constructor() {
        this.databaseManager = new DatabaseManager();
        this.timerManager = new TimerManager();
        this.speechManager = new SpeechManager();
        this.questionManager = new QuestionManager();
        this.scoreManager = new ScoreManager();
        this.uiManager = new UIManager();

        this.selectedDifficulty = 'medium';
        this.contextParagraphs = [];

        this.init();
    }

    async init() {
        try {
            await this.databaseManager.initialize();
            await this.updateLessonSelector();
            this.setupEventListeners();
            this.scoreManager.updateProgress();
        } catch (error) {
            console.error('Error initializing application:', error);
        }
    }

    setupEventListeners() {
        // Event listeners principales
        document.getElementById('loadLessonBtn').addEventListener('click', () => this.handleLoadLesson());
        document.getElementById('startQuizBtn').addEventListener('click', () => this.startQuiz());
        document.getElementById('submitBtn').addEventListener('click', () => this.submitQuiz());
        document.getElementById('resetBtn').addEventListener('click', () => window.location.reload());
        document.getElementById('showDifficultyBtn').addEventListener('click', () => this.showDifficultySelector());
        document.getElementById('floatingReadText').addEventListener('click', () => this.handleFloatingReadButton());

        // Event listeners de base de datos
        document.getElementById('loadFromDbBtn').addEventListener('click', () => this.uiManager.openLoadJsonModal());
        document.getElementById('cancelLoadJsonBtn').addEventListener('click', () => this.uiManager.closeLoadJsonModal());
        document.getElementById('saveJsonBtn').addEventListener('click', () => this.saveJsonFromModal());
        document.getElementById('exportDbBtn').addEventListener('click', () => this.exportDatabase());
        document.getElementById('importDbBtn').addEventListener('change', (event) => this.importDatabase(event));
        document.getElementById('deleteLessonBtn').addEventListener('click', () => this.handleDeleteLesson());
        document.getElementById('deleteAllDbBtn').addEventListener('click', () => this.handleDeleteAllLessons());
    }

    async updateLessonSelector() {
        try {
            const lessons = await this.databaseManager.getAllLessons();
            this.uiManager.updateLessonSelector(lessons);
        } catch (error) {
            console.error('Error updating lesson selector:', error);
        }
    }

    showDifficultySelector() {
        this.uiManager.showDifficultySelector();

        // Configurar listeners de dificultad
        document.querySelectorAll('input[name="difficulty"]').forEach(input => {
            input.addEventListener('change', (e) => this.handleDifficultyChange(e.target.value));
        });
    }

    async saveJsonFromModal() {
        const { jsonText, lessonName } = this.uiManager.getJsonModalData();

        if (!jsonText) {
            alert('Por favor, pega el JSON en el área de texto.');
            return;
        }

        try {
            const jsonData = JSON.parse(jsonText);
            await this.databaseManager.saveLesson(jsonData, lessonName);
            await this.updateLessonSelector();
            alert('Lección guardada en la base de datos exitosamente.');
            this.uiManager.closeLoadJsonModal();
        } catch (error) {
            console.error('Error parsing JSON:', error);
            alert('Error al procesar el JSON. Asegúrate de que sea un formato válido.');
        }
    }

    async handleLoadLesson() {
        const selectedValue = document.getElementById('lessonSelector').value;
        if (!selectedValue) {
            alert('Por favor, selecciona una lección.');
            return;
        }

        try {
            const lesson = await this.databaseManager.getLesson(selectedValue);
            if (lesson) {
                this.processQuestionData(lesson.data, lesson.filename);
                this.uiManager.hideSelectors();
            } else {
                alert('Lección no encontrada en la base de datos.');
            }
        } catch (error) {
            console.error('Error loading lesson:', error);
            alert('Error al cargar la lección desde la base de datos.');
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

        this.questionManager.loadQuestions(questionsData);
        this.contextParagraphs = context;
        this.uiManager.displayContext(context, jsonFile);
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
        this.uiManager.showQuizContainer();
        this.startTimers();
    }

    prepareQuiz() {
        document.getElementById('difficultySelector').classList.add('hidden');
        this.uiManager.updateTimePerQuestion(this.selectedDifficulty, this.timerManager.timePerQuestion);

        const totalQuestions = this.questionManager.prepareQuiz();
        this.scoreManager.setTotalQuestions(totalQuestions);
    }

    renderQuestions() {
        const questions = this.questionManager.getShuffledQuestions();
        this.uiManager.renderQuestions(questions);
        this.setupQuestionListeners();
    }

    setupQuestionListeners() {
        document.querySelectorAll('input[type="radio"]').forEach(input => {
            input.addEventListener('change', () => {
                const questionId = input.name;
                this.questionManager.setUserAnswer(questionId, input.value);
                this.evaluateAndMoveToNext(questionId);
            });
        });
    }

    initializeQuizState() {
        this.scoreManager.reset();
        document.getElementById('score').innerText = '';
        document.getElementById('summary').innerHTML = '';
        document.getElementById('progressFill').style.width = '0%';
    }

    startTimers() {
        // Timer global
        this.timerManager.startGlobalTimer(() => {
            document.getElementById('submitBtn').click();
        });

        // Timer de primera pregunta
        const firstQuestion = this.questionManager.getShuffledQuestions()[0];
        if (firstQuestion) {
            this.timerManager.startQuestionTimer(
                this.selectedDifficulty,
                firstQuestion.id,
                (timedOut) => this.evaluateAndMoveToNext(firstQuestion.id, timedOut)
            );
        }
    }

    evaluateAndMoveToNext(questionId, timedOut = false) {
        const question = this.questionManager.getQuestionById(questionId);
        const index = this.questionManager.getQuestionIndex(questionId);

        this.processAnswer(questionId, timedOut);
        this.moveToNextQuestion(index);
    }

    processAnswer(questionId, timedOut) {
        const userAnswer = this.questionManager.getUserAnswer(questionId);
        const correctAnswer = this.questionManager.getCorrectAnswer(questionId);
        const question = this.questionManager.getQuestionById(questionId);

        if (userAnswer) {
            if (userAnswer === correctAnswer) {
                const pointsEarned = this.scoreManager.processCorrectAnswer();
                this.uiManager.displayQuestionFeedback(question, userAnswer, true, pointsEarned, this.scoreManager.streak);
            } else {
                this.scoreManager.processIncorrectAnswer();
                this.uiManager.displayQuestionFeedback(question, userAnswer, false);
            }
        } else {
            this.scoreManager.processIncorrectAnswer();
            const message = timedOut ? 'Tiempo agotado.' : 'No respondida.';
            const feedback = document.getElementById(`feedback${questionId}`);
            if (feedback) {
                feedback.innerHTML = `<span class="incorrect">${message}</span>`;
            }
        }
    }

    moveToNextQuestion(currentIndex) {
        const questions = this.questionManager.getShuffledQuestions();
        const totalQuestions = this.questionManager.getTotalQuestions();

        if (currentIndex < totalQuestions - 1) {
            // Ocultar pregunta actual
            this.uiManager.hideQuestion(questions[currentIndex].id);

            // Mostrar siguiente pregunta
            this.uiManager.showQuestion(questions[currentIndex + 1].id);

            // Actualizar contador y progreso
            this.scoreManager.nextQuestion();

            // Iniciar timer para siguiente pregunta
            this.timerManager.startQuestionTimer(
                this.selectedDifficulty,
                questions[currentIndex + 1].id,
                (timedOut) => this.evaluateAndMoveToNext(questions[currentIndex + 1].id, timedOut)
            );
        } else {
            this.finishQuestions();
        }
    }

    finishQuestions() {
        this.scoreManager.setCurrentQuestion(this.questionManager.getTotalQuestions());
        this.timerManager.clearQuestionTimer();
        document.getElementById('submitBtn').disabled = false;
    }

    submitQuiz() {
        this.timerManager.clearAllTimers();
        const results = this.calculateResults();
        this.displayFinalResults(results);
        this.showSummary(results);
    }

    calculateResults() {
        let correctAnswers = 0;
        const results = [];
        const questions = this.questionManager.getShuffledQuestions();

        questions.forEach(question => {
            const selectedValue = this.questionManager.getUserAnswer(question.id);
            const correctValue = this.questionManager.getCorrectAnswer(question.id);
            const isCorrect = selectedValue === correctValue;

            if (isCorrect) correctAnswers++;

            this.displayQuestionFinalFeedback(question, selectedValue, isCorrect);
            results.push({ correct: isCorrect });
        });

        return { results, correctAnswers };
    }

    displayQuestionFinalFeedback(question, selectedValue, isCorrect) {
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
        const { points, totalQuestions } = this.scoreManager.getFinalScore();
        this.uiManager.displayFinalResults(correctAnswers, totalQuestions, points);
    }

    showSummary({ results }) {
        const questions = this.questionManager.getShuffledQuestions();
        this.uiManager.showSummary(results, questions);
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
        // Ocultar todas las preguntas
        this.questionManager.getShuffledQuestions().forEach(q => {
            this.uiManager.hideQuestion(q.id);
        });

        // Mostrar pregunta específica
        this.uiManager.showQuestion(questionId);

        // Actualizar progreso
        const questionIndex = this.questionManager.getQuestionIndex(questionId);
        this.scoreManager.setCurrentQuestion(questionIndex + 1);
    }

    // Métodos para manejo de texto a voz
    handleFloatingReadButton() {
        this.startReadingContext();

        // if (this.speechManager.isPaused) {
        //     this.speechManager.handleToggle();
        // } else if (this.speechManager.isReading) {
        //     this.speechManager.handleToggle();
        // } else {
        //     this.startReadingContext();
        // }
    }

    async startReadingContext() {
        await this.speechManager.startReading(this.contextParagraphs);
    }

    // Métodos para manejo de base de datos
    async exportDatabase() {
        try {
            await this.databaseManager.exportDatabase();
            alert('Base de datos exportada exitosamente.');
        } catch (error) {
            console.error('Error exporting database:', error);
            alert('Error al exportar la base de datos.');
        }
    }

    async importDatabase(event) {
        const file = event.target.files[0];
        if (!file) {
            alert('Por favor, selecciona un archivo JSON.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                const importedCount = await this.databaseManager.importDatabase(importData);
                await this.updateLessonSelector();
                alert(`Se importaron ${importedCount} lecciones nuevas exitosamente.`);
            } catch (error) {
                console.error('Error importing database:', error);
                alert('Error al procesar el archivo JSON. Asegúrate de que sea un formato válido.');
            }
        };
        reader.readAsText(file);
    }

    async handleDeleteLesson() {
        const selectedValue = document.getElementById('lessonSelector').value;
        if (!selectedValue) {
            alert('Por favor, selecciona una lección para eliminar.');
            return;
        }

        if (confirm('¿Estás seguro de que deseas eliminar esta lección? Esta acción no se puede deshacer.')) {
            try {
                await this.databaseManager.deleteLesson(selectedValue);
                await this.updateLessonSelector();
                alert('Lección eliminada exitosamente.');
            } catch (error) {
                console.error('Error deleting lesson:', error);
                alert('Error al eliminar la lección.');
            }
        }
    }

    async handleDeleteAllLessons() {
        if (confirm('¿Estás seguro de que deseas eliminar TODA la base de datos? Esta acción no se puede deshacer.')) {
            try {
                await this.databaseManager.clearAllLessons();
                await this.updateLessonSelector();
                alert('Base de datos eliminada exitosamente.');
            } catch (error) {
                console.error('Error clearing database:', error);
                alert('Error al eliminar la base de datos.');
            }
        }
    }
}
