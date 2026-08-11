import { useEffect, useState, type CSSProperties } from 'react'
import type { LabelItem } from '../types'
import { renderLabelToCanvas } from '../utils/renderLabel'

interface PrintLabelsProps {
  items: LabelItem[]
  widthIn: number
  heightIn: number
}

function PrintLabel({ item }: { item: LabelItem }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let revoked = false
    let objectUrl: string | null = null

    try {
      const canvas = renderLabelToCanvas(item)
      objectUrl = canvas.toDataURL('image/png')
      if (!revoked) setSrc(objectUrl)
    } catch {
      if (!revoked) setSrc(null)
    }

    return () => {
      revoked = true
    }
  }, [item])

  return (
    <div
      className="print-label"
      style={
        {
          width: `${item.widthIn}in`,
          height: `${item.heightIn}in`,
        } as CSSProperties
      }
    >
      {src ? (
        <img
          src={src}
          alt={item.productName}
          className="print-label-image"
          width={Math.round(item.widthIn * 203)}
          height={Math.round(item.heightIn * 203)}
        />
      ) : null}
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
