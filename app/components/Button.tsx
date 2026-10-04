interface Props {
  label: string;
  onClick?: () => void;
  className?: string;
}

export default function Button({ label, onClick, className = "" }: Props) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md bg-primary px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
    >
      {label}
    </button>
  );
}
