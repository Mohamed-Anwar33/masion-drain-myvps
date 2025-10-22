import { apiClient } from './apiClient';

export interface UploadResponse {
  url: string;
  cloudinaryId: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface UploadError {
  message: string;
  code?: string;
  details?: any;
}

class UploadService {
  /**
   * Upload single image
   */
  async uploadImage(file: File, folder: string = 'products'): Promise<UploadResponse> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', folder);

      const response = await apiClient.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(files: File[], folder: string = 'products'): Promise<UploadResponse[]> {
    try {
      const uploadPromises = Array.from(files).map(file => 
        this.uploadImage(file, folder)
      );

      const results = await Promise.allSettled(uploadPromises);
      
      const successful: UploadResponse[] = [];
      const failed: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push(`File ${files[index].name}: ${result.reason.message}`);
        }
      });

      if (failed.length > 0) {
        console.warn('Some uploads failed:', failed);
      }

      return successful;
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw new Error('Failed to upload images');
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(cloudinaryId: string): Promise<void> {
    try {
      await apiClient.delete(`/upload/image/${cloudinaryId}`);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Delete multiple images
   */
  async deleteMultipleImages(cloudinaryIds: string[]): Promise<{
    deleted: number;
    failed: number;
    results: Array<{
      cloudinaryId: string;
      success: boolean;
      error?: string;
    }>;
  }> {
    try {
      const response = await apiClient.delete('/upload/images/bulk', {
        data: { cloudinaryIds }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error deleting multiple images:', error);
      throw new Error('Failed to delete images');
    }
  }

  /**
   * Get upload statistics
   */
  async getUploadStats(): Promise<{
    totalUploads: number;
    totalSize: number;
    byFolder: Array<{
      folder: string;
      count: number;
      size: number;
    }>;
    recentUploads: Array<{
      url: string;
      cloudinaryId: string;
      folder: string;
      uploadedAt: string;
      size: number;
    }>;
  }> {
    try {
      const response = await apiClient.get('/upload/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching upload stats:', error);
      throw new Error('Failed to fetch upload statistics');
    }
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'File must be an image' };
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    // Check supported formats
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedFormats.includes(file.type)) {
      return { valid: false, error: 'Supported formats: JPEG, PNG, WebP' };
    }

    return { valid: true };
  }

  /**
   * Generate optimized image URL with transformations
   */
  generateOptimizedUrl(
    cloudinaryId: string, 
    options: {
      width?: number;
      height?: number;
      quality?: 'auto' | number;
      format?: 'auto' | 'webp' | 'jpg' | 'png';
      crop?: 'fill' | 'fit' | 'scale' | 'crop';
    } = {}
  ): string {
    const baseUrl = 'https://res.cloudinary.com/your-cloud-name/image/upload';
    
    const transformations: string[] = [];
    
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    
    const transformationString = transformations.length > 0 
      ? `/${transformations.join(',')}`
      : '';
    
    return `${baseUrl}${transformationString}/${cloudinaryId}`;
  }
}

export const uploadService = new UploadService();