import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface EventNote {
  id: string;
  event_id: string;
  content: string;
  created_at: string;
  created_by: string | null;
}

interface Props {
  eventId: string;
}

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  timeZone: "Asia/Jerusalem",
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function EventNotesLog({ eventId }: Props) {
  const [notes, setNotes] = useState<EventNote[]>([]);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("event_notes" as never)
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (!error) setNotes((data as EventNote[]) || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel(`event-notes-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_notes", filter: `event_id=eq.${eventId}` },
        refresh,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId, refresh]);

  const submit = async () => {
    const text = content.trim();
    if (!text) return;
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("event_notes" as never)
      .insert({ event_id: eventId, content: text, created_by: auth.user?.id ?? null } as never);
    setSaving(false);
    if (error) {
      toast.error("שגיאה בשמירת ההערה");
      return;
    }
    setContent("");
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("למחוק את ההערה?")) return;
    const { error } = await supabase.from("event_notes" as never).delete().eq("id", id);
    if (error) {
      toast.error("שגיאה במחיקת ההערה");
      return;
    }
    toast.success("ההערה נמחקה");
    refresh();
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="size-8 rounded-lg grid place-items-center bg-info/10">
          <MessageSquare className="size-4 text-info" />
        </div>
        <h3 className="font-semibold">יומן הערות פנימי</h3>
        <span className="text-xs text-muted-foreground">({notes.length})</span>
      </div>

      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="הוסף הערה — מה דובר, מה הוחלט, מה צריך לזכור..."
          rows={3}
          className="resize-none text-sm"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            ⌘/Ctrl + Enter לשליחה מהירה
          </span>
          <Button
            size="sm"
            onClick={submit}
            disabled={saving || !content.trim()}
            className="gap-1.5"
          >
            <Send className="size-3.5" />
            {saving ? "שומר..." : "הוסף הערה"}
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="text-center py-4 text-xs text-muted-foreground">טוען...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
            אין הערות עדיין. ההערות יישמרו עם תאריך ושעה.
          </div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className="rounded-lg border bg-muted/30 p-3 group hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-muted-foreground stat-number mb-1">
                    {dateFormatter.format(new Date(n.created_at))}
                  </div>
                  <div className="text-sm whitespace-pre-wrap break-words">{n.content}</div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(n.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="מחק הערה"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
