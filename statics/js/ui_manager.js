class UIManager {
    constructor() {
        this.elements = {
            lessonSelector: document.getElementById('lessonSelector'),
            difficultySelector: document.getElementById('difficultySelector'),
            lessonContext: document.getElementById('lessonContext'),
            quizContainer: document.getElementById('quizContainer'),
            quizForm: document.getElementById('quizForm'),
            floatingReadBtn: document.getElementById('floatingReadBtn'),
            loadJsonModal: document.getElementById('loadJsonModal')
        };
    }

    updateLessonSelector(lessons) {
        if (!this.elements.lessonSelector) return;

        this.elements.lessonSelector.innerHTML = '<option value="">-- Selecciona una lección --</option>';

        lessons.forEach(lesson => {
            const displayName = lesson.filename ? lesson.filename.replace('.json', '') : 'Lección Sin Nombre';
            const option = new Option(`${displayName} (DB)`, lesson.id.toString());
            this.elements.lessonSelector.appendChild(option);
        });
    }

    displayContext(context, jsonFile) {
        const fileName = this.formatFileName(jsonFile);

        if (this.elements.lessonContext && context.length > 0) {
            this.elements.lessonContext.innerHTML = `
                <div class="flex items-center mb-4">
                    <h2 class="text-2xl font-bold text-[#ed8936] mr-4">${fileName}</h2>
                </div>
                <div id="lessonContextText">
                    ${context.map(p => `<p class="mb-4">${p}</p>`).join('')}
                </div>
            `;
            this.elements.lessonContext.classList.remove('hidden');
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
        this.elements.lessonSelector.parentElement.classList.add('hidden');
        this.elements.difficultySelector.classList.add('hidden');
        document.getElementById('showDifficultyBtn').classList.remove('hidden');
    }

    showDifficultySelector() {
        document.getElementById('showDifficultyBtn').classList.add('hidden');
        this.elements.lessonContext.classList.add('hidden');
        this.elements.difficultySelector.classList.remove('hidden');
        this.showFloatingReadBtn(false);
    }

    showFloatingReadBtn(show = true) {
        if (this.elements.floatingReadBtn) {
            this.elements.floatingReadBtn.classList.toggle('hidden', !show);
        }
    }

    renderQuestions(questions) {
        this.elements.quizForm.innerHTML = '';

        questions.forEach((question, index) => {
            const questionElement = this.createQuestionElement(question, index);
            this.elements.quizForm.appendChild(questionElement);
        });
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

    showQuizContainer() {
        this.elements.quizContainer.style.display = 'block';
    }

    showQuestion(questionId) {
        const element = document.getElementById(questionId);
        if (element) {
            element.classList.remove('hidden');
            element.classList.add('visible');
        }
    }

    hideQuestion(questionId) {
        const element = document.getElementById(questionId);
        if (element) {
            element.classList.remove('visible');
            element.classList.add('hidden');
        }
    }

    displayQuestionFeedback(question, selectedValue, isCorrect, pointsEarned = 0, streak = 0) {
        const feedback = document.getElementById(`feedback${question.id}`);

        if (selectedValue) {
            const selectedOption = question.options.find(opt => opt.value === selectedValue);
            const explanation = selectedOption?.explanation || '';

            if (isCorrect) {
                feedback.innerHTML = `<span class="correct">¡Correcto! +${pointsEarned} puntos (Racha x${Math.min(streak, 5)})</span><br><span class="text-sm">${explanation}</span>`;
            } else {
                feedback.innerHTML = `<span class="incorrect">Incorrecto.</span><br><span class="text-sm">${explanation}</span>`;
            }
        } else {
            const correctOption = question.options.find(opt => opt.correct);
            const explanation = correctOption?.explanation || '';
            feedback.innerHTML = `<span class="incorrect">No respondida.</span><br><span class="text-sm">${explanation}</span>`;
        }
    }

    displayFinalResults(correctAnswers, totalQuestions, totalPoints) {
        document.getElementById('score').innerText = `Puntuación Final: ${correctAnswers} / ${totalQuestions} (Total: ${totalPoints} puntos)`;
    }

    showSummary(results, questions) {
        const summaryDiv = document.getElementById('summary');
        summaryDiv.innerHTML = `
            <h2 class="text-2xl font-bold text-center text-[#ed8936] mb-6">Resumen de Respuestas</h2>
            ${results.map((result, index) => `
                <a href="#header-smoth-scroll">
                    <button class="summary-item ${result.correct ? 'correct' : 'incorrect'}" 
                            data-question-id="${questions[index].id}">
                        Pregunta ${index + 1}: ${result.correct ? 'Correcta' : 'Incorrecta o no respondida'}
                    </button>
                </a>
            `).join('')}
        `;
    }

    openLoadJsonModal() {
        this.elements.loadJsonModal.classList.remove('hidden');
        document.getElementById('jsonInput').focus();
    }

    closeLoadJsonModal() {
        this.elements.loadJsonModal.classList.add('hidden');
        document.getElementById('jsonInput').value = '';
        document.getElementById('lessonName').value = '';
    }

    getJsonModalData() {
        return {
            jsonText: document.getElementById('jsonInput').value.trim(),
            lessonName: document.getElementById('lessonName').value.trim() || 'leccion_personalizada.json'
        };
    }

    updateTimePerQuestion(difficulty, timePerQuestion) {
        document.getElementById('timePerQuestion').innerText = timePerQuestion[difficulty];
    }
}