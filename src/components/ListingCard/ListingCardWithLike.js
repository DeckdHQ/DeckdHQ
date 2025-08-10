import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import {
  displayPrice,
  isPriceVariationsEnabled,
  requireListingImage,
} from '../../util/configHelpers';
import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { formatMoney } from '../../util/currency';
import { ensureListing, ensureUser } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import { isBookingProcessAlias } from '../../transactions/transaction';

import { likeListing, unlikeListing, checkLikedListings } from '../../ducks/like.duck';
import { getOfferStatuses } from '../../ducks/offer.duck';
import {
  LikeButton,
  LikeCount,
  OfferStatusIndicator,
  NamedLink,
  AspectRatioWrapper,
  ResponsiveImage,
  ListingCardThumbnail,
} from '../../components';

import css from './ListingCard.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;

const priceData = (price, currency, intl) => {
  if (price && price.currency === currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: price.currency }
      ),
    };
  }
  return {};
};

// Lazy-loaded image component with 3s loading delay (copied from ListingCard.js)
const LazyImage = lazyLoadWithDimensions(ResponsiveImage, { loadAfterInitialRendering: 3000 });

/**
 * PriceMaybe component (copied from original ListingCard.js)
 */
const PriceMaybe = props => {
  const { price, publicData, config, intl, listingTypeConfig } = props;
  const showPrice = displayPrice(listingTypeConfig);
  if (!showPrice && price) {
    return null;
  }

  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, listingTypeConfig);
  const hasMultiplePriceVariants = isPriceVariationsInUse && publicData?.priceVariants?.length > 1;

  const isBookable = isBookingProcessAlias(publicData?.transactionProcessAlias);
  const { formattedPrice, priceTitle } = priceData(price, config.currency, intl);

  const priceValue = <span className={css.priceValue}>{formattedPrice}</span>;
  const pricePerUnit = isBookable ? (
    <span className={css.perUnit}>
      <FormattedMessage id="ListingCard.perUnit" values={{ unitType: publicData?.unitType }} />
    </span>
  ) : (
    ''
  );

  return (
    <div className={css.price} title={priceTitle}>
      {hasMultiplePriceVariants ? (
        <FormattedMessage
          id="ListingCard.priceStartingFrom"
          values={{ priceValue, pricePerUnit }}
        />
      ) : (
        <FormattedMessage id="ListingCard.price" values={{ priceValue, pricePerUnit }} />
      )}
    </div>
  );
};

/**
 * ListingCardImage component (unchanged from original)
 */
const ListingCardImage = props => {
  const {
    currentListing,
    setActivePropsMaybe,
    title,
    renderSizes,
    aspectWidth,
    aspectHeight,
    variantPrefix,
    showListingImage,
    style,
  } = props;

  const firstImage =
    currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  return showListingImage ? (
    <AspectRatioWrapper
      className={css.aspectRatioWrapper}
      width={aspectWidth}
      height={aspectHeight}
      {...setActivePropsMaybe}
    >
      <LazyImage
        rootClassName={css.rootForImage}
        alt={title}
        image={firstImage}
        variants={variants}
        sizes={renderSizes}
      />
    </AspectRatioWrapper>
  ) : (
    <ListingCardThumbnail
      style={style}
      listingTitle={title}
      className={css.aspectRatioWrapper}
      width={aspectWidth}
      height={aspectHeight}
    />
  );
};

/**
 * Enhanced ListingCard with Like functionality
 */
