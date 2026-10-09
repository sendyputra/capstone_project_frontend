import { cn } from '@/lib/utils'

/* Satu peta tone untuk semua status di aplikasi — status unit, tagihan,
   kontrak, pengajuan, dan verifikasi KTP — supaya "Ditolak" selalu merah dan
   "Lunas" selalu hijau, di layar mana pun. */
const tone: Record<string, string> = {
  Tersedia: 'bg-brand-success-soft text-brand-success-soft-fg',
  Terisi: 'bg-brand-danger-soft text-brand-danger-soft-fg',
  'Belum Bayar': 'bg-brand-warning-soft text-brand-warning-soft-fg',
  'Menunggu Verifikasi': 'bg-brand-accent-track text-brand-accent-soft-fg',
  'Menunggu Persetujuan': 'bg-brand-warning-soft text-brand-warning-soft-fg',
  Disetujui: 'bg-brand-success-soft text-brand-success-soft-fg',
  Lunas: 'bg-brand-success-soft text-brand-success-soft-fg',
  Ditolak: 'bg-brand-danger-soft text-brand-danger-soft-fg',
  Aktif: 'bg-brand-success-soft text-brand-success-soft-fg',
  Selesai: 'bg-brand-accent-track text-brand-accent-soft-fg',
  Dibatalkan: 'bg-brand-danger-soft text-brand-danger-soft-fg',
  Terverifikasi: 'bg-brand-success-soft text-brand-success-soft-fg',
  Menunggu: 'bg-brand-warning-soft text-brand-warning-soft-fg',
  Belum: 'bg-brand-surface-sunken text-brand-text-muted',
}

export function StatusChip({ nilai, className }: { nilai: string; className?: string }) {
  return (
    <span className={cn('inline-block whitespace-nowrap rounded-full px-3 py-1 text-micro font-bold', tone[nilai] ?? 'bg-brand-surface-sunken text-brand-text-muted', className)}>
      {nilai}
    </span>
  )
}
