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
 * Renders a complete label. Content is packed from the top with a bottom
 * safe margin so barcode bars + digits stay on physical stickers even when
 * the printer crops a little from the bottom.
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
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const padX = Math.round(width * 0.07)
  const padTop = Math.round(height * 0.04)
  // Keep the bottom ~18% clear — many label printers crop the trailing edge
  const safeBottom = Math.round(height * 0.18)
  const hasPrice = Boolean(opts.price.trim())
  const contentBottom = height - safeBottom

  let y = padTop

  // —— Product name ——
  const name = opts.productName.trim() || 'Untitled'
  let nameSize = Math.min(22, Math.round(height * 0.08))
  ctx.font = `600 ${nameSize}px "IBM Plex Sans", system-ui, sans-serif`
  while (nameSize > 10 && ctx.measureText(name).width > width - padX * 2) {
    nameSize -= 1
    ctx.font = `600 ${nameSize}px "IBM Plex Sans", system-ui, sans-serif`
  }
  const nameH = Math.round(nameSize * 1.25)
  ctx.fillText(name, width / 2, y + nameH / 2, width - padX * 2)
  y += nameH + Math.round(height * 0.025)

  // —— Optional price (under name, above barcode) ——
  if (hasPrice) {
    const priceSize = Math.min(18, Math.round(height * 0.07))
    ctx.font = `700 ${priceSize}px "IBM Plex Sans", system-ui, sans-serif`
    const priceH = Math.round(priceSize * 1.2)
    ctx.fillText(opts.price.trim(), width / 2, y + priceH / 2, width - padX * 2)
    y += priceH + Math.round(height * 0.02)
  }

  // —— Barcode bars (no built-in text — we draw digits ourselves) ——
  const codeFontSize = Math.max(10, Math.round(height * 0.05))
  const codeH = Math.round(codeFontSize * 1.35)
  const gapBeforeCode = Math.round(height * 0.015)
  const remainingForBars = Math.max(
    20,
    contentBottom - y - codeH - gapBeforeCode,
  )
  // Keep bars modest so digits always fit above the safe bottom
  const barcodeBarHeight = Math.min(
    remainingForBars,
    Math.round(height * 0.32),
  )

  const barcodeCanvas = document.createElement('canvas')
  renderBarcodeToCanvas(barcodeCanvas, opts.code, opts.format, {
    width: 2,
    height: barcodeBarHeight,
    displayValue: false,
    margin: 1,
  })

  const maxBarcodeWidth = width - padX * 2
  const scale = Math.min(maxBarcodeWidth / barcodeCanvas.width, 1)
  const drawW = barcodeCanvas.width * scale
  const drawH = barcodeCanvas.height * scale
  const drawX = (width - drawW) / 2
  ctx.drawImage(barcodeCanvas, drawX, y, drawW, drawH)
  y += drawH + gapBeforeCode

  // —— Human-readable code ——
  ctx.font = `500 ${codeFontSize}px "IBM Plex Sans", ui-monospace, monospace`
  ctx.fillText(opts.code, width / 2, y + codeH / 2, width - padX * 2)

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
