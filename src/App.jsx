import { useState, useMemo, useCallback, useEffect } from 'react'
import './styles.css'

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD — US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR — Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP — British Pound' },
  { code: 'TRY', symbol: '₺', label: 'TRY — Turkish Lira' },
  { code: 'JPY', symbol: '¥', label: 'JPY — Japanese Yen' },
  { code: 'CAD', symbol: '$', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', symbol: '$', label: 'AUD — Australian Dollar' },
  { code: 'INR', symbol: '₹', label: 'INR — Indian Rupee' },
]

const STORAGE_KEY = 'invoice-generator-v1'

let uid = 0
const newId = () => `item-${Date.now()}-${uid++}`

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function plusDaysISO(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const DEFAULT_STATE = {
  business: { name: '', email: '', address: '', phone: '' },
  client: { name: '', email: '', address: '' },
  meta: {
    number: 'INV-0001',
    issueDate: todayISO(),
    dueDate: plusDaysISO(14),
    currency: 'USD',
  },
  items: [
    { id: newId(), description: '', qty: 1, price: 0 },
  ],
  taxRate: 0,
  discount: 0,
  notes: 'Thank you for your business!',
}

const SAMPLE_STATE = {
  business: {
    name: 'Acme Studio',
    email: 'hello@acmestudio.com',
    address: '123 Market St, Suite 4\nSan Francisco, CA 94103',
    phone: '+1 (555) 018-2245',
  },
  client: {
    name: 'Nova Coffee Co.',
    email: 'billing@novacoffee.com',
    address: '456 Client Ave\nNew York, NY 10012',
  },
  meta: {
    number: 'INV-0042',
    issueDate: todayISO(),
    dueDate: plusDaysISO(14),
    currency: 'USD',
  },
  items: [
    { id: newId(), description: 'Brand identity & logo design', qty: 1, price: 1800 },
    { id: newId(), description: 'Website UI design (5 pages)', qty: 5, price: 320 },
    { id: newId(), description: 'Design revision rounds', qty: 3, price: 120 },
  ],
  taxRate: 8,
  discount: 5,
  notes: 'Payment due within 14 days via bank transfer.\nThank you for your business!',
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_STATE,
      ...parsed,
      business: { ...DEFAULT_STATE.business, ...parsed.business },
      client: { ...DEFAULT_STATE.client, ...parsed.client },
      meta: { ...DEFAULT_STATE.meta, ...parsed.meta },
      items:
        Array.isArray(parsed.items) && parsed.items.length
          ? parsed.items.map((i) => ({ id: i.id || newId(), description: i.description || '', qty: i.qty ?? 1, price: i.price ?? 0 }))
          : DEFAULT_STATE.items,
    }
  } catch {
    return DEFAULT_STATE
  }
}

function formatMoney(value, currency) {
  const num = Number.isFinite(value) ? value : 0
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  } catch {
    return num.toFixed(2)
  }
}

function formatDateLabel(iso) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d)
}

