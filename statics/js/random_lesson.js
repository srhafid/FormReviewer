document.addEventListener('DOMContentLoaded', function () {
    // Obtener el botón de lección aleatoria
    const randomLessonBtn = document.getElementById('randomLessonBtn');

    if (randomLessonBtn) {
        randomLessonBtn.addEventListener('click', async function () {
            try {
                // Inicializar DatabaseManager
                const dbManager = new DatabaseManager();
                await dbManager.initialize();

                // Obtener todas las lecciones de IndexedDB
                const lessons = await dbManager.getAllLessons();

                if (lessons.length === 0) {
                    alert('No hay lecciones disponibles para seleccionar.');
                    return;
                }

                // Seleccionar una lección aleatoria
                const randomIndex = Math.floor(Math.random() * lessons.length);
                const randomLesson = lessons[randomIndex];

                // Obtener el input oculto y el input de búsqueda
                const lessonSelector = document.getElementById('lessonSelector');
                const lessonSearchInput = document.getElementById('lessonSearchInput');

                if (!lessonSelector || !lessonSearchInput) {
                    alert('Error: No se encontraron los elementos de selección de lecciones.');
                    return;
                }

                // Establecer el ID de la lección aleatoria y actualizar el input de búsqueda
                lessonSelector.value = randomLesson.id;
                lessonSearchInput.value = randomLesson.filename;

                // Disparar el evento de cambio en lessonSelector para compatibilidad
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