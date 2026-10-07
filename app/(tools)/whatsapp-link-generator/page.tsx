"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, RotateCcw } from "lucide-react";

const card = "rounded-xl border border-edge bg-panel p-5";
const input =
  "w-full rounded-lg border border-edge bg-base px-3 py-2 text-fg outline-none focus:border-primary";
const iconBtn =
  "flex h-12 w-12 items-center justify-center rounded-full border border-edge text-muted transition-colors hover:border-primary hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

const MAX_MESSAGE = 1000;

export default function Page() {
  const [countryCode, setCountryCode] = useState("62");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Remember the country code between visits
  useEffect(() => {
    try {
      const cc = localStorage.getItem("wa-link:country-code");
      if (cc) setCountryCode(cc);
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("wa-link:country-code", countryCode);
    } catch {}
  }, [loaded, countryCode]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  const fullNumber = useMemo(() => {
    const cc = countryCode.replace(/\D/g, "");
    // Strip spaces, dashes, "+" and leading zeros (e.g. 0812... -> 812...)
    const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
    if (!digits) return "";
    // If the user already typed the country code, don't add it twice
    if (cc && digits.startsWith(cc) && digits.length > cc.length + 6) return digits;
    return `${cc}${digits}`;
  }, [countryCode, phone]);

  const valid = fullNumber.length >= 8 && fullNumber.length <= 15;

  const link = useMemo(() => {
    if (!valid) return "";
    const text = message.trim();
    return `https://wa.me/${fullNumber}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
  }, [valid, fullNumber, message]);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {}
  };

  const reset = () => {
    setPhone("");
    setMessage("");
    setCopied(false);
  };

  const showError = phone.length > 0 && !valid;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-10 lg:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">WhatsApp Link Generator</h1>
      <p className="mt-3 max-w-lg text-muted">
        Create a wa.me link that opens a chat with any number, with an optional message already filled in. No need to
        save the contact first.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Form */}
        <section className={`${card} flex flex-col gap-5 py-8 h-max`}>
          <div className="grid grid-cols-[96px_1fr] gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted">Country code</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">+</span>
                <input
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  placeholder="62"
                  aria-label="Country code"
                  className={`${input} pl-7`}
                />
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted">Phone number</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                placeholder="812 3456 7890"
                aria-label="Phone number"
                aria-invalid={showError}
                className={`${input} ${showError ? "border-red-500 focus:border-red-500" : ""}`}
              />
            </label>
          </div>
          {showError ? (
            <p className="-mt-3 text-xs text-red-400">
              Enter a valid number (8 to 15 digits including the country code).
            </p>
          ) : (
            <p className="-mt-3 text-xs text-muted">
              Leading 0 is removed automatically. Spaces and dashes are fine.
            </p>
          )}

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="flex items-center justify-between text-muted">
              <span>Message (optional)</span>
              <span className="text-xs tabular-nums">
                {message.length}/{MAX_MESSAGE}
              </span>
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
              rows={5}
              placeholder="Hi, I'm interested in your product..."
              className={`${input} resize-y`}
            />
          </label>

          <div className="mt-2 flex items-center justify-center gap-4">
            <button onClick={reset} aria-label="Clear form" className={iconBtn}>
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={copy}
              disabled={!link}
              className="flex min-w-[6rem] items-center justify-center gap-2 rounded-full bg-primary px-6 py-2 text-md font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open chat in WhatsApp"
                className={iconBtn}
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            ) : (
              <span aria-hidden className={`${iconBtn} cursor-not-allowed opacity-40`}>
                <ExternalLink className="h-5 w-5" />
              </span>
            )}
          </div>
        </section>

        {/* Side panel */}
        <div className="flex flex-col gap-6">
          <section className={card}>
            <h2 className="font-bold">Your link</h2>
            <div className="mt-4 min-h-[88px] break-all rounded-lg border border-edge bg-base p-3 text-sm">
              {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {link}
                </a>
              ) : (
                <span className="text-muted">Your link will appear here once you enter a valid number.</span>
              )}
            </div>
            {link && (
              <p className="mt-3 text-xs text-muted">
                Opens a chat with <span className="font-semibold text-fg">+{fullNumber}</span>
                {message.trim() ? " with your message ready to send." : "."}
              </p>
            )}
          </section>

          <section className={card}>
            <h2 className="font-bold">Preview</h2>
            <div className="mt-4 rounded-lg border border-edge bg-base p-4">
              {message.trim() ? (
                <div className="ml-auto w-fit max-w-full whitespace-pre-wrap break-words rounded-xl rounded-tr-sm bg-primary/90 px-3 py-2 text-sm text-white">
                  {message.trim()}
                </div>
              ) : (
                <p className="text-sm text-muted">No message. The chat will open empty.</p>
              )}
            </div>
          </section>

          <section className={card}>
            <h2 className="font-bold">Tips</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs text-muted">
              <li>Use the international format: country code + number, no + or 0 at the start.</li>
              <li>Line breaks in your message are kept in the link.</li>
              <li>Great for bio links, invoices, and &quot;Chat with us&quot; buttons.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
