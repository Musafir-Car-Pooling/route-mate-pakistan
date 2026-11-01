import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function SameAddressDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-3xl tracking-normal text-destructive">Cannot select same address</AlertDialogTitle>
          <AlertDialogDescription>Home and workplace addresses must be different.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter><AlertDialogAction onClick={onClose}>OK</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
