import { fetchCurrentUser } from './user.duck';
import { addMarketplaceEntities } from './marketplaceData.duck';
import { likeListing as likeListingAPI, getLikedListings as getLikedListingsAPI, checkLikedListings as checkLikedListingsAPI } from '../util/api';

// ================ Action types ================ //

export const LIKE_LISTING_REQUEST = 'app/like/LIKE_LISTING_REQUEST';
export const LIKE_LISTING_SUCCESS = 'app/like/LIKE_LISTING_SUCCESS';
export const LIKE_LISTING_ERROR = 'app/like/LIKE_LISTING_ERROR';

export const UNLIKE_LISTING_REQUEST = 'app/like/UNLIKE_LISTING_REQUEST';
export const UNLIKE_LISTING_SUCCESS = 'app/like/UNLIKE_LISTING_SUCCESS';
export const UNLIKE_LISTING_ERROR = 'app/like/UNLIKE_LISTING_ERROR';

export const GET_LIKED_LISTINGS_REQUEST = 'app/like/GET_LIKED_LISTINGS_REQUEST';
export const GET_LIKED_LISTINGS_SUCCESS = 'app/like/GET_LIKED_LISTINGS_SUCCESS';
export const GET_LIKED_LISTINGS_ERROR = 'app/like/GET_LIKED_LISTINGS_ERROR';

export const CHECK_LIKED_LISTINGS_REQUEST = 'app/like/CHECK_LIKED_LISTINGS_REQUEST';
export const CHECK_LIKED_LISTINGS_SUCCESS = 'app/like/CHECK_LIKED_LISTINGS_SUCCESS';
export const CHECK_LIKED_LISTINGS_ERROR = 'app/like/CHECK_LIKED_LISTINGS_ERROR';

export const RESET_LIKE_COUNTS = 'app/like/RESET_LIKE_COUNTS';

// ================ Action creators ================ //

export const likeListingRequest = listingId => ({ type: LIKE_LISTING_REQUEST, payload: { listingId } });
export const likeListingSuccess = payload => ({ type: LIKE_LISTING_SUCCESS, payload });
export const likeListingError = (listingId, error) => ({ type: LIKE_LISTING_ERROR, payload: { listingId, error }, error: true });

export const unlikeListingRequest = listingId => ({ type: UNLIKE_LISTING_REQUEST, payload: { listingId } });
export const unlikeListingSuccess = payload => ({ type: UNLIKE_LISTING_SUCCESS, payload });
export const unlikeListingError = (listingId, error) => ({ type: UNLIKE_LISTING_ERROR, payload: { listingId, error }, error: true });

export const getLikedListingsRequest = () => ({ type: GET_LIKED_LISTINGS_REQUEST });
export const getLikedListingsSuccess = payload => ({ type: GET_LIKED_LISTINGS_SUCCESS, payload });
export const getLikedListingsError = payload => ({ type: GET_LIKED_LISTINGS_ERROR, payload, error: true });

export const checkLikedListingsRequest = () => ({ type: CHECK_LIKED_LISTINGS_REQUEST });
export const checkLikedListingsSuccess = payload => ({ type: CHECK_LIKED_LISTINGS_SUCCESS, payload });
export const checkLikedListingsError = payload => ({ type: CHECK_LIKED_LISTINGS_ERROR, payload, error: true });

// ================ Utility functions ================ //

const loadLikeCountsFromStorage = () => {
  try {
    const counts = localStorage.getItem('listingLikeCounts');
    const parsed = counts ? JSON.parse(counts) : {};
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    console.warn('Error loading like counts from storage:', error);
    return {};
  }
};

const saveLikeCountsToStorage = likeCounts => {
  try {
    localStorage.setItem('listingLikeCounts', JSON.stringify(likeCounts));
  } catch (error) {
    console.warn('Error saving like counts to storage:', error);
  }
};

// ================ Reducer ================ //

