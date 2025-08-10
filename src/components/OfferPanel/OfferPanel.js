import React, { useState } from 'react';
import { func, bool, string, object } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { types as sdkTypes } from '../../util/sdkLoader';
import { PrimaryButton, SecondaryButton } from '../Button/Button';
import FieldCurrencyInput from '../FieldCurrencyInput/FieldCurrencyInput';
import { Form as FinalForm } from 'react-final-form';
import css from './OfferPanel.module.css';

const { Money } = sdkTypes;

const OfferPanel = props => {
  const {
    className,
    rootClassName,
    offer,
    currentUser,
    listing,
    onAcceptOffer,
    onRejectOffer,
    onCounterOffer,
    onAcceptCounter,
    onDeclineCounter,
    respondToOfferInProgress,
    intl,
    marketplaceCurrency,
  } = props;

  const [showCounterForm, setShowCounterForm] = useState(false);
  const classes = classNames(rootClassName || css.root, className);

  if (!offer || !currentUser) {
    console.log('OfferPanel: Missing offer or currentUser', { offer: !!offer, currentUser: !!currentUser });
    return null;
  }

  const { status, buyerId, sellerId, offerPrice, counterPrice, originalPrice } = offer;
  const isUserBuyer = buyerId === currentUser.id?.uuid;
  const isUserSeller = sellerId === currentUser.id?.uuid;
  // Prefer listing prop id, but reliably fall back to offer.listingId
  const listingId = listing?.id?.uuid || offer.listingId;

  console.log('OfferPanel render conditions:', {
    status,
    buyerId,
    sellerId,
    currentUserId: currentUser.id?.uuid,
    isUserBuyer,
    isUserSeller,
    listingId,
    respondToOfferInProgress
  });

  const formatPrice = amount => {
    try {
      if (!amount || amount === 0) {
        return formatMoney(intl, new Money(0, marketplaceCurrency));
      }
      return formatMoney(intl, new Money(amount, marketplaceCurrency));
    } catch (error) {
      console.error('Error formatting price:', error, 'amount:', amount);
      return `${marketplaceCurrency} ${amount || 0}`;
    }
  };

  const handleCounterOffer = values => {
    const counterAmount = values.counterPrice?.amount;
    if (counterAmount && listingId) {
      onCounterOffer(listingId, counterAmount);
      setShowCounterForm(false);
    }
  };

  const renderOfferDetails = () => (
    <div className={css.offerDetails}>
      <div className={css.priceInfo}>
        <div className={css.priceRow}>
          <span className={css.priceLabel}>
            <FormattedMessage id="OfferPanel.originalPrice" />
          </span>
          <span className={css.priceValue}>{formatPrice(originalPrice)}</span>
        </div>
        <div className={css.priceRow}>
          <span className={css.priceLabel}>
            <FormattedMessage id="OfferPanel.offerPrice" />
          </span>
          <span className={classNames(css.priceValue, css.offerPriceValue)}>
            {formatPrice(offerPrice)}
          </span>
        </div>
        {counterPrice && (
          <div className={css.priceRow}>
            <span className={css.priceLabel}>
              <FormattedMessage id="OfferPanel.counterPrice" />
            </span>
            <span className={classNames(css.priceValue, css.counterPriceValue)}>
              {formatPrice(counterPrice)}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // Seller sees pending offer - can accept, reject, or counter
  if (status === 'pending' && isUserSeller) {
    console.log('Rendering pending offer for seller:', { status, isUserSeller, respondToOfferInProgress, listingId });
    return (
      <div className={classes}>
        <h4 className={css.title}>
          <FormattedMessage id="OfferPanel.offerReceived" />
        </h4>
        
        {renderOfferDetails()}

        {!showCounterForm ? (
          <div className={css.actionButtons}>
            <SecondaryButton
              onClick={() => {
                if (!listingId) return;
                onRejectOffer(listingId);
              }}
              inProgress={respondToOfferInProgress}
              disabled={respondToOfferInProgress || !listingId}
            >
              <FormattedMessage id="OfferPanel.reject" />
            </SecondaryButton>

            <SecondaryButton
              onClick={() => setShowCounterForm(true)}
              disabled={respondToOfferInProgress}
            >
              <FormattedMessage id="OfferPanel.makeCounter" />
            </SecondaryButton>

            <PrimaryButton
              onClick={() => {
                if (!listingId) return;
                onAcceptOffer(listingId);
              }}
              inProgress={respondToOfferInProgress}
              disabled={respondToOfferInProgress || !listingId}
            >
              <FormattedMessage id="OfferPanel.accept" />
            </PrimaryButton>
          </div>
        ) : (
          <div className={css.counterForm}>
            <FinalForm
              onSubmit={handleCounterOffer}
              render={({ handleSubmit, form, submitting, pristine }) => (
                <form onSubmit={handleSubmit}>
                  <FieldCurrencyInput
                    id="counterPrice"
                    name="counterPrice"
                    className={css.counterPriceField}
                    label={intl.formatMessage({ id: 'OfferPanel.counterPriceLabel' })}
                    placeholder={intl.formatMessage({ id: 'OfferPanel.counterPricePlaceholder' })}
                    currencyConfig={{ currency: marketplaceCurrency }}
                    validate={value => {
                      if (!value || !value.amount || value.amount <= 0) {
                        return intl.formatMessage({ id: 'OfferPanel.counterPriceRequired' });
                      }
                      return undefined;
                    }}
                  />
                  
                  <div className={css.formActions}>
                    <SecondaryButton
                      type="button"
                      onClick={() => {
                        setShowCounterForm(false);
                        form.reset();
                      }}
                      disabled={submitting || respondToOfferInProgress}
                    >
                      <FormattedMessage id="OfferPanel.cancel" />
                    </SecondaryButton>
                    
                    <PrimaryButton
                      type="submit"
                      inProgress={submitting || respondToOfferInProgress}
                      disabled={pristine || submitting || respondToOfferInProgress}
                    >
                      <FormattedMessage id="OfferPanel.sendCounter" />
                    </PrimaryButton>
                  </div>
                </form>
              )}
            />
          </div>
        )}
      </div>
    );
  }

  // Buyer sees counter offer - can accept or decline
  if (status === 'countered' && isUserBuyer) {
    return (
      <div className={classes}>
        <h4 className={css.title}>
          <FormattedMessage id="OfferPanel.counterOfferReceived" />
        </h4>
        
        {renderOfferDetails()}

        <div className={css.actionButtons}>
          <SecondaryButton
            className={css.declineButton}
            onClick={() => listingId && onDeclineCounter(listingId)}
            inProgress={respondToOfferInProgress}
            disabled={respondToOfferInProgress || !listingId}
          >
            <FormattedMessage id="OfferPanel.declineCounter" />
          </SecondaryButton>

          <PrimaryButton
            className={css.acceptCounterButton}
            onClick={() => listingId && onAcceptCounter(listingId)}
            inProgress={respondToOfferInProgress}
            disabled={respondToOfferInProgress || !listingId}
          >
            <FormattedMessage id="OfferPanel.acceptCounter" />
          </PrimaryButton>
        </div>
      </div>
    );
  }

  // Show status for completed offers
  if (['accepted', 'rejected', 'counter_accepted', 'counter_declined'].includes(status)) {
    let statusMessage;
    let statusClass = '';

    switch (status) {
      case 'accepted':
        statusMessage = <FormattedMessage id="OfferPanel.offerWasAccepted" />;
        statusClass = css.acceptedStatus;
        break;
      case 'rejected':
        statusMessage = <FormattedMessage id="OfferPanel.offerWasRejected" />;
        statusClass = css.rejectedStatus;
        break;
      case 'counter_accepted':
        statusMessage = <FormattedMessage id="OfferPanel.counterWasAccepted" />;
        statusClass = css.acceptedStatus;
        break;
      case 'counter_declined':
        statusMessage = <FormattedMessage id="OfferPanel.counterWasDeclined" />;
        statusClass = css.rejectedStatus;
        break;
      default:
        return null;
    }

    return (
      <div className={classes}>
        <div className={classNames(css.statusMessage, statusClass)}>
          {statusMessage}
        </div>
        {renderOfferDetails()}
      </div>
    );
  }

  // Buyer sees pending offer (they submitted)
  if (status === 'pending' && isUserBuyer) {
    return (
      <div className={classes}>
        <h4 className={css.title}>
          <FormattedMessage id="OfferPanel.offerSubmitted" />
        </h4>
        {renderOfferDetails()}
        <div className={css.waitingMessage}>
          <FormattedMessage id="OfferPanel.waitingForResponse" />
        </div>
      </div>
    );
  }

  // Seller sees counter offer (they sent)
  if (status === 'countered' && isUserSeller) {
    return (
      <div className={classes}>
        <h4 className={css.title}>
          <FormattedMessage id="OfferPanel.counterOfferSent" />
        </h4>
        {renderOfferDetails()}
        <div className={css.waitingMessage}>
          <FormattedMessage id="OfferPanel.waitingForCounterResponse" />
        </div>
      </div>
    );
  }

  return null;
};

OfferPanel.defaultProps = {
  className: null,
  rootClassName: null,
  respondToOfferInProgress: false,
};

OfferPanel.propTypes = {
  className: string,
  rootClassName: string,
  offer: object,
  currentUser: object,
  listing: object,
  onAcceptOffer: func.isRequired,
  onRejectOffer: func.isRequired,
  onCounterOffer: func.isRequired,
  onAcceptCounter: func.isRequired,
  onDeclineCounter: func.isRequired,
  respondToOfferInProgress: bool,
  intl: intlShape.isRequired,
  marketplaceCurrency: string.isRequired,
};

export default OfferPanel; 