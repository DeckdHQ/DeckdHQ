const { getSdk, getTrustedSdk, handleError, serialize, typeHandlers } = require('../api-util/sdk');

module.exports = (req, res) => {
  const { userId } = req.query;
  const sdk = getSdk(req, res);

  if (!userId) {
    return res.status(400).json({ error: 'Missing required parameter: userId' });
  }

  // Get user's liked listings from their private data
  sdk.users.show({ id: userId })
    .then(userResponse => {
      const user = userResponse.data.data;
      const userPrivateData = user.attributes.profile.privateData || {};
      const likedListingIds = userPrivateData.likedListings || [];

      if (likedListingIds.length === 0) {
        return res.status(200).json({
          success: true,
          userId,
          likedListings: [],
          totalCount: 0,
        });
      }

      // Fetch the actual listing data for the liked listings
      const listingQueries = likedListingIds.map(listingId => 
        sdk.listings.show({ id: listingId }).catch(() => null) // Return null for deleted/unavailable listings
      );

      return Promise.all(listingQueries)
        .then(listingResponses => {
          const validListings = listingResponses
            .filter(response => response !== null)
            .map(response => response.data.data);

          res.status(200).json({
            success: true,
            userId,
            likedListings: validListings,
            totalCount: validListings.length,
          });
        });
    })
    .catch(e => {
      handleError(res, e);
    });
}; 