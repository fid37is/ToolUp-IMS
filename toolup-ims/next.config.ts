// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['drive.google.com', 'lh3.googleusercontent.com'],
  },
  // Important: Do not expose server env variables to the browser
  // The following are accessible only in API routes and server components
  serverRuntimeConfig: {
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
    GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID,
  },
  // These are exposed to the browser
  publicRuntimeConfig: {},
}

module.exports = nextConfig