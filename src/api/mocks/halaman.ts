import { HttpResponse } from 'msw'

/* Laravel `paginate()` membalas `{current_page, last_page, data}` dengan bawaan
   10 baris per halaman. Mock wajib menirunya: selama mock mengirim daftar utuh,
   klien yang hanya membaca halaman pertama tetap hijau di tes padahal kehilangan
   sebagian besar baris di server sungguhan. */
export function halamanLaravel<T>(request: Request, baris: T[], bawaan = 10) {
  const cari = new URL(request.url).searchParams
  const batas = Number(cari.get('limit') ?? bawaan) || bawaan
  const nomor = Math.max(1, Number(cari.get('page') ?? 1) || 1)
  const mulai = (nomor - 1) * batas
  return HttpResponse.json({
    current_page: nomor,
    last_page: Math.max(1, Math.ceil(baris.length / batas)),
    per_page: batas,
    total: baris.length,
    data: baris.slice(mulai, mulai + batas),
  })
}
