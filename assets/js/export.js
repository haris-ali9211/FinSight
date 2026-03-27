/* ════════════════════════════════
   EXPORT.JS — JSON download
   ════════════════════════════════ */

/**
 * Trigger a browser download of the analysis result as JSON.
 * @param {object|null} data  The parsed analysis result object
 */
export function exportJSON(data) {
  if (!data) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'bank_statement_analysis.json';
  a.click();
  URL.revokeObjectURL(url);
}
