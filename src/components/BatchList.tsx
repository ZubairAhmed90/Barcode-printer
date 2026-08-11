import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import type { LabelItem } from '../types'
import { buildBarcodeValue } from '../utils/barcodePayload'
import { downloadLabelPng } from '../utils/download'

interface BatchListProps {
  items: LabelItem[]
  onRemove: (id: string) => void
  onDownloadAll: () => void
  onPrint: () => void | Promise<void>
  downloading: boolean
}

function Thumbnail({ item }: { item: LabelItem }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const barcodeValue = buildBarcodeValue({
    format: item.format,
    productName: item.productName,
    price: item.price,
    sku: item.code,
  })

  useEffect(() => {
    if (!svgRef.current) return
    try {
      JsBarcode(svgRef.current, barcodeValue, {
        format: item.format,
        width: 1,
        height: 28,
        displayValue: false,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000',
      })
    } catch {
      // ignore
    }
  }, [barcodeValue, item.format])

  return <svg ref={svgRef} className="h-7 w-20" />
}

export function BatchList({
  items,
  onRemove,
  onDownloadAll,
  onPrint,
  downloading,
}: BatchListProps) {
  const [busyId, setBusyId] = useState<string | null>(null)

  async function handleDownloadOne(item: LabelItem) {
    setBusyId(item.id)
    try {
      await downloadLabelPng(item)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-stone-700 uppercase">
          Batch list{' '}
          <span className="font-normal normal-case text-stone-400">
            ({items.length})
          </span>
        </h2>
        <div className="flex flex-wrap gap-2 no-print">
          <button
            type="button"
            onClick={onPrint}
            disabled={items.length === 0}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Print
          </button>
          <button
            type="button"
            onClick={onDownloadAll}
            disabled={items.length === 0 || downloading}
            className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {downloading ? 'Preparing ZIP…' : 'Download all as ZIP'}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-stone-300 bg-stone-50/80 px-4 py-8 text-center text-sm text-stone-500">
          No labels yet. Fill in the form and click Add to list.
        </p>
      ) : (
        <ul className="flex flex-col gap-2 overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-md border border-stone-200 bg-white px-3 py-2"
            >
              <div className="shrink-0 rounded border border-stone-100 bg-white p-1">
                <Thumbnail item={item} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">
                  {item.productName}
                </p>
                <p className="truncate font-mono text-xs text-stone-500">
                  {buildBarcodeValue({
                    format: item.format,
                    productName: item.productName,
                    price: item.price,
                    sku: item.code,
                  })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 no-print">
                <button
                  type="button"
                  onClick={() => handleDownloadOne(item)}
                  disabled={busyId === item.id}
                  className="rounded px-2 py-1 text-xs font-medium text-teal-800 hover:bg-teal-50 disabled:opacity-50"
                >
                  {busyId === item.id ? '…' : 'Download PNG'}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Remove ${item.productName}`}
                  className="rounded px-2 py-1 text-lg leading-none text-stone-400 hover:bg-red-50 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
