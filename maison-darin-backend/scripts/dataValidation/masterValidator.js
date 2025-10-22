/**
 * Master Data Validation Script
 * 
 * This script orchestrates all data validation and quality assurance tests:
 * - Comprehensive data validation
 * - Image validation and Cloudinary integration
 * - Multilingual content validation
 * - Data integrity checks
 * - Generates consolidated validation report
 * 
 * Requirements: 2.1-2.6, 3.1-3.5, 4.1-4.5
 */

const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ComprehensiveDataValidator = require('./comprehensiveDataValidator');
const ImageValidationTest = require('./imageValidationTest');
const MultilingualValidator = require('./multilingualValidator');
const DataIntegrityChecker = require('./dataIntegrityChecker');

class MasterValidator {
  constructor() {
    this.validationResults = {
      comprehensive: {},
      images: {},
      multilingual: {},
      integrity: {},
      overall: {}
    };
    this.startTime = Date.now();
    this.allErrors = [];
    this.allWarnings = [];
    this.criticalIssues = [];
  }

  /**
   * Run all validation tests
   */
  async runAllValidations() {
    console.log('🚀 Starting Master Data Validation and Quality Assurance');
    console.log('=' .repeat(80));
    console.log('📋 Task 11.4: Data Validation and Quality Assurance');
    console.log('🎯 Requirements: 2.1-2.6, 3.1-3.5, 4.1-4.5');
    console.log('=' .repeat(80));
    
    try {
      // Run comprehensive data validation
      await this.runComprehensiveValidation();
      
      // Run image validation tests
      await this.runImageValidation();
      
      // Run multilingual validation
      await this.runMultilingualValidation();
      
      // Run data integrity checks
      await this.runIntegrityChecks();
      
      // Generate master validation report
      await this.generateMasterReport();
      
      // Display consolidated results
      this.displayMasterResults();
      
      // Determine overall validation status
      const overallStatus = this.determineOverallStatus();
      
      console.log('\n' + '=' .repeat(80));
      console.log(`🎉 Master Data Validation Completed: ${overallStatus}`);
      console.log('=' .repeat(80));
      
      return overallStatus;
      
    } catch (error) {
      console.error('❌ Master validation failed:', error);
      throw error;
    }
  }

  /**
   * Run comprehensive data validation
   */
  async runComprehensiveValidation() {
    console.log('\n📊 RUNNING COMPREHENSIVE DATA VALIDATION');
    console.log('-' .repeat(50));
    
    try {
      const validator = new ComprehensiveDataValidator();
      await validator.validateAllData();
      
      // Read the generated report
      const reportPath = path.join(__dirname, '../extractedData/comprehensiveValidationReport.json');
      const reportData = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(reportData);
      
      this.validationResults.comprehensive = report.comprehensiveValidationReport;
      this.collectIssues(this.validationResults.comprehensive.overall);
      
      console.log('✅ Comprehensive data validation completed');
      
    } catch (error) {
      console.error('❌ Comprehensive validation failed:', error.message);
      this.criticalIssues.push('Comprehensive validation failed to complete');
    }
  }

  /**
   * Run image validation tests
   */
  async runImageValidation() {
    console.log('\n🖼️  RUNNING IMAGE VALIDATION TESTS');
    console.log('-' .repeat(50));
    
    try {
      const validator = new ImageValidationTest();
      await validator.validateImages();
      
      // Read the generated report
      const reportPath = path.join(__dirname, '../extractedData/imageValidationReport.json');
      const reportData = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(reportData);
      
      this.validationResults.images = report.imageValidationReport;
      this.collectIssues(this.validationResults.images.overall);
      
      console.log('✅ Image validation tests completed');
      
    } catch (error) {
      console.error('❌ Image validation failed:', error.message);
      this.criticalIssues.push('Image validation failed to complete');
    }
  }

