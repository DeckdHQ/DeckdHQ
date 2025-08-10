const { getSdk, handleError } = require('../api-util/sdk');

global.currentAuction = global.currentAuction || null;
global.auctionBids = global.auctionBids || {};

const isOperatorOrAdmin = authInfo => {
  const scopes = authInfo?.scopes || [];
  return scopes.includes('admin') || scopes.includes('operator');
};

module.exports = (req, res) => {
  const sdk = getSdk(req, res);

  return sdk
    .authInfo()
    .then(info => {
      if (!isOperatorOrAdmin(info)) {
        const e = new Error('Forbidden');
        e.status = 403;
        throw e;
      }

      const auction = global.currentAuction;
      if (!auction) {
        return res.status(200).json({ success: true, auction: null });
      }

      const auctionId = auction.auctionId;
      const bids = global.auctionBids[auctionId] || [];
      const highest = bids.length ? bids[bids.length - 1] : null;

      // Clear in-memory state
      global.currentAuction = null;
      delete global.auctionBids[auctionId];

      return res.status(200).json({ success: true, auctionEnded: true, winner: highest });
    })
    .catch(e => handleError(res, e));
}; 