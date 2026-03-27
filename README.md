# FinSight — AI-Powered Bank Statement Analyzer

FinSight is a modern, privacy-focused, premium web application designed to automatically extract and analyze financial data from bank statement PDFs.

By combining the robustness of **PaddleOCR's Layout Parsing API** for raw text extraction and the intelligence of **Large Language Models (GPT-4o, Gemini, or Claude)** for structured data parsing, FinSight turns unstructured multi-page bank statements into clear, actionable insights in seconds.

---

## ✨ Features

- **Document Analysis**: Supports multi-page bank statement PDFs (up to 100 pages).
- **Demographic Extraction**: Automatically detects Bank Name, Account Title, Account Number, IBAN, Statement Period, and more.
- **Stamp & Signature Detection**: Identifies whether the document carries an official bank stamp or signature, and provides a confidence score.
- **Monthly Financial Statistics**: Aggregates minimum balance, maximum balance, average balance, total credits, and total debits on a per-month basis.
- **Transaction Line Extraction**: Extracts and formats individual statement transactions into a sortable, paginated data table.
- **Premium UI/UX**: Built with a sleek, responsive dark-mode interface featuring mesh gradients, progress pipelines, and interactive data visualization.
- **100% Client-Side Processing**: All parsing logic and UI rendering happens in the browser. The only external calls are direct API requests to the OCR and LLM providers.
- **JSON Export**: One-click download of the complete structured analysis JSON for external use.

---

## 🏗️ Architecture

The project is structured with a modular vanilla JavaScript frontend and a lightweight Express.js proxy server to handle CORS restrictions and large payload timeouts.

### File Structure
```text
PaddleOCR/
├── index.html               # Main application shell (No inline CSS/JS)
├── assets/
│   ├── css/                 # Modular CSS architecture
│   │   ├── base.css         # Design tokens, reset, typography, backgrounds
│   │   ├── layout.css       # Structure, headers, containers
│   │   ├── upload.css       # Drag-and-drop zone styling
│   │   ├── pipeline.css     # Status indicator and log console
│   │   └── results.css      # Result cards, tables, and statistics
│   └── js/                  # ES Module JavaScript logic
│       ├── config.js        # 🔑 API Credentials (Gitignored)
│       ├── main.js          # App entry point & orchestration
│       ├── upload.js        # File input, drag-and-drop handlers
│       ├── ocr.js           # PaddleOCR layout parsing integration
│       ├── llm.js           # Prompt engineering and LLM routing
│       ├── renderer.js      # DOM manipulation for displaying results
│       ├── export.js        # JSON file download utility
│       └── pipeline.js      # UI state management & terminal-style logging
├── server.js                # Combined Express proxy & static file server
├── package.json             # Node.js dependencies for the proxy
└── .env                     # Reference template for API keys
```

### The OCR Proxy (`server.js`)
Because browser security policies (CORS) block direct frontend calls to the PaddleOCR API, `server.js` acts as a middleman.
1. The frontend (`http://localhost:3001`) POSTs the base64 PDF to `/api/ocr`.
2. The proxy attaches the secret `PADDLE_TOKEN` and forwards the request via native Node.js `https` (bypassing timeouts for massive 100-page limits).
3. The proxy returns the raw layout JSON back to the browser.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- API Keys for:
  - **PaddleOCR** (Studio App Layout Parsing Token)
  - **OpenAI** (or Anthropic Claude / Google Gemini)

### 1. Installation

Clone the repository and install the proxy server dependencies:

```bash
cd PaddleOCR
npm install
```

### 2. Configuration

Create a `config.js` file in `assets/js/` (this file is gitignored to protect your keys).

```bash

PADDLE_URL=
PADDLE_TOKEN=

OPENAI_API_KEY=
LLM_MODEL=
```

**`assets/js/config.js`:**
```javascript
export const CONFIG = {
  // The local proxy endpoint (do not change this)
  paddleUrl: 'http://localhost:3001/api/ocr',

  // Choose your LLM: 'openai', 'gemini', or 'claude'
  llmProvider: 'openai',

  // Insert your actual LLM API key here
  llmKey: 'sk-YOUR-API-KEY-HERE',

  // Specify the model (e.g., 'gpt-4o-mini', 'gpt-4o', 'claude-3-5-sonnet')
  llmModel: 'gpt-4o-mini',
};
```

*(Note: The PaddleOCR API Endpoint and Token are configured server-side inside `server.js` or via `.env` variables `PADDLE_URL` and `PADDLE_TOKEN`. You do not need to put the Paddle token in `config.js`.)*

### 3. Run the Application

Start the unified server. This serves both the static frontend and the OCR proxy:

```bash
node server.js
# Or: npm start
```

### 4. Usage

1. Open your browser and navigate to **[http://localhost:3001](http://localhost:3001)**.
2. Drag and drop a Bank Statement PDF (or click "Browse Files").
3. Click the **"Analyze Statement"** button.
4. Watch the pipeline log console as it extracts text, parses AI data, and visualizes the results.
5. Review the demographics, stamp verification, monthly trends, and transaction history.
6. Click **"⬇ Export JSON"** to download the structured data.

---

## 🛠️ Technology Stack

- **Frontend Core**: HTML5, Vanilla CSS3 (CSS Variables, Flexbox/Grid, Mesh Gradients)
- **Frontend Logic**: Vanilla JavaScript (ES6 Modules, Async/Await, Fetch API)
- **Backend / Proxy**: Node.js, Express.js
- **OCR Engine**: [PaddleOCR Layout Parsing API](https://aistudio.baidu.com/)
- **Intelligence**: OpenAI API (GPT-4o-mini) - with built-in routing for Anthropic/Google.
- **Typography**: [Inter](https://fonts.google.com/specimen/Inter) and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

---
*Disclaimer: This tool processes sensitive financial documents. Ensure you adhere to privacy laws and organizational data policies regarding where API calls are routed. The frontend defaults to client-side LLM calls for simplicity and speed.*
