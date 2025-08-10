import { addMarketplaceEntities } from './marketplaceData.duck';
import { makeOffer as makeOfferAPI, getOffers as getOffersAPI } from '../util/api';

// ================ Action types ================ //

export const MAKE_OFFER_REQUEST = 'app/offer/MAKE_OFFER_REQUEST';
export const MAKE_OFFER_SUCCESS = 'app/offer/MAKE_OFFER_SUCCESS';
export const MAKE_OFFER_ERROR = 'app/offer/MAKE_OFFER_ERROR';

export const RESPOND_TO_OFFER_REQUEST = 'app/offer/RESPOND_TO_OFFER_REQUEST';
export const RESPOND_TO_OFFER_SUCCESS = 'app/offer/RESPOND_TO_OFFER_SUCCESS';
export const RESPOND_TO_OFFER_ERROR = 'app/offer/RESPOND_TO_OFFER_ERROR';

export const GET_OFFERS_REQUEST = 'app/offer/GET_OFFERS_REQUEST';
export const GET_OFFERS_SUCCESS = 'app/offer/GET_OFFERS_SUCCESS';
export const GET_OFFERS_ERROR = 'app/offer/GET_OFFERS_ERROR';

export const GET_OFFER_STATUSES_REQUEST = 'app/offer/GET_OFFER_STATUSES_REQUEST';
export const GET_OFFER_STATUSES_SUCCESS = 'app/offer/GET_OFFER_STATUSES_SUCCESS';
export const GET_OFFER_STATUSES_ERROR = 'app/offer/GET_OFFER_STATUSES_ERROR';

// ================ Action creators ================ //

export const makeOfferRequest = listingId => ({ type: MAKE_OFFER_REQUEST, payload: { listingId } });
export const makeOfferSuccess = payload => ({ type: MAKE_OFFER_SUCCESS, payload });
export const makeOfferError = (listingId, error) => ({ type: MAKE_OFFER_ERROR, payload: { listingId, error }, error: true });

export const respondToOfferRequest = listingId => ({ type: RESPOND_TO_OFFER_REQUEST, payload: { listingId } });
export const respondToOfferSuccess = payload => ({ type: RESPOND_TO_OFFER_SUCCESS, payload });
export const respondToOfferError = (listingId, error) => ({ type: RESPOND_TO_OFFER_ERROR, payload: { listingId, error }, error: true });

export const getOffersRequest = () => ({ type: GET_OFFERS_REQUEST });
export const getOffersSuccess = payload => ({ type: GET_OFFERS_SUCCESS, payload });
export const getOffersError = payload => ({ type: GET_OFFERS_ERROR, payload, error: true });

export const getOfferStatusesRequest = () => ({ type: GET_OFFER_STATUSES_REQUEST });
export const getOfferStatusesSuccess = payload => ({ type: GET_OFFER_STATUSES_SUCCESS, payload });
export const getOfferStatusesError = payload => ({ type: GET_OFFER_STATUSES_ERROR, payload, error: true });

// ================ Reducer ================ //

const initialState = {
  makeOfferInProgress: {}, // { listingId: true/false }
  makeOfferError: null,
  respondToOfferInProgress: {}, // { listingId: true/false }
  respondToOfferError: null,
  getOffersInProgress: false,
  getOffersError: null,
  getOfferStatusesInProgress: false,
  getOfferStatusesError: null,
  offers: [], // Array of user's offers
  offerStatuses: {}, // { listingId: { hasOffer, status, isUserBuyer, isUserSeller } }
};

