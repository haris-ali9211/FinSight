/* ════════════════════════════════
   UPLOAD.JS — File drag-drop, validation, readiness check
   ════════════════════════════════ */

/** Shared state — exported so other modules can read it */
export const state = {
  uploadedFile: null,
};

/** Format raw bytes to human-readable string */
export function formatBytes(bytes) {
  if (bytes < 1024)    return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

/** Handle a dropped or selected File object */
export function handleFile(file) {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    alert('Please upload a PDF file.');
    return;
  }
  state.uploadedFile = file;

  const nameEl = document.getElementById('filename');
  const sizeEl = document.getElementById('filesize');
  const meta   = document.getElementById('filemeta');

  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = formatBytes(file.size);
  if (meta)   meta.classList.add('visible');

  checkReady();
}

/** Enable/disable the Analyze button — only requires a file */
export function checkReady() {
  const btn = document.getElementById('analyze-btn');
  if (btn) btn.disabled = !state.uploadedFile;
}

/** Register all drag-and-drop and input listeners */
export function initUpload() {
  const dropzone  = document.getElementById('dropzone');
  const fileinput = document.getElementById('fileinput');
  const browseBtn = document.getElementById('browse-btn');

  if (!dropzone || !fileinput) return;

  // Drag events
  ['dragover', 'dragenter'].forEach(evt =>
    dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.add('dragging'); })
  );

  ['dragleave', 'drop'].forEach(evt =>
    dropzone.addEventListener(evt, e => {
      e.preventDefault();
      dropzone.classList.remove('dragging');
      if (evt === 'drop' && e.dataTransfer?.files[0]) handleFile(e.dataTransfer.files[0]);
    })
  );

  // Browse button
  browseBtn?.addEventListener('click', () => fileinput.click());

  // File input change
  fileinput.addEventListener('change', () => {
    if (fileinput.files?.[0]) handleFile(fileinput.files[0]);
  });
}
