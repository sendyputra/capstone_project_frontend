import { onTestFinished, vi } from 'vitest'

/* jsdom tidak menyediakan URL.createObjectURL; tanpa stub ini setiap unduhan
   melempar sebelum tautan sempat diklik. */
export function stubUnduhan() {
  const berkas: Blob[] = []
  const nama: string[] = []
  const revoked = vi.fn()
  const asliCreate = URL.createObjectURL
  const asliRevoke = URL.revokeObjectURL
  const asliKlik = HTMLAnchorElement.prototype.click

  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: (blob: Blob) => {
      berkas.push(blob)
      return `blob:uji/${berkas.length}`
    },
  })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoked })
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    nama.push(this.download)
  }

  onTestFinished(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: asliCreate })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: asliRevoke })
    HTMLAnchorElement.prototype.click = asliKlik
  })

  return { berkas, nama, revoked }
}