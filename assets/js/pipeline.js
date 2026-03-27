/* ════════════════════════════════
   PIPELINE.JS — Step state, progress fill, log console
   ════════════════════════════════ */

const FILL_WIDTHS = {
  'step-upload':  '0%',
  'step-ocr':     '33%',
  'step-parse':   '66%',
  'step-results': '100%',
};

const STEPS = ['step-upload', 'step-ocr', 'step-parse', 'step-results'];

/** Set a single step's CSS class (active | done | error | '') */
export function setStep(stepId, status) {
  const el = document.getElementById(stepId);
  if (el) el.className = 'step ' + status;
}

/** Mark step as active and advance the fill bar */
export function activateStep(stepId) {
  STEPS.forEach(s => {
    if (document.getElementById(s)?.classList.contains('active')) return;
  });
  setStep(stepId, 'active');
  const fill = document.getElementById('pipeline-fill');
  if (fill) fill.style.width = FILL_WIDTHS[stepId] ?? '0%';
}

/** Mark step as successfully done */
export function completeStep(stepId) {
  setStep(stepId, 'done');
}

/** Mark step as errored */
export function errorStep(stepId) {
  setStep(stepId, 'error');
}

/** Append a timestamped line to the log box */
export function log(msg, type = 'info') {
  const box = document.getElementById('log-box');
  if (!box) return;
  const line = document.createElement('span');
  line.className = 'log-line ' + type;
  const ts = new Date().toLocaleTimeString();
  line.textContent = `[${ts}] ${msg}`;
  box.appendChild(line);
  box.appendChild(document.createElement('br'));
  box.scrollTop = box.scrollHeight;
}

/** Reset all steps and clear the log */
export function resetPipeline() {
  STEPS.forEach(s => setStep(s, ''));
  const fill = document.getElementById('pipeline-fill');
  if (fill) fill.style.width = '0%';
  const box = document.getElementById('log-box');
  if (box) box.innerHTML = '';
}
