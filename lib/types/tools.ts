import type { ReactNode } from "react";

export interface Tool {
  name: string;
  description: string;
  icon: ReactNode;
  link: string;
}

export interface ToolCategory {
  category: string;
  site: Tool[];
}