import { BsTextParagraph, BsQrCode, BsClock } from 'react-icons/bs';
import { RiTeamLine } from 'react-icons/ri';

export const tools = [
  {
    category: 'Productivity',
    site: [
      {
        name: 'Pomodoro',
        description: 'Focus timer for productivity',
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
        description: 'Online tool for counting words',
        icon: <BsTextParagraph />,
        link: '/word-counter',
      },
    ],
  },
  {
    category: 'Generator',
    site: [
      {
        name: 'QR Code',
        description: 'Online tool for generating QR Code',
        icon: <BsQrCode />,
        link: '/qr-code-generator',
      },
      {
        name: 'Random Team',
        description: 'Online tool for generating random team',
        icon: <RiTeamLine />,
        link: '/random-team',
      },
    ],
  },
];
