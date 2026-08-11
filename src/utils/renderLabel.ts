import JsBarcode from 'jsbarcode'
import type { BarcodeFormat } from '../types'

const DPI = 203

export function inchesToPx(inches: number): number {
  return Math.round(inches * DPI)
}

export function renderBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  code: string,
  format: BarcodeFormat,
  options?: {
    width?: number
    height?: number
    displayValue?: boolean
    fontSize?: number
    margin?: number
  },
): void {
  JsBarcode(canvas, code, {
    format,
    width: options?.width ?? 2,
    height: options?.height ?? 60,
    displayValue: options?.displayValue ?? true,
    fontSize: options?.fontSize ?? 14,
    margin: options?.margin ?? 8,
    background: '#ffffff',
    lineColor: '#000000',
  })
}

/**
 * Wide, short LP2824-friendly layout:
 * name (+ price) on one line → full-width short barcode → code digits.
 */
export function renderLabelToCanvas(opts: {
  productName: string
  price: string
  code: string
  format: BarcodeFormat
  widthIn: number
  heightIn: number
}): HTMLCanvasElement {
  const width = inchesToPx(opts.widthIn)
  const height = inchesToPx(opts.heightIn)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#000000'

  const padX = Math.round(width * 0.04)
  const padY = Math.round(height * 0.06)
  const hasPrice = Boolean(opts.price.trim())
  const innerW = width - padX * 2

  // Fixed compact heights (not huge % of label) so short stickers fit
  const nameSize = Math.max(11, Math.min(16, Math.round(height * 0.14)))
  const codeSize = Math.max(9, Math.min(12, Math.round(height * 0.11)))
  const nameH = Math.round(nameSize * 1.2)
  const codeH = Math.round(codeSize * 1.25)
  const gap = Math.max(2, Math.round(height * 0.03))

  // Barcode: short bars, stretched to nearly full label width
  const barcodeH = Math.max(
    18,
    Math.min(Math.round(height * 0.28), height - padY * 2 - nameH - codeH - gap * 3),
  )

  const blockH = nameH + gap + barcodeH + gap + codeH
  // Center the whole block vertically with a little bias toward the top
  let y = Math.max(padY, Math.round((height - blockH) * 0.35))

  // —— Name (+ optional price on the same row) ——
  const name = opts.productName.trim() || 'Untitled'
  ctx.textBaseline = 'middle'

  if (hasPrice) {
    const price = opts.price.trim()
    ctx.font = `700 ${nameSize}px "IBM Plex Sans", system-ui, sans-serif`
    const priceW = ctx.measureText(price).width
    const priceX = width - padX - priceW / 2

    ctx.textAlign = 'left'
    ctx.font = `600 ${nameSize}px "IBM Plex Sans", system-ui, sans-serif`
    const maxNameW = innerW - priceW - Math.round(width * 0.06)
    // Truncate name if needed
    let drawName = name
    while (drawName.length > 1 && ctx.measureText(drawName).width > maxNameW) {
      drawName = drawName.slice(0, -1)
    }
    if (drawName !== name) drawName = `${drawName.slice(0, -1)}…`

    ctx.fillText(drawName, padX, y + nameH / 2)
    ctx.textAlign = 'center'
    ctx.font = `700 ${nameSize}px "IBM Plex Sans", system-ui, sans-serif`
    ctx.fillText(price, priceX, y + nameH / 2)
  } else {
    ctx.textAlign = 'center'
    ctx.font = `600 ${nameSize}px "IBM Plex Sans", system-ui, sans-serif`
    let size = nameSize
    while (size > 9 && ctx.measureText(name).width > innerW) {
      size -= 1
      ctx.font = `600 ${size}px "IBM Plex Sans", system-ui, sans-serif`
    }
    ctx.fillText(name, width / 2, y + nameH / 2, innerW)
  }
  y += nameH + gap

  // —— Wide, short barcode (stretch to full inner width) ——
  const barcodeCanvas = document.createElement('canvas')
  // Use a modest module width; we stretch horizontally to fill the label
  renderBarcodeToCanvas(barcodeCanvas, opts.code, opts.format, {
    width: 1.5,
    height: barcodeH,
    displayValue: false,
    margin: 0,
  })

  const drawW = innerW
  const drawH = barcodeH
  const drawX = padX
  ctx.drawImage(barcodeCanvas, drawX, y, drawW, drawH)
  y += drawH + gap

  // —— Code under barcode ——
  ctx.textAlign = 'center'
  ctx.font = `500 ${codeSize}px "IBM Plex Sans", ui-monospace, monospace`
  ctx.fillText(opts.code, width / 2, y + codeH / 2, innerW)

  return canvas
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create PNG blob'))
    }, 'image/png')
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
