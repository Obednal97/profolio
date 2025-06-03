/**
 * Centralized user data utilities for consistent display across components
 */

// Types
export interface UserData {
  id: string;
  email: string | null;
  name?: string | null;
  displayName?: string | null;
  phone?: string | null;
  photoURL?: string | null;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
}

/**
 * Get user display name with consistent priority:
 * 1. userProfile.name (from database)
 * 2. user.name (direct name field)
 * 3. user.displayName (Firebase displayName)
 * 4. Email username (before @)
 * 5. Fallback to 'User'
 */
export function getUserDisplayName(
  user?: UserData | null,
  userProfile?: UserProfile | null
): string {
  // Priority 1: Database profile name
  if (userProfile?.name) {
    return userProfile.name;
  }

  // Priority 2: Direct name field
  if (user?.name) {
    return user.name;
  }

  // Priority 3: Firebase displayName
  if (user?.displayName) {
    return user.displayName;
  }

  // Priority 4: Email username
  if (user?.email) {
    return user.email.split('@')[0];
  }

  // Fallback
  return 'User';
}

/**
 * Get user display email with fallback
 */
export function getUserDisplayEmail(
  user?: UserData | null,
  userProfile?: UserProfile | null
): string {
  return userProfile?.email || user?.email || '';
}

/**
 * Create a complete user context object for components
 */
export function createUserContext(
  user?: UserData | null,
  userProfile?: UserProfile | null,
  isDemoMode = false
): { id: string; name: string; email: string } | null {
  // Handle demo mode
  if (isDemoMode && !user) {
    let demoUser = {
      id: 'demo-user-id',
      name: 'Demo User',
      email: 'demo@profolio.com'
    };

    // Try to get stored demo user data
    if (typeof window !== 'undefined') {
      try {
        const storedUserData = localStorage.getItem('user-data');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          demoUser = {
            ...demoUser,
            name: parsedData.name || demoUser.name,
            email: parsedData.email || demoUser.email,
          };
        }
      } catch (error) {
        console.error('Error parsing demo user data:', error);
      }
    }

    return demoUser;
  }

  // Handle real user
  if (user) {
    return {
      id: user.id,
      name: getUserDisplayName(user, userProfile),
      email: getUserDisplayEmail(user, userProfile),
    };
  }

  return null;
}

/**
 * Get safe user initials for avatar display
 */
export function getUserInitials(
  user?: UserData | null,
  userProfile?: UserProfile | null
): string {
  const name = getUserDisplayName(user, userProfile);
  
  if (!name || name === 'User') {
    return 'U';
  }

  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Sanitize text for safe display
 */
export function sanitizeText(text?: string | null): string {
  if (!text) return '';
  
  // Basic XSS prevention
  return text
    .replace(/[<>'"]/g, '')
    .trim()
    .slice(0, 200); // Reasonable length limit
} 