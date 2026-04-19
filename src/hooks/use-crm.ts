import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type TeamRow = Database["public"]["Tables"]["event_team"]["Row"];
export type ChecklistRow = Database["public"]["Tables"]["event_checklist"]["Row"];
export type FileRow = Database["public"]["Tables"]["event_files"]["Row"];
export type Brand = Database["public"]["Enums"]["brand"];

export function useEvents(brand?: Brand) {
  const [data, setData] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let q = supabase.from("events").select("*").order("event_date", { ascending: true });
    if (brand) q = q.eq("brand", brand);
    const { data, error } = await q;
    if (!error) setData(data || []);
    setLoading(false);
  }, [brand]);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel(`events-${brand || "all"}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refresh, brand]);

  return { data, loading, refresh };
}

export function useClients(brand?: Brand) {
  const [data, setData] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let q = supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (brand) q = q.eq("brand", brand);
    const { data, error } = await q;
    if (!error) setData(data || []);
    setLoading(false);
  }, [brand]);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel(`clients-${brand || "all"}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refresh, brand]);

  return { data, loading, refresh };
}

export function useEventTeam(eventId: string | undefined) {
  const [data, setData] = useState<TeamRow[]>([]);
  const refresh = useCallback(async () => {
    if (!eventId) return;
    const { data } = await supabase.from("event_team").select("*").eq("event_id", eventId);
    setData(data || []);
  }, [eventId]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { data, refresh };
}

export function useChecklist(eventId: string | undefined) {
  const [data, setData] = useState<ChecklistRow[]>([]);
  const refresh = useCallback(async () => {
    if (!eventId) return;
    const { data } = await supabase
      .from("event_checklist")
      .select("*")
      .eq("event_id", eventId)
      .order("position", { ascending: true });
    setData(data || []);
  }, [eventId]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { data, refresh };
}

export function useEventFiles(eventId: string | undefined) {
  const [data, setData] = useState<FileRow[]>([]);
  const refresh = useCallback(async () => {
    if (!eventId) return;
    const { data } = await supabase
      .from("event_files")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    setData(data || []);
  }, [eventId]);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { data, refresh };
}
