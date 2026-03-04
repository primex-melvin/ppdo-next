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

export const ONBOARDING_STEP_ORDER = [
  "initial_profile",
  "bug_report_onboarding",
  "reset_pin_feature_onboarding",
] as const;

export type OnboardingStep = typeof ONBOARDING_STEP_ORDER[number];

export const ONBOARDING_FLOW_BY_STEP = {
  initial_profile: "profile",
  bug_report_onboarding: "features",
  reset_pin_feature_onboarding: "reset_pin_feature",
} as const satisfies Record<OnboardingStep, "profile" | "features" | "reset_pin_feature">;

export type OnboardingFlow = (typeof ONBOARDING_FLOW_BY_STEP)[OnboardingStep];

export function getNextOnboardingFlow(completedSteps: readonly string[]): OnboardingFlow | null {
  const completedSet = new Set(completedSteps);

  for (const step of ONBOARDING_STEP_ORDER) {
    if (!completedSet.has(step)) {
      return ONBOARDING_FLOW_BY_STEP[step];
    }
  }

  return null;
}
