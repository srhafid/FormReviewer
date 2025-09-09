# FormReviewer

## Cuestionario Gamificado de Ciberseguridad

Este proyecto es un cuestionario interactivo en HTML y TailwindCSS que carga preguntas dinámicamente desde archivos JSON.  
Incluye un script en Node.js (`inject-lessons.js`) que se encarga de inyectar automáticamente todas las lecciones disponibles en la carpeta `lessons/` dentro del selector del archivo `index.html`.

---

## ⚙️ Funcionamiento

1. Cada **lección** es un archivo `.json` ubicado dentro de la carpeta `lessons/`.  
   - Ejemplo: `lessons/introduccion_a_la_ciberseguridad.json`.

2. El script `inject-lessons.js`:
   - Busca todos los `.json` dentro de `lessons/`.
   - Genera automáticamente las opciones `<option>` del `<select>` en `index.html`.
   - Inyecta esas opciones reemplazando el contenido anterior.

3. Al abrir `index.html` en el navegador, el usuario puede seleccionar una lección desde el desplegable y cargar sus preguntas.

---

## 🚀 Uso

1. Asegúrate de tener [Node.js](https://nodejs.org/) instalado.
2. Crea la carpeta `lessons/` (si no existe).
3. Coloca dentro de `lessons/` tus archivos `.json` con las preguntas.
4. Ejecuta el script para inyectar las lecciones en el HTML:

```bash
node inject-lessons.js
```

#### promp example

Este prompt sirve para generar automáticamente cuestionarios en formato JSON a partir de una explicación dada.

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