import { http, HttpResponse, type HttpResponseResolver } from 'msw'
import { dariKtp } from '@/api/adapters/tenants'
import { contracts } from '@/api/mocks/data/contracts'
import { tenants } from '@/api/mocks/data/tenants'
import { pemanggil, tenantById, unitById } from '@/api/mocks/join'
import type { KtpStatus, Tenant } from '@/api/types'

let urutan = Math.max(...tenants.map((tenant) => tenant.id))

/* Cakupan sama dengan `TenantController::scopeFor`: penyewa buatan pemilik
   ATAU penyewa yang punya kontrak pada unit pemilik itu. */
function dalamCakupan(tenant: Tenant, sub: number): boolean {
  if (tenant.owner_id === sub) return true
  return contracts.some((kontrak) => kontrak.tenant_id === tenant.id && unitById(kontrak.unit_id)?.owner_id === sub)
}

function jumlahKontrak(tenantId: number): number {
  return contracts.filter((kontrak) => kontrak.tenant_id === tenantId).length
}

function baris(tenant: Tenant) {
  return {
    id: tenant.id,
    user_id: tenant.user_id,
    owner_id: tenant.owner_id ?? null,
    name: tenant.name,
    phone: tenant.phone,
    ktp_status: dariKtp(tenant.ktp),
    contracts_count: jumlahKontrak(tenant.id),
    created_at: tenant.joined,
  }
}

type MasukanTenant = { name?: unknown; phone?: unknown; ktp_status?: unknown }

function bacaKtp(nilai: unknown): KtpStatus | null {
  if (nilai === 'unverified') return 'Belum'
  if (nilai === 'pending') return 'Menunggu'
  if (nilai === 'verified') return 'Terverifikasi'
  return null
}

/* Penyewa yang dibuat pemilik tidak punya akun: `user_id` selalu kosong dan
   `owner_id` diambil dari token, bukan dari badan permintaan. */
const buatTenant: HttpResponseResolver = async ({ request }) => {
  const { sub, peran } = pemanggil(request)
  if (!peran) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
  if (peran !== 'pemilik') return HttpResponse.json({ message: 'Unauthorized access' }, { status: 403 })

  const badan = (await request.json()) as MasukanTenant
  const nama = String(badan.name ?? '').trim()
  if (!nama) return HttpResponse.json({ message: 'Nama penyewa wajib diisi.' }, { status: 422 })

  const tenant: Tenant = {
    id: ++urutan,
    user_id: null,
    owner_id: sub,
    name: nama,
    phone: String(badan.phone ?? ''),
    ktp: bacaKtp(badan.ktp_status) ?? 'Belum',
    joined: new Date().toISOString(),
  }
  tenants.push(tenant)
  return HttpResponse.json({ message: 'Penyewa berhasil ditambahkan.', tenant: baris(tenant) }, { status: 201 })
}

const ubahTenant: HttpResponseResolver<{ id: string }> = async ({ request, params }) => {
  const { sub, peran } = pemanggil(request)
  if (!peran) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

  const tenant = tenantById(Number(params.id))
  if (!tenant) return HttpResponse.json({ message: 'Penyewa tidak ditemukan.' }, { status: 404 })
  if (peran !== 'pemilik' || !dalamCakupan(tenant, sub ?? 0)) {
    return HttpResponse.json({ message: 'Unauthorized access' }, { status: 403 })
  }

  const badan = (await request.json()) as MasukanTenant
  if (badan.name !== undefined) {
    const nama = String(badan.name).trim()
    if (!nama) return HttpResponse.json({ message: 'Nama penyewa wajib diisi.' }, { status: 422 })
    tenant.name = nama
  }
  if (badan.phone !== undefined) tenant.phone = String(badan.phone)
  const ktp = bacaKtp(badan.ktp_status)
  if (ktp) tenant.ktp = ktp

  return HttpResponse.json({ message: 'Penyewa berhasil diperbarui.', tenant: baris(tenant) })
}

export const tenantHandlers = [
  http.get('/tenants', ({ request }) => {
    const { sub, peran } = pemanggil(request)
    if (!peran) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
    if (peran !== 'pemilik') return HttpResponse.json({ message: 'Unauthorized access' }, { status: 403 })

    const data = tenants
      .filter((tenant) => dalamCakupan(tenant, sub ?? 0))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(baris)
    return HttpResponse.json({ data })
  }),

  http.post('/tenants', buatTenant),
  http.put('/tenants/:id', ubahTenant),

  /* Hanya penyewa buatan pemilik yang boleh dihapus; penyewa yang sudah punya
     kontrak ditolak 409, sama seperti backend. */
  http.delete('/tenants/:id', ({ request, params }) => {
    const { sub, peran } = pemanggil(request)
    if (!peran) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
    if (peran !== 'pemilik') return HttpResponse.json({ message: 'Unauthorized access' }, { status: 403 })

    const indeks = tenants.findIndex((tenant) => tenant.id === Number(params.id))
    if (indeks === -1) return HttpResponse.json({ message: 'Penyewa tidak ditemukan.' }, { status: 404 })
    const tenant = tenants[indeks]
    if (tenant.owner_id !== sub) return HttpResponse.json({ message: 'Unauthorized access' }, { status: 403 })
    if (jumlahKontrak(tenant.id) > 0) {
      return HttpResponse.json({ message: 'Penyewa yang memiliki kontrak tidak dapat dihapus.' }, { status: 409 })
    }

    tenants.splice(indeks, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
