import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { H2, Page, PrimaryButton, IconSpinner, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import { getCurrentAuction, startAuction as apiStartAuction, endAuction as apiEndAuction } from '../../util/api';

const AuctionAdminPageComponent = props => {
  const { isLoggedInAs, authScopes } = props;
  const isOperatorOrAdmin = isLoggedInAs || (authScopes || []).some(s => s === 'admin' || s === 'operator');

  const [loading, setLoading] = useState(true);
  const [auction, setAuction] = useState(null);
  const [error, setError] = useState(null);

  const [listingId, setListingId] = useState('');
  const [auctionId, setAuctionId] = useState('');
  const [startTimeISO, setStartTimeISO] = useState('');
  const [endTimeISO, setEndTimeISO] = useState('');
  const [startingBid, setStartingBid] = useState(1);
  const [minIncrement, setMinIncrement] = useState(1);
  const [reservePrice, setReservePrice] = useState('');

  const refresh = () => {
    setLoading(true);
    getCurrentAuction()
      .then(res => {
        setAuction(res.auction);
        setLoading(false);
      })
      .catch(e => {
        setError(e?.message || 'Failed to load');
        setLoading(false);
      });
  };

  useEffect(() => {
    // initialize defaults
    const now = new Date();
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    setStartTimeISO(now.toISOString());
    setEndTimeISO(inTwoHours.toISOString());
    setAuctionId(`auc_${now.getTime()}`);

    setLoading(true);
    getCurrentAuction()
      .then(res => {
        setAuction(res.auction);
        setLoading(false);
      })
      .catch(e => {
        setError(e?.message || 'Failed to load');
        setLoading(false);
      });
  }, []);

  const onStart = e => {
    e.preventDefault();
    setError(null);
    apiStartAuction({
      listingId,
      auctionId,
      startTimeISO,
      endTimeISO,
      startingBid: Number(startingBid),
      minIncrement: Number(minIncrement),
      reservePrice: reservePrice === '' ? null : Number(reservePrice),
    })
      .then(res => {
        setAuction(res.auction);
      })
      .catch(e => setError(e?.data?.message || e?.message || 'Failed to start auction'));
  };

  const onEnd = () => {
    setError(null);
    apiEndAuction()
      .then(() => {
        setAuction(null);
      })
      .catch(e => setError(e?.data?.message || e?.message || 'Failed to end auction'));
  };

  if (!isOperatorOrAdmin) {
    return (
      <Page title="Auction Admin">
        <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
          <div style={{ padding: '2rem', textAlign: 'center' }}>Forbidden: operator/admin only.</div>
        </LayoutSingleColumn>
      </Page>
    );
  }

  return (
    <Page title="Auction Admin">
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
          <H2 as="h1">Auction Admin</H2>

          {loading ? (
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
              <IconSpinner />
            </div>
          ) : auction ? (
            <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: 6, marginBottom: '2rem' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Active auction</div>
              <div>Listing ID: {auction.listingId}</div>
              <div>Title: {auction.title || '—'}</div>
              <div>Starts: {auction.startTimeISO}</div>
              <div>Ends: {auction.endTimeISO}</div>
              <div>Starting bid: £{auction.startingBid}</div>
              <div>Min increment: £{auction.minIncrement}</div>
              {auction.reservePrice ? <div>Reserve: £{auction.reservePrice}</div> : null}
              <div style={{ marginTop: 12 }}>
                <PrimaryButton type="button" onClick={onEnd}>End auction</PrimaryButton>
              </div>
            </div>
          ) : (
            <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: 6, marginBottom: '2rem' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>No active auction</div>
            </div>
          )}

          {error ? <div style={{ color: 'red', marginBottom: '1rem' }}>{String(error)}</div> : null}

          {!auction ? (
            <form onSubmit={onStart}>
              <div style={{ display: 'grid', gap: 12 }}>
                <label>
                  <div>Listing ID</div>
                  <input value={listingId} onChange={e => setListingId(e.target.value)} placeholder="UUID of listing" required />
                </label>
                <label>
                  <div>Auction ID</div>
                  <input value={auctionId} onChange={e => setAuctionId(e.target.value)} placeholder="unique id for auction" required />
                </label>
                <label>
                  <div>Start time (ISO)</div>
                  <input value={startTimeISO} onChange={e => setStartTimeISO(e.target.value)} required />
                </label>
                <label>
                  <div>End time (ISO)</div>
                  <input value={endTimeISO} onChange={e => setEndTimeISO(e.target.value)} required />
                </label>
                <label>
                  <div>Starting bid (GBP)</div>
                  <input type="number" min="1" value={startingBid} onChange={e => setStartingBid(e.target.value)} required />
                </label>
                <label>
                  <div>Min increment (GBP)</div>
                  <input type="number" min="1" value={minIncrement} onChange={e => setMinIncrement(e.target.value)} required />
                </label>
                <label>
                  <div>Reserve price (GBP, optional)</div>
                  <input type="number" min="0" value={reservePrice} onChange={e => setReservePrice(e.target.value)} />
                </label>
                <div>
                  <PrimaryButton type="submit">Start auction</PrimaryButton>
                </div>
              </div>
            </form>
          ) : null}
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { isLoggedInAs, authScopes } = state.auth || {};
  return { isLoggedInAs, authScopes };
};

const AuctionAdminPage = compose(connect(mapStateToProps))(AuctionAdminPageComponent);

export default AuctionAdminPage; 