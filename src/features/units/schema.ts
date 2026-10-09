import { z } from 'zod'

export const unitFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama unit belum diisi. Isi nama agar penyewa mudah mengenali unit ini.'),
  address: z.string().trim().min(1, 'Lokasi belum diisi. Tulis lokasi singkat, misalnya Bandung Barat.'),
  price: z.coerce
    .number({ message: 'Harga belum diisi atau bukan angka. Masukkan harga per bulan, misalnya 1200000.' })
    .positive('Harga harus lebih besar dari nol. Masukkan harga per bulan, misalnya 1200000.'),
  status: z.enum(['Tersedia', 'Terisi']),
})

export type UnitFormValues = z.infer<typeof unitFormSchema>

/* Bentuk mentah yang masuk dari bidang formulir (`price` masih `unknown`
   sebelum dipaksa jadi angka oleh `z.coerce`). */
export type UnitFormInput = z.input<typeof unitFormSchema>
