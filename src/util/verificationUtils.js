// Utility functions for managing user verification status

/**
 * Mark a user as verified by updating their publicData
 * This is a development helper - in production, this would be handled by admin tools
 */
export const markUserAsVerified = (userId) => {
  console.log(`To mark user ${userId} as verified, update their profile.publicData.verified to true`);
  console.log('This can be done through:');
  console.log('1. Sharetribe Console > Users > Edit User > Public Data');
  console.log('2. Integration API call to update user profile');
  console.log('3. User profile edit form (if extended)');
};

/**
 * Check if a user is verified
 */
export const isUserVerified = (user) => {
  return user?.attributes?.profile?.publicData?.verified === true;
};

/**
 * Get verification status for display
 */
export const getVerificationBadgeProps = (user) => {
  return {
    isVerified: isUserVerified(user),
  };
};

// Make these functions available globally for development
if (typeof window !== 'undefined') {
  window.markUserAsVerified = markUserAsVerified;
  window.isUserVerified = isUserVerified;
} 