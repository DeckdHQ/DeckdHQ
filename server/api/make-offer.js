const { getSdk, handleError } = require('../api-util/sdk');

// In-memory storage for offers (in production, use a database)
// Structure: { listingId: { offerId, buyerId, sellerId, originalPrice, offerPrice, counterPrice, status, createdAt, updatedAt } }
global.listingOffers = global.listingOffers || {};

// Offer statuses
const OFFER_STATUS = {
  PENDING: 'pending',           // Buyer made offer, waiting for seller
  ACCEPTED: 'accepted',         // Seller accepted offer
  REJECTED: 'rejected',         // Seller rejected offer
  COUNTERED: 'countered',       // Seller made counter offer
  COUNTER_ACCEPTED: 'counter_accepted', // Buyer accepted counter offer
  COUNTER_DECLINED: 'counter_declined', // Buyer declined counter offer
};

// Helper function to generate offer ID
const generateOfferId = () => {
  return 'offer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Helper function to get offer for listing
const getOfferForListing = (listingId) => {
  return global.listingOffers[listingId] || null;
};

// Helper function to set offer for listing
const setOfferForListing = (listingId, offerData) => {
  global.listingOffers[listingId] = {
    ...offerData,
    updatedAt: new Date().toISOString(),
  };
  return global.listingOffers[listingId];
};

// Helper function to delete offer for listing
const deleteOfferForListing = (listingId) => {
  delete global.listingOffers[listingId];
};

module.exports = (req, res) => {
  const { listingId, action, offerPrice, counterPrice } = req.body;
  const sdk = getSdk(req, res);

  if (!listingId || !action) {
    return res.status(400).json({ error: 'Missing required parameters: listingId and action' });
  }

  const validActions = ['make_offer', 'accept_offer', 'reject_offer', 'counter_offer', 'accept_counter', 'decline_counter'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  // Get current user
  sdk.currentUser
    .show()
    .then(currentUserResponse => {
      const currentUser = currentUserResponse.data.data;
      const userId = currentUser.id.uuid;

      // Get listing to validate and get seller info
      // Include author data like the frontend does
      return sdk.listings.show({ 
        id: listingId, 
        include: ['author'] 
      }).then(listingResponse => {
        const listing = listingResponse.data.data;
        console.log('Listing data structure:', JSON.stringify(listing, null, 2));
        
        // Get seller ID from the included author data
        let sellerId = null;
        
        // Method 1: Direct author.id.uuid (like frontend uses)
        if (listing.author?.id?.uuid) {
          sellerId = listing.author.id.uuid;
        }
        // Method 2: author.id as string
        else if (listing.author?.id) {
          sellerId = listing.author.id;
        }
        // Method 3: relationships.author.data.id.uuid (fallback)
        else if (listing.relationships?.author?.data?.id?.uuid) {
          sellerId = listing.relationships.author.data.id.uuid;
        }
        // Method 4: relationships.author.data.id as string
        else if (listing.relationships?.author?.data?.id) {
          sellerId = listing.relationships.author.data.id;
        }
        
        console.log('Extracted sellerId:', sellerId);
        const originalPrice = listing.attributes?.price?.amount || 0;
        
        if (!sellerId) {
          console.error('Could not find listing owner. Listing structure:', listing);
          throw new Error('Could not find listing owner');
        }

        const existingOffer = getOfferForListing(listingId);

        switch (action) {
          case 'make_offer':
            // Buyer makes initial offer
            if (!offerPrice || offerPrice <= 0) {
              throw new Error('Valid offer price required');
            }
            
            if (userId === sellerId) {
              throw new Error('Cannot make offer on your own listing');
            }

            if (existingOffer && existingOffer.status === OFFER_STATUS.PENDING) {
              throw new Error('An offer is already pending for this listing');
            }

            const newOffer = {
              offerId: generateOfferId(),
              listingId,
              buyerId: userId,
              sellerId,
              originalPrice,
              offerPrice: parseFloat(offerPrice),
              counterPrice: null,
              status: OFFER_STATUS.PENDING,
              createdAt: new Date().toISOString(),
            };

            setOfferForListing(listingId, newOffer);
            
            return {
              success: true,
              action,
              offer: newOffer,
              message: 'Offer submitted successfully',
            };

          case 'accept_offer':
            // Seller accepts buyer's offer
            if (!existingOffer) {
              throw new Error('No offer found for this listing');
            }
            
            if (userId !== sellerId) {
              throw new Error('Only the listing owner can accept offers');
            }

            if (existingOffer.status !== OFFER_STATUS.PENDING) {
              throw new Error('Offer is not in pending state');
            }

            const acceptedOffer = setOfferForListing(listingId, {
              ...existingOffer,
              status: OFFER_STATUS.ACCEPTED,
            });

            return {
              success: true,
              action,
              offer: acceptedOffer,
              message: 'Offer accepted',
              shouldCreateTransaction: true,
              transactionPrice: acceptedOffer.offerPrice,
            };

          case 'reject_offer':
            // Seller rejects buyer's offer
            if (!existingOffer) {
              throw new Error('No offer found for this listing');
            }
            
            if (userId !== sellerId) {
              throw new Error('Only the listing owner can reject offers');
            }

            if (existingOffer.status !== OFFER_STATUS.PENDING) {
              throw new Error('Offer is not in pending state');
            }

            const rejectedOffer = setOfferForListing(listingId, {
              ...existingOffer,
              status: OFFER_STATUS.REJECTED,
            });

            return {
              success: true,
              action,
              offer: rejectedOffer,
              message: 'Offer rejected',
            };

          case 'counter_offer':
            // Seller makes counter offer
            if (!counterPrice || counterPrice <= 0) {
              throw new Error('Valid counter price required');
            }

            if (!existingOffer) {
              throw new Error('No offer found for this listing');
            }
            
            if (userId !== sellerId) {
              throw new Error('Only the listing owner can make counter offers');
            }

            if (existingOffer.status !== OFFER_STATUS.PENDING) {
              throw new Error('Offer is not in pending state');
            }

            const counterOffer = setOfferForListing(listingId, {
              ...existingOffer,
              counterPrice: parseFloat(counterPrice),
              status: OFFER_STATUS.COUNTERED,
            });

            return {
              success: true,
              action,
              offer: counterOffer,
              message: 'Counter offer sent',
            };

          case 'accept_counter':
            // Buyer accepts seller's counter offer
            if (!existingOffer) {
              throw new Error('No offer found for this listing');
            }
            
            if (userId !== existingOffer.buyerId) {
              throw new Error('Only the original buyer can accept counter offers');
            }

            if (existingOffer.status !== OFFER_STATUS.COUNTERED) {
              throw new Error('No counter offer to accept');
            }

            const acceptedCounter = setOfferForListing(listingId, {
              ...existingOffer,
              status: OFFER_STATUS.COUNTER_ACCEPTED,
            });

            return {
              success: true,
              action,
              offer: acceptedCounter,
              message: 'Counter offer accepted',
              shouldCreateTransaction: true,
              transactionPrice: acceptedCounter.counterPrice,
            };

          case 'decline_counter':
            // Buyer declines seller's counter offer
            if (!existingOffer) {
              throw new Error('No offer found for this listing');
            }
            
            if (userId !== existingOffer.buyerId) {
              throw new Error('Only the original buyer can decline counter offers');
            }

            if (existingOffer.status !== OFFER_STATUS.COUNTERED) {
              throw new Error('No counter offer to decline');
            }

            const declinedCounter = setOfferForListing(listingId, {
              ...existingOffer,
              status: OFFER_STATUS.COUNTER_DECLINED,
            });

            return {
              success: true,
              action,
              offer: declinedCounter,
              message: 'Counter offer declined',
            };

          default:
            throw new Error('Invalid action');
        }
      });
    })
    .then(result => {
      res.status(200).json(result);
    })
    .catch(e => {
      console.error('Error in make-offer API:', e);
      res.status(400).json({ 
        success: false, 
        error: e.message || 'An error occurred' 
      });
    });
};

// Export helper functions for use in other APIs
module.exports.getOfferForListing = getOfferForListing;
module.exports.setOfferForListing = setOfferForListing;
module.exports.deleteOfferForListing = deleteOfferForListing;
module.exports.OFFER_STATUS = OFFER_STATUS; 