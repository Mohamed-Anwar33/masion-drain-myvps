/**
 * Multilingual Content Validation
 * 
 * This script validates multilingual content to ensure:
 * - Complete translations in both English and Arabic
 * - Proper text encoding and character validation
 * - Content consistency between languages
 * - Translation quality checks
 * 
 * Requirements: 2.1-2.6, 3.1-3.5
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Product = require('../../models/Product');
const Content = require('../../models/Content');

class MultilingualValidator {
  constructor() {
    this.validationResults = {
      products: {},
      content: {},
      textValidation: {},
      consistency: {},
      quality: {},
      overall: {}
    };
    this.errors = [];
    this.warnings = [];
    
    // Arabic and English text patterns
    this.arabicPattern = /[\u0600-\u06FF]/;
    this.englishPattern = /[a-zA-Z]/;
    this.arabicNumbers = /[\u0660-\u0669]/;
    this.englishNumbers = /[0-9]/;
  }

  /**
   * Main multilingual validation method
   */
  async validateMultilingualContent() {
    console.log('🌐 Starting multilingual content validation...');
    console.log('=' .repeat(60));
    
    try {
      // Connect to database
      await this.connectToDatabase();
      
      // Run all multilingual validation tests
      await this.validateProductTranslations();
      await this.validateContentTranslations();
      await this.validateTextEncoding();
      await this.validateContentConsistency();
      await this.validateTranslationQuality();
      
      // Generate multilingual validation report
      await this.generateMultilingualReport();
      
      // Display results
      this.displayMultilingualResults();
      
      console.log('✅ Multilingual content validation completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during multilingual validation:', error);
      throw error;
    } finally {
      await mongoose.connection.close();
    }
  }

  /**
   * Connect to database
   */
  async connectToDatabase() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/maison-darin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for multilingual validation');
  }

  /**
   * Validate product translations
   */
  async validateProductTranslations() {
    console.log('🔍 Validating product translations...');
    
    const products = await Product.find({});
    
    let totalProducts = products.length;
    let completeTranslations = 0;
    let englishComplete = 0;
    let arabicComplete = 0;
    let nameTranslations = 0;
    let descriptionTranslations = 0;
    let longDescriptionTranslations = 0;
    let fragranceNotesTranslations = 0;
    let concentrationTranslations = 0;
    let seoTranslations = 0;
    let imageAltTranslations = 0;
    
    for (const product of products) {
      let hasEnglish = true;
      let hasArabic = true;
      
      // Check name translations
      if (product.name?.en && product.name?.ar) {
        nameTranslations++;
      } else {
        if (!product.name?.en) hasEnglish = false;
        if (!product.name?.ar) hasArabic = false;
        this.errors.push(`Product ${product.name?.en || 'Unknown'} missing name translation`);
      }
      
      // Check description translations
      if (product.description?.en && product.description?.ar) {
        descriptionTranslations++;
      } else {
        if (!product.description?.en) hasEnglish = false;
        if (!product.description?.ar) hasArabic = false;
        this.errors.push(`Product ${product.name?.en || 'Unknown'} missing description translation`);
      }
      
      // Check long description translations
      if (product.longDescription?.en && product.longDescription?.ar) {
        longDescriptionTranslations++;
      }
      
      // Check fragrance notes translations
      if (this.hasFragranceNotesTranslations(product.notes)) {
        fragranceNotesTranslations++;
      }
      
      // Check concentration translations
      if (product.concentration?.en && product.concentration?.ar) {
        concentrationTranslations++;
      }
      
      // Check SEO translations
      if (product.seo?.metaTitle?.en && product.seo?.metaTitle?.ar &&
          product.seo?.metaDescription?.en && product.seo?.metaDescription?.ar) {
        seoTranslations++;
      }
      
      // Check image alt text translations
      if (product.images) {
        let hasImageAltTranslations = true;
        for (const image of product.images) {
          if (!image.alt?.en || !image.alt?.ar) {
            hasImageAltTranslations = false;
            break;
          }
        }
        if (hasImageAltTranslations && product.images.length > 0) {
          imageAltTranslations++;
        }
      }
      
      if (hasEnglish) englishComplete++;
      if (hasArabic) arabicComplete++;
      if (hasEnglish && hasArabic) completeTranslations++;
    }
    
    this.validationResults.products = {
      totalProducts,
      completeTranslations,
      englishComplete,
      arabicComplete,
      nameTranslations,
      descriptionTranslations,
      longDescriptionTranslations,
      fragranceNotesTranslations,
      concentrationTranslations,
      seoTranslations,
      imageAltTranslations,
      completenessRates: {
        overall: (completeTranslations / totalProducts * 100).toFixed(1),
        english: (englishComplete / totalProducts * 100).toFixed(1),
        arabic: (arabicComplete / totalProducts * 100).toFixed(1),
        names: (nameTranslations / totalProducts * 100).toFixed(1),
        descriptions: (descriptionTranslations / totalProducts * 100).toFixed(1),
        longDescriptions: (longDescriptionTranslations / totalProducts * 100).toFixed(1),
        fragranceNotes: (fragranceNotesTranslations / totalProducts * 100).toFixed(1),
        concentration: (concentrationTranslations / totalProducts * 100).toFixed(1),
        seo: (seoTranslations / totalProducts * 100).toFixed(1),
        imageAlt: (imageAltTranslations / totalProducts * 100).toFixed(1)
      }
    };
    
    console.log('✅ Product translations validation completed');
  }

  /**
   * Validate content translations
   */
  async validateContentTranslations() {
    console.log('🔍 Validating content translations...');
    
    const contentSections = await Content.find({ isActive: true });
    
    let totalSections = contentSections.length;
    let completeTranslations = 0;
    let englishComplete = 0;
    let arabicComplete = 0;
    
    const sectionDetails = {};
    
    for (const section of contentSections) {
      const hasEnglish = section.content?.en && Object.keys(section.content.en).length > 0;
      const hasArabic = section.content?.ar && Object.keys(section.content.ar).length > 0;
      
      sectionDetails[section.section] = {
        hasEnglish,
        hasArabic,
        complete: hasEnglish && hasArabic
      };
      
      if (hasEnglish) englishComplete++;
      if (hasArabic) arabicComplete++;
      if (hasEnglish && hasArabic) completeTranslations++;
      
      if (!hasEnglish || !hasArabic) {
        this.warnings.push(`Content section ${section.section} missing ${!hasEnglish ? 'English' : 'Arabic'} translation`);
      }
    }
    
    this.validationResults.content = {
      totalSections,
      completeTranslations,
      englishComplete,
      arabicComplete,
      sectionDetails,
      completenessRates: {
        overall: totalSections > 0 ? (completeTranslations / totalSections * 100).toFixed(1) : '0',
        english: totalSections > 0 ? (englishComplete / totalSections * 100).toFixed(1) : '0',
        arabic: totalSections > 0 ? (arabicComplete / totalSections * 100).toFixed(1) : '0'
      }
    };
    
    console.log('✅ Content translations validation completed');
  }

  /**
   * Validate text encoding and character sets
   */
  async validateTextEncoding() {
    console.log('🔍 Validating text encoding...');
    
    const products = await Product.find({});
    const contentSections = await Content.find({ isActive: true });
    
    let totalTexts = 0;
    let validArabicTexts = 0;
    let validEnglishTexts = 0;
    let mixedLanguageTexts = 0;
    let encodingIssues = 0;
    
    // Validate product texts
    for (const product of products) {
      // Validate Arabic texts
      const arabicTexts = [
        product.name?.ar,
        product.description?.ar,
        product.longDescription?.ar
      ].filter(Boolean);
      
      for (const text of arabicTexts) {
        totalTexts++;
        if (this.isValidArabicText(text)) {
          validArabicTexts++;
        } else {
          this.warnings.push(`Invalid Arabic text in product ${product.name?.en}: ${text.substring(0, 50)}...`);
        }
        
        if (this.hasMixedLanguages(text)) {
          mixedLanguageTexts++;
        }
      }
      
      // Validate English texts
      const englishTexts = [
        product.name?.en,
        product.description?.en,
        product.longDescription?.en
      ].filter(Boolean);
      
      for (const text of englishTexts) {
        totalTexts++;
        if (this.isValidEnglishText(text)) {
          validEnglishTexts++;
        } else {
          this.warnings.push(`Invalid English text in product ${product.name?.en}: ${text.substring(0, 50)}...`);
        }
        
        if (this.hasMixedLanguages(text)) {
          mixedLanguageTexts++;
        }
      }
    }
    
    // Validate content texts
    for (const section of contentSections) {
      if (section.content?.ar) {
        const arabicContent = JSON.stringify(section.content.ar);
        totalTexts++;
        if (this.isValidArabicText(arabicContent)) {
          validArabicTexts++;
        }
      }
      
      if (section.content?.en) {
        const englishContent = JSON.stringify(section.content.en);
        totalTexts++;
        if (this.isValidEnglishText(englishContent)) {
          validEnglishTexts++;
        }
      }
    }
    
    this.validationResults.textValidation = {
      totalTexts,
      validArabicTexts,
      validEnglishTexts,
      mixedLanguageTexts,
      encodingIssues,
      validationRates: {
        arabic: totalTexts > 0 ? (validArabicTexts / (totalTexts / 2) * 100).toFixed(1) : '0',
        english: totalTexts > 0 ? (validEnglishTexts / (totalTexts / 2) * 100).toFixed(1) : '0',
        mixedLanguage: totalTexts > 0 ? (mixedLanguageTexts / totalTexts * 100).toFixed(1) : '0'
      }
    };
    
    console.log('✅ Text encoding validation completed');
  }

  /**
   * Validate content consistency between languages
   */
  async validateContentConsistency() {
    console.log('🔍 Validating content consistency...');
    
    const products = await Product.find({});
    
    let totalComparisons = 0;
    let consistentLengths = 0;
    let consistentStructures = 0;
    let lengthDiscrepancies = [];
    
    for (const product of products) {
      // Compare name lengths
      if (product.name?.en && product.name?.ar) {
        totalComparisons++;
        const enLength = product.name.en.length;
        const arLength = product.name.ar.length;
        const lengthRatio = Math.min(enLength, arLength) / Math.max(enLength, arLength);
        
        if (lengthRatio > 0.3) { // Allow for language differences
          consistentLengths++;
        } else {
          lengthDiscrepancies.push({
            product: product.name.en,
            field: 'name',
            enLength,
            arLength,
            ratio: lengthRatio.toFixed(2)
          });
        }
      }
      
      // Compare description lengths
      if (product.description?.en && product.description?.ar) {
        totalComparisons++;
        const enLength = product.description.en.length;
        const arLength = product.description.ar.length;
        const lengthRatio = Math.min(enLength, arLength) / Math.max(enLength, arLength);
        
        if (lengthRatio > 0.5) {
          consistentLengths++;
        } else {
          lengthDiscrepancies.push({
            product: product.name.en,
            field: 'description',
            enLength,
            arLength,
            ratio: lengthRatio.toFixed(2)
          });
        }
      }
      
      // Check fragrance notes structure consistency
      if (product.notes) {
        totalComparisons++;
        const enNotesCount = this.countFragranceNotes(product.notes, 'en');
        const arNotesCount = this.countFragranceNotes(product.notes, 'ar');
        
        if (enNotesCount === arNotesCount) {
          consistentStructures++;
        } else {
          this.warnings.push(`Fragrance notes count mismatch in ${product.name?.en}: EN=${enNotesCount}, AR=${arNotesCount}`);
        }
      }
    }
    
    this.validationResults.consistency = {
      totalComparisons,
      consistentLengths,
      consistentStructures,
      lengthDiscrepancies,
      consistencyRates: {
        length: totalComparisons > 0 ? (consistentLengths / totalComparisons * 100).toFixed(1) : '0',
        structure: totalComparisons > 0 ? (consistentStructures / totalComparisons * 100).toFixed(1) : '0'
      }
    };
    
    console.log('✅ Content consistency validation completed');
  }

  /**
   * Validate translation quality
   */
  async validateTranslationQuality() {
    console.log('🔍 Validating translation quality...');
    
    const products = await Product.find({});
    
    let totalTranslations = 0;
    let qualityIssues = 0;
    let suspiciousTranslations = [];
    
    for (const product of products) {
      // Check for obvious translation issues
      if (product.name?.en && product.name?.ar) {
        totalTranslations++;
        
        // Check if Arabic translation is just English text
        if (this.isEnglishInArabicField(product.name.ar)) {
          qualityIssues++;
          suspiciousTranslations.push({
            product: product.name.en,
            field: 'name',
            issue: 'English text in Arabic field',
            text: product.name.ar
          });
        }
        
        // Check if English translation is just Arabic text
        if (this.isArabicInEnglishField(product.name.en)) {
          qualityIssues++;
          suspiciousTranslations.push({
            product: product.name.en,
            field: 'name',
            issue: 'Arabic text in English field',
            text: product.name.en
          });
        }
      }
      
      // Check descriptions
      if (product.description?.en && product.description?.ar) {
        totalTranslations++;
        
        if (this.isEnglishInArabicField(product.description.ar)) {
          qualityIssues++;
          suspiciousTranslations.push({
            product: product.name?.en,
            field: 'description',
            issue: 'English text in Arabic field',
            text: product.description.ar.substring(0, 100) + '...'
          });
        }
      }
    }
    
    this.validationResults.quality = {
      totalTranslations,
      qualityIssues,
      suspiciousTranslations,
      qualityScore: totalTranslations > 0 ? Math.round((totalTranslations - qualityIssues) / totalTranslations * 100) : 0
    };
    
    console.log('✅ Translation quality validation completed');
  }

  /**
   * Helper methods for text validation
   */
  isValidArabicText(text) {
    return this.arabicPattern.test(text) && text.length > 0;
  }

  isValidEnglishText(text) {
    return this.englishPattern.test(text) && text.length > 0;
  }

  hasMixedLanguages(text) {
    return this.arabicPattern.test(text) && this.englishPattern.test(text);
  }

  isEnglishInArabicField(text) {
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    return englishChars > arabicChars && englishChars > 5;
  }

  isArabicInEnglishField(text) {
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    return arabicChars > englishChars && arabicChars > 5;
  }

  hasFragranceNotesTranslations(notes) {
    if (!notes) return false;
    
    const hasEnglishNotes = (notes.top?.en?.length > 0) || 
                           (notes.middle?.en?.length > 0) || 
                           (notes.base?.en?.length > 0);
    
    const hasArabicNotes = (notes.top?.ar?.length > 0) || 
                          (notes.middle?.ar?.length > 0) || 
                          (notes.base?.ar?.length > 0);
    
    return hasEnglishNotes && hasArabicNotes;
  }

  countFragranceNotes(notes, language) {
    if (!notes) return 0;
    
    let count = 0;
    if (notes.top?.[language]) count += notes.top[language].length;
    if (notes.middle?.[language]) count += notes.middle[language].length;
    if (notes.base?.[language]) count += notes.base[language].length;
    
    return count;
  }

  /**
   * Generate multilingual validation report
   */
  async generateMultilingualReport() {
    console.log('📋 Generating multilingual validation report...');
    
    const overallScore = this.calculateMultilingualScore();
    
    this.validationResults.overall = {
      validationDate: new Date().toISOString(),
      overallScore,
      status: this.getStatusFromScore(overallScore),
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.generateMultilingualRecommendations()
    };
    
    const report = {
      multilingualValidationReport: {
        ...this.validationResults,
        summary: {
          translationCompleteness: parseFloat(this.validationResults.products.completenessRates.overall) > 90 ? 'EXCELLENT' : 'GOOD',
          textEncoding: parseFloat(this.validationResults.textValidation.validationRates.arabic) > 90 ? 'VALID' : 'ISSUES',
          contentConsistency: parseFloat(this.validationResults.consistency.consistencyRates.length) > 80 ? 'CONSISTENT' : 'INCONSISTENT',
          translationQuality: this.validationResults.quality.qualityScore > 90 ? 'HIGH' : 'NEEDS_REVIEW'
        }
      }
    };
    
    // Save multilingual validation report
    await fs.writeFile(
      path.join(__dirname, '../extractedData/multilingualValidationReport.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('✅ Multilingual validation report generated');
  }

  /**
   * Calculate overall multilingual score
   */
  calculateMultilingualScore() {
    const weights = {
      products: 40,
      content: 20,
      textValidation: 20,
      consistency: 10,
      quality: 10
    };
    
    const scores = {
      products: parseFloat(this.validationResults.products.completenessRates.overall),
      content: parseFloat(this.validationResults.content.completenessRates.overall),
      textValidation: (parseFloat(this.validationResults.textValidation.validationRates.arabic) + 
                      parseFloat(this.validationResults.textValidation.validationRates.english)) / 2,
      consistency: parseFloat(this.validationResults.consistency.consistencyRates.length),
      quality: this.validationResults.quality.qualityScore
    };
    
    let weightedScore = 0;
    for (const [category, weight] of Object.entries(weights)) {
      weightedScore += (scores[category] * weight) / 100;
    }
    
    return Math.round(weightedScore);
  }

  /**
   * Get status from score
   */
  getStatusFromScore(score) {
    if (score >= 95) return 'EXCELLENT';
    if (score >= 85) return 'VERY_GOOD';
    if (score >= 75) return 'GOOD';
    if (score >= 65) return 'ACCEPTABLE';
    return 'NEEDS_IMPROVEMENT';
  }

  /**
   * Generate multilingual-specific recommendations
   */
  generateMultilingualRecommendations() {
    const recommendations = [];
    
    if (parseFloat(this.validationResults.products.completenessRates.overall) < 100) {
      recommendations.push('Complete missing product translations for full multilingual support');
    }
    
    if (parseFloat(this.validationResults.content.completenessRates.overall) < 100) {
      recommendations.push('Add missing content section translations');
    }
    
    if (this.validationResults.quality.qualityIssues > 0) {
      recommendations.push('Review and fix translation quality issues');
    }
    
    if (parseFloat(this.validationResults.consistency.consistencyRates.length) < 80) {
      recommendations.push('Improve content consistency between language versions');
    }
    
    if (parseFloat(this.validationResults.textValidation.validationRates.mixedLanguage) > 10) {
      recommendations.push('Separate mixed-language content into appropriate language fields');
    }
    
    return recommendations;
  }

  /**
   * Display multilingual validation results
   */
  displayMultilingualResults() {
    console.log('\n🌐 MULTILINGUAL VALIDATION RESULTS');
    console.log('=' .repeat(60));
    
    console.log('\n📦 PRODUCT TRANSLATIONS:');
    console.log(`   Complete Translations: ${this.validationResults.products.completenessRates.overall}%`);
    console.log(`   English Complete: ${this.validationResults.products.completenessRates.english}%`);
    console.log(`   Arabic Complete: ${this.validationResults.products.completenessRates.arabic}%`);
    console.log(`   Names Translated: ${this.validationResults.products.completenessRates.names}%`);
    console.log(`   Descriptions Translated: ${this.validationResults.products.completenessRates.descriptions}%`);
    console.log(`   SEO Translated: ${this.validationResults.products.completenessRates.seo}%`);
    
    console.log('\n📄 CONTENT TRANSLATIONS:');
    console.log(`   Complete Translations: ${this.validationResults.content.completenessRates.overall}%`);
    console.log(`   English Complete: ${this.validationResults.content.completenessRates.english}%`);
    console.log(`   Arabic Complete: ${this.validationResults.content.completenessRates.arabic}%`);
    
    console.log('\n🔤 TEXT VALIDATION:');
    console.log(`   Valid Arabic Text: ${this.validationResults.textValidation.validationRates.arabic}%`);
    console.log(`   Valid English Text: ${this.validationResults.textValidation.validationRates.english}%`);
    console.log(`   Mixed Language Content: ${this.validationResults.textValidation.validationRates.mixedLanguage}%`);
    
    console.log('\n🔄 CONTENT CONSISTENCY:');
    console.log(`   Length Consistency: ${this.validationResults.consistency.consistencyRates.length}%`);
    console.log(`   Structure Consistency: ${this.validationResults.consistency.consistencyRates.structure}%`);
    
    console.log('\n⭐ TRANSLATION QUALITY:');
    console.log(`   Quality Score: ${this.validationResults.quality.qualityScore}/100`);
    console.log(`   Quality Issues: ${this.validationResults.quality.qualityIssues}`);
    
    console.log('\n📊 OVERALL MULTILINGUAL SCORE:');
    console.log(`   Score: ${this.validationResults.overall.overallScore}/100`);
    console.log(`   Status: ${this.getStatusEmoji(this.validationResults.overall.status)} ${this.validationResults.overall.status}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    if (this.validationResults.overall.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.validationResults.overall.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
  }

  /**
   * Get status emoji
   */
  getStatusEmoji(status) {
    const emojis = {
      'EXCELLENT': '🟢',
      'VERY_GOOD': '🟢',
      'GOOD': '🟡',
      'ACCEPTABLE': '🟡',
      'NEEDS_IMPROVEMENT': '🔴'
    };
    return emojis[status] || '⚪';
  }
}

// Export for use in other scripts
module.exports = MultilingualValidator;

// Run validation if called directly
if (require.main === module) {
  const validator = new MultilingualValidator();
  validator.validateMultilingualContent()
    .then(() => {
      console.log('\n🎉 Multilingual validation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Multilingual validation failed:', error);
      process.exit(1);
    });
}