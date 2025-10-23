import ImageKit from 'imagekit';

// Debug: Log environment variables (remove after testing)
console.log('🔍 ImageKit Configuration Debug:');
console.log('Public Key:', process.env.IMAGEKIT_PUBLIC_KEY);
console.log('Private Key exists:', !!process.env.IMAGEKIT_PRIVATE_KEY);
console.log('Private Key length:', process.env.IMAGEKIT_PRIVATE_KEY?.length);
console.log('URL Endpoint:', process.env.IMAGEKIT_URL_ENDPOINT);

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

export default imagekit;
