/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      // ONNX Runtime Web configuration
      config.resolve.alias['onnxruntime-node'] = 'onnxruntime-web';
  
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          path: false,
        };
      }
  
      // Add rule for .node files
      config.module.rules.push({
        test: /\.node$/,
        use: 'node-loader',
      });
  
      return config;
    },
    experimental: {
      serverComponentsExternalPackages: ['@xenova/transformers'],
    },
  };
  
  export default nextConfig;