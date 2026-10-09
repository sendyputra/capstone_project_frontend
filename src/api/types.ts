export type Role = 'penyewa' | 'pemilik' | 'admin'

export type User = {
  id: number
  name: string
  email: string
  role: Role
  phone: string
  city: string
  joined: string
}

export type KtpStatus = 'Terverifikasi' | 'Menunggu' | 'Belum'

export type Tenant = {
  id: number
  user_id: number | null
  name: string
  phone: string
  ktp: KtpStatus
  joined: string
}

export type UnitStatus = 'Tersedia' | 'Terisi'
export type UnitType = 'Kamar Kos' | 'Kontrakan' | 'Ruang Usaha' | 'Apartemen'

export type Unit = {
  id: number
  owner_id: number
  name: string
  address: string
  price: number
  status: UnitStatus
  /* Di luar ERD: dibutuhkan layar katalog dan kalender purwarupa, belum ada di skema. */
  type: UnitType
  facilities: string[]
  image: string
  booked_dates: number[]
}

/* Masukan formulir unit: bidang yang diisi pengguna. Purwarupa memilih tipe dan
   menulis fasilitas sebagai satu baris koma; gambar dan tanggal terisi menyusul. */
export type UnitInput = Pick<Unit, 'name' | 'address' | 'price' | 'status'> & Partial<Pick<Unit, 'type' | 'facilities' | 'image'>>

export type BookingStatus = 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak'
/* Di luar ERD: pengajuan sewa belum punya tabelnya di skema. */
export type Booking = { id: number; unit_id: number; tenant_id: number; duration: string; status: BookingStatus }

export type ContractStatus = 'Aktif' | 'Selesai' | 'Dibatalkan'

export type Contract = {
  id: number
  unit_id: number
  tenant_id: number
  start_date: string
  end_date: string
  total_price: number
  status: ContractStatus
}

export type PaymentStatus = 'Belum Bayar' | 'Menunggu Verifikasi' | 'Lunas' | 'Ditolak'

export type Payment = {
  id: number
  contract_id: number
  month: string
  amount: number
  status: PaymentStatus
  proof_url: string
}

/* Bentuk yang dikirim handler: baris siap tampil hasil join, seperti peran
   `with()` pada API sungguhan, supaya komponen tidak perlu menyambung sendiri. */
export type UnitRow = Unit & { owner_name: string }
export type BookingRow = Booking & { renter_name: string; unit_title: string; renter_phone: string }
export type ContractRow = Contract & { renter_name: string; unit_title: string; owner_name: string; term: string; monthly: number }
export type PaymentRow = Payment & { renter_name: string; unit_title: string }

export type ApiErrorKind = 'unauthorized' | 'validation' | 'not_found' | 'conflict' | 'server' | 'network'

export class ApiError extends Error {
  kind: ApiErrorKind
  status: number
  fields?: Record<string, string>

  constructor(kind: ApiErrorKind, status: number, message: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.fields = fields
  }
}
