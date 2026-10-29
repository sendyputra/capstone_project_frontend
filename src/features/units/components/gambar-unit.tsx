/* Bila unit tanpa foto (`image` kosong), tampilkan blok placeholder warna
   token, bukan <img> yang gagal memuat dan tampak putus. */
export function GambarUnit({ src, alt, className }: { src: string; alt: string; className: string }) {
  if (src) return <img src={src} alt={alt} className={className} />
  return (
    <div className={`flex items-center justify-center bg-brand-surface-sunken ${className}`}>
      <span className="text-micro text-brand-text-subtle">Belum ada foto</span>
    </div>
  )
}
