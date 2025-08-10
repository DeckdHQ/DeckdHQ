/**
 * This file contains server side endpoints that can be used to perform backend
 * tasks that can not be handled in the browser.
 *
 * The endpoints should not clash with the application routes. Therefore, the
 * endpoints are prefixed in the main server where this file is used.
 */

const express = require('express');
const bodyParser = require('body-parser');
const { deserialize } = require('./api-util/sdk');

const initiateLoginAs = require('./api/initiate-login-as');
const loginAs = require('./api/login-as');
const transactionLineItems = require('./api/transaction-line-items');
const initiatePrivileged = require('./api/initiate-privileged');
const transitionPrivileged = require('./api/transition-privileged');

const createUserWithIdp = require('./api/auth/createUserWithIdp');
const followUser = require('./api/follow-user');
const getFollowers = require('./api/get-followers');
const likeListing = require('./api/like-listing');
const getLikedListings = require('./api/get-liked-listings');
const checkLikedListings = require('./api/check-liked-listings');
const getListingLikes = require('./api/get-listing-likes');
const makeOffer = require('./api/make-offer');
const getOffers = require('./api/get-offers');

// Auction endpoints
const getCurrentAuction = require('./api/get-current-auction');
const getBids = require('./api/get-bids');
const placeBid = require('./api/place-bid');
const startAuction = require('./api/start-auction');
const endAuction = require('./api/end-auction');

const { authenticateFacebook, authenticateFacebookCallback } = require('./api/auth/facebook');
const { authenticateGoogle, authenticateGoogleCallback } = require('./api/auth/google');

const router = express.Router();

// ================ API router middleware: ================ //

// Parse Transit body first to a string
router.use(
  bodyParser.text({
    type: 'application/transit+json',
  })
);

// Deserialize Transit body string to JS data
router.use((req, res, next) => {
  if (req.get('Content-Type') === 'application/transit+json' && typeof req.body === 'string') {
    try {
      req.body = deserialize(req.body);
    } catch (e) {
      console.error('Failed to parse request body as Transit:');
      console.error(e);
      res.status(400).send('Invalid Transit in request body.');
      return;
    }
  }
  next();
});

// ================ API router endpoints: ================ //

router.get('/initiate-login-as', initiateLoginAs);
router.get('/login-as', loginAs);
router.post('/transaction-line-items', transactionLineItems);
router.post('/initiate-privileged', initiatePrivileged);
router.post('/transition-privileged', transitionPrivileged);

// Create user with identity provider (e.g. Facebook or Google)
// This endpoint is called to create a new user after user has confirmed
// they want to continue with the data fetched from IdP (e.g. name and email)
router.post('/auth/create-user-with-idp', createUserWithIdp);

// Follow/unfollow user endpoints
router.post('/follow-user', followUser);
router.get('/get-followers', getFollowers);

// Like/unlike listing endpoints
router.post('/like-listing', likeListing);
router.get('/get-liked-listings', getLikedListings);
router.post('/check-liked-listings', checkLikedListings);
router.post('/get-listing-likes', getListingLikes);

// Make offer endpoints
router.post('/make-offer', makeOffer);
router.get('/get-offers', getOffers);

// Auction endpoints
router.get('/get-current-auction', getCurrentAuction);
router.get('/get-bids', getBids);
router.post('/place-bid', placeBid);
router.post('/start-auction', startAuction);
router.post('/end-auction', endAuction);

// Facebook authentication endpoints

// This endpoint is called when user wants to initiate authenticaiton with Facebook
router.get('/auth/facebook', authenticateFacebook);

// This is the route for callback URL the user is redirected after authenticating
// with Facebook. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Sharetribe Auth API to authenticate user to the marketplace
router.get('/auth/facebook/callback', authenticateFacebookCallback);

// Google authentication endpoints

// This endpoint is called when user wants to initiate authenticaiton with Google
router.get('/auth/google', authenticateGoogle);

// This is the route for callback URL the user is redirected after authenticating
// with Google. In this route a Passport.js custom callback is used for calling
// loginWithIdp endpoint in Sharetribe Auth API to authenticate user to the marketplace
router.get('/auth/google/callback', authenticateGoogleCallback);

module.exports = router;