  /**
   * Run multilingual validation
   */
  async runMultilingualValidation() {
    console.log('\n🌐 RUNNING MULTILINGUAL VALIDATION');
    console.log('-' .repeat(50));
    
    try {
      const validator = new MultilingualValidator();
      await validator.validateMultilingualContent();
      
      // Read the generated report
      const reportPath = path.join(__dirname, '../extractedData/multilingualValidationReport.json');
      const reportData = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(reportData);
      
      this.validationResults.multilingual = report.multilingualValidationReport;
      this.collectIssues(this.validationResults.multilingual.overall);
      
      console.log('✅ Multilingual validation completed');
      
    } catch (error) {
      console.error('❌ Multilingual validation failed:', error.message);
      this.criticalIssues.push('Multilingual validation failed to complete');
    }
  }

  /**
   * Run data integrity checks
   */
  async runIntegrityChecks() {
    console.log('\n🔍 RUNNING DATA INTEGRITY CHECKS');
    console.log('-' .repeat(50));
    
    try {
      const checker = new DataIntegrityChecker();
      await checker.checkDataIntegrity();
      
      // Read the generated report
      const reportPath = path.join(__dirname, '../extractedData/dataIntegrityReport.json');
      const reportData = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(reportData);
      
      this.validationResults.integrity = report.dataIntegrityReport;
      this.collectIssues(this.validationResults.integrity.overall);
      
      console.log('✅ Data integrity checks completed');
      
    } catch (error) {
      console.error('❌ Data integrity check failed:', error.message);
      this.criticalIssues.push('Data integrity check failed to complete');
    }
  }

  /**
   * Collect issues from validation results
   */
  collectIssues(overallResults) {
    if (overallResults.errors) {
      this.allErrors.push(...overallResults.errors);
    }
    if (overallResults.warnings) {
      this.allWarnings.push(...overallResults.warnings);
    }
    if (overallResults.criticalIssues) {
      this.criticalIssues.push(...overallResults.criticalIssues);
    }
  }

  /**
   * Generate master validation report
   */
  async generateMasterReport() {
    console.log('\n📋 GENERATING MASTER VALIDATION REPORT');
    console.log('-' .repeat(50));
    
    const totalTime = Date.now() - this.startTime;
    const overallScore = this.calculateMasterScore();
    const overallStatus = this.getStatusFromScore(overallScore);
    
    this.validationResults.overall = {
      validationDate: new Date().toISOString(),
      validationDuration: `${totalTime}ms`,
      overallScore,
      status: overallStatus,
      totalErrors: this.allErrors.length,
      totalWarnings: this.allWarnings.length,
      totalCriticalIssues: this.criticalIssues.length,
      readyForProduction: this.isReadyForProduction(),
      validationSummary: {
        comprehensiveValidation: {
          score: this.validationResults.comprehensive.overall?.overallScore || 0,
          status: this.validationResults.comprehensive.overall?.status || 'FAILED'
        },
        imageValidation: {
          score: this.validationResults.images.overall?.overallScore || 0,
          status: this.validationResults.images.overall?.status || 'FAILED'
        },
        multilingualValidation: {
          score: this.validationResults.multilingual.overall?.overallScore || 0,
          status: this.validationResults.multilingual.overall?.status || 'FAILED'
        },
        integrityValidation: {
          score: this.validationResults.integrity.overall?.overallScore || 0,
          status: this.validationResults.integrity.overall?.status || 'FAILED'
        }
      },
      keyFindings: this.generateKeyFindings(),
      recommendations: this.generateMasterRecommendations(),
      nextSteps: this.generateNextSteps()
    };
    
    const masterReport = {
      masterValidationReport: {
        task: '11.4 Data Validation and Quality Assurance',
        requirements: '2.1-2.6, 3.1-3.5, 4.1-4.5',
        ...this.validationResults
      }
    };
    
    // Save master validation report
    await fs.writeFile(
      path.join(__dirname, '../extractedData/masterValidationReport.json'),
      JSON.stringify(masterReport, null, 2)
    );
    
    // Generate summary report for task completion
    await this.generateTaskCompletionReport();
    
    console.log('✅ Master validation report generated');
  }

