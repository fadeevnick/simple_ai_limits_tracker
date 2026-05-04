import { useState, useEffect, useRef } from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ServiceModalProps {
  open: boolean;
  initial: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

export function ServiceModal({ open, initial, onSubmit, onClose }: ServiceModalProps) {
  const [name, setName] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initial);
      setTimeout(() => ref.current?.focus(), 50);
    }
  }, [open, initial]);

  return (
    <ModalShell open={open} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSubmit(name.trim());
        }}
      >
        <div className="p-8">
          <h3 className="text-2xl font-bold mb-8">New service</h3>
          <div>
            <label className="block text-sm text-gray-500 mb-2">Service name</label>
            <Input ref={ref} type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[var(--border)] px-8 py-4">
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">Add</Button>
        </div>
      </form>
    </ModalShell>
  );
}
