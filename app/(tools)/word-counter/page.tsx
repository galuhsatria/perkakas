"use client";

import * as React from "react";
import { BsTrash } from "react-icons/bs";
import { AiOutlineFontSize } from "react-icons/ai";
import Button from "@/app/components/Button";

export default function WordCounter() {
  const [value, setValue] = React.useState("");
  const words = value.match(/\S+/g)?.length || 0;
  const characters = value.length || 0;
  const charactersWithoutSpace = value.replace(/ /g, "").length || 0;
  const paragraphs = value.split("\n").filter((paragraph) => paragraph !== "").length || 0;
  const [fontSize, setFontSize] = React.useState("lg");
  const [showDetail, setShowDetail] = React.useState(true);
  const wordsPerMinute = 200;

  const calculateReadingTime = () => {
    const readingTimeMinutes = Math.floor(words / wordsPerMinute);
    const readingTimeSeconds = Math.ceil((words / wordsPerMinute - readingTimeMinutes) * 60);
    return { minutes: readingTimeMinutes, seconds: readingTimeSeconds };
  };

  const { minutes, seconds } = calculateReadingTime();

  return (
    <main className="layout">
      <div>
        <h1 className="font-bold text-2xl">Word Counter</h1>
        <div className="flex gap-5 my-5 flex-wrap">
          <div className="rounded-md bg-blue-500 text-white border-large px-4 py-2 text-lg">{words} word</div>
          <div className="rounded-md bg-yellow-400 text-white border-large px-4 py-2 text-lg">{characters} characters</div>
          <div className="rounded-md border-small py-2 px-4 cursor-pointer " onClick={() => setValue("")}>
            <BsTrash className="text-xl text-center mt-1 hover:text-red-500" />
          </div>
          <div className="rounded-md group flex gap-2">
            <div className="rounded-md border-small py-2 px-4 cursor-pointer">
              {" "}
              <AiOutlineFontSize className="text-2xl mt-1 text-center hover:text-blue-600" />
            </div>

            <div className="hidden group-hover:flex items-center bg-white rounded-md px-4 py-2 border gap-3 mt-1">
              <AiOutlineFontSize className="text-2xl hover:text-blue-500 cursor-pointer" onClick={() => setFontSize("2xl")} />
              <AiOutlineFontSize className="text-xl hover:text-blue-500 cursor-pointer" onClick={() => setFontSize("xl")} />
              <AiOutlineFontSize className="text-lg hover:text-blue-500 cursor-pointer" onClick={() => setFontSize("lg")} />
            </div>
          </div>
        </div>
        <div>
          <textarea
            name=""
            id=""
            rows={6}
            className={`w-full p-2 mt-4 rounded-md border-large focus:outline-none text-${fontSize}`}
            placeholder="Type here ..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          ></textarea>
        </div>
        <Button label={`${showDetail ? "Hide Detail" : "Show Detail"}`} onClick={() => setShowDetail(!showDetail)} className="mt-5" />
        {showDetail && (
          <div
            className="border-large rounded-md
         mt-6 p-4 sm:w-2/5 mb-14"
          >
            <h1 className="font-bold text-lg">Detail</h1>
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center justify-between border-b">
                <p>Word</p>
                <p>{words}</p>
              </div>
              <div className="flex items-center justify-between border-b">
                <p>Characters</p>
                <p>{characters}</p>
              </div>
              <div className="flex items-center justify-between border-b">
                <p>Characters Without Space</p>
                <p>{charactersWithoutSpace}</p>
              </div>
              <div className="flex items-center justify-between border-b">
                <p>Paragraphs</p>
                <p>{paragraphs}</p>
              </div>
              <div className="flex items-center justify-between border-b">
                <p>Reading Time</p>
                <p>{minutes > 1 ? `${minutes} min ${seconds} sec` : `${seconds} sec`}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
