import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Prevent Next.js from bundling native addons and ESM-only packages
  // that the Tether WDK relies on (sodium-native, bip39, etc.)
  serverExternalPackages: [
    "@tetherto/wdk",
    "@tetherto/wdk-wallet",
    "@tetherto/wdk-wallet-evm",
    "sodium-native",
    "bip39",
  ],
};

export default nextConfig;
