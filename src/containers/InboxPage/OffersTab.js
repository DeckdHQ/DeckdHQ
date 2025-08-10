import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import classNames from 'classnames';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { types as sdkTypes } from '../../util/sdkLoader';
import { createSlug } from '../../util/urlHelpers';
import { ensureListing } from '../../util/data';

import {
  getUserOffers,
  acceptOffer,
  rejectOffer,
  counterOffer,
  acceptCounterOffer,
  declineCounterOffer,
} from '../../ducks/offer.duck';

import {
  H3,
  NamedLink,
  PrimaryButton,
  SecondaryButton,
  IconSpinner,
} from '../../components';

import { OfferPanel } from '../../components';
import css from './InboxPage.module.css';

const { Money } = sdkTypes;

export const OffersTabComponent = props => {
  const intl = useIntl();
  const {
    currentUser,
    offers,
    getOffersInProgress,
    getOffersError,
    respondToOfferInProgress,
    marketplaceCurrency,
    onGetUserOffers,
    onAcceptOffer,
    onRejectOffer,
    onCounterOffer,
    onAcceptCounter,
    onDeclineCounter,
    getListing,
  } = props;

  // Fetch offers when component mounts
  useEffect(() => {
    if (currentUser) {
      onGetUserOffers();
    }
  }, [currentUser, onGetUserOffers]);

  if (getOffersInProgress) {
    return (
      <div className={css.loadingContainer}>
        <IconSpinner />
        <FormattedMessage id="OffersTab.loadingOffers" />
      </div>
    );
  }

  if (getOffersError) {
    return (
      <div className={css.error}>
        <FormattedMessage id="OffersTab.fetchFailed" />
      </div>
    );
  }

  const hasOffers = offers && offers.length > 0;

  if (!hasOffers) {
    return (
      <div className={css.noResults}>
        <H3 as="h2" className={css.noOffersTitle}>
          <FormattedMessage id="OffersTab.noOffers" />
        </H3>
        <p className={css.noOffersDescription}>
          <FormattedMessage id="OffersTab.noOffersDescription" />
        </p>
      </div>
    );
  }

  // Group offers by status for better organization
  const groupedOffers = offers.reduce((groups, offer) => {
    const group = offer.status;
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(offer);
    return groups;
  }, {});

  const renderOfferItem = offer => {
    const listing = getListing ? getListing(offer.listingId) : null;
    const listingTitle = listing?.attributes?.title || 'Unknown Listing';
    const listingSlug = createSlug(listingTitle);
    
    const formatPrice = amount => {
      try {
        return formatMoney(intl, new Money(amount, marketplaceCurrency));
      } catch (error) {
        return `${marketplaceCurrency} ${amount}`;
      }
    };

    const getStatusText = (status, userRole) => {
      const statusKey = `OffersTab.status.${status}.${userRole}`;
      return <FormattedMessage id={statusKey} />;
    };

    const needsAction = 
      (offer.status === 'pending' && offer.userRole === 'seller') ||
      (offer.status === 'countered' && offer.userRole === 'buyer');

    const canBuyAtAcceptedPrice =
      (offer.status === 'accepted' || offer.status === 'counter_accepted') && offer.userRole === 'buyer';

    return (
      <div 
        key={offer.offerId} 
        className={classNames(css.offerItem, {
          [css.offerNeedsAction]: needsAction,
        })}
      >
        <div className={css.offerHeader}>
          <NamedLink
            name="ListingPage"
            params={{ id: offer.listingId, slug: listingSlug }}
            className={css.offerListingLink}
          >
            <h4 className={css.offerListingTitle}>{listingTitle}</h4>
          </NamedLink>
          <div className={css.offerStatus}>
            {getStatusText(offer.status, offer.userRole)}
          </div>
        </div>

        <div className={css.offerPrices}>
          <div className={css.priceRow}>
            <span className={css.priceLabel}>
              <FormattedMessage id="OffersTab.originalPrice" />
            </span>
            <span className={css.priceValue}>
              {formatPrice(offer.originalPrice)}
            </span>
          </div>
          <div className={css.priceRow}>
            <span className={css.priceLabel}>
              <FormattedMessage id="OffersTab.offerPrice" />
            </span>
            <span className={classNames(css.priceValue, css.offerPriceValue)}>
              {formatPrice(offer.offerPrice)}
            </span>
          </div>
          {offer.counterPrice && (
            <div className={css.priceRow}>
              <span className={css.priceLabel}>
                <FormattedMessage id="OffersTab.counterPrice" />
              </span>
              <span className={classNames(css.priceValue, css.counterPriceValue)}>
                {formatPrice(offer.counterPrice)}
              </span>
            </div>
          )}
        </div>

        {needsAction && (
          <OfferPanel
            className={css.inlineOfferPanel}
            offer={offer}
            currentUser={currentUser}
            listing={listing}
            onAcceptOffer={onAcceptOffer}
            onRejectOffer={onRejectOffer}
            onCounterOffer={onCounterOffer}
            onAcceptCounter={onAcceptCounter}
            onDeclineCounter={onDeclineCounter}
            respondToOfferInProgress={respondToOfferInProgress[offer.listingId] || false}
            intl={intl}
            marketplaceCurrency={marketplaceCurrency}
          />
        )}

        {canBuyAtAcceptedPrice && (
          <div className={css.actionRow}>
            <NamedLink
              name="ListingPage"
              params={{ id: offer.listingId, slug: listingSlug }}
              className={css.buyAtOfferLink}
            >
              <PrimaryButton type="button">
                <FormattedMessage id="OffersTab.buyAtAcceptedPrice" />
              </PrimaryButton>
            </NamedLink>
          </div>
        )}

        <div className={css.offerDates}>
          <span className={css.dateLabel}>
            <FormattedMessage id="OffersTab.created" />
          </span>
          <span className={css.dateValue}>
            {new Date(offer.createdAt).toLocaleDateString()}
          </span>
          {offer.updatedAt !== offer.createdAt && (
            <>
              <span className={css.dateLabel}>
                <FormattedMessage id="OffersTab.updated" />
              </span>
              <span className={css.dateValue}>
                {new Date(offer.updatedAt).toLocaleDateString()}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderOfferGroup = (status, statusOffers) => {
    if (!statusOffers || statusOffers.length === 0) return null;

    return (
      <div key={status} className={css.offerGroup}>
        <h3 className={css.offerGroupTitle}>
          <FormattedMessage 
            id={`OffersTab.groupTitle.${status}`} 
            values={{ count: statusOffers.length }}
          />
        </h3>
        <div className={css.offerList}>
          {statusOffers.map(renderOfferItem)}
        </div>
      </div>
    );
  };

  // Render groups in priority order
  const statusOrder = ['pending', 'countered', 'accepted', 'counter_accepted', 'rejected', 'counter_declined'];
  
  return (
    <div className={css.offersTab}>
      <div className={css.offersHeader}>
        <H3 as="h2" className={css.offersTitle}>
          <FormattedMessage id="OffersTab.title" values={{ count: offers.length }} />
        </H3>
        <p className={css.offersDescription}>
          <FormattedMessage id="OffersTab.description" />
        </p>
      </div>

      <div className={css.offersContent}>
        {statusOrder.map(status => renderOfferGroup(status, groupedOffers[status]))}
      </div>
    </div>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    offers,
    getOffersInProgress,
    getOffersError,
    respondToOfferInProgress,
  } = state.offer;

  return {
    currentUser,
    offers,
    getOffersInProgress,
    getOffersError,
    respondToOfferInProgress,
  };
};

const mapDispatchToProps = dispatch => ({
  onGetUserOffers: () => dispatch(getUserOffers()),
  onAcceptOffer: listingId => dispatch(acceptOffer(listingId)),
  onRejectOffer: listingId => dispatch(rejectOffer(listingId)),
  onCounterOffer: (listingId, counterPrice) => dispatch(counterOffer(listingId, counterPrice)),
  onAcceptCounter: listingId => dispatch(acceptCounterOffer(listingId)),
  onDeclineCounter: listingId => dispatch(declineCounterOffer(listingId)),
});

OffersTabComponent.defaultProps = {
  offers: [],
  getOffersError: null,
  respondToOfferInProgress: {},
};

const OffersTab = compose(
  connect(mapStateToProps, mapDispatchToProps)
)(OffersTabComponent);

export default OffersTab; 