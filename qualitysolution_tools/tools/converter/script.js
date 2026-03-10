let originalContent = '';
let convertedContent = '';
let fileName = '';
let fileExtension = '';

// Manejar selección de delimitador personalizado
document.getElementById('original-delimiter').addEventListener('change', function() {
    const container = document.getElementById('custom-original-container');
    if (this.value === 'custom') {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
});

// Event Listeners para el input de archivo
// Referencias a elementos
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');

// --- NUEVO: Hacer que la zona sea clicable ---
dropzone.addEventListener('click', () => fileInput.click());

// Evitar que el clic se dispare dos veces si se hace clic directamente en el input (aunque esté oculto)
fileInput.addEventListener('click', (e) => e.stopPropagation());
// ----------------------------------------------

// Tus Event Listeners actuales (Mantenlos)
fileInput.addEventListener('change', handleFileSelect);
dropzone.addEventListener('dragover', dragOver);
dropzone.addEventListener('dragleave', dragLeave);
dropzone.addEventListener('drop', dropFile);
document.getElementById('convert-btn').addEventListener('click', convertFile);
document.getElementById('clear-btn').addEventListener('click', clearAll);

// Event Listeners para los botones de formato
document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        const format = this.getAttribute('data-format');
        downloadFile(format);
    });
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        fileName = file.name;
        fileExtension = fileName.split('.').pop().toLowerCase();
        readFile(file);
    }
}

function dragOver(event) {
    event.preventDefault();
    document.getElementById('dropzone').classList.add('dragover');
}

function dragLeave(event) {
    event.preventDefault();
    document.getElementById('dropzone').classList.remove('dragover');
}

function dropFile(event) {
    event.preventDefault();
    document.getElementById('dropzone').classList.remove('dragover');
    const file = event.dataTransfer.files[0];
    if (file) {
        fileName = file.name;
        fileExtension = fileName.split('.').pop().toLowerCase();
        readFile(file);
    }
}

function readFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        originalContent = e.target.result;
        document.getElementById('convert-btn').disabled = false;
        
        // Mejora visual: avisar que el archivo está listo
        const dropzoneText = dropzone.querySelector('p');
        if (dropzoneText) {
            dropzoneText.innerHTML = `✅ <strong>${file.name}</strong> cargado correctamente`;
        }
    };
    reader.readAsText(file, 'utf-8');
}

function getDelimiterValue(selectId, customId) {
    const select = document.getElementById(selectId);
    const custom = document.getElementById(customId);
    
    if (select.value === 'custom') {
        return custom.value || '#';
    } else if (select.value === '\\t') {
        return '\t';
    } else {
        return select.value;
    }
}

function convertFile() {
    if (!originalContent) {
        alert('Por favor, sube un archivo primero');
        return;
    }

    const originalDelimiter = getDelimiterValue('original-delimiter', 'custom-original');
    const newDelimiter = document.getElementById('new-delimiter').value || '#';
    const conversionType = document.getElementById('conversion-type').value;

    // --- NUEVA LIMPIEZA AGRESIVA ---
    let lines = originalContent.split(/\r?\n/);
    
    let cleanLines = lines.filter(line => {
        // 1. Quitamos espacios en blanco
        let trimmedLine = line.trim();
        
        // 2. Si la línea está vacía, fuera.
        if (trimmedLine.length === 0) return false;

        // 3. REGLA DE ORO: Si quitamos todos los delimitadores y la línea se queda vacía,
        // significa que era una línea "fantasma" de Excel.
        let contentWithoutDelimiters = trimmedLine.split(originalDelimiter).join('').trim();
        
        return contentWithoutDelimiters.length > 0; // Solo mantenemos si hay datos reales
    });

    let contentToProcess = cleanLines.join('\n');
    // ----------------------------------------

    if (originalDelimiter === newDelimiter) {
        alert('El delimitador original y el nuevo no pueden ser iguales');
        return;
    }

    let result = contentToProcess;
    let replacements = 0;

    // Ejecutamos la lógica de conversión sobre el contenido ya limpio
    switch (conversionType) {
        case 'replace':
            const regex = new RegExp(escapeRegExp(originalDelimiter), 'g');
            result = contentToProcess.replace(regex, newDelimiter);
            replacements = (contentToProcess.match(regex) || []).length;
            break;
        case 'add':
            const addRegex = new RegExp(escapeRegExp(originalDelimiter), 'g');
            result = contentToProcess.replace(addRegex, originalDelimiter + newDelimiter);
            replacements = (contentToProcess.match(addRegex) || []).length;
            break;
        case 'remove':
            const removeRegex = new RegExp(escapeRegExp(originalDelimiter), 'g');
            result = contentToProcess.replace(removeRegex, '');
            replacements = (contentToProcess.match(removeRegex) || []).length;
            break;
    }

    convertedContent = result;
    document.getElementById('result-content').textContent = result;
    
    // Estadísticas
    const linesCount = cleanLines.length;
    document.getElementById('lines-count').textContent = linesCount.toLocaleString() + ' líneas';
    document.getElementById('replacements-count').textContent = replacements.toLocaleString() + ' reemplazos';
    
    document.getElementById('result-section').style.display = 'block';
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function downloadFile(format = 'csv') {
    if (!convertedContent) {
        alert('No hay contenido convertido para descargar');
        return;
    }

    let mimeType = 'text/csv;charset=utf-8;';
    let extension = 'csv';
    
    switch (format) {
        case 'txt':
            mimeType = 'text/plain;charset=utf-8;';
            extension = 'txt';
            break;
        case 'tsv':
            mimeType = 'text/tab-separated-values;charset=utf-8;';
            extension = 'tsv';
            break;
        default:
            mimeType = 'text/csv;charset=utf-8;';
            extension = 'csv';
    }

    const blob = new Blob([convertedContent], { type: mimeType });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName.replace(/\.[^/.]+$/, '') + '_convertido.' + extension);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function clearAll() {
    originalContent = '';
    convertedContent = '';
    fileName = '';
    fileExtension = '';
    
    document.getElementById('file-input').value = '';
    document.getElementById('result-section').style.display = 'none';
    document.getElementById('convert-btn').disabled = false;
    document.getElementById('download-btn').disabled = true;
    
    document.getElementById('result-content').textContent = '';
    
    document.getElementById('lines-count').textContent = '0 líneas';
    document.getElementById('replacements-count').textContent = '0 reemplazos';
}
