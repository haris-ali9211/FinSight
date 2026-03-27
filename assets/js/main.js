/* ════════════════════════════════
   MAIN.JS — Entry point
   Imports all modules, wires up event listeners,
   orchestrates the full analysis flow.
   ════════════════════════════════ */

import { initUpload, state as uploadState } from './upload.js';
import { runOCR }                          from './ocr.js';
import { parseWithLLM }                    from './llm.js';
import { renderResults }                   from './renderer.js';
import { exportJSON }                      from './export.js';
import { CONFIG }                          from './config.js';
import {
  activateStep,
  completeStep,
  errorStep,
  log,
  resetPipeline,
} from './pipeline.js';

/* ── App-level state ── */
let analysisResult = null;

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  initUpload();
  document.getElementById('analyze-btn')?.addEventListener('click', startAnalysis);
  document.getElementById('export-btn')?.addEventListener('click', () => exportJSON(analysisResult));
});

/* ── Main analysis flow ── */
async function startAnalysis() {
  const file = uploadState.uploadedFile;
  if (!file) return;

  const { paddleUrl, llmKey, llmProvider } = CONFIG;

  // Reset UI
  resetPipeline();
  document.getElementById('pipeline')?.classList.add('visible');
  document.getElementById('results')?.classList.remove('visible');
  setAnalyzeLoading(true);
  analysisResult = null;

  try {
    // ── Step 1: Validate PDF ─────────────────────────
    activateStep('step-upload');
    log(`File ready: ${file.name} (${(file.size / 1048576).toFixed(1)} MB)`);
    completeStep('step-upload');

    // ── Step 2: OCR via PaddleOCR Layout Parsing ────
    activateStep('step-ocr');
    const rawText = await runOCR(file, paddleUrl);
    log(`✓ OCR complete — ${rawText.length} characters extracted`, 'ok');
    completeStep('step-ocr');

    // ── Step 3: LLM Parsing ─────────────────────────
    activateStep('step-parse');
    log(`Parsing with ${llmProvider.toUpperCase()} (${CONFIG.llmModel})…`);
    analysisResult = await parseWithLLM(rawText, llmKey, llmProvider, CONFIG.llmModel);
    log('✓ AI parsing complete', 'ok');
    completeStep('step-parse');

    // ── Step 4: Render ──────────────────────────────
    activateStep('step-results');
    renderResults(analysisResult);
    completeStep('step-results');

    // Advance fill to 100%
    const fill = document.getElementById('pipeline-fill');
    if (fill) fill.style.width = '100%';

    // Show results
    const resultsEl = document.getElementById('results');
    resultsEl?.classList.add('visible');
    resultsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    log(`✗ ${err.message}`, 'err');
    console.error('[FinSight]', err);

    // Mark the currently active step as errored
    ['step-upload', 'step-ocr', 'step-parse', 'step-results'].forEach(s => {
      if (document.getElementById(s)?.classList.contains('active')) errorStep(s);
    });

  } finally {
    setAnalyzeLoading(false);
  }
}

/* ── Helpers ── */
function setAnalyzeLoading(loading) {
  const btn     = document.getElementById('analyze-btn');
  const iconEl  = document.getElementById('analyze-icon');
  const textEl  = document.getElementById('analyze-text');
  if (!btn) return;
  btn.disabled         = loading;
  iconEl.textContent   = loading ? '⏳' : '⚡';
  textEl.textContent   = loading ? 'Analyzing…' : 'Analyze Statement';
}
