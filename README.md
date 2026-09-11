# Invoice Generator
Add your client, services, prices and tax — then generate a clean, professional invoice ready to download, all in your browser.

---

## Live Demo
https://invoice-generator-seven-beryl.vercel.app/

---

## Features
- Live invoice preview that updates as you type
- Business + client details with multi-line addresses
- Dynamic line items — add/remove rows, auto-calculated amounts
- Subtotal, discount, tax and grand total computed instantly
- 8 currencies with proper symbol & formatting (`Intl.NumberFormat`)
- Issue / due dates with a clear "amount due" summary
- Custom notes and payment terms
- One-click **Download** — print-to-PDF with a clean print stylesheet
- Auto-saves your work to `localStorage`
- Fully responsive editor + paper preview

---

## Tech Stack
- React 19 (Vite)
- CSS custom properties (Apple-inspired dark UI, no framework)
- `Intl.NumberFormat` / `Intl.DateTimeFormat` for money & dates
- `window.print()` + print media queries for PDF export

---

## How It Works
1. Fill in your business and the client you're billing
2. Add line items with quantity and price
3. Set discount, tax and a due date
4. Hit **Download** and save/print the invoice as a PDF

> Generation runs entirely in your browser. No data leaves your machine.

---

## Installation
```bash
git clone https://github.com/berkinyilmaz/invoice-generator.git
cd invoice-generator
npm install
npm run dev
```

---

## Privacy
Everything runs **locally in your browser**. Your invoice data is stored only in your own `localStorage`.
# invoice-generator
