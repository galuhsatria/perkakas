"use client";
import Link from "next/link";
import ToolCard from "./components/ToolCard";
import { tools } from "./data/tools";
import Button from "./components/Button";
import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();
  return (
    <main className="layout">
      <section>
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold capitalize">Your favorite online tools are here</h1>
            <p className="text-slate-400 mt-2">
              Here are some free online tools made by{" "}
              <Link href={"https://galuhsatria.vercel.app/"} className="text-blue-600" target="_blank">
                @galuhsatria
              </Link>
            </p>  
          </div>
          <Button label="Get Started" onClick={() => router.push("#tools")} />
        </div>
      </section>
      <section className="flex flex-col gap-6 pt-16"  id="tools">
        <div>
          {tools.map((tool, index) => (
            <div key={index}>
              <h1 key={index} className="font-bold text-xl">
                {tool.category}
              </h1>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 py-5">
                {tool.site.map((site, index) => (
                  <ToolCard key={index} {...site} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
