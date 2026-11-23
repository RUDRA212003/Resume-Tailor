/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      'pdf-parse',
      'mammoth',
      'docx',
      '@react-pdf/renderer',
      'pdfkit',
    ],
    outputFileTracingIncludes: {
      '/api/export/pdf': ['./node_modules/pdfkit/js/standard-fonts/**/*'],
      '/api/export/cover-letter-pdf': ['./node_modules/pdfkit/js/standard-fonts/**/*'],
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
