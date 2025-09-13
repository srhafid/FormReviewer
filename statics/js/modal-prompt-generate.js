// Esperar a que el DOM esté cargado para evitar errores de elementos null
document.addEventListener('DOMContentLoaded', function () {
    // Show modal when "Generar Nuevo Cuestionario" button is clicked
    var generateQuizBtn = document.getElementById('generateQuizBtn');
    if (generateQuizBtn) {
        generateQuizBtn.addEventListener('click', function () {
            var modal = document.getElementById('generateQuizModal');
            if (modal) {
                modal.classList.remove('hidden');
            }
        });
    }

    // Hide modal when "Cancelar" button is clicked
    var cancelModalBtn = document.getElementById('cancelModalBtn');
    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', function () {
            var modal = document.getElementById('generateQuizModal');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    }

    // Handle form submission to copy prompt
    var generateQuizForm = document.getElementById('generateQuizForm');
    if (generateQuizForm) {
        generateQuizForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var context = document.getElementById('quizContext').value.trim();
            var numQuestions = document.getElementById('numQuestions').value;
            var explanationLength = document.getElementById('explanationLength').value;

            if (!context) {
                alert('Por favor, ingresa un contexto válido.');
                return;
            }

            // Construct the prompt for JSON generation using simple concatenation
            var prompt = 'Genera EXCLUSIVAMENTE un objeto JSON válido y bien formado para un cuestionario de evaluación, basado en el siguiente contexto: ' + context + '\n\n' +
                '**Parámetros:**\n' +
                '- Número de preguntas: ' + numQuestions + '\n' +
                '- Longitud de explicaciones: ' + explanationLength + '\n\n' +
                '**Estructura JSON requerida (sin comentarios ni placeholders):**\n' +
                '{\n' +
                '    "context": ["texto del contexto utilizado"],\n' +
                '    "questions": [\n' +
                '        {\n' +
                '            "id": "identificador único",\n' +
                '            "text": "texto de la pregunta",\n' +
                '            "options": [\n' +
                '                {\n' +
                '                    "value": "letra opción",\n' +
                '                    "text": "texto opción",\n' +
                '                    "correct": valor_booleano,\n' +
                '                    "explanation": "texto explicación"\n' +
                '                }\n' +
                '            ]\n' +
                '        }\n' +
                '    ]\n' +
                '}\n\n' +
                '**Reglas estrictas de formato:**\n' +
                '- SALIDA ÚNICAMENTE JSON VÁLIDO - sin texto, ni comentarios, ni marcas, ni acentos graves\n' +
                '- SIN caracteres de escape adicionales (\\\\, \\n, \\t) innecesarios\n' +
                '- SIN "```json" o cualquier otro delimitador de código\n' +
                '- SIN contenido antes o después del objeto JSON\n' +
                '- Las strings del JSON deben usar comillas dobles exclusivamente\n' +
                '- Los valores booleanos deben ser true/false sin comillas\n\n' +
                '**Instrucciones de contenido:**\n' +
                '- Basa todo el contenido estrictamente en el contexto proporcionado\n' +
                '- Genera exactamente el número especificado de preguntas\n' +
                '- Las preguntas deben ser de alta dificultad, requiriendo análisis profundo, comprensión avanzada y atención a detalles sutiles del contexto\n' +
                '- Las opciones de respuesta deben ser plausibles, confusas y retadoras, pero siempre con sentido dentro del contexto\n' +
                '- Variedad de tipos de preguntas (conceptuales, aplicativas, detalle, inferenciales)\n' +
                '- Solo una opción correcta por pregunta (correct: true)\n' +
                '- Explicaciones con longitud apropiada: corta(1-2 oraciones), mediana(3-4), larga(5+)\n' +
                '- Opciones incorrectas deben ser plausibles pero erróneas y diseñadas para confundir a quien no domine el tema\n' +
                '- Lenguaje claro, profesional y desafiante acorde al tema\n' +
                '- PRIORIZA SIEMPRE EL APARTADO TÉCNICO, científico, de ingeniería o relacionado a ciencias. Evita preguntas arbitrarias sobre presentaciones, nombres, datos anecdóticos o superficiales. El enfoque debe ser en lo técnico y conceptual relevante al área de estudio.';

            // Copy prompt to clipboard
            navigator.clipboard.writeText(prompt).then(function () {
                alert('Prompt copiado al portapapeles con éxito!');
                // Cerrar modal después de copiar
                var modal = document.getElementById('generateQuizModal');
                if (modal) modal.classList.add('hidden');
                generateQuizForm.reset();
            }).catch(function (err) {
                console.error('Error al copiar al portapapeles:', err);
                alert('No se pudo copiar el prompt. Por favor, cópialo manualmente.');
            });
        });
    }
});