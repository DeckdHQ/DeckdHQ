const { getSdk, handleError } = require('../api-util/sdk');

// In-memory auction store
// global.currentAuction = {
//   auctionId, listingId, title, startTimeISO, endTimeISO, startingBid, minIncrement,
//   reservePrice, featuredImage, sellerId
// }
// global.auctionBids = { [auctionId]: [{ userId, amount, createdAtISO }] }

global.currentAuction = global.currentAuction || null;
global.auctionBids = global.auctionBids || {};

const isOperatorOrAdmin = authInfo => {
  // In Flex, when using Console login-as, token contains flag isLoggedInAs and scopes include 'admin'/'operator'
  const scopes = authInfo?.scopes || [];
  return scopes.includes('admin') || scopes.includes('operator');
};

module.exports = (req, res) => {
  const { listingId, auctionId, startTimeISO, endTimeISO, startingBid, minIncrement, reservePrice } = req.body || {};

  if (global.currentAuction) {
    return res.status(400).json({ success: false, error: 'Another auction is already active' });
  }

  const sdk = getSdk(req, res);

  return sdk
    .authInfo()
    .then(info => {
      if (!isOperatorOrAdmin(info)) {
        const e = new Error('Forbidden');
        e.status = 403;
        throw e;
      }
      if (!listingId || !auctionId || !startTimeISO || !endTimeISO) {
        const e = new Error('Missing required fields');
        e.status = 400;
        throw e;
      }
      // Fetch listing to capture title and author
      return sdk.listings.show({ id: listingId }).then(resp => {
        const listing = resp.data.data;
        const title = listing?.attributes?.title;
        const sellerId = listing?.relationships?.author?.data?.id?.uuid;

        const auction = {
          auctionId,
          listingId,
          title,
          startTimeISO,
          endTimeISO,
          startingBid: Number(startingBid) || 1,
          minIncrement: Number(minIncrement) || 1,
          reservePrice: reservePrice != null ? Number(reservePrice) : null,
          sellerId,
        };

        global.currentAuction = auction;
        global.auctionBids[auctionId] = [];

        return res.status(200).json({ success: true, auction });
      });
    })
    .catch(e => handleError(res, e));
}; 