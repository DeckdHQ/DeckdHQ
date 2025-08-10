const { getSdk, handleError } = require('../api-util/sdk');

global.currentAuction = global.currentAuction || null;
global.auctionBids = global.auctionBids || {};

const UK_TZ_OFFSET_MIN = 0; // Assume server times already in ISO; display handled in FE

module.exports = (req, res) => {
  const { amount } = req.body || {};

  if (!global.currentAuction) {
    return res.status(400).json({ success: false, error: 'No active auction' });
  }

  const auction = global.currentAuction;
  const auctionId = auction.auctionId;

  const now = Date.now();
  const start = Date.parse(auction.startTimeISO);
  const end = Date.parse(auction.endTimeISO);

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }

  if (now < start) {
    return res.status(400).json({ success: false, error: 'Auction not started' });
  }

  if (now > end) {
    return res.status(400).json({ success: false, error: 'Auction ended' });
  }

  const sdk = getSdk(req, res);

  // Require logged-in & email-verified user
  return sdk.currentUser
    .show()
    .then(resp => {
      const user = resp.data.data;
      const emailVerified = user?.attributes?.emailVerified;
      if (!emailVerified) {
        const e = new Error('Email not verified');
        e.status = 403;
        throw e;
      }
      const userId = user.id.uuid;

      const bids = (global.auctionBids[auctionId] = global.auctionBids[auctionId] || []);
      const currentHigh = bids.length ? bids[bids.length - 1].amount : Math.max(auction.startingBid || 1, 1);
      const minNext = currentHigh + (auction.minIncrement || 1);

      if (amount < minNext) {
        return res.status(400).json({ success: false, error: `Bid must be at least £${minNext}` });
      }

      const bid = { userId, amount, createdAtISO: new Date().toISOString() };
      bids.push(bid);

      // Anti-sniping: extend end by 20s if bid in last 60s
      const secondsLeft = (end - now) / 1000;
      if (secondsLeft <= 60) {
        const extendedEnd = new Date(end + 20 * 1000);
        auction.endTimeISO = extendedEnd.toISOString();
        global.currentAuction = auction;
      }

      const anonymize = uid => {
        if (!uid) return 'User***';
        const suffix = uid.slice(-2);
        return `User***${suffix}`;
      };

      const publicHighBidder = anonymize(bid.userId);
      const reserveMet = auction.reservePrice ? amount >= auction.reservePrice : true;

      return res.status(200).json({
        success: true,
        auction,
        highBid: amount,
        highBidder: publicHighBidder,
        minNextBid: amount + (auction.minIncrement || 1),
        reserveMet,
        bidsCount: bids.length,
      });
    })
    .catch(e => handleError(res, e));
}; 