import { namaBerkas } from '@/lib/format'

/* Hanya alamat yang benar-benar bisa dibuka peramban yang menjadi tautan.
   `proof_url` dari API asli berupa URL absolut; data demo mengirim nama berkas
   saja sebelum ada unggahan, dan unggahan demo berupa data URL. */
const BISA_DIBUKA = /^(https?:|data:|blob:)/

export function TautanBukti({ url }: { url: string }) {
  const nama = url.startsWith('data:') ? 'Bukti bayar' : namaBerkas(url)

  if (!nama) return <span className="text-brand-text-subtle">Belum ada berkas</span>
  if (!BISA_DIBUKA.test(url)) return <span>{nama}</span>

  return (
    <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-brand-accent underline">
      {nama}
    </a>
  )
}
