import { supabase } from "@/integrations/supabase/client";
import { formatILS, formatDateIL } from "@/lib/format";
import {
  STATUS_LABELS,
  WEDDING_EVENT_TYPE_LABELS,
  ROLE_LABELS,
  type Brand,
} from "@/lib/brand";
import type { EventRow, ClientRow } from "@/hooks/use-crm";

function escapeHtml(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function generateUpcomingEventsPdf(
  brand: Brand,
  brandName: string,
  brandColor: string,
  upcomingEvents: EventRow[],
) {
  if (upcomingEvents.length === 0) return;

  const eventIds = upcomingEvents.map((e) => e.id);
  const clientIds = Array.from(
    new Set(upcomingEvents.map((e) => e.client_id).filter((x): x is string => !!x)),
  );

  const [clientsRes, teamRes, checklistRes, filesRes] = await Promise.all([
    clientIds.length
      ? supabase.from("clients").select("*").in("id", clientIds)
      : Promise.resolve({ data: [] as ClientRow[] }),
    supabase.from("event_team").select("*").in("event_id", eventIds),
    supabase
      .from("event_checklist")
      .select("*")
      .in("event_id", eventIds)
      .order("position", { ascending: true }),
    supabase.from("event_files").select("*").in("event_id", eventIds),
  ]);

  const clientMap = new Map<string, ClientRow>();
  for (const c of (clientsRes.data || []) as ClientRow[]) clientMap.set(c.id, c);

  const teamByEvent = new Map<string, Array<{ name: string; role: string; payment: number; is_paid: boolean }>>();
  for (const t of (teamRes.data || []) as Array<{
    event_id: string;
    name: string;
    role: keyof typeof ROLE_LABELS;
    payment: number;
    is_paid: boolean;
  }>) {
    if (!teamByEvent.has(t.event_id)) teamByEvent.set(t.event_id, []);
    teamByEvent.get(t.event_id)!.push({
      name: t.name,
      role: ROLE_LABELS[t.role] || String(t.role),
      payment: Number(t.payment || 0),
      is_paid: !!t.is_paid,
    });
  }

  const checklistByEvent = new Map<string, Array<{ text: string; is_done: boolean }>>();
  for (const c of (checklistRes.data || []) as Array<{
    event_id: string;
    text: string;
    is_done: boolean;
  }>) {
    if (!checklistByEvent.has(c.event_id)) checklistByEvent.set(c.event_id, []);
    checklistByEvent.get(c.event_id)!.push({ text: c.text, is_done: !!c.is_done });
  }

  const filesByEvent = new Map<string, Array<{ file_name: string; tag: string }>>();
  for (const f of (filesRes.data || []) as Array<{
    event_id: string;
    file_name: string;
    tag: string;
  }>) {
    if (!filesByEvent.has(f.event_id)) filesByEvent.set(f.event_id, []);
    filesByEvent.get(f.event_id)!.push({ file_name: f.file_name, tag: f.tag });
  }

  // Sort by date ascending
  const sorted = [...upcomingEvents].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
  );

  const totalRevenue = sorted.reduce((s, e) => s + Number(e.total_price || 0), 0);
  const totalPaid = sorted.reduce((s, e) => s + Number(e.paid_amount || 0), 0);
  const totalRemaining = totalRevenue - totalPaid;

  const generatedAt = new Date().toLocaleString("he-IL", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const eventsHtml = sorted
    .map((e, idx) => {
      const client = e.client_id ? clientMap.get(e.client_id) : undefined;
      const team = teamByEvent.get(e.id) || [];
      const checklist = checklistByEvent.get(e.id) || [];
      const files = filesByEvent.get(e.id) || [];
      const remaining = Number(e.total_price || 0) - Number(e.paid_amount || 0);
      const teamTotal = team.reduce((s, t) => s + t.payment, 0);
      const teamUnpaid = team.filter((t) => !t.is_paid).reduce((s, t) => s + t.payment, 0);

      return `
      <section class="event">
        <div class="event-head">
          <div class="event-num">${idx + 1}</div>
          <div class="event-title-block">
            <div class="event-title">${escapeHtml(e.event_name)}</div>
            <div class="event-sub">
              ${escapeHtml(formatDateIL(e.event_date))}
              ${e.event_type ? ` • ${escapeHtml(WEDDING_EVENT_TYPE_LABELS[e.event_type as "wedding" | "henna"])}` : ""}
              ${e.location ? ` • ${escapeHtml(e.location)}` : ""}
            </div>
          </div>
          <div class="event-status">
            <span class="badge">${escapeHtml(STATUS_LABELS[e.status])}</span>
          </div>
        </div>

        <div class="grid">
          <div class="cell">
            <div class="cell-label">לקוח</div>
            <div class="cell-value">${escapeHtml(client?.name || "—")}</div>
            ${client?.phone ? `<div class="cell-meta">📞 ${escapeHtml(client.phone)}</div>` : ""}
            ${client?.email ? `<div class="cell-meta">✉ ${escapeHtml(client.email)}</div>` : ""}
            ${client?.instagram ? `<div class="cell-meta">📷 ${escapeHtml(client.instagram)}</div>` : ""}
          </div>
          <div class="cell">
            <div class="cell-label">חבילה</div>
            <div class="cell-value">${escapeHtml(e.package_details || "—")}</div>
          </div>
          <div class="cell money">
            <div class="cell-label">תשלומים</div>
            <div class="money-row"><span>מחיר כולל</span><strong>${escapeHtml(formatILS(e.total_price))}</strong></div>
            <div class="money-row"><span>מקדמה</span><span>${escapeHtml(formatILS(e.deposit))}</span></div>
            <div class="money-row"><span>שולם</span><span>${escapeHtml(formatILS(e.paid_amount))}</span></div>
            <div class="money-row total ${remaining > 0 ? "warn" : "ok"}">
              <span>${remaining > 0 ? "יתרה לתשלום" : "שולם במלואו"}</span>
              <strong>${escapeHtml(formatILS(Math.max(0, remaining)))}</strong>
            </div>
          </div>
        </div>

        ${
          team.length
            ? `
        <div class="block">
          <div class="block-title">צוות (${team.length})</div>
          <table class="t">
            <thead><tr><th>שם</th><th>תפקיד</th><th>תשלום</th><th>סטטוס</th></tr></thead>
            <tbody>
              ${team
                .map(
                  (t) => `
                <tr>
                  <td>${escapeHtml(t.name)}</td>
                  <td>${escapeHtml(t.role)}</td>
                  <td>${escapeHtml(formatILS(t.payment))}</td>
                  <td>${t.is_paid ? '<span class="ok-text">שולם</span>' : '<span class="warn-text">לא שולם</span>'}</td>
                </tr>`,
                )
                .join("")}
              <tr class="sum">
                <td colspan="2">סה״כ עלות צוות</td>
                <td>${escapeHtml(formatILS(teamTotal))}</td>
                <td>${teamUnpaid > 0 ? `חוב: ${escapeHtml(formatILS(teamUnpaid))}` : "הכל שולם"}</td>
              </tr>
            </tbody>
          </table>
        </div>`
            : ""
        }

        ${
          checklist.length
            ? `
        <div class="block">
          <div class="block-title">משימות (${checklist.filter((c) => c.is_done).length}/${checklist.length})</div>
          <ul class="checklist">
            ${checklist
              .map(
                (c) => `<li class="${c.is_done ? "done" : ""}">
              <span class="chk">${c.is_done ? "☑" : "☐"}</span>
              ${escapeHtml(c.text)}
            </li>`,
              )
              .join("")}
          </ul>
        </div>`
            : ""
        }

        ${
          files.length
            ? `
        <div class="block">
          <div class="block-title">קבצים מצורפים (${files.length})</div>
          <ul class="files">
            ${files.map((f) => `<li>📎 ${escapeHtml(f.file_name)} <span class="tag">${escapeHtml(f.tag)}</span></li>`).join("")}
          </ul>
        </div>`
            : ""
        }

        ${
          e.quick_note
            ? `<div class="block note"><div class="block-title">הערה</div><div>${escapeHtml(e.quick_note)}</div></div>`
            : ""
        }
      </section>
    `;
    })
    .join("");

  const html = `<!doctype html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8" />
<title>דוח אירועים עתידיים — ${escapeHtml(brandName)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Heebo', 'Assistant', 'Arial Hebrew', Arial, sans-serif;
    color: #1a1a1a;
    background: #fff;
    direction: rtl;
    font-size: 11pt;
    line-height: 1.45;
  }
  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 0 14px;
    border-bottom: 3px solid ${brandColor};
    margin-bottom: 18px;
  }
  .header-title { font-size: 20pt; font-weight: 800; color: ${brandColor}; letter-spacing: -0.3px; }
  .header-sub { font-size: 9.5pt; color: #666; margin-top: 2px; }
  .header-meta { text-align: left; font-size: 9pt; color: #777; }

  .summary {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
    margin-bottom: 22px;
  }
  .summary-card {
    border: 1px solid #e5e5e5; border-radius: 10px; padding: 10px 12px;
    background: #fafafa;
  }
  .summary-label { font-size: 8.5pt; color: #777; text-transform: uppercase; letter-spacing: 0.5px; }
  .summary-value { font-size: 14pt; font-weight: 700; margin-top: 3px; color: #111; }
  .summary-card.accent { background: ${brandColor}10; border-color: ${brandColor}40; }
  .summary-card.accent .summary-value { color: ${brandColor}; }

  .event {
    border: 1px solid #e2e2e2;
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 14px;
    page-break-inside: avoid;
    background: #fff;
  }
  .event-head {
    display: flex; align-items: center; gap: 12px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #e5e5e5;
    margin-bottom: 10px;
  }
  .event-num {
    background: ${brandColor};
    color: #fff;
    width: 32px; height: 32px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 11pt;
    flex-shrink: 0;
  }
  .event-title-block { flex: 1; min-width: 0; }
  .event-title { font-size: 13pt; font-weight: 700; color: #111; }
  .event-sub { font-size: 9.5pt; color: #666; margin-top: 2px; }
  .event-status { display: flex; gap: 6px; flex-wrap: wrap; }

  .badge {
    display: inline-block; padding: 3px 9px; border-radius: 999px;
    font-size: 8.5pt; font-weight: 600;
    background: ${brandColor}; color: #fff;
  }
  .badge-soft { background: #eee; color: #444; }

  .grid {
    display: grid; grid-template-columns: 1fr 1fr 1.1fr; gap: 10px;
    margin-bottom: 10px;
  }
  .cell {
    border: 1px solid #eee; border-radius: 8px; padding: 8px 10px;
    background: #fafafa;
  }
  .cell-label { font-size: 8.5pt; color: #888; font-weight: 600; margin-bottom: 3px; }
  .cell-value { font-size: 10.5pt; font-weight: 600; color: #111; }
  .cell-meta { font-size: 9pt; color: #555; margin-top: 2px; }
  .cell.money { background: #fff; }
  .money-row { display: flex; justify-content: space-between; font-size: 9.5pt; padding: 2px 0; }
  .money-row.total { border-top: 1px solid #ddd; margin-top: 4px; padding-top: 5px; font-weight: 700; }
  .money-row.total.warn { color: #b85c00; }
  .money-row.total.ok { color: #137a3b; }

  .block { margin-top: 8px; }
  .block-title { font-size: 9.5pt; font-weight: 700; color: #555; margin-bottom: 5px; }
  .block.note { background: #fffbeb; border: 1px solid #fde68a; padding: 8px 10px; border-radius: 8px; }

  table.t { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  table.t th, table.t td { padding: 5px 8px; text-align: right; border-bottom: 1px solid #eee; }
  table.t th { background: #f5f5f5; font-weight: 600; color: #555; font-size: 9pt; }
  table.t tr.sum td { font-weight: 700; background: #fafafa; border-top: 1px solid #ddd; border-bottom: none; }
  .ok-text { color: #137a3b; font-weight: 600; }
  .warn-text { color: #b85c00; font-weight: 600; }

  .checklist { list-style: none; padding: 0; margin: 0; columns: 2; column-gap: 14px; font-size: 9.5pt; }
  .checklist li { break-inside: avoid; padding: 2px 0; }
  .checklist li.done { color: #888; text-decoration: line-through; }
  .chk { display: inline-block; width: 14px; }

  .files { list-style: none; padding: 0; margin: 0; font-size: 9.5pt; }
  .files li { padding: 2px 0; }
  .tag { font-size: 8pt; background: #eee; padding: 1px 6px; border-radius: 4px; color: #666; margin-right: 4px; }

  .footer {
    margin-top: 20px;
    padding-top: 10px;
    border-top: 1px solid #eee;
    text-align: center;
    font-size: 8.5pt;
    color: #999;
  }

  @media print {
    .no-print { display: none !important; }
  }
  .toolbar {
    position: fixed; top: 12px; left: 12px;
    display: flex; gap: 8px; z-index: 1000;
  }
  .toolbar button {
    background: ${brandColor}; color: #fff; border: none;
    padding: 10px 18px; border-radius: 8px; font-weight: 600;
    cursor: pointer; font-size: 10pt; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    font-family: inherit;
  }
  .toolbar button.ghost { background: #444; }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button onclick="window.print()">📥 שמור כ-PDF</button>
    <button class="ghost" onclick="window.close()">סגור</button>
  </div>

  <div class="header">
    <div>
      <div class="header-title">${escapeHtml(brandName)}</div>
      <div class="header-sub">דוח אירועים עתידיים</div>
    </div>
    <div class="header-meta">
      הופק: ${escapeHtml(generatedAt)}<br/>
      ${sorted.length} אירועים
    </div>
  </div>

  <div class="summary">
    <div class="summary-card accent">
      <div class="summary-label">סה״כ אירועים</div>
      <div class="summary-value">${sorted.length}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">הכנסה צפויה</div>
      <div class="summary-value">${escapeHtml(formatILS(totalRevenue))}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">שולם עד כה</div>
      <div class="summary-value">${escapeHtml(formatILS(totalPaid))}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">יתרה לקבל</div>
      <div class="summary-value">${escapeHtml(formatILS(totalRemaining))}</div>
    </div>
  </div>

  ${eventsHtml}

  <div class="footer">
    הופק אוטומטית ממערכת ניהול האירועים — ${escapeHtml(brandName)} • ${escapeHtml(generatedAt)}
  </div>

  <script>
    // Auto-trigger print dialog after layout settles
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 600);
    });
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("חלון קופץ נחסם — אנא אפשר חלונות קופצים ונסה שוב");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
