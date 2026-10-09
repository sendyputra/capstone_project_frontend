import { createBrowserRouter } from 'react-router'
import { ForbiddenPage } from '@/app/pages/forbidden-page'
import { RequireRole } from '@/app/guards'
import { AppShell } from '@/app/layouts/app-shell'
import { LoginPage } from '@/features/auth/pages/login-page'
import { OwnerDashboardPage } from '@/features/dashboard/pages/owner-dashboard-page'
import { UnitFormPage } from '@/features/units/pages/unit-form-page'
import { UnitListPage } from '@/features/units/pages/unit-list-page'

/* AppShell adalah tata letak akar: semua rute berada di dalamnya, sehingga
   bilah atas, tombol tema, dan atribut peran terpasang di setiap layar. */
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/masuk', element: <LoginPage /> },
      { path: '/403', element: <ForbiddenPage /> },
      { path: '/', element: <RequireRole role="penyewa"><p className="p-8">Katalog menyusul.</p></RequireRole> },
      { path: '/pemilik', element: <RequireRole role="pemilik"><OwnerDashboardPage /></RequireRole> },
      { path: '/pemilik/unit', element: <RequireRole role="pemilik"><UnitListPage /></RequireRole> },
      { path: '/pemilik/unit/baru', element: <RequireRole role="pemilik"><UnitFormPage /></RequireRole> },
      { path: '/admin/unit', element: <RequireRole role="admin"><p className="p-8">Area admin menyusul.</p></RequireRole> },
    ],
  },
])
