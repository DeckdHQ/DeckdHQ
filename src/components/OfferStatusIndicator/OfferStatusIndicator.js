import React from 'react';
import { string, object } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import css from './OfferStatusIndicator.module.css';

const OfferStatusIndicator = props => {
  const { className, offerStatus } = props;

  if (!offerStatus || !offerStatus.hasOffer) {
    return null;
  }

  const { status, isUserBuyer, isUserSeller } = offerStatus;
  const classes = classNames(css.root, className);

  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        if (isUserBuyer) {
          return <FormattedMessage id="OfferStatusIndicator.offerPending" />;
        } else if (isUserSeller) {
          return <FormattedMessage id="OfferStatusIndicator.offerReceived" />;
        }
        return <FormattedMessage id="OfferStatusIndicator.offerPending" />;

      case 'accepted':
        return <FormattedMessage id="OfferStatusIndicator.offerAccepted" />;

      case 'rejected':
        return <FormattedMessage id="OfferStatusIndicator.offerRejected" />;

      case 'countered':
        if (isUserBuyer) {
          return <FormattedMessage id="OfferStatusIndicator.counterReceived" />;
        } else if (isUserSeller) {
          return <FormattedMessage id="OfferStatusIndicator.counterSent" />;
        }
        return <FormattedMessage id="OfferStatusIndicator.counterOffer" />;

      case 'counter_accepted':
        return <FormattedMessage id="OfferStatusIndicator.counterAccepted" />;

      case 'counter_declined':
        return <FormattedMessage id="OfferStatusIndicator.counterDeclined" />;

      default:
        return null;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'pending':
        return css.pending;
      case 'accepted':
      case 'counter_accepted':
        return css.accepted;
      case 'rejected':
      case 'counter_declined':
        return css.rejected;
      case 'countered':
        return css.countered;
      default:
        return '';
    }
  };

  const statusMessage = getStatusMessage();
  if (!statusMessage) {
    return null;
  }

  return (
    <div className={classNames(classes, getStatusClass())}>
      {statusMessage}
    </div>
  );
};

OfferStatusIndicator.defaultProps = {
  className: null,
};

OfferStatusIndicator.propTypes = {
  className: string,
  offerStatus: object,
};

export default OfferStatusIndicator; 