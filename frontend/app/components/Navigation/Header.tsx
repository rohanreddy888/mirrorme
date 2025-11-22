"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEvmAddress, useSignOut } from "@coinbase/cdp-hooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { truncate } from "@/lib/utils";
import { AuthButton } from "@coinbase/cdp-react";
import { DoorOpen, User } from "lucide-react";
import CopyButton from "../CopyButton";

export default function Header() {
  const router = useRouter();
  const { evmAddress } = useEvmAddress();
  const { signOut } = useSignOut();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="w-full fixed top-6 z-50 bg-white backdrop-blur-sm px-6 py-4 rounded-full shadow-md max-w-7xl flex items-center justify-between">
      <Link href={"/"}>
        <Image
          className="ml-2"
          src="/assets/logo-dark.svg"
          alt="Logo"
          width={180}
          height={180}
        />
      </Link>
      <nav>
        <ul className="flex items-center gap-6 text-background font-semibold">
          {evmAddress && (
            <>
              <li>
                <Link href="/mirrors">Mirrors</Link>
              </li>
              <li>
                <Link href="/profile">Profile</Link>
              </li>
            </>
          )}
          {evmAddress ? (
            <li>
              <DropdownMenu>
                <div className="bg-secondary text-white px-4 py-3 rounded-full font-semibold text-base flex items-center gap-2">
                  <DropdownMenuTrigger className="focus:outline-none">
                    {truncate(evmAddress, 4)}
                  </DropdownMenuTrigger>
                  <CopyButton textToCopy={evmAddress} />
                </div>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="hover:bg-red-600 hover:text-white text-sm font-semibold"
                  >
                    <DoorOpen className="size-6" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ) : (
            <li>
              <AuthButton className="bg-secondary text-white p-0 rounded-full font-bold text-base capitalize" />
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}
