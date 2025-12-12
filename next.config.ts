import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deshabilita los source maps en producción
  productionBrowserSourceMaps: false,
  webpack(config, { dev, isServer }) {
    if (dev && isServer) {
      // Deshabilita los source maps del servidor en desarrollo
      config.devtool = false;
    }
    return config;
  },
};

export default nextConfig;
