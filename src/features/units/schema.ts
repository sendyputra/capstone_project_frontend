import { z } from 'zod'
import { TIPE_UNIT } from '@/api/types'

export const unitFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama unit belum diisi. Isi nama agar penyewa mudah mengenali unit ini.'),
  /* Backend menolak POST /units tanpa `type`, jadi bidang ini wajib diisi —
     nilai bawaan akan menamai ruko sebagai kamar kos. */
  type: z.enum(TIPE_UNIT, { message: 'Tipe properti belum dipilih. Pilih salah satu, misalnya Kamar Kos.' }),
  address: z.string().trim().min(1, 'Lokasi belum diisi. Tulis lokasi singkat, misalnya Bandung Barat.'),
  price: z.coerce
    .number({ message: 'Harga belum diisi atau bukan angka. Masukkan harga per bulan, misalnya 1200000.' })
    .positive('Harga harus lebih besar dari nol. Masukkan harga per bulan, misalnya 1200000.'),
  /* Teks mentah koma; bukan daftar. Pemecahannya di halaman: tiap butir dipangkas
     dan yang kosong dibuang sebelum masuk FormData `facilities[]`. */
  facilities: z.string().trim(),
  status: z.enum(['Tersedia', 'Terisi']),
})

export type UnitFormValues = z.infer<typeof unitFormSchema>

/* Bentuk mentah yang masuk dari bidang formulir (`price` masih `unknown`
   sebelum dipaksa jadi angka oleh `z.coerce`). */
export type UnitFormInput = z.input<typeof unitFormSchema>
