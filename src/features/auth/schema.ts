import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email atau nomor WhatsApp belum diisi. Isi agar pemilik dapat menghubungi Anda.'),
  password: z
    .string()
    .min(1, 'Kata sandi belum diisi. Isi sekurangnya 8 karakter.')
    .min(8, 'Kata sandi kurang dari 8 karakter. Tambahkan sampai minimal 8 karakter.'),
})

export type LoginValues = z.infer<typeof loginSchema>
