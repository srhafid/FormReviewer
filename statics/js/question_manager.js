class QuestionManager {
    constructor() {
        this.questions = [];
        this.shuffledQuestions = [];
        this.answers = {};
        this.userSelections = {};
    }

    loadQuestions(questionsData) {
        this.questions = questionsData;
    }

    prepareQuiz() {
        this.shuffledQuestions = this.shuffle([...this.questions]);
        this.shuffledQuestions.forEach(question => {
            question.options = this.shuffle([...question.options]);
        });
        this.generateAnswers();
        return this.shuffledQuestions.length;
    }

    generateAnswers() {
        this.answers = {};
        this.shuffledQuestions.forEach(question => {
            const correctOption = question.options.find(opt => opt.correct);
            this.answers[question.id] = correctOption ? correctOption.value : '';
        });
    }

    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getQuestionById(questionId) {
        return this.shuffledQuestions.find(q => q.id === questionId);
    }

    getQuestionIndex(questionId) {
        return this.shuffledQuestions.findIndex(q => q.id === questionId);
    }

    getCorrectAnswer(questionId) {
        return this.answers[questionId];
    }

    setUserAnswer(questionId, value) {
        this.userSelections[questionId] = value;
    }

    getUserAnswer(questionId) {
        return this.userSelections[questionId];
    }

    getTotalQuestions() {
        return this.shuffledQuestions.length;
    }

    getShuffledQuestions() {
        return this.shuffledQuestions;
    }
}