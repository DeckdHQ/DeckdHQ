const { getSdk, handleError } = require('../api-util/sdk');
const { getOfferForListing, OFFER_STATUS } = require('./make-offer');

module.exports = (req, res) => {
  const { listingIds, type } = req.query;
  const sdk = getSdk(req, res);

  if (!type || !['listing', 'user'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type parameter. Must be "listing" or "user"' });
  }

  // Get current user
  sdk.currentUser
    .show()
    .then(currentUserResponse => {
      const currentUser = currentUserResponse.data.data;
      const userId = currentUser.id.uuid;

      if (type === 'listing') {
        // Get offers for specific listings (to show offer status on listing cards)
        if (!listingIds) {
          return res.status(400).json({ error: 'listingIds parameter required for listing type' });
        }

        const listingIdArray = Array.isArray(listingIds) ? listingIds : [listingIds];
        const offerStatuses = {};

        listingIdArray.forEach(listingId => {
          const offer = getOfferForListing(listingId);
          if (offer) {
            // Only include basic status info for listing cards
            offerStatuses[listingId] = {
              hasOffer: true,
              status: offer.status,
              isUserBuyer: offer.buyerId === userId,
              isUserSeller: offer.sellerId === userId,
            };
          } else {
            offerStatuses[listingId] = {
              hasOffer: false,
              status: null,
              isUserBuyer: false,
              isUserSeller: false,
            };
          }
        });

        return res.status(200).json({
          success: true,
          type: 'listing',
          offerStatuses,
        });

      } else if (type === 'user') {
        // Get all offers involving the current user (for inbox/offers page)
        const userOffers = [];

        // Iterate through all offers and find ones involving current user
        Object.values(global.listingOffers || {}).forEach(offer => {
          if (offer.buyerId === userId || offer.sellerId === userId) {
            userOffers.push({
              ...offer,
              userRole: offer.buyerId === userId ? 'buyer' : 'seller',
            });
          }
        });

        // Sort by most recent first
        userOffers.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        return res.status(200).json({
          success: true,
          type: 'user',
          offers: userOffers,
        });
      }
    })
    .catch(e => {
      console.error('Error in get-offers API:', e);
      handleError(res, e);
    });
}; 