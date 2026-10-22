import type { Contract, ContractStatusDto } from '@/api/types'

/* Baris tabel `contracts` seperti yang dikirim API asli: bentuknya sama dengan
   `Contract`, hanya statusnya enum backend (`active`), bukan label tampilan. */
export type ContractDto = Omit<Contract, 'status'> & { status: ContractStatusDto }

/* `total_price` mengikuti ERD: harga bulanan unit dikali masa sewa. */
export const contracts: ContractDto[] = [
  { id: 201, unit_id: 2, tenant_id: 2, start_date: '2026-09-01', end_date: '2027-02-28', total_price: 15000000, status: 'active' },
  { id: 202, unit_id: 5, tenant_id: 3, start_date: '2026-07-15', end_date: '2027-01-14', total_price: 18600000, status: 'active' },
  { id: 203, unit_id: 3, tenant_id: 4, start_date: '2026-02-01', end_date: '2026-07-31', total_price: 27000000, status: 'completed' },
  { id: 204, unit_id: 1, tenant_id: 5, start_date: '2026-05-01', end_date: '2026-10-31', total_price: 7200000, status: 'cancelled' },
  { id: 205, unit_id: 2, tenant_id: 2, start_date: '2026-11-01', end_date: '2027-01-31', total_price: 7500000, status: 'pending' },
  { id: 206, unit_id: 7, tenant_id: 6, start_date: '2026-06-01', end_date: '2026-10-31', total_price: 6500000, status: 'active' },
  { id: 207, unit_id: 9, tenant_id: 7, start_date: '2026-06-01', end_date: '2026-10-31', total_price: 5500000, status: 'active' },
  { id: 208, unit_id: 13, tenant_id: 8, start_date: '2026-06-15', end_date: '2026-11-14', total_price: 12000000, status: 'active' },
  { id: 209, unit_id: 14, tenant_id: 9, start_date: '2026-02-01', end_date: '2026-12-31', total_price: 15400000, status: 'active' },
  { id: 210, unit_id: 16, tenant_id: 10, start_date: '2025-11-01', end_date: '2026-10-31', total_price: 21600000, status: 'active' },
  { id: 211, unit_id: 18, tenant_id: 11, start_date: '2026-06-01', end_date: '2026-10-31', total_price: 12000000, status: 'active' },
  { id: 212, unit_id: 20, tenant_id: 12, start_date: '2026-06-01', end_date: '2026-10-31', total_price: 7500000, status: 'active' },
  { id: 213, unit_id: 21, tenant_id: 13, start_date: '2026-06-15', end_date: '2026-11-14', total_price: 10200000, status: 'active' },
  { id: 214, unit_id: 12, tenant_id: 6, start_date: '2026-11-01', end_date: '2027-01-31', total_price: 5700000, status: 'pending' },
  { id: 215, unit_id: 10, tenant_id: 7, start_date: '2026-11-15', end_date: '2027-02-14', total_price: 3750000, status: 'pending' },
  { id: 216, unit_id: 17, tenant_id: 8, start_date: '2026-12-01', end_date: '2027-05-31', total_price: 12000000, status: 'pending' },
  { id: 217, unit_id: 24, tenant_id: 9, start_date: '2026-11-01', end_date: '2027-04-30', total_price: 8700000, status: 'pending' },
  { id: 218, unit_id: 4, tenant_id: 10, start_date: '2025-11-01', end_date: '2026-04-30', total_price: 5700000, status: 'completed' },
  { id: 219, unit_id: 11, tenant_id: 11, start_date: '2025-08-01', end_date: '2026-01-31', total_price: 9600000, status: 'completed' },
  { id: 220, unit_id: 19, tenant_id: 12, start_date: '2026-01-01', end_date: '2026-06-30', total_price: 8100000, status: 'completed' },
  { id: 221, unit_id: 23, tenant_id: 13, start_date: '2025-12-01', end_date: '2026-05-31', total_price: 6300000, status: 'completed' },
  { id: 222, unit_id: 6, tenant_id: 6, start_date: '2026-06-01', end_date: '2026-11-30', total_price: 7800000, status: 'cancelled' },
  { id: 223, unit_id: 22, tenant_id: 7, start_date: '2026-07-01', end_date: '2026-12-31', total_price: 7200000, status: 'cancelled' },
  { id: 224, unit_id: 15, tenant_id: 8, start_date: '2026-08-01', end_date: '2027-01-31', total_price: 8400000, status: 'cancelled' },
]
