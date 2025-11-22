import { StripedPattern } from "@/components/magicui/striped-pattern";
import Header from "./components/Navigation/Header";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Header />
      <div className="flex flex-col items-center justify-center gap-6 max-w-2xl text-center">
        <h1 className="text-6xl font-bold text-center capitalize">
          Turn your influence into interaction
        </h1>
        <p className="">
          MirrorMe turns your influence into interaction with an AI version of
          you, powered by X402 micropayments, a dynamic reputation score, and
          seamless discoverability through ERC-8004
        </p>
        <button className="bg-white text-secondary px-6 py-3 rounded-full font-black text-xl mt-6 hover:bg-secondary hover:text-white transition-all duration-300 flex items-center justify-center">Get Started </button>
      </div>
      
      <StripedPattern className="stroke-[0.3] [stroke-dasharray:8,4] absolute top-0 left-0 right-0 bottom-0 w-full h-full" />

    </div>
  );
}
