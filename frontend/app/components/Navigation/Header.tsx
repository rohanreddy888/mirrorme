"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEvmAddress, useSignOut, useCurrentUser } from "@coinbase/cdp-hooks";
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
import { agentsApi, GetWalletResponse } from "@/lib/api";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const { evmAddress } = useEvmAddress();
  const { signOut } = useSignOut();
  const { currentUser } = useCurrentUser();
  const [wallet, setWallet] = useState<GetWalletResponse | null>(null);

  useEffect(() => {
    if (currentUser) {
    const fetchWallet = async () => {
      try {
        const wallet = await agentsApi.getWallet(currentUser.authenticationMethods.x?.username || '');
        setWallet(wallet);
      } catch (error) {
        console.error(error);
        setWallet(null);
      }
    };
    fetchWallet();
    }
  }, [currentUser]);

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
          <li>
            <Link href="/about">Features</Link>
          </li>
          <li>
            <Link href="/contact">Contact</Link>
          </li>
          {wallet ? (
            <li>
              <DropdownMenu>
               <div className="bg-secondary text-white px-4 py-3 rounded-full font-semibold text-base flex items-center gap-2">
               <DropdownMenuTrigger className="focus:outline-none">
                  {truncate(wallet.address, 4)} 
                </DropdownMenuTrigger>
                <CopyButton textToCopy={wallet.address || ''} />
               </div>
                <DropdownMenuContent>
                  <DropdownMenuItem className="text-sm" asChild>
                    <Link
                      className="hover:bg-secondary hover:text-white flex items-center gap-2 w-full"
                      href="/profile"
                    >
                      <User className="size-6" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="hover:bg-red-600 hover:text-white text-sm"
                  >
                    <DoorOpen className="size-6" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ) : (
            <li>
              <AuthButton className="bg-secondary text-white p-0 rounded-full font-semibold text-base" />
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}
