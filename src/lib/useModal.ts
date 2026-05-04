import { useState } from "react";

export type ModalState<T> = { open: true; id: string | null; initial: T } | { open: false };

export function useModal<T>(defaults: T) {
  const [modal, setModal] = useState<ModalState<T>>({ open: false });

  const open = (initial?: Partial<T>, id: string | null = null) =>
    setModal({ open: true, id, initial: { ...defaults, ...initial } });

  const close = () => setModal({ open: false });

  return { modal, open, close, isOpen: modal.open };
}
