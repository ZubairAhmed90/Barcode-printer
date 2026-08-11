import { useMemo, useState } from 'react'
import { BatchList } from './components/BatchList'
import { LabelForm } from './components/LabelForm'
import { LabelPreview } from './components/LabelPreview'
import { PrintLabels } from './components/PrintLabels'
import type { LabelDraft, LabelDimensions, LabelItem } from './types'
import { downloadAllAsZip } from './utils/download'
import { validateBarcodeInput } from './utils/validation'

const DEFAULT_SIZE: LabelDimensions = { widthIn: 2.2, heightIn: 2 }

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function App() {
  const [draft, setDraft] = useState<LabelDraft>({
    productName: '',
    price: '',
    sku: '',
    format: 'CODE128',
  })
  const [nextSku, setNextSku] = useState(1001)
  const [items, setItems] = useState<LabelItem[]>([])
  const [size, setSize] = useState<LabelDimensions>(DEFAULT_SIZE)
  const [showSize, setShowSize] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const previewCode = draft.sku.trim() || String(nextSku)

  const liveError = useMemo(() => {
    if (!draft.sku.trim()) {
      if (draft.format === 'EAN13' || draft.format === 'UPC') {
        return `Auto SKU (${nextSku}) is not valid for ${draft.format === 'EAN13' ? 'EAN-13' : 'UPC-A'}. Enter the required digits.`
      }
      return null
    }
    return validateBarcodeInput(draft.format, draft.sku)
  }, [draft.format, draft.sku, nextSku])

  function updateDraft(patch: Partial<LabelDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }))
    setSubmitError(null)
  }

  function handleAdd() {
    const name = draft.productName.trim()
    if (!name) {
      setSubmitError('Product name is required.')
      return
    }

    const usingAuto = !draft.sku.trim()
    const code = usingAuto ? String(nextSku) : draft.sku.trim()
    const error = validateBarcodeInput(draft.format, code)

    if (usingAuto && (draft.format === 'EAN13' || draft.format === 'UPC')) {
      setSubmitError(
        `Enter a valid ${draft.format === 'EAN13' ? '12-digit EAN-13' : '11-digit UPC-A'} code (auto SKU only works with Code128).`,
      )
      return
    }

    if (error) {
      setSubmitError(error)
      return
    }

    const item: LabelItem = {
      id: createId(),
      productName: name,
      price: draft.price.trim(),
      code,
      format: draft.format,
      widthIn: size.widthIn,
      heightIn: size.heightIn,
    }

    setItems((prev) => [...prev, item])
    if (usingAuto) setNextSku((n) => n + 1)
    setDraft((prev) => ({ ...prev, productName: '', price: '', sku: '' }))
    setSubmitError(null)
  }

  async function handleDownloadAll() {
    setDownloading(true)
    try {
      await downloadAllAsZip(items)
    } finally {
      setDownloading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="min-h-screen text-stone-900">
      <div className="app-shell mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 no-print">
          <p className="font-display text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            LabelPress
          </p>
          <p className="mt-1 max-w-xl text-stone-600">
            Generate barcode labels in your browser. Preview, batch, download
            PNGs or a ZIP — nothing is uploaded.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2 no-print">
          <div className="flex flex-col gap-6 rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-stone-700 uppercase">
                New label
              </h2>
              <button
                type="button"
                onClick={() => setShowSize((v) => !v)}
                className="text-xs font-medium text-teal-800 hover:underline"
              >
                {showSize ? 'Hide size' : 'Label size'}
              </button>
            </div>

            {showSize && (
              <div className="grid grid-cols-2 gap-3 rounded-md border border-stone-200 bg-stone-50 p-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="widthIn" className="text-xs font-medium text-stone-600">
                    Width (in)
                  </label>
                  <input
                    id="widthIn"
                    type="number"
                    min={0.5}
                    max={8}
                    step={0.1}
                    value={size.widthIn}
                    onChange={(e) =>
                      setSize((s) => ({
                        ...s,
                        widthIn: Math.max(0.5, Number(e.target.value) || s.widthIn),
                      }))
                    }
                    className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-teal-600"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="heightIn" className="text-xs font-medium text-stone-600">
                    Height (in)
                  </label>
                  <input
                    id="heightIn"
                    type="number"
                    min={0.5}
                    max={8}
                    step={0.1}
                    value={size.heightIn}
                    onChange={(e) =>
                      setSize((s) => ({
                        ...s,
                        heightIn: Math.max(0.5, Number(e.target.value) || s.heightIn),
                      }))
                    }
                    className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-teal-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSize(DEFAULT_SIZE)}
                  className="col-span-2 text-left text-xs text-stone-500 hover:text-stone-800"
                >
                  Reset to 2.2″ × 2″
                </button>
              </div>
            )}

            <LabelForm
              draft={draft}
              error={submitError ?? liveError}
              nextSku={nextSku}
              onChange={updateDraft}
              onAdd={handleAdd}
            />

            <LabelPreview
              productName={draft.productName}
              price={draft.price}
              code={previewCode}
              format={draft.format}
              widthIn={size.widthIn}
              heightIn={size.heightIn}
            />
          </div>

          <div className="rounded-xl border border-stone-200 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6">
            <BatchList
              items={items}
              onRemove={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
              onDownloadAll={handleDownloadAll}
              onPrint={handlePrint}
              downloading={downloading}
            />
          </div>
        </div>
      </div>

      <PrintLabels items={items} widthIn={size.widthIn} heightIn={size.heightIn} />
    </div>
  )
}
