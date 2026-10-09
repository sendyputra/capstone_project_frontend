import { HeroBeranda } from '@/features/landing/components/hero-beranda'
import { KatalogPage } from '@/features/units/pages/katalog-page'

/* Seperti purwarupa: halaman penyewa menyajikan hero lalu katalog, dan
   pengunjung tanpa akun boleh melihatnya. Tagihan tetap perlu masuk. */
export function LandingPage() {
  return (
    <>
      <HeroBeranda />
      <KatalogPage />
    </>
  )
}
