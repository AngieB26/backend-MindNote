import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Forzar Webpack para evitar conflictos con Turbopack
  webpack: (config) => config,

  // Silenciar error de Turbopack
  turbopack: {},
};

export default nextConfig;
