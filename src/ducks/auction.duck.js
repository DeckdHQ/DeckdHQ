import { storableError } from '../util/errors';
import { getCurrentAuction as apiGetCurrentAuction, placeBid as apiPlaceBid, getBids as apiGetBids } from '../util/api';

// Action types
export const AUCTION_FETCH_REQUEST = 'app/auction/AUCTION_FETCH_REQUEST';
export const AUCTION_FETCH_SUCCESS = 'app/auction/AUCTION_FETCH_SUCCESS';
export const AUCTION_FETCH_ERROR = 'app/auction/AUCTION_FETCH_ERROR';

export const BIDS_FETCH_REQUEST = 'app/auction/BIDS_FETCH_REQUEST';
export const BIDS_FETCH_SUCCESS = 'app/auction/BIDS_FETCH_SUCCESS';
export const BIDS_FETCH_ERROR = 'app/auction/BIDS_FETCH_ERROR';

export const PLACE_BID_REQUEST = 'app/auction/PLACE_BID_REQUEST';
export const PLACE_BID_SUCCESS = 'app/auction/PLACE_BID_SUCCESS';
export const PLACE_BID_ERROR = 'app/auction/PLACE_BID_ERROR';

// Reducer
const initialState = {
  auction: null,
  bids: [],
  fetchInProgress: false,
  fetchError: null,
  bidsInProgress: false,
  bidsError: null,
  placeBidInProgress: false,
  placeBidError: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case AUCTION_FETCH_REQUEST:
      return { ...state, fetchInProgress: true, fetchError: null };
    case AUCTION_FETCH_SUCCESS:
      return { ...state, fetchInProgress: false, auction: payload.auction, bids: payload.bids ?? state.bids };
    case AUCTION_FETCH_ERROR:
      return { ...state, fetchInProgress: false, fetchError: payload };

    case BIDS_FETCH_REQUEST:
      return { ...state, bidsInProgress: true, bidsError: null };
    case BIDS_FETCH_SUCCESS:
      return { ...state, bidsInProgress: false, bids: payload.bids || [] };
    case BIDS_FETCH_ERROR:
      return { ...state, bidsInProgress: false, bidsError: payload };

    case PLACE_BID_REQUEST:
      return { ...state, placeBidInProgress: true, placeBidError: null };
    case PLACE_BID_SUCCESS:
      return {
        ...state,
        placeBidInProgress: false,
        // optimistic: append a summarized bid item for live feeling
        bids: [...state.bids, { amount: payload.highBid, createdAtISO: new Date().toISOString(), bidder: 'You' }],
        auction: payload.auction,
      };
    case PLACE_BID_ERROR:
      return { ...state, placeBidInProgress: false, placeBidError: payload };
    default:
      return state;
  }
}

// Actions
const auctionFetchRequest = () => ({ type: AUCTION_FETCH_REQUEST });
const auctionFetchSuccess = data => ({ type: AUCTION_FETCH_SUCCESS, payload: data });
const auctionFetchError = e => ({ type: AUCTION_FETCH_ERROR, payload: e, error: true });

const bidsFetchRequest = () => ({ type: BIDS_FETCH_REQUEST });
const bidsFetchSuccess = data => ({ type: BIDS_FETCH_SUCCESS, payload: data });
const bidsFetchError = e => ({ type: BIDS_FETCH_ERROR, payload: e, error: true });

const placeBidRequest = () => ({ type: PLACE_BID_REQUEST });
const placeBidSuccess = data => ({ type: PLACE_BID_SUCCESS, payload: data });
const placeBidError = e => ({ type: PLACE_BID_ERROR, payload: e, error: true });

// Thunks
export const loadAuction = () => dispatch => {
  dispatch(auctionFetchRequest());
  return apiGetCurrentAuction()
    .then(resp => dispatch(auctionFetchSuccess(resp)))
    .catch(e => {
      dispatch(auctionFetchError(storableError(e)));
      throw e;
    });
};

export const loadBids = () => dispatch => {
  dispatch(bidsFetchRequest());
  return apiGetBids()
    .then(resp => dispatch(bidsFetchSuccess(resp)))
    .catch(e => {
      dispatch(bidsFetchError(storableError(e)));
      throw e;
    });
};

export const placeBid = amount => dispatch => {
  dispatch(placeBidRequest());
  return apiPlaceBid({ amount })
    .then(resp => dispatch(placeBidSuccess(resp)))
    .catch(e => {
      dispatch(placeBidError(storableError(e)));
      throw e;
    });
};

// Page loader
export const loadData = () => dispatch => {
  return Promise.all([dispatch(loadAuction()), dispatch(loadBids())]);
}; 