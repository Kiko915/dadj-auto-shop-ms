import ImageKit from 'imagekit-javascript'

const imagekit = new ImageKit({
  publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || 'your_public_key',
  urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/your_imagekit_id'
})

export default imagekit
