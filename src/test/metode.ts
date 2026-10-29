import { onTestFinished, vi } from 'vitest'

/* Mock hanya melayani PUT untuk perubahan kontrak dan pembayaran, seperti rute
   API asli. Rekaman ini mengunci metode yang benar-benar pergi — tiap entri
   berbentuk "PUT /contracts/3" — supaya adaptor yang kembali mengirim PATCH
   tidak lolos diam-diam. Pemulihan fetch otomatis di akhir tes, sehingga tes
   lain tetap memakai fetch asli. */
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

/* Badan FormData yang *dikirim* klien direkam sebelum menyusup ke serializer
   MSW: serializer itu menggugurkan bidang berama ganda kecuali yang terakhir,
   satu-satunya tempat semua butir masih utuh adalah `init.body`. */
export function pantauBadanForm(): FormData[] {
  const rekaman: FormData[] = []
  const asli = globalThis.fetch
  const pantau = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const badan = init?.body
    if (badan instanceof FormData) rekaman.push(badan)
    return asli(input, init)
  })
  onTestFinished(() => pantau.mockRestore())
  return rekaman
}
