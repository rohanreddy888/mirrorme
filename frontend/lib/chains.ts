export const chains = [
  {
    id: "base-sepolia",
    name: "Base Sepolia",
    symbol: "ETH",
    chainId: 84532,
    icon: "/chains/base.png",
  },
  {
    id: "polygon-amoy",
    name: "Polygon Amoy",
    symbol: "MATIC",
    chainId: 80002,
    icon: "/chains/polygon.png",
  },
];

export const getChainById = (id: number) => {
  return chains.find((chain) => chain.chainId === id);
};