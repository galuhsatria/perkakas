"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, Copy, Download, ImagePlus, X } from "lucide-react";
import type {
  CornerDotType,
  CornerSquareType,
  DotType,
  ErrorCorrectionLevel,
  FileExtension,
  Options,
} from "qr-code-styling";

type QRCtor = typeof import("qr-code-styling").default;
type Tab = "text" | "wifi" | "whatsapp";
type Security = "WPA" | "WEP" | "nopass";

const card = "rounded-xl border border-edge bg-panel p-5";
const input =
  "w-full rounded-lg border border-edge bg-base px-3 py-2 text-fg outline-none placeholder:text-muted focus:border-primary";
const btn =
  "flex items-center justify-center gap-2 rounded-lg border border-edge px-4 py-2 text-sm font-semibold transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-edge";

const PRESETS = [
  { name: "Classic", dot: "square", sq: "square", cd: "square", fg: "#000000", fg2: "#000000", grad: false },
  { name: "Rounded", dot: "rounded", sq: "extra-rounded", cd: "dot", fg: "#111111", fg2: "#111111", grad: false },
  { name: "Ember", dot: "classy-rounded", sq: "extra-rounded", cd: "dot", fg: "#D9590A", fg2: "#7A2E0E", grad: true },
  { name: "Dots", dot: "dots", sq: "dot", cd: "dot", fg: "#0F172A", fg2: "#0F172A", grad: false },
] as const;

const escapeWifi = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function Segment<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
  }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40 ${
            value === o.value
              ? "border-primary bg-primary/15 font-semibold text-primary"
              : "border-edge text-muted hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
          checked ? "bg-primary" : "bg-edge"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div className={disabled ? "opacity-40" : ""}>
      <p className="mb-1.5 text-sm text-muted">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-edge bg-base p-1"
        />
        <input
          type="text"
          aria-label={`${label} hex`}
          value={draft}
          disabled={disabled}
          maxLength={7}
          onChange={(e) => {
            setDraft(e.target.value);
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value);
          }}
          className={`${input} font-mono`}
        />
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between text-muted">
        {label}
        <span className="tabular-nums text-fg">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[#FF8A1F]"
      />
    </label>
  );
}

