import { onTestFinished, vi } from 'vitest'

/* Mock melayani PATCH dan PUT sekaligus sampai Task 9 menghapus PATCH, jadi
   tes halaman tetap hijau walau adaptor kembali mengirim PATCH sementara
   produksi membalas 405. Rekaman ini mengunci metode yang benar-benar pergi:
   tiap entri berbentuk "PUT /contracts/3". Pemulihan fetch otomatis di akhir
   tes, sehingga tes lain tetap memakai fetch asli. */
export function pantauMetode(): string[] {
  const rekaman: string[] = []
  const asli = globalThis.fetch
  const pantau = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const jalur = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
    rekaman.push(`${init?.method ?? 'GET'} ${jalur}`)
    return asli(input, init)
  })
  onTestFinished(() => pantau.mockRestore())
  return rekaman
}
