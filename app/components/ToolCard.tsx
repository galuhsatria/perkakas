"use client";
import { useRouter } from "next/navigation";

interface Props {
  name: string;
  description: string;
  icon: any;
  link: string;
}

export default function ToolCard(props: Props) {
  const { name, description, icon, link } = props;
  const router = useRouter();
  return (
    <div onClick={() => router.push(link)} className="w-full p-4 rounded-md border border-black shadow-[6px_6px_0_0_#000000] hover:shadow-[8px_8px_0_0_#000000] transition-shadow cursor-pointer">
      <div className="w-14 border border-black shadow-[3px_3px_0_0_#000000] text-center text-xl rounded-lg p-4">{icon}</div>
      <div className="mt-4">
        <h3 className="text-xl font-bold ">{name}</h3>
        <p className="text-slate-500">{description}</p>
      </div>
    </div>
  );
}
