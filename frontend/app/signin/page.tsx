"use client";
import { SignIn } from "@coinbase/cdp-react";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="rounded-3xl overflow-hidden max-w-lg w-full">
        <SignIn />
      </div>
    </div>
  );
}
