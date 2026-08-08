export const assetTypeConfig = {
  stock: {
    icon: "fa-chart-line",
    color: "#22c55e",
    gradient: "from-green-400 to-green-600",
  },
  crypto: {
    icon: "fa-coins",
    color: "#f59e0b",
    gradient: "from-yellow-400 to-yellow-600",
  },
  savings: {
    icon: "fa-piggy-bank",
    color: "#3b82f6",
    gradient: "from-blue-400 to-blue-600",
  },
  stock_options: {
    icon: "fa-chart-bar",
    color: "#a855f7",
    gradient: "from-purple-400 to-purple-600",
  },
  cash: {
    icon: "fa-dollar-sign",
    color: "#10b981",
    gradient: "from-emerald-400 to-emerald-600",
  },
  bond: {
    icon: "fa-file-contract",
    color: "#6366f1",
    gradient: "from-indigo-400 to-indigo-600",
  },
  other: {
    icon: "fa-coins",
    color: "#64748b",
    gradient: "from-slate-400 to-slate-600",
  },
};

// Crypto-specific icons
export const getCryptoIcon = (symbol: string): string => {
  const cryptoIcons: Record<string, string> = {
    BTC: "fab fa-bitcoin",
    ETH: "fab fa-ethereum",
    ADA: "fas fa-coins",
    DOT: "fas fa-circle-dot",
    LINK: "fas fa-link",
    XRP: "fas fa-water",
    LTC: "fab fa-litecoin-sign",
    BCH: "fab fa-bitcoin",
    BNB: "fas fa-fire",
    SOL: "fas fa-sun",
    DOGE: "fas fa-dog",
    MATIC: "fas fa-diamond",
    UNI: "fas fa-unicorn",
    AVAX: "fas fa-mountain",
    ATOM: "fas fa-atom",
    FTM: "fas fa-ghost",
    ALGO: "fas fa-cubes",
    VET: "fas fa-shield",
    NEAR: "fas fa-infinity",
    FLOW: "fas fa-river",
    USDT: "fas fa-dollar-sign",
    USDC: "fas fa-dollar-sign",
    DAI: "fas fa-dollar-sign",
  };
  return cryptoIcons[symbol?.toUpperCase()] || "fas fa-coins";
};

export type AssetType = keyof typeof assetTypeConfig;