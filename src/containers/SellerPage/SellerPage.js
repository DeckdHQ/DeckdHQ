import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { ensureCurrentUser, ensureUser } from '../../util/data';
// import { propTypes } from '../../util/types'; // Temporarily removed
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { followUser, unfollowUser, getFollowers } from '../../ducks/follow.duck';

import {
  Page,
  LayoutSingleColumn,
  LayoutSideNavigation,
  NamedLink,
  Avatar,
  AvatarLarge,
  FollowButton,
  FollowerCount,
  VerifiedBadge,
  H1,
  H2,
  H3,
  H4,
  IconLocation,
} from '../../components';

import ListingCardWithLike from '../../components/ListingCard/ListingCardWithLike';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import NotFoundPage from '../NotFoundPage/NotFoundPage';

import { loadData } from './SellerPage.duck';
import css from './SellerPage.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;

export const SellerHeader = props => {
  const {
    seller,
    currentUser,
    followerCount,
    isFollowing,
    onFollow,
    onUnfollow,
    followInProgress,
    unfollowInProgress,
    isCurrentUser,
  } = props;

  const displayName = seller?.attributes?.profile?.displayName || 'Unknown User';
  const bio = seller?.attributes?.profile?.bio;
  const isVerified = seller?.attributes?.profile?.publicData?.verified === true;
  const joinedDate = seller?.attributes?.createdAt;
  const location = seller?.attributes?.profile?.publicData?.location?.address;
  
  const bioWithLinks = bio ? richText(bio, {
    linkify: true,
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
    longWordClass: css.longWord,
  }) : null;

  const formattedJoinedDate = joinedDate 
    ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(joinedDate))
    : '';

  return (
    <div className={css.sellerHeader}>
      <div className={css.avatarSection}>
        <AvatarLarge className={css.avatar} user={seller} disableProfileLink />
        {isVerified && (
          <VerifiedBadge isVerified={true} className={css.headerVerifiedBadge} />
        )}
      </div>
      
      <div className={css.sellerInfo}>
        <div className={css.nameSection}>
          <H1 className={css.displayName}>{displayName}</H1>
          <div className={css.handle}>@{seller?.id?.uuid?.slice(0, 8) || 'user'}</div>
        </div>
        
        {bioWithLinks && (
          <div className={css.bio}>{bioWithLinks}</div>
        )}
        
        <div className={css.metadata}>
          {location && (
            <span className={css.location}>
              <IconLocation className={css.locationIcon} />
              {location}
            </span>
          )}
          {formattedJoinedDate && (
            <span className={css.joinedDate}>
              <FormattedMessage id="SellerPage.joined" values={{ date: formattedJoinedDate }} />
            </span>
          )}
        </div>

        <div className={css.actionButtons}>
          {!isCurrentUser && currentUser && (
            <FollowButton
              className={css.followButton}
              isFollowing={isFollowing}
              onFollow={onFollow}
              onUnfollow={onUnfollow}
              followInProgress={followInProgress}
              unfollowInProgress={unfollowInProgress}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const SellerStats = props => {
  const { followerCount, followingCount } = props;

  return (
    <div className={css.sellerStats}>
      <div className={css.stat}>
        <span className={css.statNumber}>{followerCount || 0}</span>
        <span className={css.statLabel}>
          <FormattedMessage id="SellerPage.followers" />
        </span>
      </div>
      
      <div className={css.stat}>
        <span className={css.statNumber}>{followingCount || 0}</span>
        <span className={css.statLabel}>
          <FormattedMessage id="SellerPage.following" />
        </span>
      </div>
    </div>
  );
};

export const SellerListingsSection = props => {
  const {
    listings,
    listingsFilter,
    onFilterChange,
    priceSort,
    onPriceSortChange,
    categoryFilter,
    onCategoryFilterChange,
  } = props;

  const forSaleListings = listings.filter(l => l.attributes.state === 'published');
  const soldListings = listings.filter(l => l.attributes.state === 'closed');
  
  const displayListings = listingsFilter === 'sold' ? soldListings : forSaleListings;

  return (
    <div className={css.listingsSection}>
      <div className={css.listingsHeader}>
        <H3 className={css.listingsTitle}>
          <FormattedMessage id="SellerPage.listings" />
        </H3>
        
        <div className={css.listingsFilters}>
          <select 
            className={css.filterSelect}
            value={listingsFilter}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="forSale">
              <FormattedMessage id="SellerPage.forSale" />
            </option>
            <option value="sold">
              <FormattedMessage id="SellerPage.sold" />
            </option>
          </select>
          
          <select 
            className={css.filterSelect}
            value={priceSort}
            onChange={(e) => onPriceSortChange(e.target.value)}
          >
            <option value="newest">
              <FormattedMessage id="SellerPage.newest" />
            </option>
            <option value="lowToHigh">
              <FormattedMessage id="SellerPage.priceLowToHigh" />
            </option>
            <option value="highToLow">
              <FormattedMessage id="SellerPage.priceHighToLow" />
            </option>
          </select>
        </div>
      </div>
      
      <div className={css.listingsGrid}>
        {displayListings.map(listing => (
          <div key={listing.id.uuid} className={css.listingCard}>
            <ListingCardWithLike 
              listing={listing} 
              showAuthorInfo={false}
              renderSizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
            />
          </div>
        ))}
      </div>
      
      {displayListings.length === 0 && (
        <div className={css.noListings}>
          <FormattedMessage 
            id={listingsFilter === 'sold' ? 'SellerPage.noSoldListings' : 'SellerPage.noListings'} 
          />
        </div>
      )}
    </div>
  );
};

export const SellerPageComponent = props => {
  const config = useConfiguration();
  const intl = useIntl();
  const [mounted, setMounted] = useState(false);
  const [listingsFilter, setListingsFilter] = useState('forSale');
  const [priceSort, setPriceSort] = useState('newest');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    scrollingDisabled,
    currentUser,
    userShowError,
    seller,
    listings,
    queryListingsError,
    followersData,
    onFollowUser,
    onUnfollowUser,
    onGetFollowers,
    params,
    ...rest
  } = props;

  const pathParams = params || {};
  const sellerIdFromParams = pathParams.handle;

  if (userShowError && userShowError.status === 404) {
    return <NotFoundPage staticContext={props.staticContext} />;
  }

  const ensuredCurrentUser = ensureCurrentUser(currentUser);
  const ensuredSeller = ensureUser(seller);
  const isCurrentUser = ensuredCurrentUser.id && ensuredSeller.id 
    ? ensuredCurrentUser.id.uuid === ensuredSeller.id.uuid 
    : false;

  // Follow functionality
  const sellerId = ensuredSeller?.id?.uuid;
  const followerData = sellerId ? followersData[sellerId] : null;
  const followerCount = followerData?.followerCount ?? 0;
  const isFollowing = followerData?.isFollowing ?? false;

  // Get followers when component mounts
  useEffect(() => {
    if (sellerId && mounted) {
      onGetFollowers(sellerId);
    }
  }, [sellerId, mounted, onGetFollowers, currentUser?.id?.uuid]);

  const handleFollow = () => {
    if (sellerId) {
      onFollowUser(sellerId);
    }
  };

  const handleUnfollow = () => {
    if (sellerId) {
      onUnfollowUser(sellerId);
    }
  };

  const followInProgress = false; // You can add this to Redux state if needed
  const unfollowInProgress = false; // You can add this to Redux state if needed

  // Calculate stats
  // Reviews and ratings removed as requested

  const schemaTitle = intl.formatMessage(
    { id: 'SellerPage.schemaTitle' },
    { sellerDisplayName: ensuredSeller?.attributes?.profile?.displayName }
  );

  if (userShowError || queryListingsError) {
    return (
      <Page title={schemaTitle} scrollingDisabled={scrollingDisabled}>
        <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
          <div className={css.error}>
            <FormattedMessage id="SellerPage.loadingDataFailed" />
          </div>
        </LayoutSingleColumn>
      </Page>
    );
  }

  return (
    <Page
      title={schemaTitle}
      scrollingDisabled={scrollingDisabled}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'ProfilePage',
        mainEntity: {
          '@type': 'Person',
          name: ensuredSeller?.attributes?.profile?.displayName,
        },
        name: schemaTitle,
      }}
    >
      <LayoutSingleColumn
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
        className={css.pageRoot}
      >
        <div className={css.contentWrapper}>
          <SellerHeader
            seller={ensuredSeller}
            currentUser={ensuredCurrentUser}
            followerCount={followerCount}
            isFollowing={isFollowing}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            followInProgress={followInProgress}
            unfollowInProgress={unfollowInProgress}
            isCurrentUser={isCurrentUser}
          />
          
          <SellerStats
            followerCount={followerCount}
            followingCount={0} // You can add this to your data
          />
          
          <SellerListingsSection
            listings={listings || []}
            listingsFilter={listingsFilter}
            onFilterChange={setListingsFilter}
            priceSort={priceSort}
            onPriceSortChange={setPriceSort}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
          />
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

SellerPageComponent.defaultProps = {
  currentUser: null,
  seller: null,
  userShowError: null,
  queryListingsError: null,
  queryReviewsError: null,
  listings: [],
  reviews: [],
  followersData: {},
};

// PropTypes removed for now to avoid import issues
// SellerPageComponent.propTypes = {
//   scrollingDisabled: bool.isRequired,
//   currentUser: propTypes.currentUser,
//   seller: propTypes.user,
//   userShowError: propTypes.error,
//   queryListingsError: propTypes.error,
//   queryReviewsError: propTypes.error,
//   listings: array,
//   reviews: array,
//   followersData: object,
//   onFollowUser: func.isRequired,
//   onUnfollowUser: func.isRequired,
//   onGetFollowers: func.isRequired,
//   params: object.isRequired,
// };

const mapStateToProps = (state, ownProps) => {
  const { currentUser } = state.user;
  const { followersData } = state.follow;
  
  const pathParams = ownProps.params || {};
  const sellerId = pathParams.id;
  
  // Get seller from marketplace entities
  const sellerMatches = getMarketplaceEntities(state, [{ type: 'user', id: sellerId }]);
  const seller = sellerMatches.length === 1 ? sellerMatches[0] : null;
  
  const {
    userShowError,
    queryListingsError,
    queryReviewsError,
    listings,
    reviews,
  } = state.SellerPage || {};

  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    seller,
    userShowError,
    queryListingsError,
    queryReviewsError,
    listings,
    reviews,
    followersData,
  };
};

const mapDispatchToProps = {
  onFollowUser: followUser,
  onUnfollowUser: unfollowUser,
  onGetFollowers: getFollowers,
};

const SellerPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(SellerPageComponent);

SellerPage.loadData = loadData;

export default SellerPage; 