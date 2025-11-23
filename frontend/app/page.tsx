"use client";
import MirrorIcon from "@/lib/icons/mirror";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import mirrorAnimation from "@/public/lottie/mirror.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function Home() {
  const lottieRef = useRef<HTMLDivElement>(null);
  const [shouldPlay, setShouldPlay] = useState(false);

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
      <div className="flex flex-col items-center justify-center gap-6 text-center min-h-[calc(100dvh-8rem)] max-w-2xl mx-auto">
        <h1 className="md:text-6xl text-5xl font-bold text-center capitalize">
          Turn your influence into interaction
        </h1>
        <p className="md:text-base text-sm">
          MirrorMe turns your influence into interaction with an AI version of
          you, powered by X402 micropayments, a dynamic reputation score, and
          seamless discoverability through ERC-8004
        </p>
        <div className="flex gap-4 items-center justify-center">
          <Link
            href="/mirrors"
            className="bg-white text-secondary px-6 py-4 rounded-full font-black text-xl mt-6 hover:bg-secondary hover:text-white transition-all duration-300 flex items-center justify-center"
          >
            Explore Mirrors
          </Link>
          <Link
            href="/#how-it-works"
            className="bg-transparent text-white px-6 py-4 rounded-full font-black text-xl mt-6 hover:bg-secondary hover:text-white transition-all duration-300 flex items-center justify-center"
          >
            Read more
          </Link>
        </div>
      </div>
      <div
        id="how-it-works"
        className="min-h-[calc(100dvh-8rem)] w-full grid grid-cols-2 items-center gap-6"
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

        <div ref={lottieRef} className="flex items-end justify-end">
          {shouldPlay ? (
            <Lottie
              animationData={mirrorAnimation}
              loop={true}
              style={{ width: 400, height: 400 }}
            />
          ) : (
            <MirrorIcon width={400} height={400} />
          )}
        </div>
      </div>
      <div className="min-h-[calc(100dvh-8rem)] w-full grid grid-cols-2 items-center gap-6">
        <div ref={lottieRef} className="flex items-start justify-start">
          {shouldPlay ? (
            <Lottie
              animationData={mirrorAnimation}
              loop={true}
              style={{ width: 300, height: 300 }}
            />
          ) : (
            <MirrorIcon width={300} height={300} />
          )}
        </div>
        <div className="flex flex-col items-end justify-end gap-6 text-right">
          <h1 className="md:text-6xl text-5xl font-bold text-right capitalize">
            How does it work?
          </h1>
          <p className="md:text-base text-sm">
            MirrorMe works by creating a mirror of your social media presence.
            It tracks your activity and interactions, and uses that data to
            create a mirror of your social media presence.
          </p>
        </div>
      </div>
    </div>
  );
}
