const { handleError } = require('../api-util/sdk');

global.currentAuction = global.currentAuction || null;
global.auctionBids = global.auctionBids || {};

module.exports = (req, res) => {
  try {
    const auction = global.currentAuction;
    if (!auction) return res.status(200).json({ success: true, bids: [] });

    const auctionId = auction.auctionId;
    const bids = (global.auctionBids[auctionId] || []).slice(-100);

    const anonymize = uid => {
      if (!uid) return 'User***';
      const suffix = uid.slice(-2);
      return `User***${suffix}`;
    };

    const publicBids = bids.map(b => ({ amount: b.amount, createdAtISO: b.createdAtISO, bidder: anonymize(b.userId) }));

    res.status(200).json({ success: true, bids: publicBids });
  } catch (e) {
    handleError(res, e);
  }
}; 