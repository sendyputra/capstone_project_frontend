import { createBrowserRouter, type RouteObject } from 'react-router'
import { ForbiddenPage } from '@/app/pages/forbidden-page'
import { RequireRole } from '@/app/guards'
import { AppShell } from '@/app/layouts/app-shell'
import { AdminShell } from '@/features/admin/layouts/admin-shell'
import { AdminKontrakPage } from '@/features/admin/pages/admin-kontrak-page'
import { AdminPembayaranPage } from '@/features/admin/pages/admin-pembayaran-page'
import { AdminPenggunaPage } from '@/features/admin/pages/admin-pengguna-page'
import { AdminUnitPage } from '@/features/admin/pages/admin-unit-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { RegisterPage } from '@/features/auth/pages/register-page'
import { BantuanPage } from '@/features/help/pages/bantuan-page'
import { LandingPage } from '@/features/landing/pages/landing-page'
import { TagihanPage } from '@/features/billing/pages/tagihan-page'
import { PengajuanPage } from '@/features/bookings/pages/pengajuan-page'
import { OwnerDashboardPage } from '@/features/dashboard/pages/owner-dashboard-page'
import { KatalogPage } from '@/features/units/pages/katalog-page'
import { UnitDetailPage } from '@/features/units/pages/unit-detail-page'
import { UnitFormPage } from '@/features/units/pages/unit-form-page'
import { UnitListPage } from '@/features/units/pages/unit-list-page'

/* AppShell adalah tata letak akar: semua rute berada di dalamnya, sehingga
   bilah atas, tombol tema, dan atribut peran terpasang di setiap layar. Dipisah
   dari peramban perutean supaya peta rutenya bisa diuji lewat memori perutean. */
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: '/masuk', element: <LoginPage /> },
      { path: '/daftar', element: <RegisterPage /> },
      { path: '/bantuan', element: <BantuanPage /> },
      { path: '/403', element: <ForbiddenPage /> },
      { path: '/', element: <LandingPage /> },
      { path: '/katalog', element: <KatalogPage /> },
      { path: '/katalog/:id', element: <UnitDetailPage /> },
      { path: '/tagihan', element: <RequireRole role="penyewa"><TagihanPage /></RequireRole> },
      { path: '/pemilik', element: <RequireRole role="pemilik"><OwnerDashboardPage /></RequireRole> },
      { path: '/pemilik/unit', element: <RequireRole role="pemilik"><UnitListPage /></RequireRole> },
      { path: '/pemilik/unit/baru', element: <RequireRole role="pemilik"><UnitFormPage /></RequireRole> },
      { path: '/pemilik/unit/:id', element: <RequireRole role="pemilik"><UnitDetailPage mode="pemilik" /></RequireRole> },
      { path: '/pemilik/pengajuan', element: <RequireRole role="pemilik"><PengajuanPage /></RequireRole> },
      {
        path: '/admin',
        element: <RequireRole role="admin"><AdminShell /></RequireRole>,
        children: [
          { path: 'unit', element: <AdminUnitPage /> },
          { path: 'kontrak', element: <AdminKontrakPage /> },
          { path: 'pembayaran', element: <AdminPembayaranPage /> },
          { path: 'pengguna', element: <AdminPenggunaPage /> },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
