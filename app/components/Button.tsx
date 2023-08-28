interface Props {
  label: string;
  onClick: () => void;
  className?: string;
}

export default function Button(props: Props) {
  return (
    <button onClick={props.onClick} className={`py-2 px-4 bg-blue-600 text-white border border-black shadow-[6px_6px_0_0_#000000] hover:shadow-[8px_8px_0_0_#000000] transition-shadow cursor-pointer ${props.className}`}>
      {props.label}
    </button>
  );
}
