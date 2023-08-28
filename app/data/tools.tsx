import { BsTextParagraph, BsQrCode } from "react-icons/bs";
export const tools = [
  {
    category: "Calculation",
    site: [
      {
        name: "Word Count",
        description: "Online tool for counting words",
        icon: <BsTextParagraph />,
        link: "/word-counter",
      },
    ],
  },
  {
    category: "Generator",
    site: [
      {
        name: "QR Code",
        description: "Online tool for generating QR Code",
        icon: <BsQrCode />,
        link: "/qr-code-generator",
      },
    ],
  },
];
