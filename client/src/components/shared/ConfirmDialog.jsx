import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description = '',
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
}) {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {cancelText}
          </DialogClose>
          <Button variant={variant} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
