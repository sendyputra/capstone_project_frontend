import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/alert-dialog'

type Permintaan = { judul: string; pesan: string; labelKonfirmasi?: string }

/* Pengganti `window.confirm` ala purwarupa: pemanggil menunggu janji boolean,
   jadi alur penghapusan tetap satu baris di komponen pemanggil. */
const Konteks = createContext<((permintaan: Permintaan) => Promise<boolean>) | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [permintaan, setPermintaan] = useState<Permintaan | null>(null)
  const jawab = useRef<((nilai: boolean) => void) | null>(null)

  const konfirmasi = useCallback((berikutnya: Permintaan) => {
    return new Promise<boolean>((selesai) => {
      jawab.current = selesai
      setPermintaan(berikutnya)
    })
  }, [])

  function tutup(nilai: boolean) {
    jawab.current?.(nilai)
    jawab.current = null
    setPermintaan(null)
  }

  return (
    <Konteks.Provider value={konfirmasi}>
      {children}
      <AlertDialog open={Boolean(permintaan)} onOpenChange={(terbuka) => { if (!terbuka) tutup(false) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{permintaan?.judul}</AlertDialogTitle>
            <AlertDialogDescription>{permintaan?.pesan}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => tutup(true)}>{permintaan?.labelKonfirmasi ?? 'Lanjutkan'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Konteks.Provider>
  )
}

export function useKonfirmasi() {
  const nilai = useContext(Konteks)
  if (!nilai) throw new Error('useKonfirmasi dipakai di luar ConfirmProvider')
  return nilai
}
