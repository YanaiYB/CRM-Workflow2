import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRAND_LIST, CHECKLIST_TEMPLATES, WEDDING_EVENT_TYPE_LABELS, type Brand, type WeddingEventType } from "@/lib/brand";
import { LEAD_SOURCE_LABELS, LEAD_SOURCE_LIST, type LeadSource } from "@/lib/lead-source";
import { useClients } from "@/hooks/use-crm";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultBrand?: Brand;
  onCreated?: (eventId: string) => void;
}

type MagnetType = "none" | "selfie" | "regular";

interface WeddingPackage {
  photographers: number;
  reel: boolean;
  clip: boolean;
  longFilm: boolean;
  longFilmMinutes: number;
  magnets: MagnetType;
  album: boolean;
  parentsAlbums: number;
  note: string;
}

const DEFAULT_PACKAGE: WeddingPackage = {
  photographers: 1,
  reel: false,
  clip: false,
  longFilm: false,
  longFilmMinutes: 0,
  magnets: "none",
  album: false,
  parentsAlbums: 0,
  note: "",
};

function serializeWeddingPackage(p: WeddingPackage): string {
  const parts: string[] = [];
  parts.push(`${p.photographers} צלמים`);
  if (p.reel) parts.push("ריל");
  if (p.clip) parts.push("קליפ");
  if (p.longFilm) {
    parts.push(p.longFilmMinutes > 0 ? `סרט ארוך (${p.longFilmMinutes} דק׳)` : "סרט ארוך");
  }
  if (p.magnets === "selfie") parts.push("עמדת סלפי");
  else if (p.magnets === "regular") parts.push("מגנטים");
  if (p.album) parts.push("אלבום");
  if (p.parentsAlbums > 0) parts.push(`${p.parentsAlbums} אלבומי הורים`);
  let result = parts.join(" • ");
  if (p.note.trim()) result += ` | ${p.note.trim()}`;
  return result;
}

