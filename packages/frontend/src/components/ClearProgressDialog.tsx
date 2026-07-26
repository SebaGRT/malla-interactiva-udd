import { useEffect, useRef } from "react";

interface ClearProgressDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ClearProgressDialog({
  open,
  onCancel,
  onConfirm,
}: ClearProgressDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => cancelRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="clear-dialog"
      aria-labelledby="clear-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <form method="dialog" className="clear-dialog__form">
        <h2 id="clear-dialog-title">¿Borrar todo el avance?</h2>
        <p>Se desmarcarán todos los ramos que registraste como aprobados.</p>
        <div className="clear-dialog__actions">
          <button ref={cancelRef} type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="clear-dialog__confirm" onClick={onConfirm}>
            Borrar avance
          </button>
        </div>
      </form>
    </dialog>
  );
}
