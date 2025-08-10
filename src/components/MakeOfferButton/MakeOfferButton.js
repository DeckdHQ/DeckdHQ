import React, { useState } from 'react';
import { func, bool, string, number, object } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { types as sdkTypes } from '../../util/sdkLoader';
import { PrimaryButton, SecondaryButton } from '../Button/Button';
import FieldCurrencyInput from '../FieldCurrencyInput/FieldCurrencyInput';
import { Form as FinalForm } from 'react-final-form';
import css from './MakeOfferButton.module.css';

const { Money } = sdkTypes;

const MakeOfferButton = props => {
  const {
    className,
    rootClassName,
    listing,
    currentUser,
    onMakeOffer,
    makeOfferInProgress,
    disabled,
    intl,
    marketplaceCurrency,
  } = props;

  const [showOfferForm, setShowOfferForm] = useState(false);
  const classes = classNames(rootClassName || css.root, className);

  if (!currentUser) {
    return null;
  }

  const listingId = listing?.id?.uuid;
  const originalPrice = listing?.attributes?.price;
  const isOwnListing = currentUser?.id?.uuid === listing?.relationships?.author?.data?.id?.uuid;

  if (isOwnListing) {
    return null; // Don't show make offer button on own listings
  }

  const handleMakeOffer = values => {
    const offerAmount = values.offerPrice?.amount;
    if (offerAmount && listingId) {
      onMakeOffer(listingId, offerAmount);
      setShowOfferForm(false);
    }
  };

  if (!showOfferForm) {
    return (
      <div className={classes}>
        <SecondaryButton
          className={css.makeOfferButton}
          onClick={() => setShowOfferForm(true)}
          disabled={disabled}
        >
          <FormattedMessage id="MakeOfferButton.makeOffer" />
        </SecondaryButton>
      </div>
    );
  }

  return (
    <div className={classes}>
      <div className={css.offerForm}>
        <h4 className={css.offerTitle}>
          <FormattedMessage id="MakeOfferButton.makeOfferTitle" />
        </h4>
        
        {originalPrice && (
          <div className={css.originalPrice}>
            <FormattedMessage 
              id="MakeOfferButton.originalPrice" 
              values={{ 
                price: formatMoney(intl, originalPrice) 
              }} 
            />
          </div>
        )}

        <FinalForm
          onSubmit={handleMakeOffer}
          render={({ handleSubmit, form, submitting, pristine, values }) => (
            <form onSubmit={handleSubmit} className={css.form}>
              <FieldCurrencyInput
                id="offerPrice"
                name="offerPrice"
                className={css.priceField}
                label={intl.formatMessage({ id: 'MakeOfferButton.offerPriceLabel' })}
                placeholder={intl.formatMessage({ id: 'MakeOfferButton.offerPricePlaceholder' })}
                currencyConfig={{ currency: marketplaceCurrency, ...values }}
                validate={value => {
                  if (!value || !value.amount || value.amount <= 0) {
                    return intl.formatMessage({ id: 'MakeOfferButton.offerPriceRequired' });
                  }
                  return undefined;
                }}
              />

              <div className={css.formActions}>
                <SecondaryButton
                  type="button"
                  className={css.cancelButton}
                  onClick={() => {
                    setShowOfferForm(false);
                    form.reset();
                  }}
                  disabled={submitting || makeOfferInProgress}
                >
                  <FormattedMessage id="MakeOfferButton.cancel" />
                </SecondaryButton>
                
                <PrimaryButton
                  type="submit"
                  className={css.submitButton}
                  inProgress={submitting || makeOfferInProgress}
                  disabled={pristine || submitting || makeOfferInProgress}
                >
                  <FormattedMessage id="MakeOfferButton.submitOffer" />
                </PrimaryButton>
              </div>
            </form>
          )}
        />
      </div>
    </div>
  );
};

MakeOfferButton.defaultProps = {
  className: null,
  rootClassName: null,
  disabled: false,
};

MakeOfferButton.propTypes = {
  className: string,
  rootClassName: string,
  listing: object.isRequired,
  currentUser: object,
  onMakeOffer: func.isRequired,
  makeOfferInProgress: bool,
  disabled: bool,
  intl: object.isRequired,
  marketplaceCurrency: string.isRequired,
};

export default MakeOfferButton; 