const initialState = {
  likeInProgress: {}, // { listingId: true/false }
  likeError: null,
  unlikeInProgress: {}, // { listingId: true/false }
  unlikeError: null,
  getLikedListingsInProgress: false,
  getLikedListingsError: null,
  checkLikedListingsInProgress: false,
  checkLikedListingsError: null,
  likesData: {}, // { listingId: { likeCount, isLiked } }
  likeCounts: loadLikeCountsFromStorage(), // Load validated like counts
  likedListings: [], // Array of liked listings for current user
};

export default function likeReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case LIKE_LISTING_REQUEST: {
      const { listingId } = payload;
      return {
        ...state,
        likeInProgress: {
          ...state.likeInProgress,
          [listingId]: true,
        },
        likeError: null,
      };
    }
    case LIKE_LISTING_SUCCESS: {
      const { listingId, likeCount, isLiked, wasAlreadyLiked } = payload;
      
      // Clear loading state for this listing
      const updatedLikeInProgress = { ...state.likeInProgress };
      delete updatedLikeInProgress[listingId];
      
      // Don't update if user already liked this listing
      if (wasAlreadyLiked) {
        console.log('LIKE_LISTING_SUCCESS: User already liked this listing', { listingId });
        return {
          ...state,
          likeInProgress: updatedLikeInProgress,
        };
      }
      
      const updatedCounts = { ...state.likeCounts, [listingId]: likeCount };
      
      console.log('LIKE_LISTING_SUCCESS: updating like state', {
        listingId,
        likeCount,
        isLiked,
        updatedCounts
      });
      
      // Save to localStorage
      saveLikeCountsToStorage(updatedCounts);
      
      return {
        ...state,
        likeInProgress: updatedLikeInProgress,
        likeCounts: updatedCounts,
        likesData: {
          ...state.likesData,
          [listingId]: {
            ...state.likesData[listingId],
            isLiked,
            likeCount,
          },
        },
      };
    }
    case LIKE_LISTING_ERROR: {
      const { listingId, error } = payload;
      const updatedLikeInProgress = { ...state.likeInProgress };
      delete updatedLikeInProgress[listingId];
      
      return {
        ...state,
        likeInProgress: updatedLikeInProgress,
        likeError: error,
      };
    }

    case UNLIKE_LISTING_REQUEST: {
      const { listingId } = payload;
      return {
        ...state,
        unlikeInProgress: {
          ...state.unlikeInProgress,
          [listingId]: true,
        },
        unlikeError: null,
      };
    }
    case UNLIKE_LISTING_SUCCESS: {
      const { listingId, likeCount, isLiked, wasNotLiked } = payload;
      
      // Clear loading state for this listing
      const updatedUnlikeInProgress = { ...state.unlikeInProgress };
      delete updatedUnlikeInProgress[listingId];
      
      // Don't update if user hadn't liked this listing
      if (wasNotLiked) {
        console.log('UNLIKE_LISTING_SUCCESS: User hadn\'t liked this listing', { listingId });
        return {
          ...state,
          unlikeInProgress: updatedUnlikeInProgress,
        };
      }
      
      const updatedCounts = { ...state.likeCounts, [listingId]: likeCount };
      
      console.log('UNLIKE_LISTING_SUCCESS: updating like state', {
        listingId,
        likeCount,
        isLiked,
        updatedCounts
      });
      
      // Save to localStorage
      saveLikeCountsToStorage(updatedCounts);
      
      return {
        ...state,
        unlikeInProgress: updatedUnlikeInProgress,
        likeCounts: updatedCounts,
        likesData: {
          ...state.likesData,
          [listingId]: {
            ...state.likesData[listingId],
            isLiked,
            likeCount,
          },
        },
      };
    }
    case UNLIKE_LISTING_ERROR: {
      const { listingId, error } = payload;
      const updatedUnlikeInProgress = { ...state.unlikeInProgress };
      delete updatedUnlikeInProgress[listingId];
      
      return {
        ...state,
        unlikeInProgress: updatedUnlikeInProgress,
        unlikeError: error,
      };
    }

    case GET_LIKED_LISTINGS_REQUEST:
      return {
        ...state,
        getLikedListingsInProgress: true,
        getLikedListingsError: null,
      };
    case GET_LIKED_LISTINGS_SUCCESS:
      return {
        ...state,
        getLikedListingsInProgress: false,
        likedListings: payload.likedListings || [],
      };
    case GET_LIKED_LISTINGS_ERROR:
      return {
        ...state,
        getLikedListingsInProgress: false,
        getLikedListingsError: payload,
      };

    case CHECK_LIKED_LISTINGS_REQUEST:
      return {
        ...state,
        checkLikedListingsInProgress: true,
        checkLikedListingsError: null,
      };
    case CHECK_LIKED_LISTINGS_SUCCESS: {
      const { likeStatusMap } = payload;
      
      // Update likesData with the like status from backend
      const updatedLikesData = { ...state.likesData };
      const updatedCounts = { ...state.likeCounts };
      
      Object.keys(likeStatusMap).forEach(listingId => {
        const { isLiked, likeCount } = likeStatusMap[listingId];
        updatedLikesData[listingId] = {
          ...updatedLikesData[listingId],
          isLiked,
          likeCount,
        };
        updatedCounts[listingId] = likeCount;
      });
      
      // Save to localStorage
      saveLikeCountsToStorage(updatedCounts);
      
      console.log('CHECK_LIKED_LISTINGS_SUCCESS: Updated like states', {
        likeStatusMap,
        updatedLikesData,
        updatedCounts
      });
      
      return {
        ...state,
        checkLikedListingsInProgress: false,
        likesData: updatedLikesData,
        likeCounts: updatedCounts,
      };
    }
    case CHECK_LIKED_LISTINGS_ERROR:
      return {
        ...state,
        checkLikedListingsInProgress: false,
        checkLikedListingsError: payload,
      };

    case RESET_LIKE_COUNTS:
      localStorage.removeItem('listingLikeCounts');
      return {
        ...state,
        likeCounts: {},
        likesData: {},
      };

    default:
      return state;
  }
}

