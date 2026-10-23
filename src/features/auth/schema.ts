import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email atau nomor WhatsApp belum diisi. Isi agar pemilik dapat menghubungi Anda.'),
  password: z
    .string()
    .min(1, 'Kata sandi belum diisi. Isi sekurangnya 8 karakter.')
    .min(8, 'Kata sandi kurang dari 8 karakter. Tambahkan sampai minimal 8 karakter.'),
})

export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z.string().min(3, 'Nama wajib diisi.'),
    nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit.'),
    email: z.string().email('Email tidak valid.'),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter.'),
    password_confirmation: z.string(),
    role: z.enum(['penyewa', 'pemilik']),
  })
  .refine((nilai) => nilai.password === nilai.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Konfirmasi sandi tidak cocok.',
  })

export type RegisterValues = z.infer<typeof registerSchema>
