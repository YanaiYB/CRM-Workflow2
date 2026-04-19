import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import type { Brand } from "@/lib/brand";
import type { BrandTeamMemberRow } from "@/hooks/use-tasks";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: Brand;
  members: BrandTeamMemberRow[];
}

const COLOR_PALETTE = [
  "oklch(0.65 0.2 25)",
  "oklch(0.7 0.18 60)",
  "oklch(0.7 0.16 140)",
  "oklch(0.65 0.18 200)",
  "oklch(0.6 0.2 280)",
  "oklch(0.65 0.2 320)",
];

export function ManageTeamDialog({ open, onOpenChange, brand, members }: Props) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  const handleAdd = async () => {
    if (!name.trim()) return;
    const color = COLOR_PALETTE[members.length % COLOR_PALETTE.length];
    const { error } = await supabase.from("brand_team_members").insert({
      brand,
      name: name.trim(),
      role: role.trim() || null,
      color,
    });
    if (error) toast.error("שגיאה בהוספה");
    else {
      setName("");
      setRole("");
      toast.success("איש צוות נוסף");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את איש הצוות? המשימות שלו לא יימחקו.")) return;
    const { error } = await supabase.from("brand_team_members").delete().eq("id", id);
    if (error) toast.error("שגיאה במחיקה");
    else toast.success("איש הצוות נמחק");
  };

  const startEdit = (m: BrandTeamMemberRow) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditRole(m.role || "");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    const { error } = await supabase
      .from("brand_team_members")
      .update({ name: editName.trim(), role: editRole.trim() || null })
      .eq("id", editingId);
    if (error) toast.error("שגיאה בעדכון");
    else {
      setEditingId(null);
      toast.success("עודכן");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>ניהול צוות</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <Label className="text-xs">הוספת איש צוות חדש</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="שם"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9"
              />
              <Input
                placeholder="תפקיד (אופציונלי)"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-9"
              />
            </div>
            <Button size="sm" onClick={handleAdd} className="w-full">
              <Plus className="size-4" /> הוספה
            </Button>
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {members.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6">
                אין אנשי צוות עדיין
              </div>
            )}
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5">
                <span
                  className="size-7 rounded-full grid place-items-center text-xs font-bold text-white shrink-0"
                  style={{ background: m.color || "var(--brand-lore)" }}
                >
                  {m.name.charAt(0)}
                </span>
                {editingId === m.id ? (
                  <>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                    <Input value={editRole} onChange={(e) => setEditRole(e.target.value)} className="h-8 w-28" placeholder="תפקיד" />
                    <Button size="icon" variant="ghost" className="size-7" onClick={saveEdit}>
                      <Check className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditingId(null)}>
                      <X className="size-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      {m.role && <div className="text-xs text-muted-foreground truncate">{m.role}</div>}
                    </div>
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => startEdit(m)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
