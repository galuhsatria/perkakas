import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed w-full top-0 border-b border-slate-200 backdrop-blur backdrop-filter bg-white bg-opacity-75">
      <div className=" max-w-4xl mx-auto  flex py-4 px-4 justify-between ">
        <div className="logo">
          <Link href={'/'} className="font-bold">
            Perkakas
          </Link>
        </div>
      </div>
    </nav>
  );
}
