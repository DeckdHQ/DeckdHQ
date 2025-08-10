import React, { useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { H2, Page, PrimaryButton, IconSpinner, NamedLink, LayoutSingleColumn } from '../../components';
import { loadAuction, loadBids, placeBid } from '../../ducks/auction.duck';
import { createSlug } from '../../util/urlHelpers';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import css from './AuctionPage.module.css';

const useCountdown = endISO => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const end = endISO ? Date.parse(endISO) : null;
  const diff = end ? Math.max(0, end - now) : 0;
  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / (1000 * 60)) % 60;
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { diff, days, hours, minutes, seconds };
};

const AuctionPageComponent = props => {
  const intl = useIntl();
  const { auction, bids, fetchInProgress, loadAuctionData, loadBidsData, placeBidAction, currentUser } = props;
  const [bidAmount, setBidAmount] = useState('');

  useEffect(() => {
    loadAuctionData();
    loadBidsData();
    const id = setInterval(() => loadBidsData(), 5000);
    return () => clearInterval(id);
  }, [loadAuctionData, loadBidsData]);

  const countdown = useCountdown(auction?.endTimeISO);

  if (fetchInProgress && !auction) {
    return (
      <Page title="Auction">
        <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
          <div className={css.center}><IconSpinner /></div>
        </LayoutSingleColumn>
      </Page>
    );
  }

  if (!auction) {
    return (
      <Page title="Auction">
        <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
          <div className={css.center}><FormattedMessage id="AuctionPage.noAuction" defaultMessage="No auction this week." /></div>
        </LayoutSingleColumn>
      </Page>
    );
  }

  const listingLinkParams = { id: auction.listingId, slug: createSlug(auction.title || 'item') };

  const currentHigh = bids.length ? bids[bids.length - 1].amount : Math.max(auction.startingBid || 1, 1);
  const minNext = currentHigh + (auction.minIncrement || 1);
  const auctionEnded = countdown.diff === 0;
  const canBid = !!currentUser && !auctionEnded;

  const onPlaceBid = e => {
    e.preventDefault();
    const val = parseInt(bidAmount, 10);
    if (isNaN(val)) return;
    if (val < minNext) return;
    placeBidAction(val).then(() => setBidAmount(''));
  };

  return (
    <Page title="Auction">
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.header}>
            <H2 as="h1"><FormattedMessage id="AuctionPage.title" defaultMessage="Weekly Auction" /></H2>
            <div className={css.countdown}>
              {auctionEnded ? (
                <span><FormattedMessage id="AuctionPage.ended" defaultMessage="Auction ended" /></span>
              ) : (
                <>
                  <span>{countdown.days}d</span> : <span>{countdown.hours}h</span> : <span>{countdown.minutes}m</span> : <span>{countdown.seconds}s</span>
                </>
              )}
            </div>
          </div>

          <div className={css.itemCard}>
            <NamedLink name="ListingPage" params={listingLinkParams} className={css.itemLink}>
              <div className={css.itemTitle}>{auction.title}</div>
            </NamedLink>
            <div className={css.infoRow}>
              <div><FormattedMessage id="AuctionPage.currentBid" defaultMessage="Current bid" />: £{currentHigh}</div>
              <div><FormattedMessage id="AuctionPage.minNext" defaultMessage="Min next bid" />: £{minNext}</div>
              {auction.reservePrice ? (
                <div><FormattedMessage id="AuctionPage.reserve" defaultMessage="Reserve" />: £{auction.reservePrice}</div>
              ) : null}
            </div>

            <form className={css.bidForm} onSubmit={onPlaceBid}>
              <input
                className={css.bidInput}
                type="number"
                min={minNext}
                step={auction.minIncrement || 1}
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                disabled={!canBid}
                placeholder={`£${minNext}`}
              />
              <PrimaryButton type="submit" disabled={!canBid}>
                <FormattedMessage id="AuctionPage.placeBid" defaultMessage="Place bid" />
              </PrimaryButton>
            </form>

            <div className={css.bids}>
              <div className={css.bidsTitle}><FormattedMessage id="AuctionPage.bidHistory" defaultMessage="Bid history" /></div>
              {bids.length === 0 ? (
                <div className={css.muted}><FormattedMessage id="AuctionPage.noBids" defaultMessage="No bids yet." /></div>
              ) : (
                <ul className={css.bidList}>
                  {bids.slice().reverse().map((b, idx) => (
                    <li key={idx} className={css.bidItem}>
                      <span>£{b.amount}</span>
                      <span className={css.bidder}>{b.bidder}</span>
                      <span className={css.time}>{new Date(b.createdAtISO).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { auction, bids, fetchInProgress } = state.auction || {};
  const { currentUser } = state.user;
  return { auction, bids, fetchInProgress, currentUser };
};

const mapDispatchToProps = dispatch => ({
  loadAuctionData: () => dispatch(loadAuction()),
  loadBidsData: () => dispatch(loadBids()),
  placeBidAction: amount => dispatch(placeBid(amount)),
});

const AuctionPage = compose(connect(mapStateToProps, mapDispatchToProps))(AuctionPageComponent);

export default AuctionPage; 