let currentPDF = null;

function toggleSplitOptions() {
    const method = document.getElementById('splitMethod').value;
    document.getElementById('splitCountDiv').style.display = method === 'byCount' ? 'block' : 'none';
    document.getElementById('splitPagesDiv').style.display = method === 'byPages' ? 'block' : 'none';
    document.getElementById('splitRangeDiv').style.display = method === 'byRange' ? 'block' : 'none';
}

async function uploadPDF() {
    const fileInput = document.getElementById('pdfFile');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const arrayBuffer = e.target.result;
            currentPDF = await PDFLib.PDFDocument.load(arrayBuffer);
            document.getElementById('fileInfo').textContent = `اسم الملف: ${file.name}, الحجم: ${(file.size / 1024 / 1024).toFixed(2)} ميجابايت, عدد الصفحات: ${currentPDF.getPageCount()}`;
        };
        reader.readAsArrayBuffer(file);
    }
}

async function splitPDF() {
    if (!currentPDF) {
        alert('الرجاء تحميل ملف PDF أولاً');
        return;
    }
    
    const method = document.getElementById('splitMethod').value;
    const totalPages = currentPDF.getPageCount();
    let parts = [];

    if (method === 'byCount') {
        const count = parseInt(document.getElementById('splitCount').value);
        const pagesPerPart = Math.ceil(totalPages / count);
        for (let i = 0; i < count; i++) {
            const start = i * pagesPerPart;
            const end = Math.min((i + 1) * pagesPerPart, totalPages);
            parts.push({start, end});
        }
    } else if (method === 'byPages') {
        const pagesPerPart = parseInt(document.getElementById('splitPages').value);
        for (let i = 0; i < totalPages; i += pagesPerPart) {
            parts.push({start: i, end: Math.min(i + pagesPerPart, totalPages)});
        }
    } else if (method === 'byRange') {
        const ranges = document.getElementById('splitRange').value.split(',');
        parts = ranges.map(range => {
            const [start, end] = range.split('-').map(num => parseInt(num) - 1);
            return {start, end: end + 1};
        });
    }

    const progress = document.getElementById('splitProgress');
    progress.style.display = 'block';
    progress.value = 0;

    for (let i = 0; i < parts.length; i++) {
        const {start, end} = parts[i];
        const newPdf = await PDFLib.PDFDocument.create();
        
        for (let j = start; j < end; j++) {
            const [copiedPage] = await newPdf.copyPages(currentPDF, [j]);
            newPdf.addPage(copiedPage);
        }
        
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        saveAs(blob, `split_part_${i + 1}.pdf`);

        progress.value = ((i + 1) / parts.length) * 100;
    }

    document.getElementById('splitInfo').textContent = `تم تقسيم الملف إلى ${parts.length} أجزاء`;
}
