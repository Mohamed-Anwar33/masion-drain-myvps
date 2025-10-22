import { apiClient as api } from './apiClient';

export interface AboutSection {
  title: {
    en: string;
    ar: string;
  };
  subtitle: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  legacy: {
    en: string;
    ar: string;
  };
  values: {
    craftsmanship: {
      title: {
        en: string;
        ar: string;
      };
      description: {
        en: string;
        ar: string;
      };
    };
    elegance: {
      title: {
        en: string;
        ar: string;
      };
      description: {
        en: string;
        ar: string;
      };
    };
    exclusivity: {
      title: {
        en: string;
        ar: string;
      };
      description: {
        en: string;
        ar: string;
      };
    };
  };
  statistics: {
    collections: {
      value: string;
      label: {
        en: string;
        ar: string;
      };
    };
    clients: {
      value: string;
      label: {
        en: string;
        ar: string;
      };
    };
    countries: {
      value: string;
      label: {
        en: string;
        ar: string;
      };
    };
  };
  showSection: boolean;
  showStatistics: boolean;
  showValues: boolean;
}

export interface FeaturedCollection {
  _id?: string;
  name: {
    en: string;
    ar: string;
  };
  description: {
    en: string;
    ar: string;
  };
  image: {
    url: string;
    cloudinaryId?: string;
    alt?: {
      en?: string;
      ar?: string;
    };
  };
  category: {
    en: string;
    ar: string;
  };
  price: {
    value: number;
    currency: string;
    displayPrice?: {
      en?: string;
      ar?: string;
    };
  };
  slug: string;
  featured: boolean;
  order: number;
  isActive: boolean;
  rating: number;
  link?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeaturedCollectionsSection {
  title: {
    en: string;
    ar: string;
  };
  subtitle: {
    en: string;
    ar: string;
  };
  collections: FeaturedCollection[];
  showSection: boolean;
  maxCollections: number;
  showPrices: boolean;
  showRatings: boolean;
  showViewAllButton: boolean;
  viewAllButtonText: {
    en: string;
    ar: string;
  };
  viewAllButtonLink: string;
}

export interface HeroSection {
  badge: {
    en: string;
    ar: string;
  };
  title: {
    en: string;
    ar: string;
  };
  subtitle: {
    en: string;
    ar: string;
  };
  cta: {
    primary: {
      text: {
        en: string;
        ar: string;
      };
      link: string;
    };
    secondary: {
      text: {
        en: string;
        ar: string;
      };
      link: string;
    };
  };
  images: {
    main: {
      url: string;
      cloudinaryId: string;
      alt: {
        en: string;
        ar: string;
      };
    };
    slideshow: Array<{
      url: string;
      cloudinaryId: string;
      alt: {
        en: string;
        ar: string;
      };
      order: number;
    }>;
  };
  showSection: boolean;
  showBadge: boolean;
  showSlideshow: boolean;
  slideshowInterval: number;
}

export interface HomePageContent {
  _id?: string;
  // Hero Section - New Structure
  hero: HeroSection;

  // About Section
  aboutTitle: string;
  aboutDescription: string;
  aboutImage: string;
  showAboutSection: boolean;

  // Featured Products Section
  featuredProductsTitle: string;
  featuredProductsSubtitle: string;
  showFeaturedProducts: boolean;
  featuredProductsLimit: number;

  // Categories Section
  categoriesTitle: string;
  categoriesSubtitle: string;
  showCategories: boolean;

  // Newsletter Section
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterButtonText: string;
  showNewsletter: boolean;

  // Contact Section
  contactTitle: string;
  contactDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  showContact: boolean;

  // Social Media Links
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
    tiktok: string;
  };

  // SEO Settings
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;

  // Email Settings
  contactFormEmail: string;
  newsletterEmail: string;
  orderNotificationEmail: string;

  // Display Settings
  showTestimonials: boolean;
  showBlog: boolean;

