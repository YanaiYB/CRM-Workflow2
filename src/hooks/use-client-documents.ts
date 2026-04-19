import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ClientDocumentRow = {
  id: string;
  client_id: string;
  event_id: string | null;
  brand: "lore_weddings" | "depth_studios";
  morning_doc_id: string;
  doc_number: string | null;
  doc_type: "invoice" | "receipt" | "invoice_receipt" | "tax_invoice_receipt" | "proforma" | "credit_invoice";
  amount: number;
  currency: string;
  pdf_url: string | null;
  issue_date: string;
  client_email: string | null;
  created_at: string;
  status?: string | null;
  paid_amount?: number | null;
  last_synced_at?: string | null;
  // Extended fields
  language?: string | null;
  due_date?: string | null;
  payment_method?: string | null;
  payment_details?: Record<string, unknown> | null;
  notes?: string | null;
  discount?: number | null;
  email_subject?: string | null;
  email_body?: string | null;
};

export function useClientDocuments(clientId: string | undefined) {
  const [data, setData] = useState<ClientDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!clientId) {
      setData([]);
      setLoading(false);
      return;
    }
    const { data: rows } = await supabase
      .from("client_documents" as never)
      .select("*")
      .eq("client_id", clientId)
      .order("issue_date", { ascending: false });
    setData((rows as ClientDocumentRow[] | null) || []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}

export function useEventDocuments(eventId: string | undefined) {
  const [data, setData] = useState<ClientDocumentRow[]>([]);

  const refresh = useCallback(async () => {
    if (!eventId) {
      setData([]);
      return;
    }
    const { data: rows } = await supabase
      .from("client_documents" as never)
      .select("*")
      .eq("event_id", eventId)
      .order("issue_date", { ascending: false });
    setData((rows as ClientDocumentRow[] | null) || []);
  }, [eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, refresh };
}

export const DOC_TYPE_LABELS: Record<ClientDocumentRow["doc_type"], string> = {
  invoice: "חשבונית מס",
  tax_invoice_receipt: "חשבונית מס/קבלה",
  invoice_receipt: "חשבונית",
  receipt: "קבלה",
  proforma: "הצעת מחיר",
  credit_invoice: "חשבונית זיכוי",
};
