import Link from "next/link";
import SearchBar from "./components/SearchBar";
import ToolCard from "./components/ToolCard";
import { tools } from "./data/tools";

const key = "rounded-md border border-edge bg-panel px-2 py-0.5 text-xs font-semibold text-fg";

export default function Home() {
  const total = tools.reduce((sum, g) => sum + g.site.length, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-10 lg:py-20">
      <section className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <h1 className="text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-5xl">
            Every small tool I use,
            <br />
            <span className="text-muted">in one place.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted">
            {total} tools in {tools.length} categories, ready when you need them. <br></br> Made by <Link href="https://www.galuhsatria.space" target="_blank" className="text-primary">@galuhsatria</Link>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <SearchBar />
          </div>
          <p className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted">
            <kbd className={key}>Ctrl</kbd>
            <kbd className={key}>K</kbd>
            <span>or</span>
            <kbd className={key}>/</kbd>
            <span>to search from anywhere</span>
          </p>
        </div>
      </section>

      <div className="mt-14 flex flex-col gap-8">
        {[...tools]
          .sort((a, b) => b.site.length - a.site.length)
          .map((g) => (
            <section key={g.category}>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{g.category}</h2>
                <span className="rounded-full border border-edge px-2.5 py-0.5 text-xs text-muted">
                  {g.site.length}
                </span>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {g.site.map((s) => (
                  <ToolCard key={s.link} {...s} />
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