export default function App() {
  const [state, setState] = useState(loadState)

  const { business, client, meta, items, taxRate, discount, notes } = state

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        /* ignore quota errors */
      }
    }, 300)
    return () => clearTimeout(t)
  }, [state])

  // ── field helpers ────────────────────────────────
  const setField = useCallback((section, key, value) => {
    setState((s) => ({ ...s, [section]: { ...s[section], [key]: value } }))
  }, [])

  const setTop = useCallback((key, value) => {
    setState((s) => ({ ...s, [key]: value }))
  }, [])

  const updateItem = useCallback((id, key, value) => {
    setState((s) => ({
      ...s,
      items: s.items.map((it) => (it.id === id ? { ...it, [key]: value } : it)),
    }))
  }, [])

  const addItem = useCallback(() => {
    setState((s) => ({ ...s, items: [...s.items, { id: newId(), description: '', qty: 1, price: 0 }] }))
  }, [])

  const removeItem = useCallback((id) => {
    setState((s) => ({ ...s, items: s.items.length > 1 ? s.items.filter((it) => it.id !== id) : s.items }))
  }, [])

  const resetAll = useCallback(() => {
    const fresh = { ...DEFAULT_STATE, items: [{ id: newId(), description: '', qty: 1, price: 0 }], meta: { ...DEFAULT_STATE.meta, issueDate: todayISO(), dueDate: plusDaysISO(14) } }
    setState(fresh)
  }, [])

  const loadSample = useCallback(() => {
    setState({
      ...SAMPLE_STATE,
      items: SAMPLE_STATE.items.map((it) => ({ ...it, id: newId() })),
      meta: { ...SAMPLE_STATE.meta, issueDate: todayISO(), dueDate: plusDaysISO(14) },
    })
  }, [])

  // ── calculations ─────────────────────────────────
  const currency = meta.currency
  const currencyMeta = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]

  const calc = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0), 0)
    const discountAmount = subtotal * ((Number(discount) || 0) / 100)
    const taxable = subtotal - discountAmount
    const taxAmount = taxable * ((Number(taxRate) || 0) / 100)
    const total = taxable + taxAmount
    return { subtotal, discountAmount, taxable, taxAmount, total }
  }, [items, discount, taxRate])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  return (
    <div className="app">
      {/* Header */}
      <header className="header no-print">
        <div className="header-inner">
          <div className="header-left">
            <div>
              <h1 className="header-title">Invoice Generator</h1>
              <p className="header-sub">Create clean, professional invoices in seconds</p>
            </div>
          </div>
          <div className="header-right">
            <button className="btn-ghost" onClick={loadSample} aria-label="Load sample data">Sample</button>
            <button className="btn-ghost" onClick={resetAll} aria-label="Reset invoice">Reset</button>
            <button className="btn-primary btn-download" onClick={handlePrint} aria-label="Download invoice as PDF">
              <IconDownload /> Download
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        <div className="layout">
          {/* ─── Editor ─────────────────────────── */}
          <section className="editor no-print" aria-label="Invoice editor">
            <Panel title="Your Business">
              <div className="field-grid">
                <Field label="Business name" full>
                  <input className="in" value={business.name} onChange={(e) => setField('business', 'name', e.target.value)} placeholder="Acme Studio" aria-label="Business name" />
                </Field>
                <Field label="Email">
                  <input className="in" value={business.email} onChange={(e) => setField('business', 'email', e.target.value)} placeholder="hello@acme.com" aria-label="Business email" />
                </Field>
                <Field label="Phone">
                  <input className="in" value={business.phone} onChange={(e) => setField('business', 'phone', e.target.value)} placeholder="+1 555 000 0000" aria-label="Business phone" />
                </Field>
                <Field label="Address" full>
                  <textarea className="in ta" rows={2} value={business.address} onChange={(e) => setField('business', 'address', e.target.value)} placeholder="123 Market St, Suite 4&#10;San Francisco, CA" aria-label="Business address" />
                </Field>
              </div>
            </Panel>

            <Panel title="Bill To">
              <div className="field-grid">
                <Field label="Client name" full>
                  <input className="in" value={client.name} onChange={(e) => setField('client', 'name', e.target.value)} placeholder="Jane Client" aria-label="Client name" />
                </Field>
                <Field label="Email" full>
                  <input className="in" value={client.email} onChange={(e) => setField('client', 'email', e.target.value)} placeholder="jane@company.com" aria-label="Client email" />
                </Field>
                <Field label="Address" full>
                  <textarea className="in ta" rows={2} value={client.address} onChange={(e) => setField('client', 'address', e.target.value)} placeholder="456 Client Ave&#10;New York, NY" aria-label="Client address" />
                </Field>
              </div>
            </Panel>

            <Panel title="Invoice Details">
              <div className="field-grid">
                <Field label="Invoice #">
                  <input className="in" value={meta.number} onChange={(e) => setField('meta', 'number', e.target.value)} placeholder="INV-0001" aria-label="Invoice number" />
                </Field>
                <Field label="Currency">
                  <div className="select-wrap">
                    <select className="in select" value={meta.currency} onChange={(e) => setField('meta', 'currency', e.target.value)} aria-label="Currency">
                      {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                </Field>
                <Field label="Issue date">
                  <input type="date" className="in date" value={meta.issueDate} onChange={(e) => setField('meta', 'issueDate', e.target.value)} aria-label="Issue date" />
                </Field>
                <Field label="Due date">
                  <input type="date" className="in date" value={meta.dueDate} onChange={(e) => setField('meta', 'dueDate', e.target.value)} aria-label="Due date" />
                </Field>
              </div>
            </Panel>

            <Panel title="Line Items">
              <div className="items-editor">
                <div className="item-head">
                  <span className="ih-desc">Description</span>
                  <span className="ih-qty">Qty</span>
                  <span className="ih-price">Price</span>
                  <span className="ih-amt">Amount</span>
                  <span className="ih-del" />
                </div>
                {items.map((it) => {
                  const amount = (Number(it.qty) || 0) * (Number(it.price) || 0)
                  return (
                    <div className="item-row" key={it.id}>
                      <input className="in item-desc" value={it.description} onChange={(e) => updateItem(it.id, 'description', e.target.value)} placeholder="Design services" aria-label="Item description" />
                      <input className="in item-num" type="number" min="0" step="1" value={it.qty} onChange={(e) => updateItem(it.id, 'qty', e.target.value === '' ? '' : Number(e.target.value))} aria-label="Quantity" />
                      <input className="in item-num" type="number" min="0" step="0.01" value={it.price} onChange={(e) => updateItem(it.id, 'price', e.target.value === '' ? '' : Number(e.target.value))} aria-label="Unit price" />
                      <span className="item-amt">{formatMoney(amount, currency)}</span>
                      <button className="del-btn" onClick={() => removeItem(it.id)} disabled={items.length <= 1} aria-label="Remove item">
                        <IconTrash />
                      </button>
                    </div>
                  )
                })}
              </div>
              <button className="btn-add" onClick={addItem} aria-label="Add line item">
                <IconPlus /> Add item
              </button>
            </Panel>

            <Panel title="Totals & Notes">
              <div className="field-grid">
                <Field label="Discount (%)">
                  <input className="in" type="number" min="0" max="100" step="0.1" value={discount} onChange={(e) => setTop('discount', e.target.value === '' ? '' : Number(e.target.value))} aria-label="Discount percent" />
                </Field>
                <Field label="Tax (%)">
                  <input className="in" type="number" min="0" max="100" step="0.1" value={taxRate} onChange={(e) => setTop('taxRate', e.target.value === '' ? '' : Number(e.target.value))} aria-label="Tax percent" />
                </Field>
                <Field label="Notes" full>
                  <textarea className="in ta" rows={2} value={notes} onChange={(e) => setTop('notes', e.target.value)} placeholder="Payment terms, thank-you note…" aria-label="Notes" />
                </Field>
              </div>
            </Panel>
          </section>

          {/* ─── Preview ────────────────────────── */}
          <section className="preview-wrap" aria-label="Invoice preview">
            <div className="invoice-paper" id="invoice">
              <div className="inv-top">
                <div className="inv-brand">
                  <div className="inv-brand-name">{business.name || 'Your Business'}</div>
                  <div className="inv-brand-meta">
                    {business.email && <div>{business.email}</div>}
                    {business.phone && <div>{business.phone}</div>}
                    {business.address && <div className="inv-multiline">{business.address}</div>}
                  </div>
                </div>
                <div className="inv-title-block">
                  <div className="inv-title">INVOICE</div>
                  <div className="inv-number">{meta.number || '—'}</div>
                </div>
              </div>

              <div className="inv-parties">
                <div className="inv-party">
                  <div className="inv-party-label">Bill To</div>
                  <div className="inv-party-name">{client.name || 'Client name'}</div>
                  <div className="inv-party-meta">
                    {client.email && <div>{client.email}</div>}
                    {client.address && <div className="inv-multiline">{client.address}</div>}
                  </div>
                </div>
                <div className="inv-dates">
                  <div className="inv-date-row"><span>Issue date</span><strong>{formatDateLabel(meta.issueDate)}</strong></div>
                  <div className="inv-date-row"><span>Due date</span><strong>{formatDateLabel(meta.dueDate)}</strong></div>
                  <div className="inv-date-row total-due"><span>Amount due</span><strong>{formatMoney(calc.total, currency)}</strong></div>
                </div>
              </div>

              <table className="inv-table">
                <thead>
                  <tr>
                    <th className="t-desc">Description</th>
                    <th className="t-qty">Qty</th>
                    <th className="t-price">Price</th>
                    <th className="t-amt">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="t-desc">{it.description || <span className="t-empty">Item description</span>}</td>
                      <td className="t-qty">{Number(it.qty) || 0}</td>
                      <td className="t-price">{formatMoney(Number(it.price) || 0, currency)}</td>
                      <td className="t-amt">{formatMoney((Number(it.qty) || 0) * (Number(it.price) || 0), currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="inv-summary">
                <div className="inv-sum-inner">
                  <div className="sum-row"><span>Subtotal</span><span>{formatMoney(calc.subtotal, currency)}</span></div>
                  {(Number(discount) || 0) > 0 && (
                    <div className="sum-row"><span>Discount ({discount}%)</span><span>−{formatMoney(calc.discountAmount, currency)}</span></div>
                  )}
                  {(Number(taxRate) || 0) > 0 && (
                    <div className="sum-row"><span>Tax ({taxRate}%)</span><span>{formatMoney(calc.taxAmount, currency)}</span></div>
                  )}
                  <div className="sum-row grand"><span>Total</span><span>{formatMoney(calc.total, currency)}</span></div>
                </div>
              </div>

              {notes && (
                <div className="inv-notes">
                  <div className="inv-notes-label">Notes</div>
                  <div className="inv-notes-text">{notes}</div>
                </div>
              )}

              <div className="inv-foot">Generated with Invoice Generator · {currencyMeta.code}</div>
            </div>
          </section>
        </div>
      </main>

      <footer className="credit no-print">
        Coded by{' '}
        <a href="https://instagram.com/berkindev" target="_blank" rel="noopener noreferrer" className="credit-link">
          berkindev
        </a>
      </footer>
    </div>
  )
}

/* ─── Small building blocks ────────────────────── */
function Panel({ title, children }) {
  return (
    <div className="panel">
      <div className="panel-label">{title}</div>
      {children}
    </div>
  )
}

function Field({ label, children, full }) {
  return (
    <label className={`field${full ? ' full' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

/* ─── Icons ─────────────────────────────────────── */
function IconDownload() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v8m0 0l-3-3m3 3l3-3" />
      <path d="M2.5 12v1.5a1 1 0 001 1h9a1 1 0 001-1V12" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M8 3.5v9M3.5 8h9" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5h10M6.5 4.5V3.2a.7.7 0 01.7-.7h1.6a.7.7 0 01.7.7v1.3M5 4.5l.5 8a1 1 0 001 .9h3a1 1 0 001-.9l.5-8" />
    </svg>
  )
}
