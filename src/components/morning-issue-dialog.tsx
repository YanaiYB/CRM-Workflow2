import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { issueMorningDocument } from "@/lib/morning.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, Trash2, FileText, ExternalLink, Eye, Download, ArrowRight, Save,
} from "lucide-react";
import { toast } from "sonner";
import type { ClientRow, EventRow } from "@/hooks/use-crm";
import { DOC_TYPE_LABELS } from "@/hooks/use-client-documents";
import { formatDateIL, formatILS } from "@/lib/format";
import { BRANDS } from "@/lib/brand";

type DocType = "tax_invoice_receipt" | "invoice" | "receipt" | "proforma" | "credit_invoice";
type Currency = "ILS" | "USD" | "EUR";
type Lang = "he" | "en";
type PaymentMethod = "transfer" | "credit" | "cash" | "check" | "bit" | "paypal";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  transfer: "העברה בנקאית",
  credit: "כרטיס אשראי",
  cash: "מזומן",
  check: "צ׳ק",
  bit: "ביט",
  paypal: "PayPal",
};

const CURRENCY_SYMBOL: Record<Currency, string> = { ILS: "₪", USD: "$", EUR: "€" };

type LineItem = {
  description: string;
  quantity: number;
  price: number;
  discount: number; // currency, applied to line gross
};

const VAT_RATE = 0.17;

