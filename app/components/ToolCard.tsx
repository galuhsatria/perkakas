import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  name: string;
  description: string;
  icon: ReactNode;
  link: string;
}

export default function ToolCard({ name, description, icon, link }: Props) {
  return (
    <Link
      href={link}
      className="group relative flex min-h-[200px] flex-col overflow-hidden rounded-xl border border-edge bg-panel p-5 transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 rotate-12 text-white/[0.04] transition-colors group-hover:text-primary/15 [&_svg]:h-full [&_svg]:w-full"
      >
        {icon}
      </span>

      <div className="relative flex items-start justify-between">
        <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-xl text-primary">
          {icon}
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted transition-colors group-hover:text-fg" />
      </div>

      <div className="relative mt-auto pt-8">
        <h3 className="text-lg font-bold text-fg">{name}</h3>
        <p className="mt-1 max-w-[85%] text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </Link>
  );
}
