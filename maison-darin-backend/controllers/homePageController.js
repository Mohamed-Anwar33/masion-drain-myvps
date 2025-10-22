const HomePageContent = require('../models/HomePageContent');
const { validationResult } = require('express-validator');

// Get homepage content
const getHomePageContent = async (req, res) => {
  try {
    const content = await HomePageContent.getSingleton();
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching homepage content',
      error: error.message
    });
  }
};

// Update homepage content (Admin only)
const updateHomePageContent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const content = await HomePageContent.updateSingleton(updateData, userId);

    res.json({
      success: true,
      message: 'Homepage content updated successfully',
      data: content
    });
  } catch (error) {
    console.error('Error updating homepage content:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating homepage content',
      error: error.message
    });
  }
};

// Update specific section
const updateSection = async (req, res) => {
  try {
    const { section } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    // Validate section exists
    const validSections = [
      'hero', 'about', 'featuredProducts', 'categories', 
      'newsletter', 'contact', 'socialMedia', 'seo', 
      'email', 'display', 'maintenance'
    ];

    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid section specified'
      });
    }

    let content = await HomePageContent.getSingleton();
    
    // Update specific section based on section type
    switch (section) {
      case 'hero':
        if (updateData.hero) {
          // Deep merge hero object
          content.hero = {
            ...content.hero,
            ...updateData.hero,
            badge: updateData.hero.badge ? { ...content.hero.badge, ...updateData.hero.badge } : content.hero.badge,
            title: updateData.hero.title ? { ...content.hero.title, ...updateData.hero.title } : content.hero.title,
            subtitle: updateData.hero.subtitle ? { ...content.hero.subtitle, ...updateData.hero.subtitle } : content.hero.subtitle,
            cta: updateData.hero.cta ? {
              primary: updateData.hero.cta.primary ? {
                ...content.hero.cta.primary,
                ...updateData.hero.cta.primary,
                text: updateData.hero.cta.primary.text ? { ...content.hero.cta.primary.text, ...updateData.hero.cta.primary.text } : content.hero.cta.primary.text
              } : content.hero.cta.primary,
              secondary: updateData.hero.cta.secondary ? {
                ...content.hero.cta.secondary,
                ...updateData.hero.cta.secondary,
                text: updateData.hero.cta.secondary.text ? { ...content.hero.cta.secondary.text, ...updateData.hero.cta.secondary.text } : content.hero.cta.secondary.text
              } : content.hero.cta.secondary
            } : content.hero.cta,
            images: updateData.hero.images ? {
              main: updateData.hero.images.main ? {
                ...content.hero.images.main,
                ...updateData.hero.images.main,
                alt: updateData.hero.images.main.alt ? { ...content.hero.images.main.alt, ...updateData.hero.images.main.alt } : content.hero.images.main.alt
              } : content.hero.images.main,
              slideshow: updateData.hero.images.slideshow || content.hero.images.slideshow
            } : content.hero.images
          };
        }
        break;
      
      case 'about':
        if (updateData.aboutTitle !== undefined) content.aboutTitle = updateData.aboutTitle;
        if (updateData.aboutDescription !== undefined) content.aboutDescription = updateData.aboutDescription;
        if (updateData.aboutImage !== undefined) content.aboutImage = updateData.aboutImage;
        if (updateData.showAboutSection !== undefined) content.showAboutSection = updateData.showAboutSection;
        break;
      
      case 'featuredProducts':
        if (updateData.featuredProductsTitle !== undefined) content.featuredProductsTitle = updateData.featuredProductsTitle;
        if (updateData.featuredProductsSubtitle !== undefined) content.featuredProductsSubtitle = updateData.featuredProductsSubtitle;
        if (updateData.showFeaturedProducts !== undefined) content.showFeaturedProducts = updateData.showFeaturedProducts;
        if (updateData.featuredProductsLimit !== undefined) content.featuredProductsLimit = updateData.featuredProductsLimit;
        break;
      
      case 'categories':
        if (updateData.categoriesTitle !== undefined) content.categoriesTitle = updateData.categoriesTitle;
        if (updateData.categoriesSubtitle !== undefined) content.categoriesSubtitle = updateData.categoriesSubtitle;
        if (updateData.showCategories !== undefined) content.showCategories = updateData.showCategories;
        break;
      
      case 'newsletter':
        if (updateData.newsletterTitle !== undefined) content.newsletterTitle = updateData.newsletterTitle;
        if (updateData.newsletterDescription !== undefined) content.newsletterDescription = updateData.newsletterDescription;
        if (updateData.newsletterButtonText !== undefined) content.newsletterButtonText = updateData.newsletterButtonText;
        if (updateData.showNewsletter !== undefined) content.showNewsletter = updateData.showNewsletter;
        break;
      
      case 'contact':
        if (updateData.contactTitle !== undefined) content.contactTitle = updateData.contactTitle;
        if (updateData.contactDescription !== undefined) content.contactDescription = updateData.contactDescription;
        if (updateData.contactEmail !== undefined) content.contactEmail = updateData.contactEmail;
        if (updateData.contactPhone !== undefined) content.contactPhone = updateData.contactPhone;
        if (updateData.contactAddress !== undefined) content.contactAddress = updateData.contactAddress;
        if (updateData.showContact !== undefined) content.showContact = updateData.showContact;
        break;
      
      case 'socialMedia':
        if (updateData.socialMedia) {
          content.socialMedia = { ...content.socialMedia, ...updateData.socialMedia };
        }
        break;
      
      case 'seo':
        if (updateData.seoTitle !== undefined) content.seoTitle = updateData.seoTitle;
        if (updateData.seoDescription !== undefined) content.seoDescription = updateData.seoDescription;
        if (updateData.seoKeywords !== undefined) content.seoKeywords = updateData.seoKeywords;
        break;
      
      case 'email':
        if (updateData.contactFormEmail !== undefined) content.contactFormEmail = updateData.contactFormEmail;
        if (updateData.newsletterEmail !== undefined) content.newsletterEmail = updateData.newsletterEmail;
        if (updateData.orderNotificationEmail !== undefined) content.orderNotificationEmail = updateData.orderNotificationEmail;
        break;
      
      case 'display':
        if (updateData.showHeroSection !== undefined) content.showHeroSection = updateData.showHeroSection;
        if (updateData.showAboutSection !== undefined) content.showAboutSection = updateData.showAboutSection;
        if (updateData.showFeaturedProducts !== undefined) content.showFeaturedProducts = updateData.showFeaturedProducts;
        if (updateData.showCategories !== undefined) content.showCategories = updateData.showCategories;
        if (updateData.showNewsletter !== undefined) content.showNewsletter = updateData.showNewsletter;
        if (updateData.showContact !== undefined) content.showContact = updateData.showContact;
        if (updateData.showTestimonials !== undefined) content.showTestimonials = updateData.showTestimonials;
        if (updateData.showBlog !== undefined) content.showBlog = updateData.showBlog;
        break;
      
      case 'maintenance':
        if (updateData.maintenanceMode !== undefined) content.maintenanceMode = updateData.maintenanceMode;
        if (updateData.maintenanceMessage !== undefined) content.maintenanceMessage = updateData.maintenanceMessage;
        break;
    }

    content.lastUpdated = new Date();
    content.updatedBy = userId;
    await content.save();

    res.json({
      success: true,
      message: `${section} section updated successfully`,
      data: content
    });
  } catch (error) {
    console.error(`Error updating ${section} section:`, error);
    res.status(500).json({
      success: false,
      message: `Error updating ${section} section`,
      error: error.message
    });
  }
};

