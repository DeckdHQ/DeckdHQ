const { getSdk, handleError } = require('../api-util/sdk');
const { addLike, removeLike, hasUserLiked, getLikeCount } = require('./get-listing-likes');

module.exports = (req, res) => {
  const { listingId, action } = req.body;
  const sdk = getSdk(req, res);

  if (!listingId || !action) {
    return res.status(400).json({ error: 'Missing required parameters: listingId and action' });
  }

  if (action !== 'like' && action !== 'unlike') {
    return res.status(400).json({ error: 'Invalid action. Must be "like" or "unlike"' });
  }

  // Get current user first
  sdk.currentUser
    .show()
    .then(currentUserResponse => {
      const currentUser = currentUserResponse.data.data;
      const userId = currentUser.id.uuid;
      const currentUserPrivateData = currentUser.attributes.profile.privateData || {};
      const likedListings = currentUserPrivateData.likedListings || [];

      let updatedLikedListings;
      let isNewLike = false;
      let isNewUnlike = false;
      let wasAlreadyLiked = false;
      let wasNotLiked = false;
      
      // Check both user's private data and centralized like storage
      const isAlreadyLiked = likedListings.includes(listingId) || hasUserLiked(listingId, userId);

      if (action === 'like') {
        if (!isAlreadyLiked) {
          updatedLikedListings = [...likedListings, listingId];
          isNewLike = true;
          // Add to centralized like storage
          addLike(listingId, userId);
        } else {
          // User already liked this listing
          updatedLikedListings = likedListings;
          wasAlreadyLiked = true;
        }
      } else {
        if (isAlreadyLiked) {
          updatedLikedListings = likedListings.filter(id => id !== listingId);
          isNewUnlike = true;
          // Remove from centralized like storage
          removeLike(listingId, userId);
        } else {
          // User hasn't liked this listing
          updatedLikedListings = likedListings;
          wasNotLiked = true;
        }
      }

      // Update user's private data only if there was a change
      if (isNewLike || isNewUnlike) {
        return sdk.currentUser.updateProfile({
          privateData: {
            ...currentUserPrivateData,
            likedListings: updatedLikedListings,
          },
        }).then(() => ({
          wasAlreadyLiked,
          wasNotLiked,
          isNewLike,
          isNewUnlike,
          updatedLikedListings
        }));
      } else {
        return Promise.resolve({
          wasAlreadyLiked,
          wasNotLiked,
          isNewLike,
          isNewUnlike,
          updatedLikedListings
        });
      }
    })
    .then(({ wasAlreadyLiked, wasNotLiked, isNewLike, isNewUnlike, updatedLikedListings }) => {
      // Get the real total like count from centralized storage
      const totalLikeCount = getLikeCount(listingId);

      res.status(200).json({
        success: true,
        action,
        listingId,
        likeCount: totalLikeCount, // Real total count from all users
        isLiked: updatedLikedListings.includes(listingId),
        wasAlreadyLiked,
        wasNotLiked,
      });
    })
    .catch(e => {
      console.error('Error in like-listing API:', e);
      handleError(res, e);
    });
}; 