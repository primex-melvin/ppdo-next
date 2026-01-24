// app/(extra)/canvas/_components/editor/utils/image-compress.ts

export const compressImage = (
  file: File,
  maxWidth: number = 300,
  maxHeight: number = 300,
  quality: number = 0.8
): Promise<{ dataUrl: string; thumbnail: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Generate thumbnail
        const thumbnailCanvas = document.createElement('canvas');
        const thumbCtx = thumbnailCanvas.getContext('2d');
        if (!thumbCtx) return reject(new Error('Cannot get canvas context'));

        const thumbSize = 100;
        thumbnailCanvas.width = thumbSize;
        thumbnailCanvas.height = thumbSize;

        // Calculate aspect ratio
        const scale = Math.min(thumbSize / img.width, thumbSize / img.height);
        const x = (thumbSize - img.width * scale) / 2;
        const y = (thumbSize - img.height * scale) / 2;

        thumbCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
        const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.7);

        // Compress main image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Cannot get canvas context'));

        const scale2 = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        canvas.width = img.width * scale2;
        canvas.height = img.height * scale2;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        resolve({ dataUrl, thumbnail });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
