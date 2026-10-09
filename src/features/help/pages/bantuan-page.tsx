import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeadset } from '@fortawesome/free-solid-svg-icons'
import { faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons'

export function BantuanPage() {
  return (
    <section className="mx-auto max-w-md space-y-4 px-4 py-10">
      <div className="space-y-5 rounded-2xl border border-brand-border bg-brand-surface p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent-track text-xl text-brand-accent">
          <FontAwesomeIcon icon={faHeadset} aria-hidden />
        </div>

        <div>
          <h1 className="text-heading-s font-bold text-brand-text">Layanan &amp; Bantuan Aduan</h1>
          <p className="mt-1 text-micro text-brand-text-muted">Hubungi pengembang atau tim support Nusantara Booking</p>
        </div>

        <div className="space-y-3 text-left">
          <a
            href="https://instagram.com/Aditiya.wibisono"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-bg p-4"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-instagram text-lg text-brand-text-inverse">
                <FontAwesomeIcon icon={faInstagram} aria-hidden />
              </span>
              <span>
                <span className="block text-micro font-semibold uppercase tracking-label text-brand-text-subtle">Instagram Pemilik App</span>
                <span className="block text-ui font-bold text-brand-text">@Aditiya.wibisono</span>
              </span>
            </span>
          </a>

          <a
            href="https://wa.me/6285189989912"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-bg p-4"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-whatsapp text-lg text-brand-text-inverse">
                <FontAwesomeIcon icon={faWhatsapp} aria-hidden />
              </span>
              <span>
                <span className="block text-micro font-semibold uppercase tracking-label text-brand-text-subtle">Layanan Aduan WhatsApp</span>
                <span className="block text-ui font-bold text-brand-text">+62 851-8998-9912</span>
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
