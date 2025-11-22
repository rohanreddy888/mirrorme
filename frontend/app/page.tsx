
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-dvh">
    
      <div className="flex flex-col items-center justify-center gap-6 max-w-2xl text-center">
        <h1 className="text-6xl font-bold text-center capitalize">
          Turn your influence into interaction
        </h1>
        <p className="">
          MirrorMe turns your influence into interaction with an AI version of
          you, powered by X402 micropayments, a dynamic reputation score, and
          seamless discoverability through ERC-8004
        </p>
        <Link href="/mirrors" className="bg-white text-secondary px-6 py-4 rounded-full font-black text-xl mt-6 hover:bg-secondary hover:text-white transition-all duration-300 flex items-center justify-center">Explore Mirrors</Link>
      </div>
    </div>
  );
}
