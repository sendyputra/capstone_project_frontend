import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/ui/alert-dialog'

export function DeleteUnitDialog({ open, nama, onBatal, onSetuju }: { open: boolean; nama: string; onBatal: () => void; onSetuju: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={(terbuka) => { if (!terbuka) onBatal() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus unit ini?</AlertDialogTitle>
          <AlertDialogDescription>Unit {nama} beserta kontrak dan tagihannya tidak dapat dikembalikan.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onSetuju}>Hapus unit</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
