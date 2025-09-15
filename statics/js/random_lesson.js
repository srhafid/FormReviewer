document.addEventListener('DOMContentLoaded', function () {
    // Obtener el botón de lección aleatoria
    const randomLessonBtn = document.getElementById('randomLessonBtn');

    if (randomLessonBtn) {
        randomLessonBtn.addEventListener('click', async function () {
            try {
                // Obtener el selector de lecciones
                const lessonSelector = document.getElementById('lessonSelector');
                if (!lessonSelector) {
                    alert('Error: No se encontró el selector de lecciones.');
                    return;
                }

                // Obtener todas las opciones del selector, excluyendo la opción predeterminada ("-- Selecciona una lección --")
                const options = Array.from(lessonSelector.options).filter(option => option.value !== '');

                if (options.length === 0) {
                    alert('No hay lecciones disponibles para seleccionar.');
                    return;
                }

                // Seleccionar una opción aleatoria
                const randomIndex = Math.floor(Math.random() * options.length);
                const randomOption = options[randomIndex];
                lessonSelector.value = randomOption.value;

                // Disparar el evento de cambio en el selector para reflejar la selección
                const changeEvent = new Event('change', { bubbles: true });
                lessonSelector.dispatchEvent(changeEvent);

                // Simular el clic en el botón "Cargar Lección"
                const loadLessonBtn = document.getElementById('loadLessonBtn');
                if (loadLessonBtn) {
                    loadLessonBtn.click();
                } else {
                    alert('Error: No se encontró el botón para cargar la lección.');
                }
            } catch (err) {
                console.error('Error al seleccionar lección aleatoria:', err);
                alert('Error al cargar una lección aleatoria. Revisa la consola para más detalles.');
            }
        });
    }
});