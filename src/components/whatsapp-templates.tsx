import { useMemo, useState } from "react";
import type { ClientRow, EventRow } from "@/hooks/use-crm";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Copy, Check } from "lucide-react";
import { formatDateIL, formatILS } from "@/lib/format";
import { BRANDS } from "@/lib/brand";

interface Props {
  client: ClientRow;
  events: EventRow[];
}

interface Template {
  id: string;
  label: string;
  build: (ctx: TemplateContext) => string;
  needsEvent?: boolean;
}

interface TemplateContext {
  client: ClientRow;
  event?: EventRow;
  brandName: string;
}

const TEMPLATES: Template[] = [
  {
    id: "thanks_inquiry",
    label: "תודה על הפנייה",
    build: ({ client, brandName }) =>
      `היי ${client.name} 😊
תודה רבה על הפנייה ל-${brandName}!
אשמח לדבר ולהבין מה אתם מחפשים. מתי נוח לכם לשיחה קצרה?`,
  },
  {
    id: "deposit_request",
    label: "בקשת מקדמה",
    needsEvent: true,
    build: ({ client, event, brandName }) => {
      const deposit = Number(event?.deposit || 0);
      return `היי ${client.name} 😊
שמחתי לסגור איתכם על האירוע ב-${event ? formatDateIL(event.event_date) : ""}!
כדי לשריין את התאריך, צריך לקבל מקדמה של ${formatILS(deposit || 0)}.
אפשר להעביר ל:
• ביט / פייבוקס: 
• העברה בנקאית: 

תודה!
${brandName}`;
    },
  },
  {
    id: "balance_request",
    label: "בקשת תשלום יתרה",
    needsEvent: true,
    build: ({ client, event, brandName }) => {
      const remaining = event
        ? Math.max(0, Number(event.total_price || 0) - Number(event.paid_amount || 0))
        : 0;
      return `היי ${client.name} 😊
מקווה שאתם נהנים מהתמונות!
נשארה יתרה של ${formatILS(remaining)} לסגירת החשבון על האירוע.
אשמח לקבל בהקדם — תודה!
${brandName}`;
    },
  },
  {
    id: "day_before",
    label: "יום לפני האירוע",
    needsEvent: true,
    build: ({ client, event }) => {
      return `היי ${client.name} 😊
מתרגשים לקראת מחר! 🎉
${event?.location ? `נפגשים ב-${event.location}` : ""}
אם משהו השתנה בלוז או בנקודת המפגש — עדכנו אותי.
נתראה!`;
    },
  },
  {
    id: "gallery_ready",
    label: "גלריה מוכנה",
    needsEvent: true,
    build: ({ client, brandName }) =>
      `היי ${client.name} 🎉
הגלריה שלכם מוכנה! 📸
קישור: 

קחו את הזמן לבחור את התמונות לאלבום. אם יש שאלות אני כאן.
תהנו!
${brandName}`,
  },
  {
    id: "album_selection_reminder",
    label: "תזכורת בחירת תמונות",
    needsEvent: true,
    build: ({ client, brandName }) =>
      `היי ${client.name} 😊
רק תזכורת קטנה — מחכים לבחירת התמונות שלכם לאלבום.
ברגע שתסיימו, נכנס מיד לעבודה על העיצוב.
תודה!
${brandName}`,
  },
  {
    id: "anniversary",
    label: "יום נישואין",
    needsEvent: true,
    build: ({ client, event }) => {
      return `היי ${client.name} 💕
שנה (או יותר) חלפה מאז ${event ? formatDateIL(event.event_date) : "החתונה"}!
מאחלים לכם המון אהבה ואושר 🥂
תודה שבחרתם בנו לתעד את הרגעים שלכם.`;
    },
  },
];

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("0")) p = "972" + p.slice(1);
  else if (!p.startsWith("972")) p = "972" + p;
  return p;
}

export function WhatsAppTemplates({ client, events }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(TEMPLATES[0].id);
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || "");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const phone = normalizePhone(client.phone);

  const event = useMemo(
    () => events.find((e) => e.id === selectedEventId),
    [events, selectedEventId],
  );

  const openWith = (templateId: string) => {
    const tpl = TEMPLATES.find((t) => t.id === templateId)!;
    setSelectedId(templateId);
    const ctx: TemplateContext = {
      client,
      event,
      brandName: BRANDS[client.brand].name,
    };
    setText(tpl.build(ctx));
    setOpen(true);
    setCopied(false);
  };

  const rebuild = (templateId: string, eventId: string) => {
    const tpl = TEMPLATES.find((t) => t.id === templateId)!;
    const ev = events.find((e) => e.id === eventId);
    setText(
      tpl.build({
        client,
        event: ev,
        brandName: BRANDS[client.brand].name,
      }),
    );
  };

  const sendToWhatsApp = () => {
    if (!phone) return;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!client.phone) {
    return null;
  }

  return (
    <>
      <div className="rounded-xl border bg-card p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-8 rounded-lg grid place-items-center bg-success/10">
            <MessageCircle className="size-4 text-success" />
          </div>
          <h3 className="font-semibold text-sm">הודעות וואטסאפ מהירות</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant="outline"
              onClick={() => openWith(t.id)}
              disabled={t.needsEvent && events.length === 0}
              className="text-xs h-8"
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="size-5 text-success" />
              שליחת הודעה ל-{client.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">תבנית</label>
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  rebuild(e.target.value, selectedEventId);
                }}
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            {events.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">אירוע (לטמפלטים שדורשים פרטים)</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    rebuild(selectedId, e.target.value);
                  }}
                  className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.event_name} • {formatDateIL(e.event_date)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">תוכן ההודעה (ניתן לערוך)</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={10}
                className="text-sm"
                dir="rtl"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={copy} size="sm">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "הועתק" : "העתק"}
              </Button>
              <Button onClick={sendToWhatsApp} className="bg-success hover:bg-success/90 text-white" size="sm">
                <MessageCircle className="size-4" />
                שלח בוואטסאפ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
