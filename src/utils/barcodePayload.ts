import type { BarcodeFormat } from '../types'

/**
 * Value encoded into the barcode.
 * Code128 embeds name + price + SKU so a scan returns all fields.
 * EAN-13 / UPC-A are digits-only, so only the SKU is encoded.
 */
export function buildBarcodeValue(opts: {
  format: BarcodeFormat
  productName: string
  price: string
  sku: string
}): string {
  const sku = opts.sku.trim()
  if (opts.format === 'EAN13' || opts.format === 'UPC') {
    return sku
  }

  const name = opts.productName.trim() || 'Untitled'
  const price = opts.price.trim()
  // Scanner types: Name|Price|SKU  (empty price still keeps 3 parts)
  return `${name}|${price}|${sku}`
}

/** Parse a scanned Code128 payload back into fields. */
export function parseBarcodeValue(value: string): {
  productName: string
  price: string
  sku: string
} | null {
  const parts = value.split('|')
  if (parts.length < 3) return null
  const sku = parts[parts.length - 1] ?? ''
  const price = parts[parts.length - 2] ?? ''
  const productName = parts.slice(0, -2).join('|')
  return { productName, price, sku }
}

export function barcodeDisplayText(barcodeValue: string, maxLen = 42): string {
  if (barcodeValue.length <= maxLen) return barcodeValue
  return `${barcodeValue.slice(0, maxLen - 1)}…`
}
