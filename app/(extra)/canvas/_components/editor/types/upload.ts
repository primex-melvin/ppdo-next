// app/(extra)/canvas/_components/editor/types/upload.ts

export interface UploadedImage {
  id: string;
  name: string;
  dataUrl: string; // base64 or blob URL
  thumbnail: string; // base64 thumbnail
  size: number; // bytes
  uploadedAt: number; // timestamp
  folderId: string | null; // null = root
  mimeType: string;
}

export interface UploadFolder {
  id: string;
  name: string;
  createdAt: number;
  parentId: string | null; // for nested folders if needed
  imageCount: number; // denormalized count for performance
}

export interface UploadStore {
  images: UploadedImage[];
  folders: UploadFolder[];
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
}