export default function QRCodeGenerator() {
  // Content
  const [tab, setTab] = useState<Tab>("text");
  const [text, setText] = useState("https://example.com");
  const [ssid, setSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [security, setSecurity] = useState<Security>("WPA");
  const [waNumber, setWaNumber] = useState("");
  const [waMessage, setWaMessage] = useState("");

  // Style
  const [dotStyle, setDotStyle] = useState<DotType>("rounded");
  const [cornerSquare, setCornerSquare] = useState<CornerSquareType>("extra-rounded");
  const [cornerDot, setCornerDot] = useState<CornerDotType>("dot");
  const [fg, setFg] = useState("#111111");
  const [fg2, setFg2] = useState("#111111");
  const [gradient, setGradient] = useState(false);
  const [bg, setBg] = useState("#FFFFFF");
  const [transparent, setTransparent] = useState(false);

  // Logo
  const [logo, setLogo] = useState("");
  const [logoSize, setLogoSize] = useState(30);
  const [logoMargin, setLogoMargin] = useState(6);
  const [hideDots, setHideDots] = useState(true);

  // Output
  const [size, setSize] = useState(1024);
  const [quiet, setQuiet] = useState(4);
  const [ecl, setEcl] = useState<ErrorCorrectionLevel>("Q");
  const [status, setStatus] = useState("");

  const [Ctor, setCtor] = useState<QRCtor | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<InstanceType<QRCtor> | null>(null);

  useEffect(() => {
    import("qr-code-styling").then((m) => setCtor(() => m.default));
  }, []);

  const data = useMemo(() => {
    if (tab === "text") return text.trim();
    if (tab === "wifi") {
      if (!ssid.trim()) return "";
      const pass = security === "nopass" ? "" : `P:${escapeWifi(wifiPass)};`;
      return `WIFI:T:${security};S:${escapeWifi(ssid)};${pass};`;
    }
    const digits = waNumber.replace(/\D/g, "");
    if (!digits) return "";
    return `https://wa.me/${digits}${waMessage ? `?text=${encodeURIComponent(waMessage)}` : ""}`;
  }, [tab, text, ssid, wifiPass, security, waNumber, waMessage]);

  const options: Options = useMemo(
    () => ({
      width: size,
      height: size,
      type: "svg",
      data: data || " ",
      margin: Math.round((size * quiet) / 100),
      image: logo || undefined,
      qrOptions: { errorCorrectionLevel: logo ? "H" : ecl },
      imageOptions: { hideBackgroundDots: hideDots, imageSize: logoSize / 100, margin: logoMargin, crossOrigin: "anonymous" },
      dotsOptions: gradient
        ? {
            type: dotStyle,
            gradient: {
              type: "linear",
              rotation: Math.PI / 4,
              colorStops: [
                { offset: 0, color: fg },
                { offset: 1, color: fg2 },
              ],
            },
          }
        : { type: dotStyle, color: fg },
      backgroundOptions: { color: transparent ? "transparent" : bg },
      cornersSquareOptions: { type: cornerSquare, color: fg },
      cornersDotOptions: { type: cornerDot, color: fg },
    }),
    [size, quiet, data, logo, ecl, hideDots, logoSize, logoMargin, gradient, dotStyle, fg, fg2, transparent, bg, cornerSquare, cornerDot]
  );

  // Rebuild the QR whenever options change (avoids stale gradient/logo from merged updates)
  useEffect(() => {
    if (!Ctor || !boxRef.current) return;
    boxRef.current.innerHTML = "";
    const qr = new Ctor(options);
    qr.append(boxRef.current);
    qrRef.current = qr;
  }, [Ctor, options]);

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 2000);
  };

  const download = (extension: FileExtension) => {
    qrRef.current?.download({ name: "qr-code", extension });
  };

  const copy = async () => {
    try {
      const blob = await qrRef.current?.getRawData("png");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob as Blob })]);
      flash("Copied to clipboard");
    } catch {
      flash("Copy is not supported in this browser");
    }
  };

  const onUpload = (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return flash("Logo must be under 2 MB");
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setDotStyle(p.dot);
    setCornerSquare(p.sq);
    setCornerDot(p.cd);
    setFg(p.fg);
    setFg2(p.fg2);
    setGradient(p.grad);
  };

  const lowContrast =
    !transparent && Math.min(contrast(fg, bg), gradient ? contrast(fg2, bg) : Infinity) < 3;
  const empty = !data;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-10 lg:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">QR Code Generator</h1>
      <p className="mt-3 max-w-xl text-muted">
        Make a styled QR code for a link, a Wi-Fi network, or a WhatsApp chat. Everything runs in your browser.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Preview */}
        <section className={`${card} h-max lg:sticky lg:top-6`}>
          <div
            className="mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-lg"
            style={
              transparent
                ? {
                    backgroundImage: "conic-gradient(#2A2A2E 25%, #1A1A1D 0 50%, #2A2A2E 0 75%, #1A1A1D 0)",
                    backgroundSize: "16px 16px",
                  }
                : undefined
            }
          >
            <div
              ref={boxRef}
              className={`h-full w-full [&>svg]:h-full [&>svg]:w-full ${empty ? "opacity-20" : ""}`}
            />
          </div>

          <p className="mt-4 line-clamp-2 break-all text-center text-xs text-muted">
            {empty ? "Fill in the content to generate your QR code." : data}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <button className={btn} disabled={empty} onClick={() => download("png")}>
              <Download className="h-4 w-4" /> PNG
            </button>
            <button className={btn} disabled={empty} onClick={() => download("svg")}>
              <Download className="h-4 w-4" /> SVG
            </button>
            <button
              className={btn}
              disabled={empty || transparent}
              title={transparent ? "JPEG has no transparency" : undefined}
              onClick={() => download("jpeg")}
            >
              <Download className="h-4 w-4" /> JPG
            </button>
          </div>
          <button className={`${btn} mt-2 w-full`} disabled={empty} onClick={copy}>
            {status === "Copied to clipboard" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            Copy image
          </button>
          <p className="mt-3 min-h-[1.25rem] text-center text-xs text-muted" role="status">
            {status}
          </p>
        </section>

        {/* Controls */}
        <div className="flex flex-col gap-6">
          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="font-bold">Content</h2>
            <Segment<Tab>
              label="Content type"
              value={tab}
              onChange={setTab}
              options={[
                { value: "text", label: "Link or text" },
                { value: "wifi", label: "Wi-Fi" },
                { value: "whatsapp", label: "WhatsApp" },
              ]}
            />
            {tab === "text" && (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                aria-label="Link or text"
                placeholder="https://example.com"
                className={input}
              />
            )}
            {tab === "wifi" && (
              <div className="flex flex-col gap-3">
                <input value={ssid} onChange={(e) => setSsid(e.target.value)} placeholder="Network name (SSID)" aria-label="Network name" className={input} />
                <Segment<Security>
                  label="Security"
                  value={security}
                  onChange={setSecurity}
                  options={[
                    { value: "WPA", label: "WPA/WPA2" },
                    { value: "WEP", label: "WEP" },
                    { value: "nopass", label: "No password" },
                  ]}
                />
                {security !== "nopass" && (
                  <input value={wifiPass} onChange={(e) => setWifiPass(e.target.value)} placeholder="Password" aria-label="Wi-Fi password" className={input} />
                )}
              </div>
            )}
            {tab === "whatsapp" && (
              <div className="flex flex-col gap-3">
                <input
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  inputMode="tel"
                  placeholder="Phone number with country code, e.g. 62812345678"
                  aria-label="WhatsApp number"
                  className={input}
                />
                <textarea
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  rows={2}
                  placeholder="Pre-filled message (optional)"
                  aria-label="Message"
                  className={input}
                />
              </div>
            )}
          </section>

          <section className={`${card} flex flex-col gap-5`}>
            <h2 className="font-bold">Style</h2>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.name} type="button" onClick={() => applyPreset(p)} className={btn}>
                  {p.name}
                </button>
              ))}
            </div>
            <div>
              <p className="mb-2 text-sm text-muted">Dots</p>
              <Segment<DotType>
                label="Dot style"
                value={dotStyle}
                onChange={setDotStyle}
                options={[
                  { value: "square", label: "Square" },
                  { value: "dots", label: "Dots" },
                  { value: "rounded", label: "Rounded" },
                  { value: "extra-rounded", label: "Extra rounded" },
                  { value: "classy", label: "Classy" },
                  { value: "classy-rounded", label: "Classy rounded" },
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-sm text-muted">Corner frames</p>
              <Segment<CornerSquareType>
                label="Corner frame style"
                value={cornerSquare}
                onChange={setCornerSquare}
                options={[
                  { value: "square", label: "Square" },
                  { value: "extra-rounded", label: "Rounded" },
                  { value: "dot", label: "Circle" },
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-sm text-muted">Corner centers</p>
              <Segment<CornerDotType>
                label="Corner center style"
                value={cornerDot}
                onChange={setCornerDot}
                options={[
                  { value: "square", label: "Square" },
                  { value: "dot", label: "Circle" },
                ]}
              />
            </div>
          </section>

          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="font-bold">Colors</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField label="QR color" value={fg} onChange={setFg} />
              <ColorField label="Background" value={bg} onChange={setBg} disabled={transparent} />
              {gradient && <ColorField label="Gradient end color" value={fg2} onChange={setFg2} />}
            </div>
            <Switch label="Use gradient" checked={gradient} onChange={setGradient} />
            <Switch label="Transparent background" checked={transparent} onChange={setTransparent} />
            {lowContrast && (
              <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                Low contrast between the QR and its background. It may not scan reliably, so use a darker QR color.
              </p>
            )}
          </section>

          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="font-bold">Logo</h2>
            <div className="flex flex-wrap items-center gap-3">
              <label className={`${btn} cursor-pointer`}>
                <ImagePlus className="h-4 w-4" /> Upload logo
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => onUpload(e.target.files?.[0])} />
              </label>
              {["/scan-me-frame.png", "/scan-me.png"].map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setLogo(src)}
                  aria-label={`Use ${src} as logo`}
                  className={`rounded-lg border p-1 ${logo === src ? "border-primary" : "border-edge hover:border-primary"}`}
                >
                  <Image src={src} alt="" width={36} height={36} className="h-9 w-9 rounded object-contain" />
                </button>
              ))}
              {logo && (
                <button type="button" onClick={() => setLogo("")} className={btn}>
                  <X className="h-4 w-4" /> Remove
                </button>
              )}
            </div>
            <input
              value={logo.startsWith("data:") ? "" : logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="Or paste an image URL"
              aria-label="Logo image URL"
              className={input}
            />
            {logo && (
              <>
                <Slider label="Logo size" value={logoSize} min={10} max={50} unit="%" onChange={setLogoSize} />
                <Slider label="Space around logo" value={logoMargin} min={0} max={20} unit="px" onChange={setLogoMargin} />
                <Switch label="Clear dots behind the logo" checked={hideDots} onChange={setHideDots} />
                <p className="text-xs text-muted">Error correction is set to High automatically so the code still scans with a logo.</p>
              </>
            )}
          </section>

          <section className={`${card} flex flex-col gap-4`}>
            <h2 className="font-bold">Export</h2>
            <div>
              <p className="mb-2 text-sm text-muted">Image size</p>
              <Segment<string>
                label="Image size"
                value={String(size)}
                onChange={(v) => setSize(Number(v))}
                options={[
                  { value: "512", label: "512 px" },
                  { value: "1024", label: "1024 px" },
                  { value: "2048", label: "2048 px" },
                ]}
              />
            </div>
            <Slider label="Margin around the code" value={quiet} min={0} max={12} unit="%" onChange={setQuiet} />
            <div>
              <p className="mb-2 text-sm text-muted">Error correction</p>
              <Segment<ErrorCorrectionLevel>
                label="Error correction level"
                value={logo ? "H" : ecl}
                onChange={setEcl}
                disabled={!!logo}
                options={[
                  { value: "L", label: "Low" },
                  { value: "M", label: "Medium" },
                  { value: "Q", label: "Quartile" },
                  { value: "H", label: "High" },
                ]}
              />
              <p className="mt-2 text-xs text-muted">Higher levels survive more damage, but make the code denser.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
