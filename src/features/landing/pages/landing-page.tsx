import { HeroBeranda } from '@/features/landing/components/hero-beranda'
import { KatalogPage } from '@/features/units/pages/katalog-page'
import { useFilterUnit } from '@/features/units/use-filter-unit'

/* Seperti purwarupa: beranda menyajikan hero lalu katalog, dan pengunjung tanpa
   akun boleh melihat keduanya. Kartu carinya duduk di dalam hero, sehingga
   keadaannya dipegang halaman ini dan seksi katalog hanya menampilkan hasilnya. */
export function LandingPage() {
  const filter = useFilterUnit()

  return (
    <>
      <HeroBeranda filter={filter} />
      <KatalogPage filter={filter} tampilkanForm={false} />
    </>
  )
}
