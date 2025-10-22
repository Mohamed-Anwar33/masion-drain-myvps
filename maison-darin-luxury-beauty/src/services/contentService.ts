import { apiClient } from './apiClient';

export type SectionKey = 'hero' | 'about' | 'nav' | 'contact' | 'collections' | 'footer';

export interface Bilingual<T> {
  en: T;
  ar: T;
}

export interface SectionContentMap {
  hero: Bilingual<Record<string, any>>;
  about: Bilingual<Record<string, any>>;
  nav: Bilingual<Record<string, any>>;
  contact: Bilingual<Record<string, any>>;
  collections: Bilingual<Record<string, any>>;
  footer: Bilingual<Record<string, any>>;
}

class ContentService {
  private baseUrl = '/content';

  async getTranslations(language?: 'en' | 'ar'): Promise<Partial<SectionContentMap>> {
    const response = await apiClient.get(`${this.baseUrl}/translations`, {
      params: language ? { language } : undefined,
    });
    return response.data.data;
  }

  async getSection(section: SectionKey, language?: 'en' | 'ar'): Promise<Bilingual<Record<string, any>> | Record<string, any>> {
    const response = await apiClient.get(`${this.baseUrl}/${section}`, {
      params: language ? { language } : undefined,
    });
    return response.data.data;
  }

  async updateSection(section: SectionKey, content: Bilingual<Record<string, any>>, changeLog?: string) {
    const response = await apiClient.put(`${this.baseUrl}/${section}`, {
      content,
      changeLog,
    });
    return response.data.data;
  }

  async validateSection(section: SectionKey, content: Bilingual<Record<string, any>>) {
    const response = await apiClient.post(`${this.baseUrl}/${section}/validate`, { content });
    return response.data.data as { section: SectionKey; isValid: boolean; errors: string[] };
  }

  async getHistory(section: SectionKey, limit: number = 10) {
    const response = await apiClient.get(`${this.baseUrl}/${section}/history`, { params: { limit } });
    return response.data.data;
  }

  async rollback(section: SectionKey, versionId: string, changeLog?: string) {
    const response = await apiClient.post(`${this.baseUrl}/${section}/rollback`, { versionId, changeLog });
    return response.data.data;
  }

  async bulkUpdate(contentUpdates: Partial<Record<SectionKey, Bilingual<Record<string, any>>>>, changeLog?: string) {
    const response = await apiClient.put(`${this.baseUrl}/translations`, { contentUpdates, changeLog });
    return response.data.data;
  }
}

export const contentService = new ContentService();


