export type Indent = "2" | "4" | "tab";
export type Notice = { kind: "ok" | "warn"; text: string } | null;
export type JsonError = { message: string; pos: number | null };