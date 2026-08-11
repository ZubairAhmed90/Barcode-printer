import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import type { BarcodeFormat } from '../types'
import { canGenerateBarcode } from '../utils/validation'

interface LabelPreviewProps {
  productName: string
  price: string
  code: string
  format: BarcodeFormat
  widthIn: number
  heightIn: number
}

export function LabelPreview({
  productName,
  price,
  code,
  format,
  widthIn,
  heightIn,
}: LabelPreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const valid = canGenerateBarcode(format, code)

  useEffect(() => {
    if (!svgRef.current || !valid) return
    try {
      JsBarcode(svgRef.current, code.trim(), {
        format,
        width: 1.6,
        height: 48,
        displayValue: true,
        fontSize: 12,
        margin: 4,
        background: '#ffffff',
        lineColor: '#000000',
      })
    } catch {
      // Invalid barcode data for the selected format
    }
  }, [code, format, valid])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-stone-700 uppercase">
          Live preview
        </h2>
        <span className="text-xs text-stone-400">
          {widthIn}&quot; × {heightIn}&quot;
        </span>
      </div>

      <div
        className="label-preview mx-auto flex flex-col items-center justify-between overflow-hidden border border-stone-300 bg-white shadow-sm"
        style={{
          width: `${widthIn}in`,
          height: `${heightIn}in`,
          maxWidth: '100%',
          padding: '0.12in 0.1in',
        }}
      >
        <p
          className="w-full truncate text-center font-semibold text-stone-900"
          style={{ fontSize: '0.14in', lineHeight: 1.2 }}
        >
          {productName.trim() || 'Product name'}
        </p>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          {valid ? (
            <svg ref={svgRef} className="max-h-full max-w-full" />
          ) : (
            <p className="px-2 text-center text-xs text-stone-400">
              Enter valid barcode data to preview
            </p>
          )}
        </div>

        {price.trim() ? (
          <p
            className="w-full text-center font-bold text-stone-900"
            style={{ fontSize: '0.13in' }}
          >
            {price.trim()}
          </p>
        ) : (
          <div style={{ height: '0.08in' }} />
        )}
      </div>
    </div>
  )
}