export const ListingCardWithLikeComponent = props => {
  const config = useConfiguration();
  const intl = props.intl || useIntl();

  const {
    className,
    rootClassName,
    listing,
    renderSizes,
    setActiveListing,
    showAuthorInfo = true,
    showLikeButton = true,
    // Redux props
    currentUser,
    likeInProgress,
    unlikeInProgress,
    likesData,
    offerStatuses,
    onLikeListing,
    onUnlikeListing,
    onCheckLikedListings,
    onGetOfferStatuses,
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  const { title = '', price, publicData } = currentListing.attributes;
  const slug = createSlug(title);

  const author = ensureUser(listing.author);
  const authorName = author.attributes.profile.displayName;

  const { listingType, cardStyle } = publicData || {};
  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showListingImage = requireListingImage(foundListingTypeConfig);

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;

  // Like functionality
  const likeData = likesData[id] || {};
  const isLiked = likeData.isLiked || false;
  const likeCount = likeData.likeCount || 0;

  // Offer functionality
  const offerStatus = offerStatuses[id] || null;

  // Track if we've already checked liked status for this listing
  const checkedRef = useRef(new Set());
  const offerCheckedRef = useRef(new Set());

  // Check liked status when component mounts if not already known
  useEffect(() => {
    const listingKey = `${currentUser?.id?.uuid}-${id}`;
    const hasLikeData = likeData.hasOwnProperty('isLiked');
    
    if (currentUser && onCheckLikedListings && !hasLikeData && !checkedRef.current.has(listingKey)) {
      checkedRef.current.add(listingKey);
      onCheckLikedListings([id]);
    }
  }, [currentUser?.id?.uuid, id, likeData.isLiked, onCheckLikedListings]);

  // Check offer status when component mounts if not already known
  useEffect(() => {
    const offerKey = `${currentUser?.id?.uuid}-${id}-offer`;
    const hasOfferData = offerStatus !== null;
    
    if (currentUser && onGetOfferStatuses && !hasOfferData && !offerCheckedRef.current.has(offerKey)) {
      offerCheckedRef.current.add(offerKey);
      onGetOfferStatuses([id]);
    }
  }, [currentUser?.id?.uuid, id, offerStatus, onGetOfferStatuses]);

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUser && onLikeListing) {
      onLikeListing(id);
    }
  };

  const handleUnlike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUser && onUnlikeListing) {
      onUnlikeListing(id);
    }
  };

  // Sets the listing as active in the search map when hovered (if the search map is enabled)
  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => setActiveListing(currentListing.id),
        onMouseLeave: () => setActiveListing(null),
      }
    : null;

  return (
    <div className={classes}>
      <NamedLink className={css.listingLink} name="ListingPage" params={{ id, slug }}>
        <ListingCardImage
          renderSizes={renderSizes}
          title={title}
          currentListing={currentListing}
          config={config}
          setActivePropsMaybe={setActivePropsMaybe}
          aspectWidth={aspectWidth}
          aspectHeight={aspectHeight}
          variantPrefix={variantPrefix}
          style={cardStyle}
          showListingImage={showListingImage}
        />
        <div className={css.info}>
          <PriceMaybe
            price={price}
            publicData={publicData}
            config={config}
            intl={intl}
            listingTypeConfig={foundListingTypeConfig}
          />
          <div className={css.mainInfo}>
            {showListingImage && (
              <div className={css.title}>
                {richText(title, {
                  longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
                  longWordClass: css.longWord,
                })}
              </div>
            )}
            {showAuthorInfo ? (
              <div className={css.authorInfo}>
                <FormattedMessage id="ListingCard.author" values={{ authorName }} />
              </div>
            ) : null}
          </div>
        </div>
      </NamedLink>
      
      {/* Like functionality */}
      <div className={css.likeSection}>
        <LikeCount count={likeCount} className={css.likeCount} />
        {showLikeButton && currentUser && (
          <LikeButton
            className={css.likeButton}
            isLiked={isLiked}
            onLike={handleLike}
            onUnlike={handleUnlike}
            likeInProgress={likeInProgress}
            unlikeInProgress={unlikeInProgress}
          />
        )}
      </div>
      
      {/* Offer status */}
      {currentUser && offerStatus && (
        <OfferStatusIndicator
          className={css.offerStatus}
          offerStatus={offerStatus}
        />
      )}
    </div>
  );
};

const mapStateToProps = (state, ownProps) => {
  const { currentUser } = state.user;
  const {
    likeInProgress,
    unlikeInProgress,
    likesData,
  } = state.like;
  const { offerStatuses } = state.offer;

  // Extract loading state for this specific listing
  const listingId = ownProps.listing?.id?.uuid;
  const currentListingLikeInProgress = likeInProgress[listingId] || false;
  const currentListingUnlikeInProgress = unlikeInProgress[listingId] || false;

  return {
    currentUser,
    likeInProgress: currentListingLikeInProgress,
    unlikeInProgress: currentListingUnlikeInProgress,
    likesData,
    offerStatuses,
  };
};

const mapDispatchToProps = dispatch => ({
  onLikeListing: listingId => dispatch(likeListing(listingId)),
  onUnlikeListing: listingId => dispatch(unlikeListing(listingId)),
  onCheckLikedListings: listingIds => dispatch(checkLikedListings(listingIds)),
  onGetOfferStatuses: listingIds => dispatch(getOfferStatuses(listingIds)),
});

const ListingCardWithLike = compose(
  connect(mapStateToProps, mapDispatchToProps)
)(ListingCardWithLikeComponent);

export default ListingCardWithLike; 