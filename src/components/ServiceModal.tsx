import { useState, useEffect, useRef } from "react";
import type { LimitMode } from "@/lib/types";
import { ModalShell } from "@/components/ui/ModalShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface ServiceModalData {
  name: string;
  limitMode: LimitMode;
}

interface ServiceModalProps {
  open: boolean;
  initial: ServiceModalData;
  onSubmit: (data: ServiceModalData) => void;
  onClose: () => void;
}

export function ServiceModal({
  open,
  initial,
  onSubmit,
  onClose,
}: ServiceModalProps) {
  const [name, setName] = useState(initial.name);
  const [limitMode, setLimitMode] = useState<LimitMode>(initial.limitMode);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initial.name);
      setLimitMode(initial.limitMode);
      setTimeout(() => ref.current?.focus(), 50);
    }
  }, [open, initial]);

  return (
    <ModalShell open={open} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSubmit({ name: name.trim(), limitMode });
        }}
      >
        <div className="p-9">
          <h3 className="text-3xl font-bold mb-8">New service</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-base text-gray-500 mb-2">
                Service name
              </label>
              <Input
                ref={ref}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-base text-gray-500 mb-2">
                Limit type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLimitMode("single")}
                  className={`rounded-lg border px-5 py-4 text-left text-base ${limitMode === "single" ? "border-gray-400 bg-[var(--hover)] text-[var(--text-bright)]" : "border-[var(--border)] text-gray-500"}`}
                >
                  <span className="block font-medium">Single</span>
                  <span className="block text-sm opacity-70">
                    One shared reset
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setLimitMode("dailyWeekly")}
                  className={`rounded-lg border px-5 py-4 text-left text-base ${limitMode === "dailyWeekly" ? "border-gray-400 bg-[var(--hover)] text-[var(--text-bright)]" : "border-[var(--border)] text-gray-500"}`}
                >
                  <span className="block font-medium">Daily + weekly</span>
                  <span className="block text-sm opacity-70">
                    Two separate resets
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[var(--border)] px-9 py-5">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Add
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
