import { useEffect, useRef, type CSSProperties } from 'react'
import JsBarcode from 'jsbarcode'
import type { LabelItem } from '../types'

interface PrintLabelsProps {
  items: LabelItem[]
  widthIn: number
  heightIn: number
}

function PrintLabel({ item }: { item: LabelItem }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const hasPrice = Boolean(item.price.trim())

  useEffect(() => {
    if (!svgRef.current) return

    // Keep barcode bars short enough that the human-readable digits
    // still fit under the name (and optional price) inside the label.
    const barHeight = Math.max(28, Math.round(item.heightIn * 28))
    const fontSize = Math.max(9, Math.round(item.heightIn * 7))

    try {
      JsBarcode(svgRef.current, item.code, {
        format: item.format,
        width: 1.5,
        height: barHeight,
        displayValue: true,
        fontSize,
        margin: 2,
        background: '#ffffff',
        lineColor: '#000000',
      })
    } catch {
      // ignore
    }
  }, [item.code, item.format, item.heightIn])

  return (
    <div
      className="print-label flex flex-col items-center justify-between bg-white"
      style={
        {
          ['--label-w' as string]: `${item.widthIn}in`,
          ['--label-h' as string]: `${item.heightIn}in`,
          width: `${item.widthIn}in`,
          height: `${item.heightIn}in`,
        } as CSSProperties
      }
    >
      <p className="print-label-name w-full shrink-0 truncate text-center font-semibold">
        {item.productName}
      </p>

      <div className="print-label-barcode flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
        <svg ref={svgRef} className="print-barcode-svg max-h-full max-w-full" />
      </div>

      {hasPrice ? (
        <p className="print-label-price w-full shrink-0 text-center font-bold">
          {item.price.trim()}
        </p>
      ) : (
        <span className="print-label-spacer shrink-0" />
      )}
    </div>
  )
}

export function PrintLabels({ items, widthIn, heightIn }: PrintLabelsProps) {
  useEffect(() => {
    const style = document.createElement('style')
    style.setAttribute('data-print-page-size', 'true')
    style.textContent = `@media print { @page { size: ${widthIn}in ${heightIn}in; margin: 0; } }`
    document.head.appendChild(style)
    return () => {
      style.remove()
    }
  }, [widthIn, heightIn])

  return (
    <div
      id="print-root"
      className="print-only"
      style={
        {
          ['--label-w' as string]: `${widthIn}in`,
          ['--label-h' as string]: `${heightIn}in`,
        } as CSSProperties
      }
    >
      {items.map((item) => (
        <PrintLabel key={item.id} item={item} />
      ))}
    </div>
  )
}
