# Contributing to Perkakas

Thank you for your interest in contributing! Perkakas is a collection of small, focused tools — and we'd love to add more.

## Quick Start

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/yourusername/perkakas.git`
3. **Install**: `npm install`
4. **Dev server**: `npm run dev`
5. **Make changes** and test
6. **Submit PR**

## Project Structure

Each tool lives in `app/(tools)/tool-name/` with this structure:

```
app/(tools)/tool-name/
├── page.tsx              # Main page (thin composition)
├── constants.ts          # Tool-specific constants
├── hooks/                # Tool-specific hooks (optional)
│   └── useToolLogic.ts
└── components/           # UI components
    ├── ToolHeader.tsx
    ├── ToolInput.tsx
    ├── ToolOutput.tsx
    └── ToolSettings.tsx
```

## Adding a New Tool

### 1. Create the tool directory

```bash
mkdir -p app/(tools)/my-tool/components
```

### 2. Add `constants.ts` (optional)

```typescript
// app/(tools)/my-tool/constants.ts
export const MY_TOOL_CONFIG = {
  maxItems: 100,
  defaultValue: "hello",
} as const;
```

### 3. Create components

```tsx
// app/(tools)/my-tool/components/MyToolInput.tsx
"use client";

export function MyToolInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-edge bg-base px-3 py-2 text-fg outline-none focus:border-primary"
      placeholder="Enter something..."
    />
  );
}
```

### 4. Create the page

```tsx
// app/(tools)/my-tool/page.tsx
"use client";
import { MyToolInput } from "./components/MyToolInput";

export default function MyTool() {
  const [value, setValue] = useState("");

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-12">
      <h1 className="text-4xl font-extrabold tracking-tight">My Tool</h1>
      <p className="mt-3 text-muted">Description of what this tool does.</p>

      <section className="mt-10 rounded-xl border border-edge bg-panel p-5">
        <MyToolInput value={value} onChange={setValue} />
        <div className="mt-4 text-sm text-muted">Output: {value}</div>
      </section>
    </div>
  );
}
```

### 5. Register the tool

Edit `app/data/tools.tsx`:

```typescript
import { YourIcon } from "react-icons/xx";

export const tools: ToolCategory[] = [
  // ... existing tools
  {
    category: "Your Category",
    site: [
      {
        name: "My Tool",
        description: "Short description for the homepage card.",
        icon: <YourIcon />,
        link: "/my-tool",
      },
    ],
  },
];
```

### 6. Test

```bash
npm run dev    # Test locally
npm run build  # Verify production build
npm run lint   # Check code style
```

## Code Style

- **TypeScript strict mode** — no `any` in application code
- **Functional components** with hooks
- **Shared hooks** from `lib/hooks/` when applicable
- **UI constants** from `lib/ui/classes.ts` for repeated Tailwind patterns
- **Accessibility** — semantic HTML, ARIA labels, keyboard navigation
- **Responsive** — mobile-first, test at 320px, 768px, 1024px+

## Shared Hooks (Reuse These!)

| Hook | Use When |
|------|----------|
| `useLocalStorage` | Persist any state to localStorage |
| `useKeyboardShortcut` | Global hotkeys (excludes inputs) |
| `useCopyToClipboard` | Copy text with toast feedback |
| `useTimer` | Accurate countdown/interval timers |
| `useWordAnalysis` | Word/char count, reading time, keywords |

Example:
```typescript
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { useCopyToClipboard } from "@/lib/hooks/useCopyToClipboard";

function MyComponent() {
  const [text, setText, loaded] = useLocalStorage("my-tool:text", "");
  const { copied, copy } = useCopyToClipboard();
  // ...
}
```

## Pull Request Guidelines

- **One tool per PR** (or one cohesive change)
- **Descriptive title**: `feat: add base64 encoder tool`
- **Update README** if adding a new category or significant feature
- **No console.log** in production code
- **Test on mobile** viewport
- **Check build**: `npm run build` must pass

## Architecture Principles

1. **Small, focused tools** — one thing well
2. **Client-side only** — no server dependencies for core tools
3. **Privacy first** — data never leaves the browser
4. **Fast** — minimal JS, code-split by route
5. **Accessible** — keyboard navigable, screen reader friendly

## Questions?

Open a [Discussion](https://github.com/yourusername/perkakas/discussions) or [Issue](https://github.com/yourusername/perkakas/issues).

---

**Thank you for contributing!** 🎉