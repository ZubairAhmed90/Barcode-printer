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
 * Compact label for Zebra LP2824:
 * tight top, normal-width barcode (not stretched), short bars, code under it.
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

  const padX = Math.round(width * 0.06)
  // Almost no top padding — start content immediately
  const padTop = Math.max(4, Math.round(height * 0.02))
  const padBottom = Math.max(6, Math.round(height * 0.04))
  const hasPrice = Boolean(opts.price.trim())
  const innerW = width - padX * 2

  let y = padTop

  // —— Product name ——
  const name = opts.productName.trim() || 'Untitled'
  let nameSize = Math.max(12, Math.min(18, Math.round(height * 0.13)))
  ctx.font = `600 ${nameSize}px "IBM Plex Sans", system-ui, sans-serif`
  while (nameSize > 10 && ctx.measureText(name).width > innerW) {
    nameSize -= 1
    ctx.font = `600 ${nameSize}px "IBM Plex Sans", system-ui, sans-serif`
  }
  const nameH = Math.round(nameSize * 1.15)
  ctx.fillText(name, width / 2, y + nameH / 2, innerW)
  y += nameH + 2

  // —— Price (optional) ——
  if (hasPrice) {
    const priceSize = Math.max(11, Math.min(16, Math.round(height * 0.11)))
    ctx.font = `700 ${priceSize}px "IBM Plex Sans", system-ui, sans-serif`
    const priceH = Math.round(priceSize * 1.1)
    ctx.fillText(opts.price.trim(), width / 2, y + priceH / 2, innerW)
    y += priceH + 2
  }

  // —— Barcode: natural proportions, short bars, centered (not stretched) ——
  const codeSize = Math.max(9, Math.min(12, Math.round(height * 0.09)))
  const codeH = Math.round(codeSize * 1.2)
  const gap = 3
  const maxBarH = Math.max(
    22,
    Math.min(40, height - y - codeH - gap - padBottom),
  )

  const barcodeCanvas = document.createElement('canvas')
  renderBarcodeToCanvas(barcodeCanvas, opts.code, opts.format, {
    width: 2,
    height: maxBarH,
    displayValue: false,
    margin: 2,
  })

  // Uniform scale only — never stretch wider than natural size
  const maxW = innerW
  const scale = Math.min(1, maxW / barcodeCanvas.width)
  const drawW = Math.round(barcodeCanvas.width * scale)
  const drawH = Math.round(barcodeCanvas.height * scale)
  const drawX = Math.round((width - drawW) / 2)

  ctx.drawImage(barcodeCanvas, drawX, y, drawW, drawH)
  y += drawH + gap

  // —— Code digits ——
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
