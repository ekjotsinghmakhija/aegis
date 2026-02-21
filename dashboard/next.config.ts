/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // This creates an 'out' folder with static HTML/CSS/JS
  images: {
    unoptimized: true, // Required for static exports
  },
};

export default nextConfig;
