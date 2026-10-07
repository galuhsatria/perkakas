export const LIMITS = [
  { id: "none", label: "No limit", max: 0 },
  { id: "x", label: "X post", max: 280 },
  { id: "sms", label: "SMS", max: 160 },
  { id: "meta", label: "Meta description", max: 160 },
  { id: "title", label: "Title tag", max: 60 },
  { id: "ig", label: "Instagram caption", max: 2200 },
] as const;

export const FONT_SIZES = [
  { id: "sm", label: "S", cls: "text-sm" },
  { id: "md", label: "M", cls: "text-[1rem]" },
  { id: "lg", label: "L", cls: "text-lg" },
] as const;

export const STOP_WORDS = new Set(
  (
    "the a an and or but of to in on at for with is are was were be been it its this that as by from i you he she we they " +
    "yang dan di ke dari untuk dengan pada ini itu adalah atau saya kamu kita akan juga tidak dalam ada sebagai oleh"
  ).split(" ")
);