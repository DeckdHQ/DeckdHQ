/**
 * SellerPage displays a comprehensive seller profile with:
 * - Header: avatar, display name, handle, bio, joined date, follow/message/share/report buttons
 * - Stats: followers, following, rating, reviews count  
 * - Listings feed: grid layout with filters (For Sale/Sold, Price, Category)
 * - Reviews module: list with stars, text, date, buyer/seller badges
 * 
 * URL pattern: /seller/{handle}
 * 
 * This page is accessible via "Visit Seller" button from listing pages.
 */

import SellerPage from './SellerPage';

export const SellerPageExample = {
  title: 'SellerPage',
  component: SellerPage,
  parameters: {
    componentSubtitle: 'Depop-style seller/vendor page showing seller info, stats, listings and reviews',
  },
};

export const Default = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <h2>SellerPage Component</h2>
      <p>
        The SellerPage component is a comprehensive seller profile page that includes:
      </p>
      <ul>
        <li><strong>Header Section:</strong> Avatar, display name, handle, bio, location, joined date</li>
        <li><strong>Action Buttons:</strong> Follow, Message, Share, Report (for non-owners)</li>
        <li><strong>Stats Bar:</strong> Followers, Following, Average Rating, Reviews Count</li>
        <li><strong>Listings Grid:</strong> Responsive grid (2-col mobile, 3-col tablet, 4-col desktop)</li>
        <li><strong>Filters:</strong> For Sale/Sold toggle, Price sorting, Category filter</li>
        <li><strong>Reviews Section:</strong> User reviews with ratings and text</li>
      </ul>
      <p>
        <strong>URL:</strong> <code>/seller/&#123;handle&#125;</code>
      </p>
      <p>
        <strong>Access:</strong> Via "Visit Seller" button on listing pages
      </p>
    </div>
  ),
};

export default SellerPageExample; 