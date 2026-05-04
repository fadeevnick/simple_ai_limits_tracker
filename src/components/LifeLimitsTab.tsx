import { useState, useEffect, useCallback } from "react";
import { LifeLimit } from "@/lib/types";
import { api } from "@/lib/api";
import { toDatetimeLocal } from "@/lib/time";
import { useModal } from "@/lib/useModal";
import { LifeLimitRow } from "@/components/LifeLimitRow";
import { LifeLimitModal, LifeLimitModalData } from "@/components/LifeLimitModal";
import { Button } from "@/components/ui/Button";

const MODAL_DEFAULTS: LifeLimitModalData = { name: "", deadline: "" };

export function LifeLimitsTab() {
  const [limits, setLimits] = useState<LifeLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const modal = useModal<LifeLimitModalData>(MODAL_DEFAULTS);

  const fetchLimits = useCallback(async () => {
    setLimits(await api.lifeLimits.list());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLimits();
    const interval = setInterval(fetchLimits, 30000);
    return () => clearInterval(interval);
  }, [fetchLimits]);

  const openAdd = () => modal.open({ name: "", deadline: "" });

  const openEdit = (limit: LifeLimit) => {
    const local = toDatetimeLocal(limit.deadline);
    modal.open({ name: limit.name, deadline: local }, limit.id);
  };

  const submitLimit = async (data: LifeLimitModalData) => {
    const iso = new Date(data.deadline).toISOString();
    if (modal.isOpen && modal.modal.open && modal.modal.id) {
      await api.lifeLimits.update(modal.modal.id, { name: data.name, deadline: iso });
    } else {
      await api.lifeLimits.create(data.name, iso);
    }
    modal.close();
    fetchLimits();
  };

  const deleteLimit = async (id: string) => {
    await api.lifeLimits.delete(id);
    modal.close();
    fetchLimits();
  };

  if (loading) return <div className="text-gray-500 text-center py-24">Loading...</div>;

  const sorted = [...limits].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button variant="primary" onClick={openAdd}>+ Event</Button>
      </div>
      {sorted.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p>No events yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-lg p-6">
          {sorted.map((l) => (
            <LifeLimitRow key={l.id} limit={l} onEdit={openEdit} onDelete={deleteLimit} />
          ))}
        </div>
      )}

      <LifeLimitModal
        open={modal.isOpen}
        title={modal.modal.open && modal.modal.id ? "Edit event" : "Add event"}
        initial={modal.modal.open ? modal.modal.initial : MODAL_DEFAULTS}
        onSubmit={submitLimit}
        onClose={modal.close}
        showDelete={modal.modal.open ? !!modal.modal.id : false}
        onDelete={(() => {
          if (!modal.modal.open) return undefined;
          const id = modal.modal.id;
          return id ? () => deleteLimit(id) : undefined;
        })()}
      />
    </div>
  );
}
