import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  type TaskPriority,
  type TaskStatus,
  type TaskRow,
  type BrandTeamMemberRow,
  useTaskChecklist,
} from "@/hooks/use-tasks";
import type { Brand } from "@/lib/brand";
import { useEvents } from "@/hooks/use-crm";
import { Plus, Trash2, X, Calendar as CalIcon } from "lucide-react";
import { formatDateIL } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: Brand;
  task?: TaskRow | null;
  members: BrandTeamMemberRow[];
  initialAssigneeIds?: string[];
  onSaved?: () => void;
}

export function TaskDialog({
  open,
  onOpenChange,
  brand,
  task,
  members,
  initialAssigneeIds = [],
  onSaved,
}: Props) {
  const isEdit = !!task;
  const { data: events } = useEvents(brand);
  const { data: checklist, refresh: refreshChecklist } = useTaskChecklist(task?.id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [eventId, setEventId] = useState<string>("none");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.due_date || "");
      setEventId(task.event_id || "none");
      setAssigneeIds(initialAssigneeIds);
    } else {
      setTitle("");
      setDescription("");
      setStatus("todo");
      setPriority("medium");
      setDueDate("");
      setEventId("none");
      setAssigneeIds([]);
      setNewChecklistText("");
    }
  }, [open, task, initialAssigneeIds]);

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const addChecklistItem = async () => {
    if (!task || !newChecklistText.trim()) return;
    const { error } = await supabase.from("task_checklist").insert({
      task_id: task.id,
      text: newChecklistText.trim(),
      position: checklist.length,
    });
    if (error) toast.error("שגיאה בהוספת תת-משימה");
    else {
      setNewChecklistText("");
      refreshChecklist();
    }
  };

  const toggleChecklistItem = async (id: string, current: boolean) => {
    await supabase.from("task_checklist").update({ is_done: !current }).eq("id", id);
    refreshChecklist();
  };

  const deleteChecklistItem = async (id: string) => {
    await supabase.from("task_checklist").delete().eq("id", id);
    refreshChecklist();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("יש להזין כותרת");
      return;
    }
    setSaving(true);

    const payload = {
      brand,
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      due_date: dueDate || null,
      event_id: eventId === "none" ? null : eventId,
      completed_at: status === "done" ? new Date().toISOString() : null,
    };

    let taskId = task?.id;

    if (isEdit && task) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
      if (error) {
        toast.error("שגיאה בעדכון משימה");
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("tasks")
        .insert(payload)
        .select("id")
        .single();
      if (error || !data) {
        toast.error("שגיאה ביצירת משימה");
        setSaving(false);
        return;
      }
      taskId = data.id;
    }

    if (taskId) {
      await supabase.from("task_assignees").delete().eq("task_id", taskId);
      if (assigneeIds.length > 0) {
        await supabase.from("task_assignees").insert(
          assigneeIds.map((member_id) => ({ task_id: taskId!, member_id })),
        );
      }
    }

    toast.success(isEdit ? "המשימה עודכנה" : "המשימה נוצרה");
    setSaving(false);
    onSaved?.();
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm("למחוק את המשימה?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) toast.error("שגיאה במחיקה");
    else {
      toast.success("המשימה נמחקה");
      onSaved?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "עריכת משימה" : "משימה חדשה"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>כותרת *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: הכנת חוזה ליעקב" />
          </div>

          <div className="space-y-1.5">
            <Label>תיאור</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="פרטים נוספים..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>סטטוס</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>עדיפות</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><CalIcon className="size-3.5" /> דד-ליין</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>אירוע מקושר (אופציונלי)</Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger><SelectValue placeholder="ללא" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא</SelectItem>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.event_name} ({formatDateIL(e.event_date)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>אחראים</Label>
            {members.length === 0 ? (
              <div className="text-xs text-muted-foreground border border-dashed rounded-md px-3 py-3 text-center">
                אין אנשי צוות שמורים. הוסף/י בעמוד הראשי של ניהול המשימות.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const active = assigneeIds.includes(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleAssignee(m.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      <span
                        className="size-4 rounded-full grid place-items-center text-[9px] font-bold text-white"
                        style={{ background: m.color || "var(--brand-lore)" }}
                      >
                        {m.name.charAt(0)}
                      </span>
                      {m.name}
                      {active && <X className="size-3" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {isEdit && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <Label>תתי-משימות</Label>
              <div className="space-y-1.5">
                {checklist.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={c.is_done}
                      onCheckedChange={() => toggleChecklistItem(c.id, c.is_done)}
                    />
                    <span className={c.is_done ? "line-through text-muted-foreground flex-1" : "flex-1"}>
                      {c.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteChecklistItem(c.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="תת-משימה חדשה..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addChecklistItem();
                    }
                  }}
                  className="h-8"
                />
                <Button type="button" size="sm" variant="outline" onClick={addChecklistItem}>
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row-reverse sm:flex-row-reverse gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "שומר..." : isEdit ? "שמירה" : "יצירה"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          {isEdit && (
            <Button variant="ghost" className="text-destructive me-auto" onClick={handleDelete}>
              <Trash2 className="size-4" /> מחיקה
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
