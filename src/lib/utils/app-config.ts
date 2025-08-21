/**
 * Application configuration utilities
 * Centralized access to environment variables for app name, description, etc.
 */

export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Fitness Studio CRM',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'The Modern CRM system for you',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

/**
 * Generate page title with app name suffix
 */
export function generatePageTitle(pageTitle?: string): string {
  if (!pageTitle) {
    return appConfig.name;
  }
  
  return `${pageTitle} - ${appConfig.name}`;
}

/**
 * Generate metadata object for Next.js pages
 */
export function generatePageMetadata(title?: string, description?: string) {
  return {
    title: generatePageTitle(title),
    description: description || appConfig.description,
  };
}