export const DEFAULTS = {
  focus: 25,
  short: 5,
  long: 15,
  interval: 4,
  autoStart: false,
  sound: true,
  notify: false,
} as const;

export type Settings = typeof DEFAULTS;

export type Mode = "focus" | "short" | "long";

export const LABEL: Record<Mode, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

export const MODES: Mode[] = ["focus", "short", "long"];