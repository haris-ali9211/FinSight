/* ════════════════════════════════
   LLM.JS — Provider routing + prompt construction
   ════════════════════════════════ */

const MAX_TEXT_CHARS = 15_000; // Keep within token limits

/**
 * Parse raw OCR text with the selected LLM provider.
 * @param {string} rawText    Combined OCR output from all pages
 * @param {string} apiKey     LLM provider API key
 * @param {string} provider   'openai' | 'gemini' | 'claude'
 * @param {string} [model]    Optional model override (e.g. 'gpt-4o-mini')
 * @returns {Promise<object>} Parsed JSON result object
 */
export async function parseWithLLM(rawText, apiKey, provider, model) {
  const prompt = buildPrompt(rawText);
  const { url, headers, body } = buildRequest(prompt, apiKey, provider, model);

  const res = await fetch(url, { method: 'POST', headers, body });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = extractContent(data, provider);

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('LLM did not return valid JSON — check your API key and try again.');

  return JSON.parse(jsonMatch[0]);
}

/* ── Internal helpers ── */

function buildRequest(prompt, apiKey, provider, model = 'gpt-4o-mini') {
  if (provider === 'openai') {
    return {
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:           model,
        messages:        [{ role: 'user', content: prompt }],
        temperature:     0.1,
        response_format: { type: 'json_object' },
      }),
    };
  }

  if (provider === 'gemini') {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents:         [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
      }),
    };
  }

  // Claude
  return {
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages:   [{ role: 'user', content: prompt }],
    }),
  };
}

function extractContent(data, provider) {
  if (provider === 'openai') return data.choices?.[0]?.message?.content ?? '';
  if (provider === 'gemini') return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return data.content?.[0]?.text ?? '';  // claude
}

function buildPrompt(rawText) {
  return `You are a financial document parser. Analyze the following raw OCR text extracted from a bank statement PDF and return a JSON object with EXACTLY this structure:

{
  "demographics": {
    "bank_name": "string or null",
    "account_title": "string or null",
    "account_number": "string or null",
    "iban": "string or null",
    "branch": "string or null",
    "statement_period": "string or null",
    "statement_date": "string or null",
    "currency": "string or null",
    "address": "string or null"
  },
  "stamp": {
    "present": true | false | null,
    "confidence": "high" | "medium" | "low",
    "description": "one sentence about stamp/signature presence"
  },
  "monthly_stats": [
    {
      "month": "e.g. January 2024",
      "min_balance": number or null,
      "max_balance": number or null,
      "avg_balance": number or null,
      "total_credits": number or null,
      "total_debits": number or null
    }
  ],
  "transactions": [
    {
      "date": "string or null",
      "description": "string or null",
      "amount": number or null,
      "type": "credit" | "debit" | null,
      "balance": number or null
    }
  ],
  "summary": {
    "overall_min": number or null,
    "overall_max": number or null,
    "overall_avg": number or null,
    "total_months": number,
    "total_credits": number or null,
    "total_debits": number or null
  }
}

Rules:
- Use null for any field you cannot determine.
- stamp.present: true if OCR contains words like "stamp", "seal", "verified", "authenticated"; false if explicitly absent; null if uncertain.
- monthly_stats: one entry per calendar month in the statement.
- All numeric values must be plain numbers (no currency symbols).
- Return ONLY the JSON object, no surrounding text.

RAW OCR TEXT:
${rawText.slice(0, MAX_TEXT_CHARS)}`;
}
