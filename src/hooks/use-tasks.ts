import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskAssigneeRow = Database["public"]["Tables"]["task_assignees"]["Row"];
export type TaskChecklistRow = Database["public"]["Tables"]["task_checklist"]["Row"];
export type BrandTeamMemberRow = Database["public"]["Tables"]["brand_team_members"]["Row"];
export type Brand = Database["public"]["Enums"]["brand"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];

export function useTasks(brand: Brand) {
  const [data, setData] = useState<TaskRow[]>([]);
  const [assignees, setAssignees] = useState<TaskAssigneeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [{ data: tasks }, { data: assg }] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("brand", brand)
        .order("position", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("task_assignees").select("*"),
    ]);
    setData(tasks || []);
    setAssignees(assg || []);
    setLoading(false);
  }, [brand]);

  useEffect(() => {
    refresh();
    const suffix = Math.random().toString(36).slice(2);
    const ch = supabase
      .channel(`tasks-${brand}-${suffix}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_assignees" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refresh, brand]);

  return { data, assignees, loading, refresh };
}

export function useBrandTeamMembers(brand: Brand) {
  const [data, setData] = useState<BrandTeamMemberRow[]>([]);
  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("brand_team_members")
      .select("*")
      .eq("brand", brand)
      .order("name", { ascending: true });
    setData(data || []);
  }, [brand]);

  useEffect(() => {
    refresh();
    const suffix = Math.random().toString(36).slice(2);
    const ch = supabase
      .channel(`brand-team-${brand}-${suffix}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brand_team_members" },
        refresh,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refresh, brand]);

  return { data, refresh };
}

export function useTaskChecklist(taskId: string | undefined) {
  const [data, setData] = useState<TaskChecklistRow[]>([]);
  const refresh = useCallback(async () => {
    if (!taskId) {
      setData([]);
      return;
    }
    const { data } = await supabase
      .from("task_checklist")
      .select("*")
      .eq("task_id", taskId)
      .order("position", { ascending: true });
    setData(data || []);
  }, [taskId]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { data, refresh };
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "לביצוע",
  in_progress: "בתהליך",
  done: "הושלם",
};

export const TASK_STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "done"];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
  urgent: "דחופה",
};

export const TASK_PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-info/15 text-info-foreground border-info/30",
  high: "bg-warning/15 text-warning-foreground border-warning/30",
  urgent: "bg-destructive/15 text-destructive border-destructive/30",
};
