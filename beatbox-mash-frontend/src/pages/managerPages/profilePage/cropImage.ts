/* eslint-disable @typescript-eslint/no-explicit-any */
// cropImage.ts
export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous'); // To avoid CORS issues with canvas
      image.src = url;
    });
  
const getCroppedImg = async (imageSrc: string, crop: any) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }
    
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelCrop = crop;
    
    canvas.width = 200; // Desired width
    canvas.height = 200; // Desired height
    
    ctx.drawImage(
        image,
        pixelCrop.x * scaleX,
        pixelCrop.y * scaleY,
        pixelCrop.width * scaleX,
        pixelCrop.height * scaleY,
        0,
        0,
        200,
        200
    );
    
    return new Promise<File>((resolve, reject) => {
        canvas.toBlob((blob) => {
        if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
        }
        const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
        resolve(file);
        }, 'image/jpeg');
    });
};
export default getCroppedImg;
