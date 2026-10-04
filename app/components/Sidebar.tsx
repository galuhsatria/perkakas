"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutGrid, Search } from "lucide-react";
import { tools } from "../data/tools";

const item =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors";

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const cls = (active: boolean) =>
    `${item} ${
      active
        ? "bg-white/10 font-semibold text-fg"
        : "text-muted hover:bg-white/5 hover:text-fg"
    }`;

  return (
    <nav className="flex flex-col gap-4 p-4 scroll-thin">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2 px-3 py-2 text-lg font-bold">
        <img src="/logo.png" alt="" className="h-8 w-8" />
        <span className="mt-2">Perkakas</span>
      </Link>

      <Link href="/" onClick={onNavigate} className={cls(pathname === "/")}>
        <LayoutGrid className="h-4 w-4" />
        All tools
      </Link>

      <div className="flex flex-col gap-1">
        {tools.map((group) => (
          <details key={group.category} open className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-fg hover:bg-white/5">
              {group.category}
              <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <ul className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-edge pl-2">
              {group.site.map((site) => (
                <li key={site.link}>
                  <Link href={site.link} onClick={onNavigate} className={cls(pathname === site.link)}>
                    <span className="flex h-4 w-4 items-center justify-center text-sm">{site.icon}</span>
                    {site.name}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </nav>
  );
}
