import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return ( 
    <header className="w-full fixed top-6 z-50 bg-white backdrop-blur-sm px-6 py-4 rounded-full shadow-md max-w-7xl flex items-center justify-between">
      <Image className="ml-2" src="/assets/logo-dark.svg" alt="Logo" width={180} height={180} />
      <nav>
        <ul className="flex items-center gap-6 text-background font-semibold">
          <li>
            <Link href="/about">Features</Link>
          </li>
          <li>
            <Link href="/contact">Contact</Link>
          </li>
          <li>
            <button className="bg-secondary text-white px-4 py-2 rounded-full font-semibold text-base">Sign In</button>
          </li>
        </ul>
      </nav>
    </header>
    );
    }