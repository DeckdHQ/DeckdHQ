import { createImageVariantConfig } from '../../util/sdkLoader';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';

// ================ Action types ================ //

export const SHOW_SELLER_REQUEST = 'app/SellerPage/SHOW_SELLER_REQUEST';
export const SHOW_SELLER_SUCCESS = 'app/SellerPage/SHOW_SELLER_SUCCESS';
export const SHOW_SELLER_ERROR = 'app/SellerPage/SHOW_SELLER_ERROR';

export const QUERY_SELLER_LISTINGS_REQUEST = 'app/SellerPage/QUERY_SELLER_LISTINGS_REQUEST';
export const QUERY_SELLER_LISTINGS_SUCCESS = 'app/SellerPage/QUERY_SELLER_LISTINGS_SUCCESS';
export const QUERY_SELLER_LISTINGS_ERROR = 'app/SellerPage/QUERY_SELLER_LISTINGS_ERROR';

export const QUERY_SELLER_REVIEWS_REQUEST = 'app/SellerPage/QUERY_SELLER_REVIEWS_REQUEST';
export const QUERY_SELLER_REVIEWS_SUCCESS = 'app/SellerPage/QUERY_SELLER_REVIEWS_SUCCESS';
export const QUERY_SELLER_REVIEWS_ERROR = 'app/SellerPage/QUERY_SELLER_REVIEWS_ERROR';

export const QUERY_SELLER_FOLLOWING_REQUEST = 'app/SellerPage/QUERY_SELLER_FOLLOWING_REQUEST';
export const QUERY_SELLER_FOLLOWING_SUCCESS = 'app/SellerPage/QUERY_SELLER_FOLLOWING_SUCCESS';
export const QUERY_SELLER_FOLLOWING_ERROR = 'app/SellerPage/QUERY_SELLER_FOLLOWING_ERROR';

// ================ Reducer ================ //

const initialState = {
  userShowError: null,
  userShowInProgress: false,
  queryListingsError: null,
  queryListingsInProgress: false,
  listings: [],
  queryReviewsError: null,
  queryReviewsInProgress: false,
  reviews: [],
  followingCount: 0,
  queryFollowingInProgress: false,
  queryFollowingError: null,
};

export default function sellerPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SHOW_SELLER_REQUEST:
      return {
        ...state,
        userShowError: null,
        userShowInProgress: true,
      };
    case SHOW_SELLER_SUCCESS:
      return {
        ...state,
        userShowInProgress: false,
      };
    case SHOW_SELLER_ERROR:
      return {
        ...state,
        userShowError: payload,
        userShowInProgress: false,
      };

    case QUERY_SELLER_LISTINGS_REQUEST:
      return {
        ...state,
        queryListingsError: null,
        queryListingsInProgress: true,
      };
    case QUERY_SELLER_LISTINGS_SUCCESS:
      return {
        ...state,
        listings: payload.listings,
        queryListingsInProgress: false,
      };
    case QUERY_SELLER_LISTINGS_ERROR:
      return {
        ...state,
        queryListingsError: payload,
        queryListingsInProgress: false,
      };

    case QUERY_SELLER_REVIEWS_REQUEST:
      return {
        ...state,
        queryReviewsError: null,
        queryReviewsInProgress: true,
      };
    case QUERY_SELLER_REVIEWS_SUCCESS:
      return {
        ...state,
        reviews: payload.reviews,
        queryReviewsInProgress: false,
      };
    case QUERY_SELLER_REVIEWS_ERROR:
      return {
        ...state,
        queryReviewsError: payload,
        queryReviewsInProgress: false,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const showSellerRequest = () => ({ type: SHOW_SELLER_REQUEST });
export const showSellerSuccess = () => ({ type: SHOW_SELLER_SUCCESS });
export const showSellerError = error => ({
  type: SHOW_SELLER_ERROR,
  payload: error,
  error: true,
});

export const querySellerListingsRequest = () => ({ type: QUERY_SELLER_LISTINGS_REQUEST });
export const querySellerListingsSuccess = listings => ({
  type: QUERY_SELLER_LISTINGS_SUCCESS,
  payload: { listings },
});
export const querySellerListingsError = error => ({
  type: QUERY_SELLER_LISTINGS_ERROR,
  payload: error,
  error: true,
});

export const querySellerReviewsRequest = () => ({ type: QUERY_SELLER_REVIEWS_REQUEST });
export const querySellerReviewsSuccess = reviews => ({
  type: QUERY_SELLER_REVIEWS_SUCCESS,
  payload: { reviews },
});
export const querySellerReviewsError = error => ({
  type: QUERY_SELLER_REVIEWS_ERROR,
  payload: error,
  error: true,
});

// ================ Thunks ================ //

export const showSeller = userId => (dispatch, getState, sdk) => {
  dispatch(showSellerRequest());
  
  return sdk.users
    .show({
      id: userId,
      include: ['profileImage'],
      'fields.user': [
        'profile.displayName',
        'profile.abbreviatedName', 
        'profile.bio',
        'profile.publicData',
        'profile.metadata'
      ],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(showSellerSuccess());
      return response;
    })
    .catch(e => {
      dispatch(showSellerError(storableError(e)));
      throw e;
    });
};

export const querySellerListings = userId => (dispatch, getState, sdk) => {
  dispatch(querySellerListingsRequest());

  // Use default values that work for listing cards
  const aspectWidth = 1;
  const aspectHeight = 1;
  const variantPrefix = 'listing-card';
  const aspectRatio = aspectHeight / aspectWidth;

  return sdk.listings
    .query({
      authorId: userId,
      include: ['author', 'images'],
      'fields.listing': [
        'title',
        'geolocation',
        'state',
        'price',
        'publicData',
        'metadata',
      ],
      'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
      'fields.image': [`variants.${variantPrefix}`, `variants.${variantPrefix}-2x`],
      ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
      ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
      'limit': 50,
    })
    .then(response => {
      const listings = denormalisedResponseEntities(response);
      dispatch(addMarketplaceEntities(response));
      dispatch(querySellerListingsSuccess(listings));
      return response;
    })
    .catch(e => {
      dispatch(querySellerListingsError(storableError(e)));
      throw e;
    });
};

export const querySellerReviews = userId => (dispatch, getState, sdk) => {
  dispatch(querySellerReviewsRequest());

  return sdk.reviews
    .query({
      subjectId: userId,
      subjectType: 'user',
      include: ['author', 'subject'],
      'fields.review': ['type', 'state', 'rating', 'content'],
      'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
      'limit': 20,
    })
    .then(response => {
      const reviews = denormalisedResponseEntities(response);
      dispatch(addMarketplaceEntities(response));
      dispatch(querySellerReviewsSuccess(reviews));
      return response;
    })
    .catch(e => {
      dispatch(querySellerReviewsError(storableError(e)));
      throw e;
    });
};

// ================ Page Data Loading ================ //

export const loadData = (params, search) => dispatch => {
  const userId = params?.id;
  
  if (!userId) {
    return Promise.reject(new Error('Seller ID is required'));
  }

  return Promise.all([
    dispatch(showSeller(userId)),
    dispatch(querySellerListings(userId)),
    dispatch(querySellerReviews(userId)),
  ]);
}; 