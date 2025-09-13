class TimerManager {
    constructor() {
        this.timers = {
            global: null,
            question: null
        };
        this.timePerQuestion = {
            easy: 30,
            medium: 20,
            hard: 10
        };
    }

    startGlobalTimer(callback) {
        let globalTimeLeft = 600; // 10 minutos
        document.getElementById('timer').innerText = 'Tiempo Total: 10:00';

        this.timers.global = setInterval(() => {
            globalTimeLeft--;
            const timeString = this.formatTime(globalTimeLeft);
            document.getElementById('timer').innerText = `Tiempo Total: ${timeString}`;

            if (globalTimeLeft <= 0) {
                this.clearAllTimers();
                callback();
            }
        }, 1000);
    }

    startQuestionTimer(difficulty, questionId, callback) {
        this.clearQuestionTimer();

        let timeLeft = this.timePerQuestion[difficulty];
        const timerDisplay = document.getElementById(`questionTimer${questionId}`);

        if (timerDisplay) {
            timerDisplay.innerText = `Tiempo restante: ${timeLeft}s`;
        }

        this.timers.question = setInterval(() => {
            timeLeft--;
            if (timerDisplay) {
                timerDisplay.innerText = `Tiempo restante: ${timeLeft}s`;
            }

            if (timeLeft <= 0) {
                this.clearQuestionTimer();
                callback(true); // timedOut = true
            }
        }, 1000);
    }

    clearQuestionTimer() {
        if (this.timers.question) {
            clearInterval(this.timers.question);
            this.timers.question = null;
        }
    }

    clearAllTimers() {
        if (this.timers.global) {
            clearInterval(this.timers.global);
            this.timers.global = null;
        }
        this.clearQuestionTimer();
    }

    formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    }
}