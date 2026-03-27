/* ════════════════════════════════
   OCR.JS — PaddleOCR Layout Parsing API
   Sends the PDF as base64 directly to the API.
   No page-by-page image extraction needed.
   ════════════════════════════════ */

import { log } from './pipeline.js';

/**
 * Send a PDF File to the local proxy, which forwards to PaddleOCR.
 * Returns concatenated markdown from all parsed sections.
 *
 * @param {File}   file     The PDF File object
 * @param {string} proxyUrl Local proxy endpoint, e.g. http://localhost:3001/api/ocr
 * @returns {Promise<string>} Concatenated markdown text
 */
export async function runOCR(file, proxyUrl) {
  log('Reading PDF as base64…');
  const fileData = await fileToBase64(file);

  // fileType: 0 = PDF, 1 = image
  const fileType = file.type === 'application/pdf' ? 0 : 1;

  const payload = {
    file:                       fileData,
    fileType:                   fileType,
    useDocOrientationClassify:  false,
    useDocUnwarping:            false,
    useChartRecognition:        false,
  };

  log('Sending PDF to PaddleOCR via proxy…');

  const response = await fetch(proxyUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`PaddleOCR API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  // Extract markdown text from all layout parsing results
  const results = data?.result?.layoutParsingResults ?? [];

  if (results.length === 0) {
    throw new Error('PaddleOCR returned no layout results. Check your file and API credentials.');
  }

  log(`✓ Layout parsing complete — ${results.length} section(s) extracted`, 'ok');

  // Concatenate all markdown sections into one text block for LLM parsing
  const combinedText = results
    .map((res, i) => {
      const md = res?.markdown?.text ?? '';
      return md;
    })
    .filter(Boolean)
    .join('\n\n---\n\n');

  return combinedText;
}

/* ── Helpers ── */

/**
 * Convert a File object to a base64-encoded ASCII string (no data URI prefix).
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => {
      // result is "data:application/pdf;base64,<data>" — strip the prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file as base64'));
    reader.readAsDataURL(file);
  });
}
