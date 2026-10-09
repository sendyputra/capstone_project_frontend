/* Kegagalan disimulasikan sekali per aksi supaya jalur galat dan tombol coba
   ulang bisa didemokan tanpa backend — sama seperti purwarupa. Simulasi default
   mati supaya tes jalur berhasil tidak ikut gagal; peramban menyalakannya lewat
   `aktifkanSimulasi()` saat worker mock menyala, dan tes yang memang ingin
   kegagalan pertama menyalakannya sendiri. */
let simulasiAktif = false
const sudahGagal = new Set<string>()

export function gagalSekali(kunci: string): boolean {
  if (!simulasiAktif) return false
  if (sudahGagal.has(kunci)) return false
  sudahGagal.add(kunci)
  return true
}

export function aktifkanSimulasi() {
  simulasiAktif = true
}

export function resetSimulasi() {
  sudahGagal.clear()
  simulasiAktif = false
}
