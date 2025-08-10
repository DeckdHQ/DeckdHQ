const { getSdk, handleError } = require('../api-util/sdk');

// In-memory storage for likes (in production, use a database)
// Structure: { listingId: Set([userId1, userId2, ...]) }
global.listingLikes = global.listingLikes || {};

// Helper function to get or create like set for a listing
const getLikeSet = (listingId) => {
  if (!global.listingLikes[listingId]) {
    global.listingLikes[listingId] = new Set();
  }
  return global.listingLikes[listingId];
};

// Helper function to add a like
const addLike = (listingId, userId) => {
  const likeSet = getLikeSet(listingId);
  likeSet.add(userId);
  return likeSet.size;
};

// Helper function to remove a like
const removeLike = (listingId, userId) => {
  const likeSet = getLikeSet(listingId);
  likeSet.delete(userId);
  return likeSet.size;
};

// Helper function to check if user liked a listing
const hasUserLiked = (listingId, userId) => {
  const likeSet = getLikeSet(listingId);
  return likeSet.has(userId);
};

// Helper function to get like count
const getLikeCount = (listingId) => {
  const likeSet = getLikeSet(listingId);
  return likeSet.size;
};

module.exports = (req, res) => {
  const { listingIds } = req.body;
  const sdk = getSdk(req, res);

  if (!listingIds || !Array.isArray(listingIds)) {
    return res.status(400).json({ error: 'Missing or invalid parameter: listingIds (should be an array)' });
  }

  // Get like counts for all requested listings
  const likeCounts = {};
  listingIds.forEach(listingId => {
    likeCounts[listingId] = getLikeCount(listingId);
  });

  res.status(200).json({
    success: true,
    likeCounts,
  });
};

// Export helper functions for use in other APIs
module.exports.addLike = addLike;
module.exports.removeLike = removeLike;
module.exports.hasUserLiked = hasUserLiked;
module.exports.getLikeCount = getLikeCount; 