export const resetLikeCounts = () => ({
  type: RESET_LIKE_COUNTS,
});

// ================ Thunks ================ //

export const likeListing = listingId => (dispatch, getState, sdk) => {
  dispatch(likeListingRequest(listingId));

  return likeListingAPI({ listingId, action: 'like' })
    .then(response => {
      console.log('Like listing API response:', response);
      dispatch(likeListingSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(likeListingError(listingId, e));
      throw e;
    });
};

export const unlikeListing = listingId => (dispatch, getState, sdk) => {
  dispatch(unlikeListingRequest(listingId));

  return likeListingAPI({ listingId, action: 'unlike' })
    .then(response => {
      console.log('Unlike listing API response:', response);
      dispatch(unlikeListingSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(unlikeListingError(listingId, e));
      throw e;
    });
};

export const getLikedListings = userId => (dispatch, getState, sdk) => {
  dispatch(getLikedListingsRequest());

  return getLikedListingsAPI({ userId })
    .then(response => {
      console.log('Get liked listings API response:', response);
      const { likedListings } = response;
      
      // Add listings to marketplace data
      if (likedListings && likedListings.length > 0) {
        dispatch(addMarketplaceEntities(likedListings));
      }
      
      dispatch(getLikedListingsSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(getLikedListingsError(e));
      throw e;
    });
};

export const checkLikedListings = listingIds => (dispatch, getState, sdk) => {
  dispatch(checkLikedListingsRequest());

  return checkLikedListingsAPI({ listingIds })
    .then(response => {
      console.log('Check liked listings API response:', response);
      dispatch(checkLikedListingsSuccess(response));
      return response;
    })
    .catch(e => {
      dispatch(checkLikedListingsError(e));
      throw e;
    });
}; 