  // Custom CSS & JS
  customCSS: string;
  customJS: string;

  // Maintenance Mode
  maintenanceMode: boolean;
  maintenanceMessage: string;

  // Metadata
  lastUpdated?: Date;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class HomePageService {
  private baseUrl = '/homepage';

  // Get homepage content
  async getContent(): Promise<HomePageContent> {
    try {
      const response = await api.get<ApiResponse<HomePageContent>>(this.baseUrl);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch homepage content');
    } catch (error: any) {
      console.error('Error fetching homepage content:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch homepage content');
    }
  }

  // Update entire homepage content (Admin only)
  async updateContent(content: Partial<HomePageContent>): Promise<HomePageContent> {
    try {
      const response = await api.put<ApiResponse<HomePageContent>>(this.baseUrl, content);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update homepage content');
    } catch (error: any) {
      console.error('Error updating homepage content:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update homepage content');
    }
  }

  // Update specific section
  async updateSection(section: string, data: any): Promise<HomePageContent> {
    try {
      const response = await api.put<ApiResponse<HomePageContent>>(`${this.baseUrl}/section/${section}`, data);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || `Failed to update ${section} section`);
    } catch (error: any) {
      console.error(`Error updating ${section} section:`, error);
      throw new Error(error.response?.data?.message || error.message || `Failed to update ${section} section`);
    }
  }

