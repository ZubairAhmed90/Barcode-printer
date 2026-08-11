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

  useEffect(() => {
    if (!svgRef.current) return
    try {
      JsBarcode(svgRef.current, item.code, {
        format: item.format,
        width: 2,
        height: 64,
        displayValue: true,
        fontSize: 14,
        margin: 4,
        background: '#ffffff',
        lineColor: '#000000',
      })
    } catch {
      // ignore
    }
  }, [item.code, item.format])

  return (
    <div className="print-label flex flex-col items-center justify-between break-after-page bg-white">
      <p className="w-full truncate text-center text-base font-semibold">
        {item.productName}
      </p>
      <svg ref={svgRef} />
      {item.price.trim() ? (
        <p className="w-full text-center text-base font-bold">{item.price}</p>
      ) : (
        <span />
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