function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-8 w-8"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        className="h-8 w-14 text-center"
      />
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-8 w-8"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function QuickAddEvent({ open, onOpenChange, defaultBrand, onCreated }: Props) {
  const [brand, setBrand] = useState<Brand>(defaultBrand || "lore_weddings");
  const [eventType, setEventType] = useState<WeddingEventType>("wedding");
  const [eventName, setEventName] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [packageDetails, setPackageDetails] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientLeadSource, setNewClientLeadSource] = useState<LeadSource | "">("");
  const [newClientReferredBy, setNewClientReferredBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [pkg, setPkg] = useState<WeddingPackage>(DEFAULT_PACKAGE);

  const { data: clients } = useClients(brand);

  useEffect(() => {
    if (defaultBrand) setBrand(defaultBrand);
  }, [defaultBrand, open]);

  useEffect(() => {
    if (!open) {
      setEventName("");
      setLocation("");
      setEventDate("");
      setPackageDetails("");
      setTotalPrice("");
      setClientId("");
      setNewClientName("");
      setNewClientLeadSource("");
      setNewClientReferredBy("");
      setEventType("wedding");
      setPkg(DEFAULT_PACKAGE);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate) {
      toast.error("יש למלא שם אירוע ותאריך");
      return;
    }
    setSaving(true);
    try {
      let finalClientId: string | null = clientId || null;

      if (!finalClientId && newClientName.trim()) {
        const { data: c, error: ce } = await supabase
          .from("clients")
          .insert({
            name: newClientName.trim(),
            brand,
            lead_source: newClientLeadSource || null,
            referred_by:
              newClientLeadSource === "referral" && newClientReferredBy.trim()
                ? newClientReferredBy.trim()
                : null,
          } as never)
          .select()
          .single();
        if (ce) throw ce;
        finalClientId = c.id;
      }

      const finalPackage =
        brand === "lore_weddings" ? serializeWeddingPackage(pkg) : packageDetails;

      const { data: ev, error } = await supabase
        .from("events")
        .insert({
          brand,
          event_name: eventName.trim(),
          event_date: eventDate,
          package_details: finalPackage || null,
          total_price: Number(totalPrice) || 0,
          client_id: finalClientId,
          event_type: brand === "lore_weddings" ? eventType : null,
          location: brand === "lore_weddings" && location.trim() ? location.trim() : null,
          parents_albums_count: brand === "lore_weddings" ? pkg.parentsAlbums : 0,
        } as never)
        .select()
        .single();

      if (error) throw error;

      // Seed checklist from template
      const items = CHECKLIST_TEMPLATES[brand].map((text, i) => ({
        event_id: ev.id,
        text,
        position: i,
      }));
      await supabase.from("event_checklist").insert(items);

      toast.success("האירוע נוצר בהצלחה");
      onOpenChange(false);
      onCreated?.(ev.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה ביצירת אירוע");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">אירוע חדש</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!defaultBrand && (
            <div className="space-y-1.5">
              <Label>מותג</Label>
              <Select value={brand} onValueChange={(v) => setBrand(v as Brand)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRAND_LIST.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {brand === "lore_weddings" && (
            <div className="space-y-1.5">
              <Label>סוג אירוע</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["wedding", "henna"] as WeddingEventType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEventType(t)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      eventType === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {WEDDING_EVENT_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>
              {brand === "depth_studios"
                ? "שם העסק"
                : eventType === "henna"
                  ? "שם החינה / זוג"
                  : "שם החתונה / זוג"}
            </Label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder={brand === "depth_studios" ? "שם העסק / מותג הלקוח" : "חתונה של רון ומיכל"}
              required
            />
          </div>

          {brand === "lore_weddings" && (
            <div className="space-y-1.5">
              <Label>מיקום</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="שם האולם / כתובת"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>תאריך</Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>מחיר (₪)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {brand === "lore_weddings" ? (
            <div className="space-y-2 rounded-lg border p-3">
              <Label className="text-sm font-semibold">חבילה</Label>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm">צלמים</span>
                <NumberStepper
                  value={pkg.photographers}
                  onChange={(n) => setPkg({ ...pkg, photographers: n })}
                  min={1}
                  max={20}
                />
              </div>

              <div className="flex items-center justify-between py-1.5 border-t">
                <span className="text-sm">ריל</span>
                <Switch
                  checked={pkg.reel}
                  onCheckedChange={(v) => setPkg({ ...pkg, reel: v })}
                />
              </div>

              <div className="flex items-center justify-between py-1.5 border-t">
                <span className="text-sm">קליפ</span>
                <Switch
                  checked={pkg.clip}
                  onCheckedChange={(v) => setPkg({ ...pkg, clip: v })}
                />
              </div>

              <div className="border-t pt-1.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">סרט ארוך</span>
                  <Switch
                    checked={pkg.longFilm}
                    onCheckedChange={(v) => setPkg({ ...pkg, longFilm: v })}
                  />
                </div>
                {pkg.longFilm && (
                  <div className="flex items-center justify-between pr-2">
                    <span className="text-xs text-muted-foreground">אורך (דקות)</span>
                    <NumberStepper
                      value={pkg.longFilmMinutes}
                      onChange={(n) => setPkg({ ...pkg, longFilmMinutes: n })}
                      min={0}
                      max={300}
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-1.5 space-y-1.5">
                <span className="text-sm">מגנטים</span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { v: "none", label: "אין" },
                      { v: "regular", label: "רגילים" },
                      { v: "selfie", label: "עמדת סלפי" },
                    ] as { v: MagnetType; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setPkg({ ...pkg, magnets: opt.v })}
                      className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                        pkg.magnets === opt.v
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5 border-t">
                <span className="text-sm">אלבום</span>
                <Switch
                  checked={pkg.album}
                  onCheckedChange={(v) => setPkg({ ...pkg, album: v })}
                />
              </div>

              <div className="flex items-center justify-between py-1.5 border-t">
                <span className="text-sm">אלבומי הורים</span>
                <NumberStepper
                  value={pkg.parentsAlbums}
                  onChange={(n) => setPkg({ ...pkg, parentsAlbums: n })}
                  min={0}
                  max={10}
                />
              </div>

              <div className="border-t pt-2 space-y-1">
                <Label className="text-xs">הערה נוספת</Label>
                <Textarea
                  value={pkg.note}
                  onChange={(e) => setPkg({ ...pkg, note: e.target.value })}
                  placeholder="פרטים נוספים על החבילה"
                  className="min-h-[60px]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>חבילה</Label>
              <Input
                value={packageDetails}
                onChange={(e) => setPackageDetails(e.target.value)}
                placeholder="חבילה מלאה כולל וידאו"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>לקוח</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="בחר לקוח קיים (אופציונלי)" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!clientId && (
              <div className="mt-2 space-y-2">
                <Input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="או הוסף שם לקוח חדש"
                />
                {newClientName.trim() && (
                  <>
                    <Select
                      value={newClientLeadSource}
                      onValueChange={(v) => setNewClientLeadSource(v as LeadSource)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="מקור הליד (אופציונלי)" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_SOURCE_LIST.map((s) => (
                          <SelectItem key={s} value={s}>
                            {LEAD_SOURCE_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {newClientLeadSource === "referral" && (
                      <Input
                        value={newClientReferredBy}
                        onChange={(e) => setNewClientReferredBy(e.target.value)}
                        placeholder="שם הממליץ"
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "שומר..." : "צור אירוע"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
