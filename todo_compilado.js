import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname since we are in an ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= CONFIGURACIÓN =================
// Ruta del proyecto a compilar
const RUTA_ORIGEN = path.resolve(__dirname);
// Ruta del archivo de salida
const RUTA_DESTINO_TXT = path.join(__dirname, 'todo_compilado.txt');

// Extensiones de archivos que se copiarán
const EXTENSIONES_VALIDAS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.json'];

// Carpetas y archivos a ignorar
const CARPETAS_IGNORAR = ['node_modules', 'dist', 'build', '.git'];
const ARCHIVOS_IGNORAR = [
    '.env',
    '.env.local',
    'package-lock.json',
    'todo_compilado.txt',
    'todo_compilado.py',
    'todo_compilado.js'
];

// ================= FUNCIONES =================
function esArchivoValido(archivo) {
    const isExtValid = EXTENSIONES_VALIDAS.some(ext => archivo.toLowerCase().endsWith(ext));
    const isIgnored = ARCHIVOS_IGNORAR.includes(archivo);
    return isExtValid && !isIgnored;
}

function recorrerDirectorio(dir, cb) {
    const files = fs.readdirSync(dir);
    const validFiles = [];
    const dirs = [];

    for (const f of files) {
        const fullPath = path.join(dir, f);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (!CARPETAS_IGNORAR.includes(f)) {
                dirs.push(fullPath);
            }
        } else {
            validFiles.push(f);
        }
    }

    cb(dir, validFiles);
    for (const d of dirs) {
        recorrerDirectorio(d, cb);
    }
}

function copiarProyectoATxt(rutaOrigen, rutaDestinoTxt) {
    const dirname = path.dirname(rutaDestinoTxt);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }

    const outputStream = fs.createWriteStream(rutaDestinoTxt, { encoding: 'utf-8' });

    recorrerDirectorio(rutaOrigen, (root, files) => {
        let rutaRelativa = path.relative(rutaOrigen, root);
        if (rutaRelativa === '') rutaRelativa = '.';

        let folderHeaderWritten = false;

        for (const archivo of files) {
            if (esArchivoValido(archivo)) {
                if (!folderHeaderWritten) {
                    outputStream.write(`\n=== Carpeta: ${rutaRelativa} ===\n`);
                    folderHeaderWritten = true;
                }

                const archivoOrigen = path.join(root, archivo);
                outputStream.write(`\n--- Archivo: ${archivo} ---\n`);
                try {
                    const contenido = fs.readFileSync(archivoOrigen, 'utf-8');
                    outputStream.write(contenido + "\n");
                } catch (e) {
                    outputStream.write(`[ERROR LEYENDO ARCHIVO: ${e.message}]\n`);
                }
            }
        }
    });

    outputStream.end(() => {
        console.log(`Proyecto copiado exitosamente a: ${rutaDestinoTxt}`);
    });
}

// ================= EJECUCIÓN =================
copiarProyectoATxt(RUTA_ORIGEN, RUTA_DESTINO_TXT);
