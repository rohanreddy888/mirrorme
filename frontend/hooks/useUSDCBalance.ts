import { useState, useEffect } from "react";

export function useUSDCBalance(address: string) {
  const [balance, setBalance] = useState("0.00");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address || address === "0x0000000000000000000000000000000000000000") {
      setBalance("0.00");
      setIsLoading(false);
      return;
    }

    // TODO: Implement actual USDC balance fetching
    // For now, return a placeholder
    const fetchBalance = async () => {
      try {
        // Placeholder - replace with actual balance fetching logic
        setBalance("0.00");
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance("0.00");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [address]);

  return { balance, isLoading };
}

