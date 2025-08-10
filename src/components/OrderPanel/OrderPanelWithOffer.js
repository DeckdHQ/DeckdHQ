import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { formatMoney } from '../../util/currency';
import { types as sdkTypes } from '../../util/sdkLoader';

import {
  makeOffer,
  acceptOffer,
  rejectOffer,
  counterOffer,
  acceptCounterOffer,
  declineCounterOffer,
  getOfferStatuses,
  getUserOffers,
} from '../../ducks/offer.duck';

import { MakeOfferButton, OfferPanel } from '../../components';
import OrderPanel from './OrderPanel';

import css from './OrderPanel.module.css';

const { Money } = sdkTypes;

const OrderPanelWithOfferComponent = props => {
  const intl = useIntl();
  const {
    listing,
    currentUser,
    isOwnListing,
    marketplaceCurrency,
    // Offer-related props
    offers,
    offerStatuses,
    makeOfferInProgress,
    respondToOfferInProgress,
    onMakeOffer,
    onAcceptOffer,
    onRejectOffer,
    onCounterOffer,
    onAcceptCounter,
    onDeclineCounter,
    onGetOfferStatuses,
    onGetUserOffers,
    // All other OrderPanel props
    ...orderPanelProps
  } = props;

  const listingId = listing?.id?.uuid;
  const currentOffer = offers.find(offer => offer.listingId === listingId) || null;
  const offerStatus = offerStatuses[listingId];

  // Check for offers when component mounts
  useEffect(() => {
    if (currentUser && listingId) {
      onGetOfferStatuses([listingId]);
      // Ensure we have the user's offers loaded so accepted price can be applied
      if (!currentOffer) {
        onGetUserOffers();
      }
    }
  }, [currentUser, listingId, onGetOfferStatuses, onGetUserOffers]);

  const handleMakeOffer = (listingId, offerPrice) => {
    return onMakeOffer(listingId, offerPrice);
  };

  const handleAcceptOffer = listingId => onAcceptOffer(listingId);
  const handleRejectOffer = listingId => onRejectOffer(listingId);
  const handleCounterOffer = (listingId, counterPrice) => onCounterOffer(listingId, counterPrice);
  const handleAcceptCounter = listingId => onAcceptCounter(listingId);
  const handleDeclineCounter = listingId => onDeclineCounter(listingId);

  // Check if there's an active offer that allows purchase at agreed price
  const hasAcceptedOffer = currentOffer && ['accepted', 'counter_accepted'].includes(currentOffer.status);

  // If there's an accepted offer, we need to modify the price for the transaction
  const finalPrice = hasAcceptedOffer
    ? new Money(currentOffer.status === 'accepted' ? currentOffer.offerPrice : currentOffer.counterPrice, marketplaceCurrency)
    : listing?.attributes?.price;

  // Create modified listing with accepted offer price if applicable
  const modifiedListing = hasAcceptedOffer
    ? {
        ...listing,
        attributes: {
          ...listing.attributes,
          price: finalPrice,
        },
      }
    : listing;

  return (
    <div className={css.orderPanelWrapper}>
      {/* Notice if accepted price is in effect */}
      {hasAcceptedOffer ? (
        <div className={css.offerPanel} style={{ marginBottom: 12 }}>
          <strong>
            {intl.formatMessage({ id: 'OfferPanel.offerWasAccepted' })}
          </strong>
          <div>
            {intl.formatMessage({ id: 'OfferPanel.offerPrice' })}: {formatMoney(intl, finalPrice)}
          </div>
        </div>
      ) : null}

      {/* Show offer panel if there's an active offer */}
      {currentOffer && (
        <OfferPanel
          className={css.offerPanel}
          offer={currentOffer}
          currentUser={currentUser}
          listing={listing}
          onAcceptOffer={handleAcceptOffer}
          onRejectOffer={handleRejectOffer}
          onCounterOffer={handleCounterOffer}
          onAcceptCounter={handleAcceptCounter}
          onDeclineCounter={handleDeclineCounter}
          respondToOfferInProgress={respondToOfferInProgress}
          intl={intl}
          marketplaceCurrency={marketplaceCurrency}
        />
      )}

      {/* Regular OrderPanel */}
      <OrderPanel {...orderPanelProps} listing={modifiedListing} isOwnListing={isOwnListing} marketplaceCurrency={marketplaceCurrency} />

      {/* Make Offer Button - show only if not own listing and no active offer */}
      {!isOwnListing && !currentOffer && (
        <MakeOfferButton
          className={css.makeOfferButton}
          listing={listing}
          currentUser={currentUser}
          onMakeOffer={handleMakeOffer}
          makeOfferInProgress={makeOfferInProgress}
          intl={intl}
          marketplaceCurrency={marketplaceCurrency}
        />
      )}

      {/* Mobile spacer for fixed CTA */}
      <div className={css.mobileCtaSpacer} />
    </div>
  );
};

const mapStateToProps = (state, ownProps) => {
  const { currentUser } = state.user;
  const { offers, offerStatuses, makeOfferInProgress, respondToOfferInProgress } = state.offer;

  // Extract loading state for the specific listing
  const listingId = ownProps.listing?.id?.uuid;
  const currentListingMakeOfferInProgress = makeOfferInProgress[listingId] || false;
  const currentListingRespondToOfferInProgress = respondToOfferInProgress[listingId] || false;

  return {
    currentUser,
    offers,
    offerStatuses,
    makeOfferInProgress: currentListingMakeOfferInProgress,
    respondToOfferInProgress: currentListingRespondToOfferInProgress,
  };
};

const mapDispatchToProps = dispatch => ({
  onMakeOffer: (listingId, offerPrice) => dispatch(makeOffer(listingId, offerPrice)),
  onAcceptOffer: listingId => dispatch(acceptOffer(listingId)),
  onRejectOffer: listingId => dispatch(rejectOffer(listingId)),
  onCounterOffer: (listingId, counterPrice) => dispatch(counterOffer(listingId, counterPrice)),
  onAcceptCounter: listingId => dispatch(acceptCounterOffer(listingId)),
  onDeclineCounter: listingId => dispatch(declineCounterOffer(listingId)),
  onGetOfferStatuses: listingIds => dispatch(getOfferStatuses(listingIds)),
  onGetUserOffers: () => dispatch(getUserOffers()),
});

OrderPanelWithOfferComponent.defaultProps = {
  rootClassName: null,
  className: null,
  titleClassName: null,
  isOwnListing: false,
  lineItems: null,
  fetchLineItemsError: null,
};

OrderPanelWithOfferComponent.propTypes = {
  // Add all the propTypes from OrderPanel
  ...OrderPanel.propTypes,
  // Additional offer-related props will be added by connect()
};

const OrderPanelWithOffer = compose(connect(mapStateToProps, mapDispatchToProps))(OrderPanelWithOfferComponent);

export default OrderPanelWithOffer; 