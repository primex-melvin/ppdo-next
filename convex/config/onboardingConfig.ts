// convex/config/onboardingConfig.ts

/**
 * Onboarding Configuration
 * 
 * This file centralizes all onboarding-related settings.
 * Easy to maintain - just change the department code below!
 */

export const OnboardingConfig = {
  /**
   * Default Department Code
   * 
   * Set the department code that should be pre-selected during onboarding.
   * This matches against the department's "code" field in the database.
   * 
   * Examples:
   * - "PPDO" - Provincial Planning and Development Office
   * - "COA"  - Commission on Audit  
   * - "BIR"  - Bureau of Internal Revenue
   * - "HR"   - Human Resources
   * - ""     - Leave empty to disable default selection
   * 
   * TO CHANGE: Simply replace "PPDO" with your desired department code
   */
  DEFAULT_DEPARTMENT_CODE: "PPDO",
};