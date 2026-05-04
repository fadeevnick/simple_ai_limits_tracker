import { useState, useEffect, useRef } from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export type ResetMode = "duration" | "date";

export interface AccountModalData {
  name: string;
  usagePercent: number;
  days: number;
  hours: number;
  minutes: number;
  resetDate: string;
  resetMode: ResetMode;
}

interface AccountModalProps {
  open: boolean;
  title: string;
  initial: AccountModalData;
  onSubmit: (data: AccountModalData) => void;
  onClose: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
}

export function AccountModal({ open, title, initial, onSubmit, onClose, showDelete, onDelete }: AccountModalProps) {
  const [name, setName] = useState(initial.name);
  const [percent, setPercent] = useState(initial.usagePercent);
  const [days, setDays] = useState(String(initial.days));
  const [hours, setHours] = useState(String(initial.hours));
  const [minutes, setMinutes] = useState(String(initial.minutes));
  const [resetMode, setResetMode] = useState<ResetMode>(initial.resetMode);
  const [resetDate, setResetDate] = useState(initial.resetDate);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initial.name);
      setPercent(initial.usagePercent);
      setDays(String(initial.days));
      setHours(String(initial.hours));
      setMinutes(String(initial.minutes));
      setResetMode(initial.resetMode);
      setResetDate(initial.resetDate);
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name: name.trim(), usagePercent: percent, days: Number(days) || 0, hours: Number(hours) || 0, minutes: Number(minutes) || 0, resetDate, resetMode });
  };

  return (
    <ModalShell open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-8">
          <h3 className="text-2xl font-bold mb-8">{title}</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-500 mb-2">Account name</label>
              <Input ref={nameRef} type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-2">Usage — {percent}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-2">Resets</label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setResetMode("duration")} className={`px-3 py-1.5 text-sm rounded-md border ${resetMode === "duration" ? "border-gray-400 text-[var(--text-bright)] bg-[var(--hover)]" : "border-[var(--border)] text-gray-500"}`}>in</button>
                <button type="button" onClick={() => setResetMode("date")} className={`px-3 py-1.5 text-sm rounded-md border ${resetMode === "date" ? "border-gray-400 text-[var(--text-bright)] bg-[var(--hover)]" : "border-[var(--border)] text-gray-500"}`}>on</button>
              </div>
              {resetMode === "duration" ? (
                <div className="flex items-center gap-3">
                  <Input type="text" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/[^0-9]/g, ''))} />
                  <span className="text-base text-gray-400">d</span>
                  <Input type="text" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value.replace(/[^0-9]/g, ''))} />
                  <span className="text-base text-gray-400">h</span>
                  <Input type="text" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/[^0-9]/g, ''))} />
                  <span className="text-base text-gray-400">m</span>
                </div>
              ) : (
                <Input type="datetime-local" value={resetDate} onChange={(e) => setResetDate(e.target.value)} />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--border)] px-8 py-4">
          {showDelete && onDelete && (
            <Button variant="danger" type="button" onClick={() => { onDelete(); onClose(); }}>Delete</Button>
          )}
          <div className="flex-1" />
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">Save</Button>
        </div>
      </form>
    </ModalShell>
  );
}
