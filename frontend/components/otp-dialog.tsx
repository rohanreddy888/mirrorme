"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2 } from "lucide-react";

interface OTPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  onVerify: () => void;
  isVerifying?: boolean;
  error?: string;
  maxLength?: number;
}

export function OTPDialog({
  open,
  onOpenChange,
  title,
  description,
  value,
  onChange,
  onVerify,
  isVerifying = false,
  error,
  maxLength = 6,
}: OTPDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const content = (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex justify-center w-full">
        <InputOTP
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          disabled={isVerifying}
          className="w-full h-12"
        >
          <InputOTPGroup className=" grid grid-cols-6 gap-2 w-full">
            {Array.from({ length: maxLength }).map((_, index) => (
              <InputOTPSlot key={index} index={index} className="h-12 w-12 first:rounded-xl rounded-xl last:rounded-xl border" />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      <Button
        onClick={onVerify}
        disabled={value.length !== maxLength || isVerifying}
        className="w-full"
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Verifying...
          </>
        ) : (
          "Verify Code"
        )}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">{content}</div>
        <DrawerFooter className="pt-0">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

