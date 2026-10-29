import { HttpResponse } from 'msw'
import { susunCsv, type NilaiCsv } from '@/lib/csv'
import { tanggalHariIni } from '@/lib/tanggal'

/* Mock menjawab berkas seperti endpoint asli: CSV, bukan JSON, dengan nama
   berkas di `Content-Disposition` yang dibaca `apiDownload`. */
export function kirimCsv(nama: string, kolom: string[], baris: NilaiCsv[][]) {
  const tanggal = tanggalHariIni().replaceAll('-', '')
  return new HttpResponse(susunCsv(kolom, baris), {
    headers: {
      'Content-Type': 'text/csv; charset=UTF-8',
      'Content-Disposition': `attachment; filename=${nama}-${tanggal}.csv`,
    },
  })
}