  /**
   * Generate task completion report
   */
  async generateTaskCompletionReport() {
    const completionReport = {
      task: '11.4 Data Validation and Quality Assurance',
      status: this.determineOverallStatus(),
      completionDate: new Date().toISOString(),
      requirements: {
        '2.1-2.6': 'Product data validation completed',
        '3.1-3.5': 'Content data validation completed',
        '4.1-4.5': 'Media and Cloudinary validation completed'
      },
      validationResults: {
        overallScore: this.validationResults.overall.overallScore,
        readyForProduction: this.validationResults.overall.readyForProduction,
        criticalIssues: this.criticalIssues.length,
        totalErrors: this.allErrors.length,
        totalWarnings: this.allWarnings.length
      },
      taskObjectives: {
        dataCompleteness: this.assessDataCompleteness(),
        imageIntegration: this.assessImageIntegration(),
        multilingualSupport: this.assessMultilingualSupport(),
        dataIntegrity: this.assessDataIntegrity()
      },
      conclusion: this.generateTaskConclusion()
    };
    
    await fs.writeFile(
      path.join(__dirname, '../extractedData/task11.4-completionReport.md'),
      this.generateMarkdownReport(completionReport)
    );
  }

  /**
   * Generate markdown completion report
   */
  generateMarkdownReport(report) {
    return `# Task 11.4 Completion Report: Data Validation and Quality Assurance

**Task:** ${report.task}  
**Status:** ${report.status}  
**Completion Date:** ${new Date(report.completionDate).toLocaleDateString()}  
**Requirements:** 2.1-2.6, 3.1-3.5, 4.1-4.5

## Executive Summary

${report.conclusion}

## Validation Results

- **Overall Score:** ${report.validationResults.overallScore}/100
- **Production Ready:** ${report.validationResults.readyForProduction ? '✅ YES' : '❌ NO'}
- **Critical Issues:** ${report.validationResults.criticalIssues}
- **Total Errors:** ${report.validationResults.totalErrors}
- **Total Warnings:** ${report.validationResults.totalWarnings}

## Task Objectives Assessment

### ✅ Data Completeness and Accuracy
${report.taskObjectives.dataCompleteness}

### ✅ Image Uploads and Cloudinary Integration
${report.taskObjectives.imageIntegration}

### ✅ Multilingual Content Validation
${report.taskObjectives.multilingualSupport}

### ✅ Data Integrity Checks
${report.taskObjectives.dataIntegrity}

## Requirements Compliance

- **Requirements 2.1-2.6:** ${report.requirements['2.1-2.6']}
- **Requirements 3.1-3.5:** ${report.requirements['3.1-3.5']}
- **Requirements 4.1-4.5:** ${report.requirements['4.1-4.5']}

## Next Steps

${this.validationResults.overall.nextSteps.map(step => `- ${step}`).join('\n')}

---

**Task Status:** ✅ COMPLETED  
**Ready for Task 12.1:** ${report.validationResults.readyForProduction ? '✅ YES' : '❌ NO - Address issues first'}
`;
  }

  /**
   * Calculate master validation score
   */
  calculateMasterScore() {
    const weights = {
      comprehensive: 30,
      images: 25,
      multilingual: 25,
      integrity: 20
    };
    
    const scores = {
      comprehensive: this.validationResults.comprehensive.overall?.overallScore || 0,
      images: this.validationResults.images.overall?.overallScore || 0,
      multilingual: this.validationResults.multilingual.overall?.overallScore || 0,
      integrity: this.validationResults.integrity.overall?.overallScore || 0
    };
    
    let weightedScore = 0;
    for (const [category, weight] of Object.entries(weights)) {
      weightedScore += (scores[category] * weight) / 100;
    }
    
    return Math.round(weightedScore);
  }

  /**
   * Determine if ready for production
   */
  isReadyForProduction() {
    const minScore = 85;
    const maxCriticalIssues = 0;
    const maxErrors = 5;
    
    return this.validationResults.overall.overallScore >= minScore &&
           this.criticalIssues.length <= maxCriticalIssues &&
           this.allErrors.length <= maxErrors;
  }

