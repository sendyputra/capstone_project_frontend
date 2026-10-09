import type { Contract } from '@/api/types'

/* `total_price` mengikuti ERD: harga bulanan unit dikali masa sewa. */
export const contracts: Contract[] = [
  { id: 201, unit_id: 2, tenant_id: 2, start_date: '2026-09-01', end_date: '2027-02-28', total_price: 15000000, status: 'Aktif' },
  { id: 202, unit_id: 5, tenant_id: 3, start_date: '2026-07-15', end_date: '2027-01-14', total_price: 18600000, status: 'Aktif' },
  { id: 203, unit_id: 3, tenant_id: 4, start_date: '2026-02-01', end_date: '2026-07-31', total_price: 27000000, status: 'Selesai' },
  { id: 204, unit_id: 1, tenant_id: 5, start_date: '2026-05-01', end_date: '2026-10-31', total_price: 7200000, status: 'Dibatalkan' },
]
