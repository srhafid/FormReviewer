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

### promp example

Este prompt sirve para generar automáticamente cuestionarios en formato JSON a partir de una explicación dada.

```txt
Genera EXCLUSIVAMENTE un objeto JSON válido y bien formado para un cuestionario de evaluación, basado en el siguiente contexto: [INSERTAR_CONTEXTO_AQUÍ]

**Parámetros:**
- Número de preguntas: [NÚMERO_DE_PREGUNTAS]
- Longitud de explicaciones: [LONGITUD_EXPLICACIÓN] (corta/mediana/larga)

**Estructura JSON requerida (sin comentarios ni placeholders):**
{
    "context": ["texto del contexto utilizado"],
    "questions": [
        {
            "id": "identificador único",
            "text": "texto de la pregunta",
            "options": [
                {
                    "value": "letra opción",
                    "text": "texto opción",
                    "correct": valor_booleano,
                    "explanation": "texto explicación"
                }
            ]
        }
    ]
}

**Reglas estrictas de formato:**
- SALIDA ÚNICAMENTE JSON VÁLIDO - sin texto, ni comentarios, ni marcas, ni acentos graves
- SIN caracteres de escape adicionales (\\, \n, \t) innecesarios
- SIN "```json" o cualquier otro delimitador de código
- SIN contenido antes o después del objeto JSON
- Las strings del JSON deben usar comillas dobles exclusivamente
- Los valores booleanos deben ser true/false sin comillas

**Instrucciones de contenido:**
- Basa todo el contenido estrictamente en el contexto proporcionado
- Genera exactamente el número especificado de preguntas
- Variedad de tipos de preguntas (conceptuales, aplicativas, detalle)
- Solo una opción correcta por pregunta (correct: true)
- Explicaciones con longitud apropiada: corta(1-2 oraciones), mediana(3-4), larga(5+)
- Opciones incorrectas deben ser plausibles pero erróneas
- Lenguaje claro y profesional acorde al tema

El output debe ser directamente parseable por cualquier parser JSON estándar.

```