export default function offerReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case MAKE_OFFER_REQUEST: {
      const { listingId } = payload;
      return {
        ...state,
        makeOfferInProgress: {
          ...state.makeOfferInProgress,
          [listingId]: true,
        },
        makeOfferError: null,
      };
    }
    case MAKE_OFFER_SUCCESS: {
      const { offer } = payload;
      const listingId = offer.listingId;
      
      // Clear loading state for this listing
      const updatedMakeOfferInProgress = { ...state.makeOfferInProgress };
      delete updatedMakeOfferInProgress[listingId];
      
      return {
        ...state,
        makeOfferInProgress: updatedMakeOfferInProgress,
        offers: [offer, ...state.offers.filter(o => o.listingId !== listingId)],
        offerStatuses: {
          ...state.offerStatuses,
          [listingId]: {
            hasOffer: true,
            status: offer.status,
            isUserBuyer: true,
            isUserSeller: false,
          },
        },
      };
    }
    case MAKE_OFFER_ERROR: {
      const { listingId, error } = payload;
      const updatedMakeOfferInProgress = { ...state.makeOfferInProgress };
      delete updatedMakeOfferInProgress[listingId];
      
      return {
        ...state,
        makeOfferInProgress: updatedMakeOfferInProgress,
        makeOfferError: error,
      };
    }

    case RESPOND_TO_OFFER_REQUEST: {
      const { listingId } = payload;
      return {
        ...state,
        respondToOfferInProgress: {
          ...state.respondToOfferInProgress,
          [listingId]: true,
        },
        respondToOfferError: null,
      };
    }
    case RESPOND_TO_OFFER_SUCCESS: {
      const { offer } = payload;
      const listingId = offer.listingId;
      
      // Clear loading state for this listing
      const updatedRespondToOfferInProgress = { ...state.respondToOfferInProgress };
      delete updatedRespondToOfferInProgress[listingId];
      
      return {
        ...state,
        respondToOfferInProgress: updatedRespondToOfferInProgress,
        offers: state.offers.map(o => o.listingId === listingId ? offer : o),
        offerStatuses: {
          ...state.offerStatuses,
          [listingId]: {
            hasOffer: true,
            status: offer.status,
            isUserBuyer: offer.buyerId === payload.currentUserId,
            isUserSeller: offer.sellerId === payload.currentUserId,
          },
        },
      };
    }
    case RESPOND_TO_OFFER_ERROR: {
      const { listingId, error } = payload;
      const updatedRespondToOfferInProgress = { ...state.respondToOfferInProgress };
      delete updatedRespondToOfferInProgress[listingId];
      
      return {
        ...state,
        respondToOfferInProgress: updatedRespondToOfferInProgress,
        respondToOfferError: error,
      };
    }

    case GET_OFFERS_REQUEST:
      return {
        ...state,
        getOffersInProgress: true,
        getOffersError: null,
      };
    case GET_OFFERS_SUCCESS:
      return {
        ...state,
        getOffersInProgress: false,
        offers: payload.offers || [],
      };
    case GET_OFFERS_ERROR:
      return {
        ...state,
        getOffersInProgress: false,
        getOffersError: payload,
      };

    case GET_OFFER_STATUSES_REQUEST:
      return {
        ...state,
        getOfferStatusesInProgress: true,
        getOfferStatusesError: null,
      };
    case GET_OFFER_STATUSES_SUCCESS:
      return {
        ...state,
        getOfferStatusesInProgress: false,
        offerStatuses: {
          ...state.offerStatuses,
          ...payload.offerStatuses,
        },
      };
    case GET_OFFER_STATUSES_ERROR:
      return {
        ...state,
        getOfferStatusesInProgress: false,
        getOfferStatusesError: payload,
      };

    default:
      return state;
  }
}

// ================ Thunks ================ //

export const makeOffer = (listingId, offerPrice) => (dispatch, getState, sdk) => {
  dispatch(makeOfferRequest(listingId));

  const requestData = { listingId, action: 'make_offer', offerPrice };
  console.log('Make offer API request data:', requestData);

  return makeOfferAPI(requestData)
    .then(response => {
      console.log('Make offer API response:', response);
      dispatch(makeOfferSuccess(response));
      return response;
    })
    .catch(e => {
      console.error('Make offer error:', e);
      dispatch(makeOfferError(listingId, e));
      throw e;
    });
};

