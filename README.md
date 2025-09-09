# FormReviewer


#### promp example

```txt
Crea un cuestionario de evaluación en formato JSON basado en la siguiente explicación: [INSERTAR_EXPLICACIÓN_AQUÍ]

Requisitos:
1. Genera exactamente [NÚMERO_DE_PREGUNTAS] preguntas
2. Cada explicación en las opciones debe tener una extensión de [LONGITUD_EXPLICACIÓN] (corta/mediana/larga)
3. Formato de salida JSON con esta estructura:
[
    {
        "id": "q1",
        "text": "Pregunta aquí",
        "options": [
            {
                "value": "a",
                "text": "Opción aquí",
                "correct": true/false,
                "explanation": "Explicación aquí"
            }
        ]
    }
]

Instrucciones específicas:
- Las preguntas deben cubrir diferentes aspectos de la explicación
- Solo una opción correcta por pregunta
- Las explicaciones deben ser precisas y basadas en el contenido
- Usa un lenguaje claro y apropiado para el tema
- Incluye opciones plausibles pero incorrectas
- Varía el tipo de preguntas (conceptuales, aplicativas, de detalles)

Parámetros configurables:
- Número de preguntas: [X]
- Longitud de explicaciones: [corta (1-2 oraciones), mediana (3-4 oraciones), larga (5+ oraciones)]

```