class ScoreManager {
    constructor() {
        this.points = 0;
        this.streak = 0;
        this.currentQuestion = 1;
        this.totalQuestions = 0;
    }

    reset() {
        this.points = 0;
        this.streak = 0;
        this.currentQuestion = 1;
        this.updateDisplay();
    }

    setTotalQuestions(total) {
        this.totalQuestions = total;
        document.getElementById('totalQuestions').innerText = total;
    }

    processCorrectAnswer() {
        const pointsEarned = 10 * Math.min(this.streak + 1, 5);
        this.points += pointsEarned;
        this.streak++;
        this.updateDisplay();
        return pointsEarned;
    }

    processIncorrectAnswer() {
        this.streak = 0;
        this.updateDisplay();
    }

    nextQuestion() {
        if (this.currentQuestion < this.totalQuestions) {
            this.currentQuestion++;
        }
        this.updateProgress();
    }

    setCurrentQuestion(questionNumber) {
        this.currentQuestion = questionNumber;
        this.updateProgress();
    }

    updateDisplay() {
        document.getElementById('points').innerText = this.points;
        document.getElementById('streak').innerText = this.streak;
    }

    updateProgress() {
        const progressPercent = this.totalQuestions > 0 ? (this.currentQuestion / this.totalQuestions) * 100 : 0;
        document.getElementById('progressFill').style.width = `${progressPercent}%`;
        document.getElementById('currentQuestion').innerText = this.currentQuestion;
    }

    getFinalScore() {
        return {
            points: this.points,
            currentQuestion: this.currentQuestion,
            totalQuestions: this.totalQuestions
        };
    }
}