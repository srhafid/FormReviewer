const fs = require("fs");
const path = require("path");

const lessonsDir = path.join(__dirname, "lessons");
const htmlFile = path.join(__dirname, "index.html");

// 1. Leer todos los archivos .json de la carpeta lesson
const lessonFiles = fs.readdirSync(lessonsDir).filter(file => file.endsWith(".json"));

// 2. Generar las <option>
const options = [
    `<option value="">-- Selecciona una lección --</option>`,
    ...lessonFiles.map(file => {
        // nombre bonito (sin guiones ni extensión)
        const label = path.basename(file, ".json").replace(/_/g, " ");
        return `<option value="${file}">${label.charAt(0).toUpperCase() + label.slice(1)}</option>`;
    })
].join("\n            ");

// 3. Cargar el HTML original
let html = fs.readFileSync(htmlFile, "utf8");

// 4. Reemplazar el bloque de <option>
html = html.replace(
    /<select id="lessonSelector">[\s\S]*?<\/select>/,
    `<select id="lessonSelector">\n            ${options}\n        </select>`
);

// 5. Guardar el archivo HTML actualizado
fs.writeFileSync(htmlFile, html, "utf8");

console.log("✅ Opciones inyectadas en index.html");
