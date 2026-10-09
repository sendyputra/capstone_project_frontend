import { setupWorker } from 'msw/browser'
import { handlers } from '@/api/mocks/handlers'
import { aktifkanSimulasi } from '@/api/mocks/handlers/units'

/* Simulasi kegagalan pertama menyala bersama worker mock peramban — modul ini
   hanya dimuat di mode mock. Tes memakai `resetSimulasi()` sehingga jalur
   berhasil tidak ikut gagal. */
aktifkanSimulasi()

export const worker = setupWorker(...handlers)
