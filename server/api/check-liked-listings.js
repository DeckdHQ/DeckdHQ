const { getSdk, handleError } = require('../api-util/sdk');
const { hasUserLiked, getLikeCount } = require('./get-listing-likes');

module.exports = (req, res) => {
  const { listingIds } = req.body; // Array of listing IDs to check
  const sdk = getSdk(req, res);

  if (!listingIds || !Array.isArray(listingIds)) {
    return res.status(400).json({ error: 'Missing or invalid parameter: listingIds (should be an array)' });
  }

  // Get current user's liked listings
  sdk.currentUser
    .show()
    .then(currentUserResponse => {
      const currentUser = currentUserResponse.data.data;
      const userId = currentUser.id.uuid;
      const currentUserPrivateData = currentUser.attributes.profile.privateData || {};
      const likedListings = currentUserPrivateData.likedListings || [];

      // Create a map of listing ID to like status with real counts
      const likeStatusMap = {};
      listingIds.forEach(listingId => {
        // Check both user's private data and centralized storage
        const isLiked = likedListings.includes(listingId) || hasUserLiked(listingId, userId);
        const totalLikeCount = getLikeCount(listingId);
        
        likeStatusMap[listingId] = {
          isLiked,
          likeCount: totalLikeCount, // Real total count from all users
        };
      });

      res.status(200).json({
        success: true,
        likeStatusMap,
      });
    })
    .catch(e => {
      console.error('Error in check-liked-listings API:', e);
      handleError(res, e);
    });
}; 