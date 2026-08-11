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

  const padX = Math.round(width * 0.06)
  const padY = Math.round(height * 0.05)
  const hasPrice = Boolean(opts.price.trim())

  // Compact bands so name + barcode digits + optional price all fit
  const nameBand = Math.round(height * 0.16)
  const priceBand = hasPrice ? Math.round(height * 0.14) : Math.round(height * 0.03)
  const barcodeTop = padY + nameBand
  const barcodeBottom = height - padY - priceBand
  const barcodeAreaHeight = Math.max(48, barcodeBottom - barcodeTop)

  // Product name
  const name = opts.productName.trim() || 'Untitled'
  let nameSize = Math.min(24, Math.round(height * 0.085))
  ctx.font = `600 ${nameSize}px "IBM Plex Sans", system-ui, sans-serif`
  while (nameSize > 10 && ctx.measureText(name).width > width - padX * 2) {
    nameSize -= 1
    ctx.font = `600 ${nameSize}px "IBM Plex Sans", system-ui, sans-serif`
  }
  ctx.fillText(name, width / 2, padY + nameBand / 2, width - padX * 2)

  // Barcode — bars sized so bars + human-readable digits fit the area
  const barcodeCanvas = document.createElement('canvas')
  const fontSize = Math.max(11, Math.round(height * 0.055))
  const barcodeBarHeight = Math.max(
    24,
    Math.round(barcodeAreaHeight * 0.55),
  )

  renderBarcodeToCanvas(barcodeCanvas, opts.code, opts.format, {
    width: 2,
    height: barcodeBarHeight,
    displayValue: true,
    fontSize,
    margin: 2,
  })

  const maxBarcodeWidth = width - padX * 2
  const maxBarcodeHeight = barcodeAreaHeight
  const scale = Math.min(
    maxBarcodeWidth / barcodeCanvas.width,
    maxBarcodeHeight / barcodeCanvas.height,
  )
  const drawW = barcodeCanvas.width * scale
  const drawH = barcodeCanvas.height * scale
  const drawX = (width - drawW) / 2
  const drawY = barcodeTop + (barcodeAreaHeight - drawH) / 2
  ctx.drawImage(barcodeCanvas, drawX, drawY, drawW, drawH)

  // Price
  if (hasPrice) {
    const priceSize = Math.min(20, Math.round(height * 0.075))
    ctx.font = `700 ${priceSize}px "IBM Plex Sans", system-ui, sans-serif`
    ctx.fillText(
      opts.price.trim(),
      width / 2,
      height - padY - priceBand / 2,
      width - padX * 2,
    )
  }

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