// Reset to default content
const resetToDefault = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Delete existing content
    await HomePageContent.deleteMany({});
    
    // Create new default content
    const content = await HomePageContent.create({
      updatedBy: userId
    });

    res.json({
      success: true,
      message: 'Homepage content reset to default successfully',
      data: content
    });
  } catch (error) {
    console.error('Error resetting homepage content:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting homepage content',
      error: error.message
    });
  }
};

// Get content history (if needed for audit)
const getContentHistory = async (req, res) => {
  try {
    const content = await HomePageContent.findOne()
      .populate('updatedBy', 'name email')
      .select('lastUpdated updatedBy');

    res.json({
      success: true,
      data: {
        lastUpdated: content?.lastUpdated,
        updatedBy: content?.updatedBy
      }
    });
  } catch (error) {
    console.error('Error fetching content history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content history',
      error: error.message
    });
  }
};

// Get Hero Section specifically
const getHeroSection = async (req, res) => {
  try {
    const content = await HomePageContent.getSingleton();
    res.json({
      success: true,
      data: content.hero || {}
    });
  } catch (error) {
    console.error('Error fetching hero section:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hero section',
      error: error.message
    });
  }
};

// Update Hero Section specifically
const updateHeroSection = async (req, res) => {
  try {
    const userId = req.user.id;
    const heroData = req.body;

    let content = await HomePageContent.getSingleton();
    
    // Initialize hero object if it doesn't exist
    if (!content.hero) {
      content.hero = {};
    }

    // Update only the fields that are provided and not undefined
    if (heroData.badge !== undefined) {
      content.hero.badge = { ...content.hero.badge, ...heroData.badge };
    }
    if (heroData.title !== undefined) {
      content.hero.title = { ...content.hero.title, ...heroData.title };
    }
    if (heroData.subtitle !== undefined) {
      content.hero.subtitle = { ...content.hero.subtitle, ...heroData.subtitle };
    }
    if (heroData.cta !== undefined) {
      content.hero.cta = {
        primary: heroData.cta.primary ? {
          ...content.hero.cta?.primary,
          ...heroData.cta.primary,
          text: heroData.cta.primary.text ? { ...content.hero.cta?.primary?.text, ...heroData.cta.primary.text } : content.hero.cta?.primary?.text
        } : content.hero.cta?.primary,
        secondary: heroData.cta.secondary ? {
          ...content.hero.cta?.secondary,
          ...heroData.cta.secondary,
          text: heroData.cta.secondary.text ? { ...content.hero.cta?.secondary?.text, ...heroData.cta.secondary.text } : content.hero.cta?.secondary?.text
        } : content.hero.cta?.secondary
      };
    }
    if (heroData.images !== undefined) {
      content.hero.images = {
        main: heroData.images.main ? {
          ...content.hero.images?.main,
          ...heroData.images.main,
          alt: heroData.images.main.alt ? { ...content.hero.images?.main?.alt, ...heroData.images.main.alt } : content.hero.images?.main?.alt
        } : content.hero.images?.main,
        slideshow: heroData.images.slideshow || content.hero.images?.slideshow
      };
    }
    if (heroData.showSection !== undefined) {
      content.hero.showSection = heroData.showSection;
    }
    if (heroData.showBadge !== undefined) {
      content.hero.showBadge = heroData.showBadge;
    }
    if (heroData.showSlideshow !== undefined) {
      content.hero.showSlideshow = heroData.showSlideshow;
    }
    if (heroData.slideshowInterval !== undefined) {
      content.hero.slideshowInterval = heroData.slideshowInterval;
    }

    content.lastUpdated = new Date();
    content.updatedBy = userId;
    await content.save();

    res.json({
      success: true,
      message: 'Hero section updated successfully',
      data: content.hero
    });
  } catch (error) {
    console.error('Error updating hero section:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating hero section',
      error: error.message
    });
  }
};