  // Get Hero Section specifically
  async getHeroSection(): Promise<HeroSection> {
    try {
      const response = await api.get<ApiResponse<HeroSection>>(`${this.baseUrl}/hero`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch hero section');
    } catch (error: any) {
      console.error('Error fetching hero section:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch hero section');
    }
  }

  // Update hero section with new structure
  async updateHeroSection(data: Partial<HeroSection>): Promise<HeroSection> {
    try {
      const response = await api.put<ApiResponse<HeroSection>>(`${this.baseUrl}/hero`, data);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update hero section');
    } catch (error: any) {
      console.error('Error updating hero section:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update hero section');
    }
  }

  // Add image to hero slideshow
  async addHeroImage(imageData: {
    url: string;
    cloudinaryId?: string;
    alt?: {
      en: string;
      ar: string;
    };
    order?: number;
  }): Promise<HeroSection['images']['slideshow']> {
    try {
      const response = await api.post<ApiResponse<HeroSection['images']['slideshow']>>(`${this.baseUrl}/hero/images`, imageData);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to add hero image');
    } catch (error: any) {
      console.error('Error adding hero image:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to add hero image');
    }
  }

  // Remove image from hero slideshow
  async removeHeroImage(imageIndex: number): Promise<HeroSection['images']['slideshow']> {
    try {
      const response = await api.delete<ApiResponse<HeroSection['images']['slideshow']>>(`${this.baseUrl}/hero/images/${imageIndex}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to remove hero image');
    } catch (error: any) {
      console.error('Error removing hero image:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to remove hero image');
    }
  }

  // Legacy update about section (deprecated - use new About Section API)
  async updateAboutSectionLegacy(data: {
    aboutTitle?: string;
    aboutDescription?: string;
    aboutImage?: string;
    showAboutSection?: boolean;
  }): Promise<HomePageContent> {
    return this.updateSection('about', data);
  }

  // Update featured products section
  async updateFeaturedProductsSection(data: {
    featuredProductsTitle?: string;
    featuredProductsSubtitle?: string;
    showFeaturedProducts?: boolean;
    featuredProductsLimit?: number;
  }): Promise<HomePageContent> {
    return this.updateSection('featuredProducts', data);
  }

  // Update categories section
  async updateCategoriesSection(data: {
    categoriesTitle?: string;
    categoriesSubtitle?: string;
    showCategories?: boolean;
  }): Promise<HomePageContent> {
    return this.updateSection('categories', data);
  }

  // Update newsletter section
  async updateNewsletterSection(data: {
    newsletterTitle?: string;
    newsletterDescription?: string;
    newsletterButtonText?: string;
    showNewsletter?: boolean;
  }): Promise<HomePageContent> {
    return this.updateSection('newsletter', data);
  }

  // Update contact section
  async updateContactSection(data: {
    contactTitle?: string;
    contactDescription?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    showContact?: boolean;
  }): Promise<HomePageContent> {
    return this.updateSection('contact', data);
  }

  // Update social media links
  async updateSocialMediaSection(data: {
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      youtube?: string;
      tiktok?: string;
    };
  }): Promise<HomePageContent> {
    return this.updateSection('socialMedia', data);
  }

  // Update SEO settings
  async updateSEOSection(data: {
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
  }): Promise<HomePageContent> {
    return this.updateSection('seo', data);
  }

  // Update email settings
  async updateEmailSection(data: {
    contactFormEmail?: string;
    newsletterEmail?: string;
    orderNotificationEmail?: string;
  }): Promise<HomePageContent> {
    return this.updateSection('email', data);
  }

  // Update display settings
  async updateDisplaySection(data: {
    showHeroSection?: boolean;
    showAboutSection?: boolean;
    showFeaturedProducts?: boolean;
    showCategories?: boolean;
    showNewsletter?: boolean;
    showContact?: boolean;
    showTestimonials?: boolean;
    showBlog?: boolean;
  }): Promise<HomePageContent> {
    return this.updateSection('display', data);
  }

  // Update maintenance settings
  async updateMaintenanceSection(data: {
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
  }): Promise<HomePageContent> {
    return this.updateSection('maintenance', data);
  }

  // Reset to default content
  async resetToDefault(): Promise<HomePageContent> {
    try {
      const response = await api.post<ApiResponse<HomePageContent>>(`${this.baseUrl}/reset`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to reset homepage content');
    } catch (error: any) {
      console.error('Error resetting homepage content:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to reset homepage content');
    }
  }

  // Get content history
  async getContentHistory(): Promise<{ lastUpdated?: Date; updatedBy?: any }> {
    try {
      const response = await api.get<ApiResponse<{ lastUpdated?: Date; updatedBy?: any }>>(`${this.baseUrl}/history`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch content history');
    } catch (error: any) {
      console.error('Error fetching content history:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch content history');
    }
  }

  // About Section methods
  async getAboutSection(): Promise<AboutSection> {
    try {
      const response = await api.get('/homepage/about');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching about section:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch about section');
    }
  }

  async updateAboutSection(data: Partial<AboutSection>): Promise<AboutSection> {
    try {
      const response = await api.put('/homepage/about', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating about section:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update about section');
    }
  }

  // Featured Collections methods
  async getFeaturedCollections(): Promise<FeaturedCollectionsSection> {
    try {
      const response = await api.get('/homepage/featured-collections');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching featured collections:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch featured collections');
    }
  }

  async updateFeaturedCollections(data: Partial<FeaturedCollectionsSection>): Promise<FeaturedCollectionsSection> {
    try {
      const response = await api.put('/homepage/featured-collections', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating featured collections:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update featured collections');
    }
  }

  async addFeaturedCollection(data: Omit<FeaturedCollection, '_id' | 'createdAt' | 'updatedAt'>): Promise<FeaturedCollectionsSection> {
    try {
      const response = await api.post('/homepage/featured-collections/collection', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error adding featured collection:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to add featured collection');
    }
  }

  async updateFeaturedCollection(collectionId: string, data: Partial<FeaturedCollection>): Promise<FeaturedCollectionsSection> {
    try {
      const response = await api.put(`/homepage/featured-collections/collection/${collectionId}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating featured collection:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update featured collection');
    }
  }

  async removeFeaturedCollection(collectionId: string): Promise<FeaturedCollectionsSection> {
    try {
      const response = await api.delete(`/homepage/featured-collections/collection/${collectionId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error removing featured collection:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to remove featured collection');
    }
  }
}

export default new HomePageService();
