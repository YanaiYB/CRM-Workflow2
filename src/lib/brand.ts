export type Brand = "lore_weddings" | "depth_studios";

export type BrandBusinessInfo = {
  legalName: string;
  taxId: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
};

export const BRANDS: Record<Brand, {
  id: Brand;
  name: string;
  tagline: string;
  color: string;
  business: BrandBusinessInfo;
}> = {
  lore_weddings: {
    id: "lore_weddings",
    name: "LORE WEDDINGS",
    tagline: "צילום חתונות",
    color: "var(--brand-lore)",
    business: {
      legalName: "LORE WEDDINGS",
      taxId: "—",
      address: "",
      city: "",
      phone: "",
      email: "",
    },
  },
  depth_studios: {
    id: "depth_studios",
    name: "Depth Studios",
    tagline: "צילום מסחרי ויצירתי",
    color: "var(--brand-depth)",
    business: {
      legalName: "Depth Studios",
      taxId: "—",
      address: "",
      city: "",
      phone: "",
      email: "",
    },
  },
};

export const BRAND_LIST = [BRANDS.lore_weddings, BRANDS.depth_studios] as const;

export const STATUS_LABELS = {
  working: "בעבודה",
  delivered: "נמסר",
  finished: "הסתיים",
} as const;

export const STATUS_STYLES = {
  working: "bg-warning/15 text-warning-foreground border-warning/30",
  delivered: "bg-info/15 text-info-foreground border-info/30",
  finished: "bg-success/15 text-success-foreground border-success/30",
} as const;



export const ROLE_LABELS = {
  photographer: "צלם/ת",
  videographer: "וידאו",
  editor: "עורך/ת",
  assistant: "עוזר/ת",
} as const;

export type WeddingEventType = "wedding" | "henna";

export const WEDDING_EVENT_TYPE_LABELS: Record<WeddingEventType, string> = {
  wedding: "חתונה",
  henna: "חינה",
};

export const FILE_TAG_LABELS = {
  contract: "חוזה",
  invoice: "חשבונית",
  other: "אחר",
} as const;

export const CHECKLIST_TEMPLATES: Record<Brand, string[]> = {
  lore_weddings: [
    "קבלת מקדמה",
    "צילום החתונה",
    "עריכת ריל",
    "עריכת קליפ",
    "עריכת סרט ארוך",
    "שליחת תמונות",
    "מסירת גלריה",
    "קבלת תשלום סופי",
  ],
  depth_studios: [
    "בריף יצירתי",
    "תכנון הפקה",
    "אישור מעצב/לקוח",
    "יום צילום",
    "עריכה",
    "מסירה ללקוח",
    "קבלת תשלום סופי",
  ],
};