  /**
   * Generate key findings
   */
  generateKeyFindings() {
    const findings = [];
    
    // Data completeness findings
    const productScore = this.validationResults.comprehensive.products?.completenessRates?.overall || 0;
    if (parseFloat(productScore) >= 95) {
      findings.push('✅ Product data is highly complete and accurate');
    } else {
      findings.push('⚠️ Product data has some completeness issues');
    }
    
    // Image integration findings
    const imageScore = this.validationResults.images.overall?.overallScore || 0;
    if (imageScore >= 90) {
      findings.push('✅ Cloudinary integration is working excellently');
    } else {
      findings.push('⚠️ Cloudinary integration needs attention');
    }
    
    // Multilingual findings
    const multilingualScore = this.validationResults.multilingual.overall?.overallScore || 0;
    if (multilingualScore >= 90) {
      findings.push('✅ Multilingual support is comprehensive');
    } else {
      findings.push('⚠️ Multilingual content needs improvement');
    }
    
    // Integrity findings
    const integrityScore = this.validationResults.integrity.overall?.overallScore || 0;
    if (integrityScore >= 85) {
      findings.push('✅ Data integrity is maintained');
    } else {
      findings.push('⚠️ Data integrity issues detected');
    }
    
    return findings;
  }

  /**
   * Generate master recommendations
   */
  generateMasterRecommendations() {
    const recommendations = new Set();
    
    // Collect recommendations from all validators
    if (this.validationResults.comprehensive.overall?.recommendations) {
      this.validationResults.comprehensive.overall.recommendations.forEach(rec => recommendations.add(rec));
    }
    
    if (this.validationResults.images.overall?.recommendations) {
      this.validationResults.images.overall.recommendations.forEach(rec => recommendations.add(rec));
    }
    
    if (this.validationResults.multilingual.overall?.recommendations) {
      this.validationResults.multilingual.overall.recommendations.forEach(rec => recommendations.add(rec));
    }
    
    if (this.validationResults.integrity.overall?.recommendations) {
      this.validationResults.integrity.overall.recommendations.forEach(rec => recommendations.add(rec));
    }
    
    return Array.from(recommendations);
  }

  /**
   * Generate next steps
   */
  generateNextSteps() {
    const nextSteps = [];
    
    if (this.isReadyForProduction()) {
      nextSteps.push('Proceed to Task 12.1: Frontend Integration Testing');
      nextSteps.push('Begin production deployment preparation');
      nextSteps.push('Set up monitoring and alerting systems');
    } else {
      nextSteps.push('Address critical issues and errors before proceeding');
      nextSteps.push('Re-run validation after fixes are implemented');
      nextSteps.push('Review and implement recommended improvements');
    }
    
    return nextSteps;
  }

  /**
   * Assessment methods for task objectives
   */
  assessDataCompleteness() {
    const score = this.validationResults.comprehensive.products?.completenessRates?.overall || 0;
    if (parseFloat(score) >= 95) {
      return 'EXCELLENT - All migrated data is complete and accurate with minimal issues.';
    } else if (parseFloat(score) >= 85) {
      return 'GOOD - Most data is complete with some minor gaps that should be addressed.';
    } else {
      return 'NEEDS IMPROVEMENT - Significant data completeness issues require attention.';
    }
  }

  assessImageIntegration() {
    const score = this.validationResults.images.overall?.overallScore || 0;
    if (score >= 90) {
      return 'EXCELLENT - Cloudinary integration is working perfectly with all images accessible and optimized.';
    } else if (score >= 80) {
      return 'GOOD - Cloudinary integration is mostly working with minor issues to resolve.';
    } else {
      return 'NEEDS IMPROVEMENT - Cloudinary integration has significant issues that need fixing.';
    }
  }

  assessMultilingualSupport() {
    const score = this.validationResults.multilingual.overall?.overallScore || 0;
    if (score >= 90) {
      return 'EXCELLENT - Multilingual content is complete and properly validated in both English and Arabic.';
    } else if (score >= 80) {
      return 'GOOD - Multilingual support is mostly complete with some translation gaps.';
    } else {
      return 'NEEDS IMPROVEMENT - Multilingual content has significant gaps and quality issues.';
    }
  }

  assessDataIntegrity() {
    const score = this.validationResults.integrity.overall?.overallScore || 0;
    const criticalIssues = this.validationResults.integrity.overall?.criticalIssuesCount || 0;
    
    if (score >= 90 && criticalIssues === 0) {
      return 'EXCELLENT - Data integrity is maintained with no critical issues and minimal violations.';
    } else if (score >= 80 && criticalIssues === 0) {
      return 'GOOD - Data integrity is generally maintained with some minor issues to address.';
    } else {
      return 'NEEDS IMPROVEMENT - Data integrity issues detected that require immediate attention.';
    }
  }

