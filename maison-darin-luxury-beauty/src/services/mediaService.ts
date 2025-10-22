import { apiClient } from './apiClient';

export interface MediaItem {
  _id: string;
  filename: string;
  originalName?: string;
  url: string;
  cloudinaryId: string;
  size: number;
  sizeFormatted?: string;
  mimetype: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  alt: { en?: string; ar?: string };
  tags?: string[];
  variants?: Record<string, string>;
  usageCount?: number;
  uploadedBy?: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface MediaQuery {
  page?: number;
  limit?: number;
  search?: string;
  mimetype?: 'image/jpeg' | 'image/png' | 'image/webp';
  tags?: string;
  uploadedBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MediaListResponse {
  media: MediaItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class MediaService {
  private baseUrl = '/media';

  async list(query: MediaQuery = {}): Promise<MediaListResponse> {
    const response = await apiClient.get(this.baseUrl, { params: query });
    return response.data.data as MediaListResponse;
  }

  async uploadImage(file: File, options: { altEn?: string; altAr?: string; tags?: string; folder?: string } = {}): Promise<MediaItem> {
    const formData = new FormData();
    formData.append('image', file);
    if (options.altEn) formData.append('altEn', options.altEn);
    if (options.altAr) formData.append('altAr', options.altAr);
    if (options.tags) formData.append('tags', options.tags);
    if (options.folder) formData.append('folder', options.folder);

    const response = await apiClient.post(`${this.baseUrl}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data as MediaItem;
  }

  async updateMetadata(id: string, data: { alt?: { en?: string; ar?: string }; tags?: string[] }): Promise<MediaItem> {
    const response = await apiClient.put(`${this.baseUrl}/${id}`, data);
    return response.data.data as MediaItem;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

export const mediaService = new MediaService();


