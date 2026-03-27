/* ════════════════════════════════
   RENDERER.JS — Render analysis results to the DOM
   ════════════════════════════════ */

/** Master render dispatcher */
export function renderResults(data) {
  const meta = document.getElementById('results-meta');
  if (meta) meta.textContent = `Statement analyzed · ${new Date().toLocaleString()}`;

  renderDemographics(data.demographics);
  renderStamp(data.stamp);
  renderMonthly(data.monthly_stats, data.summary);
  renderTransactions(data.transactions);
}

/* ── Demographics ── */
export function renderDemographics(d) {
  const fields = [
    { key: 'Bank Name',        val: d.bank_name        },
    { key: 'Account Title',    val: d.account_title    },
    { key: 'Account Number',   val: d.account_number   },
    { key: 'IBAN',             val: d.iban              },
    { key: 'Branch',           val: d.branch           },
    { key: 'Statement Period', val: d.statement_period },
    { key: 'Statement Date',   val: d.statement_date   },
    { key: 'Currency',         val: d.currency         },
    { key: 'Address',          val: d.address          },
  ];

  const container = document.getElementById('demo-fields');
  if (!container) return;

  container.innerHTML = fields.map(f => `
    <div class="demo-field">
      <div class="demo-key">${f.key}</div>
      <div class="demo-value ${f.val ? '' : 'empty'}">${f.val ?? 'Not found'}</div>
    </div>
  `).join('');
}

/* ── Stamp Detection ── */
export function renderStamp(s) {
  const indicator = document.getElementById('stamp-indicator');
  const statusEl  = document.getElementById('stamp-status');
  const descEl    = document.getElementById('stamp-desc');
  const confEl    = document.getElementById('stamp-confidence');
  if (!indicator) return;

  if (s.present === true) {
    indicator.textContent = '✅';
    indicator.className   = 'stamp-indicator present';
    statusEl.textContent  = 'Stamp / Seal Detected';
    statusEl.style.color  = 'var(--accent-green)';
  } else if (s.present === false) {
    indicator.textContent = '❌';
    indicator.className   = 'stamp-indicator absent';
    statusEl.textContent  = 'No Stamp Found';
    statusEl.style.color  = 'var(--accent-red)';
  } else {
    indicator.textContent = '❓';
    indicator.className   = 'stamp-indicator unknown';
    statusEl.textContent  = 'Inconclusive';
    statusEl.style.color  = 'var(--accent-amber)';
  }

  if (descEl) descEl.textContent = s.description ?? '';
  if (confEl) confEl.textContent = `🎯 Confidence: ${s.confidence ?? 'unknown'}`;
}

/* ── Monthly Statistics ── */
export function renderMonthly(months, summary) {
  renderSummaryMetrics(summary, months.length);
  renderMonthsTable(months);
}

function renderSummaryMetrics(summary, fallbackCount) {
  const metricsData = [
    { label: 'Overall Min',    val: fmtNum(summary.overall_min),    cls: 'amber'  },
    { label: 'Overall Max',    val: fmtNum(summary.overall_max),    cls: 'green'  },
    { label: 'Overall Avg',    val: fmtNum(summary.overall_avg),    cls: 'blue'   },
    { label: 'Total Credits',  val: fmtNum(summary.total_credits),  cls: 'green'  },
    { label: 'Total Debits',   val: fmtNum(summary.total_debits),   cls: 'amber'  },
    { label: 'Months',         val: summary.total_months ?? fallbackCount, cls: 'purple' },
  ];

  const container = document.getElementById('summary-metrics');
  if (!container) return;

  container.innerHTML = metricsData.map(m => `
    <div class="metric">
      <div class="metric-label">${m.label}</div>
      <div class="metric-value ${m.cls}">${m.val}</div>
    </div>
  `).join('');
}

function renderMonthsTable(months) {
  const tbody = document.getElementById('months-tbody');
  if (!tbody) return;

  if (months.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="color:var(--text-muted);text-align:center;padding:32px">
          No monthly data found
        </td>
      </tr>`;
    return;
  }

  const maxAvg = Math.max(...months.map(m => m.avg_balance ?? 0), 1);

  tbody.innerHTML = months.map(m => {
    const barW = Math.min(100, ((m.avg_balance ?? 0) / maxAvg) * 100).toFixed(0);
    return `
      <tr>
        <td class="month-name">${m.month ?? '—'}</td>
        <td class="amount">${fmtNum(m.min_balance)}</td>
        <td class="amount pos">${fmtNum(m.max_balance)}</td>
        <td class="amount neu">${fmtNum(m.avg_balance)}</td>
        <td class="amount pos">${fmtNum(m.total_credits)}</td>
        <td class="amount neg">${fmtNum(m.total_debits)}</td>
        <td>
          <div class="mini-bar-wrap">
            <div class="mini-bar" style="width:${barW}%"></div>
          </div>
        </td>
      </tr>`;
  }).join('');
}

/* ── 4. Transactions ────────────────────── */

function renderTransactions(transactions) {
  const tbody = document.getElementById('trans-tbody');
  const card  = document.getElementById('card-transactions');
  if (!tbody || !card) return;

  if (!transactions || transactions.length === 0) {
    card.style.display = 'none';
    return;
  }
  card.style.display = 'flex';
  tbody.innerHTML = '';

  transactions.forEach(t => {
    const tr = document.createElement('tr');

    const dt  = t.date || '—';
    const dsc = t.description || '—';
    const amt = typeof t.amount === 'number' ? t.amount.toLocaleString(undefined, {minimumFractionDigits:2}) : '—';
    const bal = typeof t.balance === 'number' ? t.balance.toLocaleString(undefined, {minimumFractionDigits:2}) : '—';
    const typ = t.type ? t.type.toLowerCase() : '—';

    // Highlight credit/debit
    let typeHtml = typ;
    if (typ === 'credit') typeHtml = '<span style="color:var(--c-emerald)">Credit</span>';
    if (typ === 'debit')  typeHtml = '<span style="color:var(--c-rose)">Debit</span>';

    tr.innerHTML = `
      <td>${dt}</td>
      <td style="max-width:300px; white-space:normal; line-height:1.4;">${dsc}</td>
      <td>${amt}</td>
      <td>${typeHtml}</td>
      <td>${bal}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ── Helpers ── */
function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
