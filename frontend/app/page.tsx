"use client";
import MirrorIcon from "@/lib/icons/mirror";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import mirrorAnimation from "@/public/lottie/mirror.json";
import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function Home() {
  const lottieRef = useRef<HTMLDivElement>(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  const isMobile = useIsMobile();
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldPlay(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    const currentRef = lottieRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);
  return (
    <div className="flex flex-col items-start justify-start h-full gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col items-center justify-center gap-6 text-center md:min-h-[calc(100dvh-13rem)] min-h-[calc(100dvh-8rem)] max-w-2xl mx-auto">
        <h1 className="md:text-6xl text-5xl font-bold text-center capitalize">
          Turn your influence into interaction
        </h1>
        <p className="md:text-base text-sm">
          MirrorMe turns your influence into interaction with an AI version of
          you, powered by X402 micropayments, a dynamic reputation score, and
          seamless discoverability through ERC-8004
        </p>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center mt-6">
          <Link
            href="/mirrors"
            className="bg-white text-secondary px-6 py-4 rounded-full font-black text-xl hover:bg-secondary hover:text-white transition-all duration-300 flex items-center justify-center"
          >
            Explore Mirrors
          </Link>
          <Link
            href="/#how-it-works"
            className="bg-transparent text-white px-6 py-4 rounded-full font-black text-xl hover:bg-secondary hover:text-white transition-all duration-300 flex items-center justify-center"
          >
            Read more
          </Link>
        </div>
      </div>
      <div
        id="how-it-works"
        className="min-h-[calc(100dvh-8rem)] w-full flex flex-col-reverse md:grid grid-cols-2 items-center gap-6 max-w-6xl mx-auto"
      >
        <div className="flex flex-col items-start justify-start gap-6 text-left">
          <h1 className="md:text-6xl text-5xl font-bold text-left capitalize">
            Why do you need a MirrorMe?
          </h1>
          <p className="md:text-base text-sm">
            MirrorMe is a platform that allows you to create a mirror of your
            social media presence. Think of it as a digital twin of yourself
            that can interact with your followers and engage with your content.
          </p>
        </div>

        <div ref={lottieRef} className="flex md:items-end md:justify-end justify-center items-center">
          {shouldPlay ? (
            <Lottie
              animationData={mirrorAnimation}
              loop={true}
              style={{ width: isMobile ? 300 : 400, height: isMobile ? 300 : 400 }}
            />
          ) : (
            <MirrorIcon width={400} height={400} />
          )}
        </div>
      </div>
      <div className="min-h-[calc(100dvh-8rem)] w-full flex flex-col md:grid grid-cols-2 items-center gap-6 max-w-6xl mx-auto">
        <div className="flex items-start justify-start">
          <Image src="/graphics/interactions.svg" alt="MirrorMe" width={550} height={550} />
        </div>
        <div className="flex flex-col md:items-end md:justify-end justify-start items-start gap-6 text-right">
          <h1 className="md:text-6xl text-5xl font-bold md:text-right text-left capitalize">
            How does it work?
          </h1>
          <p className="md:text-base text-sm md:text-right text-left">
            MirrorMe works by creating a mirror of your social media presence.
            It tracks your activity and interactions, and uses that data to
            create a mirror of you which can interact and provide paid services example booking a meeting using x402 micropayments. All the mirror agents are discoverable through ERC-8004 with a dynamic reputation score.
          </p>
        </div>
      </div>
    </div>
  );
}
