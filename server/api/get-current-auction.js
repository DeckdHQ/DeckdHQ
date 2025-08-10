const { getSdk, handleError } = require('../api-util/sdk');

// In-memory auction store
// global.currentAuction = {
//   auctionId, listingId, title, startTimeISO, endTimeISO, startingBid, minIncrement,
//   reservePrice, featuredImage, sellerId
// }
// global.auctionBids = { [auctionId]: [{ userId, amount, createdAtISO }] }

global.currentAuction = global.currentAuction || null;
global.auctionBids = global.auctionBids || {};

module.exports = (req, res) => {
  try {
    // Return null if no auction configured
    const auction = global.currentAuction;
    if (!auction) {
      return res.status(200).json({ success: true, auction: null, bids: [] });
    }

    const bids = (global.auctionBids[auction.auctionId] || []).slice(-50);

    res.status(200).json({ success: true, auction, bids });
  } catch (e) {
    handleError(res, e);
  }
}; 