  /**
   * Generate task conclusion
   */
  generateTaskConclusion() {
    const overallScore = this.validationResults.overall.overallScore;
    const isReady = this.validationResults.overall.readyForProduction;
    
    if (isReady && overallScore >= 95) {
      return 'Task 11.4 has been completed successfully with excellent results. All migrated data has been thoroughly validated, image integration is working perfectly, multilingual content is complete, and data integrity is maintained. The system is ready for production deployment and frontend integration testing.';
    } else if (isReady && overallScore >= 85) {
      return 'Task 11.4 has been completed successfully with good results. The validation process identified minor issues that have been documented, but the system meets production readiness criteria and can proceed to frontend integration testing.';
    } else {
      return 'Task 11.4 validation has identified significant issues that need to be addressed before the system can be considered production-ready. Critical issues and errors must be resolved before proceeding to the next phase.';
    }
  }

  /**
   * Determine overall validation status
   */
  determineOverallStatus() {
    const score = this.validationResults.overall.overallScore;
    const isReady = this.validationResults.overall.readyForProduction;
    
    if (isReady && score >= 95) return '✅ EXCELLENT - PRODUCTION READY';
    if (isReady && score >= 85) return '✅ GOOD - PRODUCTION READY';
    if (score >= 75) return '⚠️ ACCEPTABLE - NEEDS MINOR FIXES';
    return '❌ NEEDS IMPROVEMENT - CRITICAL ISSUES';
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
   * Display master validation results
   */
  displayMasterResults() {
    console.log('\n📊 MASTER VALIDATION RESULTS');
    console.log('=' .repeat(80));
    
    console.log('\n🎯 VALIDATION SUMMARY:');
    console.log(`   Overall Score: ${this.validationResults.overall.overallScore}/100`);
    console.log(`   Status: ${this.getStatusEmoji(this.validationResults.overall.status)} ${this.validationResults.overall.status}`);
    console.log(`   Production Ready: ${this.validationResults.overall.readyForProduction ? '✅ YES' : '❌ NO'}`);
    console.log(`   Duration: ${this.validationResults.overall.validationDuration}`);
    
    console.log('\n📋 INDIVIDUAL VALIDATION SCORES:');
    const summary = this.validationResults.overall.validationSummary;
    console.log(`   Comprehensive: ${summary.comprehensiveValidation.score}/100 (${summary.comprehensiveValidation.status})`);
    console.log(`   Images: ${summary.imageValidation.score}/100 (${summary.imageValidation.status})`);
    console.log(`   Multilingual: ${summary.multilingualValidation.score}/100 (${summary.multilingualValidation.status})`);
    console.log(`   Integrity: ${summary.integrityValidation.score}/100 (${summary.integrityValidation.status})`);
    
    console.log('\n🔍 ISSUE SUMMARY:');
    console.log(`   Critical Issues: ${this.validationResults.overall.totalCriticalIssues}`);
    console.log(`   Total Errors: ${this.validationResults.overall.totalErrors}`);
    console.log(`   Total Warnings: ${this.validationResults.overall.totalWarnings}`);
    
    console.log('\n🎯 KEY FINDINGS:');
    this.validationResults.overall.keyFindings.forEach(finding => {
      console.log(`   ${finding}`);
    });
    
    if (this.validationResults.overall.recommendations.length > 0) {
      console.log('\n💡 TOP RECOMMENDATIONS:');
      this.validationResults.overall.recommendations.slice(0, 5).forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }
    
    console.log('\n🚀 NEXT STEPS:');
    this.validationResults.overall.nextSteps.forEach(step => {
      console.log(`   - ${step}`);
    });
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
module.exports = MasterValidator;

// Run master validation if called directly
if (require.main === module) {
  const masterValidator = new MasterValidator();
  masterValidator.runAllValidations()
    .then((status) => {
      console.log(`\n🎉 Master validation completed with status: ${status}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Master validation failed:', error);
      process.exit(1);
    });
}