// Add image to hero slideshow
const addHeroImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { url, cloudinaryId, alt, order } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    let content = await HomePageContent.getSingleton();
    
    if (!content.hero) content.hero = {};
    if (!content.hero.images) content.hero.images = { slideshow: [] };
    if (!content.hero.images.slideshow) content.hero.images.slideshow = [];

    const newImage = {
      url,
      cloudinaryId: cloudinaryId || '',
      alt: alt || { en: 'Luxury Perfume Collection', ar: 'مجموعة العطور الفاخرة' },
      order: order || content.hero.images.slideshow.length
    };

    content.hero.images.slideshow.push(newImage);
    content.lastUpdated = new Date();
    content.updatedBy = userId;
    await content.save();

    res.json({
      success: true,
      message: 'Image added to hero slideshow successfully',
      data: content.hero.images.slideshow
    });
  } catch (error) {
    console.error('Error adding hero image:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding hero image',
      error: error.message
    });
  }
};

// Remove image from hero slideshow
const removeHeroImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageIndex } = req.params;

    let content = await HomePageContent.getSingleton();
    
    if (!content.hero?.images?.slideshow || content.hero.images.slideshow.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No images found in slideshow'
      });
    }

    if (imageIndex < 0 || imageIndex >= content.hero.images.slideshow.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }

    content.hero.images.slideshow.splice(imageIndex, 1);
    content.lastUpdated = new Date();
    content.updatedBy = userId;
    await content.save();

    res.json({
      success: true,
      message: 'Image removed from hero slideshow successfully',
      data: content.hero.images.slideshow
    });
  } catch (error) {
    console.error('Error removing hero image:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing hero image',
      error: error.message
    });
  }
};

// Get About Section
const getAboutSection = async (req, res) => {
  try {
    const content = await HomePageContent.getSingleton();
    res.json({
      success: true,
      data: content.about
    });
  } catch (error) {
    console.error('Error fetching about section:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching about section',
      error: error.message
    });
  }
};

// Update About Section
const updateAboutSection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user?.id || 'system';
    const aboutData = req.body;

    const content = await HomePageContent.getSingleton();
    
    // Update about section
    content.about = {
      ...content.about,
      ...aboutData
    };
    
    content.lastUpdated = new Date();
    content.updatedBy = userId;
    await content.save();

    res.json({
      success: true,
      message: 'About section updated successfully',
      data: content.about
    });
  } catch (error) {
    console.error('Error updating about section:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating about section',
      error: error.message
    });
  }
};

