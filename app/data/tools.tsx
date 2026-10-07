import { BsTextParagraph, BsQrCode, BsClock, BsWhatsapp, BsFiletypeJson, BsImage, BsPhone, BsWindowStack, BsFileEarmarkImage } from 'react-icons/bs';
import { RiTeamLine } from 'react-icons/ri';

export const tools = [

  {
    category: 'Generator',
    site: [
      {
        name: 'QR Code',
        description: 'Turn any link or text into a QR code you can scan right away.',
        icon: <BsQrCode />,
        link: '/qr-code-generator',
      },
      {
        name: 'Random Team',
        description: 'Split a list of names into random teams with one click.',
        icon: <RiTeamLine />,
        link: '/random-team',
      },
      {
        name: 'WhatsApp Link',
        description: 'Make a wa.me chat link with a ready-to-send message.',
        icon: <BsWhatsapp />,
        link: '/whatsapp-link-generator',
      },
      {
        name: 'PWA Icon Generator',
        description: 'Make Apple, 192, 512 and maskable icons from a logo or letters.',
        icon: <BsPhone />,
        link: '/pwa-icon-generator',
      },
    ],
  },
  {
    category: 'Productivity',
    site: [
      {
        name: 'Pomodoro',
        description: 'Work in timed focus sessions with short breaks to stay on track.',
        icon: <BsClock />,
        link: '/pomodoro',
      },
    ],
  },
  {
    category: 'Calculation',
    site: [
      {
        name: 'Word Count',
        description: 'Paste or type your text to count its words and characters instantly.',
        icon: <BsTextParagraph />,
        link: '/word-counter',
      },
    ],
  },
  {
    category: 'Developer',
    site: [
      {
        name: 'JSON Formatter',
        description: 'Format, minify, validate and repair JSON in your browser.',
        icon: <BsFiletypeJson />,
        link: '/json-formatter',
      },
    ],
  },
  {
    category: 'Image',
    site: [
      {
        name: 'Background Remover',
        description: 'Remove the background from any image, right in your browser.',
        icon: <BsImage />,
        link: '/background-remover',
      },
      {
           name: 'Screenshot Editor',
           description: 'Create beautiful Screenshots by adding frames, backgrounds, etc.',
           icon: <BsWindowStack />,
           link: '/screenshot-editor',
      },
      {
          name: 'Image Converter',
          description: 'Convert images between PNG, JPG, WebP, AVIF, BMP and ICO, one file or a whole batch.',
          icon: <BsFileEarmarkImage />,
          link: '/image-converter',
      },
    ],
  },
];
