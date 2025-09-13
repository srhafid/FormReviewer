document.addEventListener('DOMContentLoaded', () => {
    new QuizManager();
});

window.speechSynthesis.onvoiceschanged = () => {
    // Este evento se maneja internamente en SpeechManager
};