// Get Featured Collections Section data
const getFeaturedCollections = async (req, res) => {
  try {
    const content = await HomePageContent.getSingleton();
    
    res.json({
      success: true,
      data: content.featuredCollections || {
        title: { en: 'Featured Collections', ar: 'المجموعات المميزة' },
        subtitle: { en: 'Discover our most exclusive collections', ar: 'اكتشف أكثر مجموعاتنا حصرية' },
        collections: [],
        showSection: true,
        maxCollections: 3,
        showPrices: true,
        showRatings: true,
        showViewAllButton: true,
        viewAllButtonText: { en: 'View All Collections', ar: 'عرض جميع المجموعات' },
        viewAllButtonLink: '/products'
      }
    });
  } catch (error) {
    console.error('Error fetching featured collections:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured collections',
      error: error.message
    });
  }
};

// Update Featured Collections Section
const updateFeaturedCollections = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user?.id || 'system';
    const collectionsData = req.body;

    const content = await HomePageContent.getSingleton();
    
    // Update featured collections section
    content.featuredCollections = {
      ...content.featuredCollections,
      ...collectionsData
    };
    
    content.lastUpdated = new Date();
    content.updatedBy = userId;
    await content.save();

    res.json({
      success: true,
      message: 'Featured collections updated successfully',
      data: content.featuredCollections
    });
  } catch (error) {
    console.error('Error updating featured collections:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating featured collections',
      error: error.message
    });
  }
};

// Add a new collection to featured collections
const addFeaturedCollection = async (req, res) => {
  try {
    const userId = req.user?.id || 'system';
    const collectionData = req.body;
    
    const content = await HomePageContent.getSingleton();
    
    // Initialize collections array if it doesn't exist
    if (!content.featuredCollections) {
      content.featuredCollections = { collections: [] };
    }
    if (!content.featuredCollections.collections) {
      content.featuredCollections.collections = [];
    }

    // Add new collection
    content.featuredCollections.collections.push({
      ...collectionData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    content.lastUpdated = new Date();
    content.updatedBy = userId;
    await content.save();

    res.status(201).json({
      success: true,
      message: 'Collection added successfully',
      data: content.featuredCollections
    });
  } catch (error) {
    console.error('Error adding featured collection:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding collection',
      error: error.message
    });
  }
};

// Update a specific collection in featured collections
const updateFeaturedCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const updates = req.body;
    const userId = req.user?.id || 'system';
    
    const content = await HomePageContent.getSingleton();
    
    if (!content.featuredCollections?.collections) {
      return res.status(404).json({
        success: false,
        message: 'No collections found'
      });
    }

    // Find and update the collection
    const collectionIndex = content.featuredCollections.collections.findIndex(
      col => col._id.toString() === collectionId
    );

    if (collectionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    content.featuredCollections.collections[collectionIndex] = {
      ...content.featuredCollections.collections[collectionIndex],
      ...updates,
      updatedAt: new Date()
    };

    content.lastUpdated = new Date();
    content.updatedBy = userId;
    await content.save();

    res.json({
      success: true,
      message: 'Collection updated successfully',
      data: content.featuredCollections
    });
  } catch (error) {
    console.error('Error updating featured collection:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating collection',
      error: error.message
    });
  }
};

// Remove a collection from featured collections
const removeFeaturedCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const userId = req.user?.id || 'system';
    
    const content = await HomePageContent.getSingleton();
    
    if (!content.featuredCollections?.collections) {
      return res.status(404).json({
        success: false,
        message: 'No collections found'
      });
    }

    // Remove the collection
    content.featuredCollections.collections = content.featuredCollections.collections.filter(
      col => col._id.toString() !== collectionId
    );

    content.lastUpdated = new Date();
    content.updatedBy = userId;
    await content.save();

    res.json({
      success: true,
      message: 'Collection removed successfully',
      data: content.featuredCollections
    });
  } catch (error) {
    console.error('Error removing featured collection:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing collection',
      error: error.message
    });
  }
};

module.exports = {
  getHomePageContent,
  updateHomePageContent,
  updateSection,
  resetToDefault,
  getContentHistory,
  getHeroSection,
  updateHeroSection,
  addHeroImage,
  removeHeroImage,
  getAboutSection,
  updateAboutSection,
  getFeaturedCollections,
  updateFeaturedCollections,
  addFeaturedCollection,
  updateFeaturedCollection,
  removeFeaturedCollection
};