export const acceptOffer = listingId => (dispatch, getState, sdk) => {
  dispatch(respondToOfferRequest(listingId));

  const requestData = { listingId, action: 'accept_offer' };
  console.log('Accept offer API request data:', requestData);

  return makeOfferAPI(requestData)
    .then(response => {
      console.log('Accept offer API response:', response);
      const state = getState();
      const currentUserId = state.user.currentUser?.id?.uuid;
      dispatch(respondToOfferSuccess({ ...response, currentUserId }));
      return response;
    })
    .catch(e => {
      console.error('Accept offer error:', e);
      dispatch(respondToOfferError(listingId, e));
      throw e;
    });
};

export const rejectOffer = listingId => (dispatch, getState, sdk) => {
  dispatch(respondToOfferRequest(listingId));

  const requestData = { listingId, action: 'reject_offer' };
  console.log('Reject offer API request data:', requestData);

  return makeOfferAPI(requestData)
    .then(response => {
      console.log('Reject offer API response:', response);
      const state = getState();
      const currentUserId = state.user.currentUser?.id?.uuid;
      dispatch(respondToOfferSuccess({ ...response, currentUserId }));
      return response;
    })
    .catch(e => {
      console.error('Reject offer error:', e);
      dispatch(respondToOfferError(listingId, e));
      throw e;
    });
};

export const counterOffer = (listingId, counterPrice) => (dispatch, getState, sdk) => {
  dispatch(respondToOfferRequest(listingId));

  const requestData = { listingId, action: 'counter_offer', counterPrice };
  console.log('Counter offer API request data:', requestData);

  return makeOfferAPI(requestData)
    .then(response => {
      console.log('Counter offer API response:', response);
      const state = getState();
      const currentUserId = state.user.currentUser?.id?.uuid;
      dispatch(respondToOfferSuccess({ ...response, currentUserId }));
      return response;
    })
    .catch(e => {
      console.error('Counter offer error:', e);
      dispatch(respondToOfferError(listingId, e));
      throw e;
    });
};

export const acceptCounterOffer = listingId => (dispatch, getState, sdk) => {
  dispatch(respondToOfferRequest(listingId));

  const requestData = { listingId, action: 'accept_counter' };
  console.log('Accept counter offer API request data:', requestData);

  return makeOfferAPI(requestData)
    .then(response => {
      console.log('Accept counter offer API response:', response);
      const state = getState();
      const currentUserId = state.user.currentUser?.id?.uuid;
      dispatch(respondToOfferSuccess({ ...response, currentUserId }));
      return response;
    })
    .catch(e => {
      console.error('Accept counter offer error:', e);
      dispatch(respondToOfferError(listingId, e));
      throw e;
    });
};

export const declineCounterOffer = listingId => (dispatch, getState, sdk) => {
  dispatch(respondToOfferRequest(listingId));

  const requestData = { listingId, action: 'decline_counter' };
  console.log('Decline counter offer API request data:', requestData);

  return makeOfferAPI(requestData)
    .then(response => {
      console.log('Decline counter offer API response:', response);
      const state = getState();
      const currentUserId = state.user.currentUser?.id?.uuid;
      dispatch(respondToOfferSuccess({ ...response, currentUserId }));
      return response;
    })
    .catch(e => {
      console.error('Decline counter offer error:', e);
      dispatch(respondToOfferError(listingId, e));
      throw e;
    });
};

export const getUserOffers = () => (dispatch, getState, sdk) => {
  dispatch(getOffersRequest());

  return getOffersAPI({ type: 'user' })
    .then(response => {
      console.log('Get user offers API response:', response);
      dispatch(getOffersSuccess(response));
      return response;
    })
    .catch(e => {
      console.error('Get user offers error:', e);
      dispatch(getOffersError(e));
      throw e;
    });
};

export const getOfferStatuses = listingIds => (dispatch, getState, sdk) => {
  dispatch(getOfferStatusesRequest());

  return getOffersAPI({ type: 'listing', listingIds: listingIds.join(',') })
    .then(response => {
      console.log('Get offer statuses API response:', response);
      dispatch(getOfferStatusesSuccess(response));
      return response;
    })
    .catch(e => {
      console.error('Get offer statuses error:', e);
      dispatch(getOfferStatusesError(e));
      throw e;
    });
}; 