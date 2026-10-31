/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@xyflow/react',
      'radix-ui',
    ],
  },
};

export default nextConfig;
