import { useState, useEffect, useRef } from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface LifeLimitModalData {
  name: string;
  deadline: string;
}

interface LifeLimitModalProps {
  open: boolean;
  title: string;
  initial: LifeLimitModalData;
  onSubmit: (data: LifeLimitModalData) => void;
  onClose: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
}

export function LifeLimitModal({
  open,
  title,
  initial,
  onSubmit,
  onClose,
  showDelete,
  onDelete,
}: LifeLimitModalProps) {
  const [name, setName] = useState(initial.name);
  const [deadline, setDeadline] = useState(initial.deadline);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initial.name);
      setDeadline(initial.deadline);
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && deadline) onSubmit({ name: name.trim(), deadline });
  };

  return (
    <ModalShell open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="px-7 py-6">
          <h3 className="text-2xl font-semibold tracking-tight text-[var(--text-bright)] mb-7">
            {title}
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Event name
              </label>
              <Input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Deadline
              </label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-[var(--border)] bg-[var(--surface-soft)]/40 px-7 py-4 rounded-b-xl">
          {showDelete && onDelete && (
            <Button
              variant="danger"
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
