"use client";

import * as React from "react";
import Button from "@/app/components/Button";
import { QRCodeSVG } from "qrcode.react";
import { QRCode } from "react-qrcode-logo";
import { MuiColorInput } from "mui-color-input";
import { BsXLg } from "react-icons/bs";
import * as htmlToImage from "html-to-image";
import Image from "next/image";
export default function QRCodeGenerator() {
  const [value, setValue] = React.useState("https://galuhsatria.vercel.app");
  const [fgColor, setFgColor] = React.useState("#000000");
  const [imgSrc, setImgSrc] = React.useState("");
  const [opacity, setOpacity] = React.useState(80);
  const [imgWidth, setImgWidth] = React.useState(50);
  const [imgHeight, setImgHeight] = React.useState(50);
  const [qrStyle, setQrStyle] = React.useState<"squares" | "dots">("squares");

  const handleDownload = async () => {
    const dataUrl = await htmlToImage.toPng(document.getElementById("qr-code")!);
    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <main className="layout">
      <h1 className="font-bold text-2xl">QR Code Generator</h1>
      <div className="flex mt-8 w-full justify-between gap-7 sm:flex-nowrap flex-wrap ">
        <section className="border-small px-4 py-6 flex flex-col items-center sm:w-1/2 w-full h-max">
          <div id="qr-code" className="w-max flex flex-col items-center p-1 bg-white">
            <QRCode value={value} size={180} fgColor={fgColor} logoImage={imgSrc} logoHeight={imgHeight} logoWidth={imgWidth} logoOpacity={parseFloat((opacity / 100).toFixed(2))} qrStyle={qrStyle} />
            <p className="text-blue-600 break-words text-center">{value}</p>
          </div>
          <Button label="Save" onClick={handleDownload} className="mt-6" />
        </section>
        <section className="border-small sm:w-1/2 w-full p-4">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="Content">Content</label>
              <input
                type="text"
                id="Content"
                onChange={(e) => setValue(e.target.value)}
                className="border-small py-[6px] px-2 focus:outline-none"
                placeholder="https://galuhsatria.vercel.app"
                defaultValue={"https://galuhsatria.vercel.app"}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="image">Logo Image URL (optional)</label>
              <input type="text" id="image" onChange={(e) => setImgSrc(e.target.value)} className="border-small py-[6px] px-2 focus:outline-none" placeholder="Put the image URL here" />
              <p className="mt-2">Or</p>
              <div className="flex gap-3">
                <div className="border-black border-2 cursor-pointer py-2 px-3" onClick={() => setImgSrc("")}>
                  {" "}
                  <BsXLg className="mt-1" />
                </div>
                <Image src={"/scan-me-frame.png"} alt="logo-scan-me-frame" width={40} height={10} className="border-black border-2 cursor-pointer" onClick={() => setImgSrc("/scan-me-frame.png")} />
                <Image src={"/scan-me.png"} alt="logo-scan-me" width={40} height={10} className="border-black border-2 cursor-pointer" onClick={() => setImgSrc("/scan-me.png")} />
              </div>
            </div>
            <div className="flex  flex-col gap-2">
              <label htmlFor="opacity">Logo Opacity</label>
              <input type="range" min="0" max="100" onChange={(e: any) => setOpacity(e.target.value)} defaultValue={80} className="rounded-lg overflow-hidden appearance-none border-small" />
            </div>
            <div className="flex gap-4">
              <div className="w-1/2">
                <label>Logo Image Width</label>
                <input type="number" onChange={(e: any) => setImgWidth(e.target.value)} className="border-small py-[6px] px-2 mt-2 w-full focus:outline-none" defaultValue={50} />
              </div>
              <div className="w-1/2">
                <label>Logo Image Height</label>
                <input type="number" onChange={(e: any) => setImgHeight(e.target.value)} className="border-small py-[6px] px-2 mt-2 w-full focus:outline-none" defaultValue={50} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label>Color</label>
              <MuiColorInput value={fgColor} onChange={(e) => setFgColor(e)} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="style">Style</label>
              <select name="style" id="style" className="border-small focus:outline-none py-2 px-4" onChange={(e: any) => setQrStyle(e.target.value as "squares" | "dots")}>
                <option value="squares">Squares</option>
                <option value="dots">Dots</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
