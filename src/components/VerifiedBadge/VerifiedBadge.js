import React from 'react';
import { bool, string } from 'prop-types';
import classNames from 'classnames';

import css from './VerifiedBadge.module.css';

const VerifiedBadge = props => {
  const { className, rootClassName, isVerified, variant } = props;

  if (!isVerified) {
    return null;
  }

  // Choose CSS classes based on variant
  const getRootClass = () => {
    switch (variant) {
      case 'navbar':
        return css.navbar;
      case 'userCardContent':
        return css.userCardContent;
      case 'orderPanel':
        return css.orderPanel;
      default:
        return css.root;
    }
  };

  const getIconClass = () => {
    switch (variant) {
      case 'navbar':
        return css.navbarIcon;
      case 'userCardContent':
        return css.userCardContentIcon;
      case 'orderPanel':
        return css.orderPanelIcon;
      default:
        return css.icon;
    }
  };

  const classes = classNames(rootClassName || getRootClass(), className);

  return (
    <div className={classes} title="Verified user">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        aria-hidden="true" 
        viewBox="0 0 24 24" 
        role="img"
        className={getIconClass()}
      >
        <path 
          fill="blue" 
          fillRule="evenodd" 
          vectorEffect="non-scaling-stroke" 
          stroke="blue" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeMiterlimit="10" 
          strokeWidth="1.5" 
          d="M20.4 13.1c.8 1 .3 2.5-.9 2.9-.8.2-1.3 1-1.3 1.8 0 1.3-1.2 2.2-2.5 1.8-.8-.3-1.7 0-2.1.7-.7 1.1-2.3 1.1-3 0-.5-.7-1.3-1-2.1-.7-1.4.4-2.6-.6-2.6-1.8 0-.8-.5-1.6-1.3-1.8-1.2-.4-1.7-1.8-.9-2.9.5-.7.5-1.6 0-2.2-.9-1-.4-2.5.9-2.9.8-.2 1.3-1 1.3-1.8C5.9 5 7.1 4 8.3 4.5c.8.3 1.7 0 2.1-.7.7-1.1 2.3-1.1 3 0 .5.7 1.3 1 2.1.7 1.4-.5 2.6.5 2.6 1.7 0 .8.5 1.6 1.3 1.8 1.2.4 1.7 1.8.9 2.9-.4.6-.4 1.6.1 2.2z" 
          clipRule="evenodd"
        />
        <path 
          vectorEffect="non-scaling-stroke" 
          stroke="white" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeMiterlimit="10" 
          strokeWidth="1.5" 
          d="M15.5 9.7L11 14.3l-2.5-2.5"
        />
      </svg>
    </div>
  );
};

VerifiedBadge.defaultProps = {
  className: null,
  rootClassName: null,
  isVerified: false,
  variant: 'default',
};

VerifiedBadge.propTypes = {
  className: string,
  rootClassName: string,
  isVerified: bool,
  variant: string,
};

export default VerifiedBadge; 