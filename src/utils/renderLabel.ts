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

  const paddingX = Math.round(width * 0.06)
  const topBand = Math.round(height * 0.22)
  const bottomBand = opts.price.trim() ? Math.round(height * 0.18) : Math.round(height * 0.08)
  const barcodeAreaTop = topBand
  const barcodeAreaBottom = height - bottomBand
  const barcodeAreaHeight = Math.max(40, barcodeAreaBottom - barcodeAreaTop)

  // Product name
  const name = opts.productName.trim() || 'Untitled'
  let nameSize = Math.min(22, Math.round(height * 0.09))
  ctx.font = `600 ${nameSize}px "IBM Plex Sans", system-ui, sans-serif`
  while (nameSize > 10 && ctx.measureText(name).width > width - paddingX * 2) {
    nameSize -= 1
    ctx.font = `600 ${nameSize}px "IBM Plex Sans", system-ui, sans-serif`
  }
  ctx.fillText(name, width / 2, topBand / 2, width - paddingX * 2)

  // Barcode (temporary canvas, then draw centered into label)
  const barcodeCanvas = document.createElement('canvas')
  const barcodeBarHeight = Math.round(barcodeAreaHeight * 0.62)
  const fontSize = Math.max(10, Math.round(height * 0.055))

  renderBarcodeToCanvas(barcodeCanvas, opts.code, opts.format, {
    width: 2,
    height: barcodeBarHeight,
    displayValue: true,
    fontSize,
    margin: 4,
  })

  const maxBarcodeWidth = width - paddingX * 2
  const maxBarcodeHeight = barcodeAreaHeight
  const scale = Math.min(
    maxBarcodeWidth / barcodeCanvas.width,
    maxBarcodeHeight / barcodeCanvas.height,
    1,
  )
  const drawW = barcodeCanvas.width * scale
  const drawH = barcodeCanvas.height * scale
  const drawX = (width - drawW) / 2
  const drawY = barcodeAreaTop + (barcodeAreaHeight - drawH) / 2
  ctx.drawImage(barcodeCanvas, drawX, drawY, drawW, drawH)

  // Price
  if (opts.price.trim()) {
    const priceSize = Math.min(20, Math.round(height * 0.08))
    ctx.font = `700 ${priceSize}px "IBM Plex Sans", system-ui, sans-serif`
    ctx.fillText(
      opts.price.trim(),
      width / 2,
      height - bottomBand / 2,
      width - paddingX * 2,
    )
  }

  // Thin border for visual label edge
  ctx.strokeStyle = '#d4d4d4'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1)

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