export function MorningIssueDialog({
  open,
  onOpenChange,
  client,
  event,
  onIssued,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientRow;
  event?: EventRow | null;
  onIssued?: () => void;
}) {
  const issueFn = useServerFn(issueMorningDocument);

  // Document
  const [docType, setDocType] = useState<DocType>("tax_invoice_receipt");
  const [language, setLanguage] = useState<Lang>("he");
  const [currency, setCurrency] = useState<Currency>("ILS");
  const today = new Date().toISOString().slice(0, 10);
  const [issueDate, setIssueDate] = useState<string>(today);
  const [dueDate, setDueDate] = useState<string>("");

  // Client extras (editable in dialog, persist to DB on issue)
  const clientExtras = client as ClientRow & {
    tax_id?: string | null;
    address?: string | null;
    city?: string | null;
  };
  const [taxId, setTaxId] = useState<string>(clientExtras.tax_id || "");
  const [address, setAddress] = useState<string>(clientExtras.address || "");
  const [city, setCity] = useState<string>(clientExtras.city || "");

  // Items
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, price: 0, discount: 0 },
  ]);
  const [docDiscount, setDocDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  // Payment (for receipts)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transfer");
  const [cardNum, setCardNum] = useState("");
  const [checkNum, setCheckNum] = useState("");
  const [accountId, setAccountId] = useState("");

  // Email
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  const [emailTo, setEmailTo] = useState<string>(client.email || "");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailBody, setEmailBody] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "preview" | "result">("form");
  const [tab, setTab] = useState<string>("doc");
  const [result, setResult] = useState<{ docNumber: string | null; pdfUrl: string | null } | null>(null);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setStep("form");
    setTab("doc");
    setEmailTo(client.email || "");
    setSendEmail(!!client.email);
    setTaxId(clientExtras.tax_id || "");
    setAddress(clientExtras.address || "");
    setCity(clientExtras.city || "");
    setIssueDate(today);
    setDueDate("");
    setDocDiscount(0);
    setNotes("");
    setPaymentMethod("transfer");
    setCardNum("");
    setCheckNum("");
    setAccountId("");
    setEmailSubject("");
    setEmailBody("");
    if (event) {
      const remaining = Number(event.total_price) - Number(event.paid_amount);
      const amount = remaining > 0 ? remaining : Number(event.total_price);
      setItems([
        {
          description: event.package_details?.trim() || event.event_name,
          quantity: 1,
          price: amount,
          discount: 0,
        },
      ]);
    } else {
      setItems([{ description: "", quantity: 1, price: 0, discount: 0 }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client.id, event?.id]);

  const linesGross = useMemo(
    () => items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0),
    [items],
  );
  const linesDiscount = useMemo(
    () => items.reduce((s, i) => s + (Number(i.discount) || 0), 0),
    [items],
  );
  const subtotalAfterLineDiscount = linesGross - linesDiscount;
  const total = Math.max(0, subtotalAfterLineDiscount - (Number(docDiscount) || 0));
  // VAT-inclusive split
  const subtotalNoVat = total / (1 + VAT_RATE);
  const vatAmount = total - subtotalNoVat;

  const updateItem = (idx: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const addItem = () =>
    setItems((prev) => [...prev, { description: "", quantity: 1, price: 0, discount: 0 }]);

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const isReceiptType = docType === "receipt" || docType === "tax_invoice_receipt";

  const validateForm = () => {
    if (!items.length || items.some((i) => !i.description.trim() || i.price <= 0)) {
      toast.error("נא למלא תיאור ומחיר לכל שורה");
      setTab("items");
      return false;
    }
    if (sendEmail && !emailTo.trim()) {
      toast.error("נא להזין כתובת מייל");
      setTab("email");
      return false;
    }
    return true;
  };

  const goToPreview = () => {
    if (!validateForm()) return;
    setStep("preview");
  };

  const persistClientExtras = async () => {
    // Save tax_id/address/city back to client record if changed
    const changed =
      (taxId || "") !== (clientExtras.tax_id || "") ||
      (address || "") !== (clientExtras.address || "") ||
      (city || "") !== (clientExtras.city || "");
    if (!changed) return;
    await supabase
      .from("clients")
      .update({
        tax_id: taxId || null,
        address: address || null,
        city: city || null,
      } as never)
      .eq("id", client.id);
  };

  const handleIssue = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await persistClientExtras();
      const res = await issueFn({
        data: {
          clientId: client.id,
          eventId: event?.id || null,
          docType,
          items: items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            price: i.price,
            discount: i.discount || 0,
          })),
          sendEmail,
          emailTo: sendEmail ? emailTo.trim() : null,
          emailSubject: sendEmail && emailSubject ? emailSubject : null,
          emailBody: sendEmail && emailBody ? emailBody : null,
          language,
          currency,
          issueDate,
          dueDate: dueDate || null,
          notes: notes || null,
          docDiscount: Number(docDiscount) || 0,
          payment: isReceiptType
            ? {
                method: paymentMethod,
                cardNum: paymentMethod === "credit" ? cardNum || null : null,
                checkNum: paymentMethod === "check" ? checkNum || null : null,
                accountId:
                  paymentMethod === "transfer" || paymentMethod === "bit"
                    ? accountId || null
                    : null,
              }
            : null,
        },
      });
      const doc = res?.document ?? null;
      const docNumber = (doc as { doc_number?: string | null } | null)?.doc_number ?? null;
      const pdfUrl = (doc as { pdf_url?: string | null } | null)?.pdf_url ?? null;
      toast.success(`המסמך הופק בהצלחה${docNumber ? ` (#${docNumber})` : ""}`);
      setResult({ docNumber, pdfUrl });
      setStep("result");
      onIssued?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "שגיאה בהפקת המסמך";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const brand = BRANDS[client.brand];
  const business = brand.business;
  const sym = CURRENCY_SYMBOL[currency];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            {step === "preview" ? "תצוגה מקדימה — כך יראה המסמך" : "הפקת מסמך ב-Morning"}
          </DialogTitle>
        </DialogHeader>

        {step === "result" && result ? (
          <div className="py-6 text-center space-y-4">
            <div className="size-14 rounded-full bg-success/15 text-success grid place-items-center mx-auto">
              <FileText className="size-7" />
            </div>
            <div>
              <div className="text-lg font-semibold">המסמך הופק בהצלחה</div>
              {result.docNumber && (
                <div className="text-sm text-muted-foreground mt-1">מספר מסמך: {result.docNumber}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                המסמך נוסף אוטומטית ל"היסטוריית מסמכים"
              </div>
            </div>
            {result.pdfUrl && (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Button asChild variant="default" className="gap-2">
                  <a href={result.pdfUrl} target="_blank" rel="noopener noreferrer">
                    צפה ב-PDF <ExternalLink className="size-3.5" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <a
                    href={result.pdfUrl}
                    download={`${DOC_TYPE_LABELS[docType]}${result.docNumber ? `-${result.docNumber}` : ""}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    הורד PDF <Download className="size-3.5" />
                  </a>
                </Button>
              </div>
            )}
            <div>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>סגור</Button>
            </div>
          </div>
        ) : step === "preview" ? (
          <div className="space-y-4">
            {/* Document-style preview */}
            <div className="rounded-xl border bg-white text-black overflow-hidden shadow-sm" dir="rtl">
              {/* Header */}
              <div
                className="px-6 py-5 flex items-start justify-between gap-4 border-b"
                style={{
                  background: `linear-gradient(135deg, ${brand.color}, color-mix(in oklab, ${brand.color} 60%, black))`,
                  color: "white",
                }}
              >
                <div>
                  <div className="text-2xl font-extrabold tracking-tight">{business.legalName}</div>
                  <div className="text-xs opacity-90 mt-0.5">{brand.tagline}</div>
                  <div className="text-[11px] opacity-80 mt-2 leading-snug">
                    {business.address && <div>{business.address}{business.city ? `, ${business.city}` : ""}</div>}
                    {business.phone && <div>טל: {business.phone}</div>}
                    {business.email && <div>{business.email}</div>}
                    <div>ע.מ./ח.פ.: {business.taxId}</div>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[11px] opacity-80 uppercase tracking-wider">{DOC_TYPE_LABELS[docType]}</div>
                  <div className="text-xs opacity-90 mt-2">תאריך: {formatDateIL(issueDate)}</div>
                  {dueDate && <div className="text-xs opacity-90">לתשלום עד: {formatDateIL(dueDate)}</div>}
                  <div className="text-xs opacity-90">מטבע: {currency}</div>
                </div>
              </div>

              {/* Client block */}
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="text-[11px] text-gray-500 mb-1">לכבוד</div>
                <div className="font-semibold text-base">{client.name}</div>
                <div className="text-xs text-gray-700 leading-relaxed mt-0.5">
                  {taxId && <div>ע.מ./ת.ז.: {taxId}</div>}
                  {address && <div>{address}{city ? `, ${city}` : ""}</div>}
                  {client.email && <div>{client.email}</div>}
                  {client.phone && <div>{client.phone}</div>}
                </div>
              </div>

              {/* Items table */}
              <div className="px-6 py-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] text-gray-500 border-b">
                      <th className="text-right font-medium pb-2">תיאור</th>
                      <th className="text-center font-medium pb-2 w-16">כמות</th>
                      <th className="text-left font-medium pb-2 w-24">מחיר יח׳</th>
                      <th className="text-left font-medium pb-2 w-20">הנחה</th>
                      <th className="text-left font-medium pb-2 w-28">סה״כ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const lineGross = item.price * item.quantity;
                      const lineNet = lineGross - (item.discount || 0);
                      return (
                        <tr key={idx} className="border-b border-gray-100 last:border-0">
                          <td className="py-2 align-top break-words">{item.description}</td>
                          <td className="py-2 text-center stat-number align-top">{item.quantity}</td>
                          <td className="py-2 text-left stat-number align-top">{sym}{item.price.toFixed(2)}</td>
                          <td className="py-2 text-left stat-number align-top text-gray-500">
                            {item.discount > 0 ? `-${sym}${item.discount.toFixed(2)}` : "—"}
                          </td>
                          <td className="py-2 text-left stat-number align-top font-medium">
                            {sym}{lineNet.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="px-6 pb-4">
                <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>סכום פריטים</span>
                    <span className="stat-number">{sym}{linesGross.toFixed(2)}</span>
                  </div>
                  {linesDiscount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>הנחות פריטים</span>
                      <span className="stat-number">-{sym}{linesDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {Number(docDiscount) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>הנחה כללית</span>
                      <span className="stat-number">-{sym}{Number(docDiscount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 pt-1 border-t">
                    <span>לפני מע״מ</span>
                    <span className="stat-number">{sym}{subtotalNoVat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>מע״מ (17%)</span>
                    <span className="stat-number">{sym}{vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-1 border-t">
                    <span>סה״כ לתשלום</span>
                    <span className="stat-number">{sym}{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment block */}
              {isReceiptType && (
                <div className="px-6 py-3 border-t bg-gray-50 text-xs text-gray-700">
                  <span className="font-medium">אמצעי תשלום: </span>
                  {PAYMENT_LABELS[paymentMethod]}
                  {paymentMethod === "credit" && cardNum && ` • סוף כרטיס ${cardNum}`}
                  {paymentMethod === "check" && checkNum && ` • צ׳ק #${checkNum}`}
                  {(paymentMethod === "transfer" || paymentMethod === "bit") && accountId && ` • ${accountId}`}
                </div>
              )}

              {/* Notes */}
              {notes.trim() && (
                <div className="px-6 py-3 border-t text-xs text-gray-700 whitespace-pre-wrap">
                  <div className="font-medium text-gray-500 mb-0.5">הערות</div>
                  {notes}
                </div>
              )}

              {sendEmail && emailTo && (
                <div className="px-6 py-2.5 border-t bg-blue-50 text-xs text-gray-700">
                  📧 יישלח במייל אל: <span className="font-medium">{emailTo}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-center text-muted-foreground">
              לאחר הפקה — לא ניתן לערוך את המסמך. ודא שכל הפרטים נכונים.
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("form")}
                disabled={submitting}
                className="gap-2"
              >
                <ArrowRight className="size-3.5" /> חזור לעריכה
              </Button>
              <Button onClick={handleIssue} disabled={submitting} className="gap-2">
                {submitting ? "מפיק..." : "אשר והפק"}
                <FileText className="size-3.5" />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="doc">מסמך</TabsTrigger>
                <TabsTrigger value="client">לקוח</TabsTrigger>
                <TabsTrigger value="items">פריטים</TabsTrigger>
                <TabsTrigger value="payment" disabled={!isReceiptType}>תשלום</TabsTrigger>
                <TabsTrigger value="email">מייל</TabsTrigger>
              </TabsList>

              {/* DOCUMENT */}
              <TabsContent value="doc" className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="סוג מסמך">
                    <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tax_invoice_receipt">{DOC_TYPE_LABELS.tax_invoice_receipt}</SelectItem>
                        <SelectItem value="invoice">{DOC_TYPE_LABELS.invoice}</SelectItem>
                        <SelectItem value="receipt">{DOC_TYPE_LABELS.receipt}</SelectItem>
                        <SelectItem value="proforma">{DOC_TYPE_LABELS.proforma}</SelectItem>
                        <SelectItem value="credit_invoice">{DOC_TYPE_LABELS.credit_invoice}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="שפה">
                    <Select value={language} onValueChange={(v) => setLanguage(v as Lang)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="he">עברית</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="מטבע">
                    <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ILS">₪ ILS</SelectItem>
                        <SelectItem value="USD">$ USD</SelectItem>
                        <SelectItem value="EUR">€ EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="תאריך הפקה">
                    <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                  </Field>
                  {(docType === "invoice" || docType === "proforma" || docType === "tax_invoice_receipt") && (
                    <Field label="תאריך לתשלום (אופציונלי)">
                      <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </Field>
                  )}
                </div>
                <Field label="הערות (יופיעו בתחתית המסמך)">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="לדוגמה: תודה על העסקה, תנאי תשלום, פרטי בנק..."
                  />
                </Field>
              </TabsContent>

              {/* CLIENT */}
              <TabsContent value="client" className="space-y-3 pt-3">
                <Field label="שם לקוח">
                  <div className="h-9 px-3 rounded-md border bg-muted/30 flex items-center text-sm">
                    {client.name}
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="ת.ז. / ע.מ.">
                    <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="123456789" />
                  </Field>
                  <Field label="עיר">
                    <Input value={city} onChange={(e) => setCity(e.target.value)} />
                  </Field>
                </div>
                <Field label="כתובת">
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </Field>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Save className="size-3" /> פרטים אלה יישמרו אוטומטית בכרטיס הלקוח
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-md border bg-muted/30 px-3 py-2">
                    <div className="text-muted-foreground">אימייל קיים</div>
                    <div className="truncate">{client.email || "—"}</div>
                  </div>
                  <div className="rounded-md border bg-muted/30 px-3 py-2">
                    <div className="text-muted-foreground">טלפון</div>
                    <div className="truncate">{client.phone || "—"}</div>
                  </div>
                </div>
              </TabsContent>

              {/* ITEMS */}
              <TabsContent value="items" className="space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <Label>פריטים</Label>
                  <Button variant="ghost" size="sm" onClick={addItem} className="gap-1 h-7">
                    <Plus className="size-3.5" /> הוסף שורה
                  </Button>
                </div>
                <div className="grid grid-cols-12 gap-2 text-[11px] text-muted-foreground px-1">
                  <div className="col-span-5">תיאור</div>
                  <div className="col-span-2">כמות</div>
                  <div className="col-span-2">מחיר יח׳</div>
                  <div className="col-span-2">הנחה ({sym})</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-5">
                        <Textarea
                          placeholder="תיאור"
                          value={item.description}
                          onChange={(e) => updateItem(idx, { description: e.target.value })}
                          rows={1}
                          className="min-h-9 h-9 py-2 resize-none focus:min-h-[80px]"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number" min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number" min={0}
                          value={item.price}
                          onChange={(e) => updateItem(idx, { price: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number" min={0}
                          value={item.discount}
                          onChange={(e) => updateItem(idx, { discount: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                          className="text-destructive h-9 w-9"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <Field label={`הנחה כללית (${sym})`}>
                    <Input
                      type="number" min={0}
                      value={docDiscount}
                      onChange={(e) => setDocDiscount(Number(e.target.value) || 0)}
                    />
                  </Field>
                  <div className="flex flex-col justify-end">
                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                      <div className="flex justify-between text-muted-foreground text-xs">
                        <span>פריטים</span>
                        <span className="stat-number">{sym}{linesGross.toFixed(2)}</span>
                      </div>
                      {(linesDiscount > 0 || Number(docDiscount) > 0) && (
                        <div className="flex justify-between text-muted-foreground text-xs">
                          <span>הנחות</span>
                          <span className="stat-number">-{sym}{(linesDiscount + Number(docDiscount)).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold pt-1 border-t mt-1">
                        <span>סה״כ</span>
                        <span className="stat-number">{formatILS(total).replace("₪", sym)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* PAYMENT */}
              <TabsContent value="payment" className="space-y-3 pt-3">
                {!isReceiptType ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    אמצעי תשלום נדרש רק לקבלות / חשבונית מס+קבלה
                  </div>
                ) : (
                  <>
                    <Field label="אמצעי תשלום">
                      <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
                            <SelectItem key={m} value={m}>{PAYMENT_LABELS[m]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    {paymentMethod === "credit" && (
                      <Field label="4 ספרות אחרונות של הכרטיס">
                        <Input value={cardNum} onChange={(e) => setCardNum(e.target.value)} maxLength={4} />
                      </Field>
                    )}
                    {paymentMethod === "check" && (
                      <Field label="מספר צ׳ק">
                        <Input value={checkNum} onChange={(e) => setCheckNum(e.target.value)} />
                      </Field>
                    )}
                    {(paymentMethod === "transfer" || paymentMethod === "bit") && (
                      <Field label={paymentMethod === "bit" ? "מספר טלפון / אסמכתא" : "פרטי חשבון / אסמכתא"}>
                        <Input value={accountId} onChange={(e) => setAccountId(e.target.value)} />
                      </Field>
                    )}

                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm flex justify-between">
                      <span className="text-muted-foreground">סכום שייקבל</span>
                      <span className="font-bold stat-number">{sym}{total.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* EMAIL */}
              <TabsContent value="email" className="space-y-3 pt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={sendEmail} onCheckedChange={(v) => setSendEmail(!!v)} />
                  <span className="text-sm">שלח את המסמך ללקוח במייל</span>
                </label>
                {sendEmail && (
                  <>
                    <Field label="כתובת מייל">
                      <Input
                        type="email"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                      />
                    </Field>
                    <Field label="נושא (אופציונלי)">
                      <Input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder={`מסמך מ-${BRANDS[client.brand].business.legalName}`}
                      />
                    </Field>
                    <Field label="גוף הודעה (אופציונלי)">
                      <Textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows={4}
                        placeholder="מצורף מסמך פיננסי. לכל שאלה ניתן לפנות אלינו."
                      />
                    </Field>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button onClick={goToPreview} className="gap-2">
                <Eye className="size-3.5" /> תצוגה מקדימה
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
