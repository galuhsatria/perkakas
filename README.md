# Perkakas

A unified toolkit of focused online tools. Every small tool you use, in one place.

## Features

- **QR Code Generator** - Turn any link or text into a QR code
- **WhatsApp Link Generator** - Make a wa.me chat link with a ready-to-send message
- **Random Team** - Split a list of names into random teams
- **PWA Icon Generator** - Make Apple, 192, 512 and maskable icons from a logo or letters
- **Pomodoro Timer** - Work in timed focus sessions with short breaks
- **Word Counter** - Count words, characters, and reading time as you type
- **JSON Formatter** - Format, minify, validate and repair JSON
- **Screenshot Editor** - Add backgrounds, frames, shadows to screenshots
- **Image Converter** - Convert images between PNG, JPG, WebP, AVIF, BMP, ICO
- **Background Remover** - Remove backgrounds from images
- **Countdown Timer** - Simple countdown timer
- **QR Code Generator** - Generate QR codes with styling options

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React, React Icons
- **State Management**: React Hooks (custom hooks for localStorage, keyboard shortcuts, etc.)
- **PWA**: Service Worker, Web App Manifest

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/galuhsatria/perkakas.git
cd perkakas

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ORSHOT_API_KEY=` | Orshot API authentication key | Yes |

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-tool`)
3. Add your tool in `app/(tools)/your-tool/`
4. Register it in `app/data/tools.tsx`
5. Run `npm run lint` and `npm run build`
6. Submit a Pull Request

### Adding a New Tool

1. Create `app/(tools)/your-tool/page.tsx`
2. Add constants in `app/(tools)/your-tool/constants.ts` (if needed)
3. Create components in `app/(tools)/your-tool/components/`
4. Register in `app/data/tools.tsx`:

```typescript
{
  category: "Your Category",
  site: [{
    name: "Your Tool",
    description: "What it does",
    icon: <YourIcon />,
    link: "/your-tool",
  }]
}
```

## License

MIT License - feel free to use for personal or commercial projects.

## Author

Made by [@galuhsatria](https://www.galuhsatria.space)
