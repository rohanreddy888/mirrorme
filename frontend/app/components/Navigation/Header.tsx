"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSignOut, useCurrentUser } from "@coinbase/cdp-hooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, truncate } from "@/lib/utils";
import { AuthButton } from "@coinbase/cdp-react";
import { DoorOpen, User } from "lucide-react";
import CopyButton from "../CopyButton";
import { agentsApi, GetWalletResponse } from "@/lib/api";
import { useEffect, useState } from "react";
import MirrorIcon from "@/lib/icons/mirror";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useSignOut();
  const { currentUser } = useCurrentUser();
  const [wallet, setWallet] = useState<GetWalletResponse | null>(null);

  useEffect(() => {
    if (currentUser) {
      const fetchWallet = async () => {
        try {
          const wallet = await agentsApi.getWallet(
            currentUser.authenticationMethods.x?.username || ""
          );
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
    setWallet(null);
    router.push("/");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="w-full fixed top-0 md:top-6 z-50 bg-white backdrop-blur-sm px-6 py-4 rounded-none md:rounded-full shadow-md max-w-7xl flex items-center justify-between">
      <Link href={"/"}>
        <Image
          className="ml-2 hidden md:block"
          src="/assets/logo-dark.svg"
          alt="Logo"
          width={180}
          height={180}
        />
        <Image
          className="md:hidden block"
          src="/assets/icon-dark.svg"
          alt="Logo"
          width={40}
          height={40}
        />
      </Link>
      <nav className="md:block hidden">
        <ul className="flex items-center gap-6 text-background font-semibold text-base">
          {wallet && (
            <>
              <li className="flex items-center gap-2">
                <Link
                  className={cn(
                    "flex items-center gap-2",
                    isActive("/mirrors") && "text-secondary"
                  )}
                  href="/mirrors"
                >
                  <MirrorIcon className="size-5" />
                  Mirrors
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Link
                  className={cn(
                    "flex items-center gap-2",
                    isActive("/profile") && "text-secondary"
                  )}
                  href="/profile"
                >
                  <User className="size-5" />
                  Profile
                </Link>
              </li>
            </>
          )}

          {wallet ? (
            <li>
              <DropdownMenu>
                <div className="bg-secondary text-white px-4 py-3 rounded-full font-semibold text-base flex items-center gap-2">
                  <DropdownMenuTrigger className="focus:outline-none">
                    {truncate(wallet.address, 4)}
                  </DropdownMenuTrigger>
                  <CopyButton textToCopy={wallet.address || ""} />
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
