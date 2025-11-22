"use client";
import { CDPReactProvider, type Config, type Theme } from "@coinbase/cdp-react";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { useEffect } from "react";

const config: Config = {
  projectId: "77b4a002-c324-4861-9666-cf4f531425d0",
  ethereum: {
    createOnLogin: "smart",
  },
  appName: "MirrorME",
  appLogoUrl: "https://www.mirrorme.fun/assets/icon-dar.svg",
  authMethods: ["oauth:x"], // Twitter is the primary login method
  showCoinbaseFooter: true,
};

export const theme: Partial<Theme> = {
  "colors-bg-default": "#ffffff",
  "colors-bg-alternate": "#eef0f3",
  "colors-bg-primary": "#7a00ff",
  "colors-bg-secondary": "#eef0f3",
  "colors-fg-default": "#0a0b0d",
  "colors-fg-muted": "#5b616e",
  "colors-fg-primary": "#7a00ff",
  "colors-fg-onPrimary": "#ffffff",
  "colors-fg-onSecondary": "#0a0b0d",
  "colors-fg-positive": "#098551",
  "colors-fg-negative": "#cf202f",
  "colors-fg-warning": "#ed702f",
  "colors-line-default": "#dcdfe4",
  "colors-line-heavy": "#9397a0",
  "borderRadius-cta": "var(--cdp-web-borderRadius-full)",
  "borderRadius-link": "var(--cdp-web-borderRadius-full)",
  "borderRadius-input": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-select-trigger": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-select-list": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-modal": "var(--cdp-web-borderRadius-xl)",
  "font-family-sans": "'Inter', 'Inter Fallback'",
};

function AuthCookieManager({ children }: { children: React.ReactNode }) {
  const { evmAddress } = useEvmAddress();

  useEffect(() => {
    // Set a cookie when user is authenticated to enable server-side middleware checks
    if (evmAddress) {
      document.cookie = `cdp-auth-token=authenticated; path=/; max-age=86400; SameSite=Lax`;
    } else {
      // Remove cookie when user is not authenticated
      document.cookie = `cdp-auth-token=; path=/; max-age=0; SameSite=Lax`;
    }
  }, [evmAddress]);

  return <>{children}</>;
}

export default function CDPProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CDPReactProvider config={config} theme={theme}>
      <AuthCookieManager>{children}</AuthCookieManager>
    </CDPReactProvider>
  );
}
