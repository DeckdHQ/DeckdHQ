import React from 'react';
import { func, bool, string, number } from 'prop-types';
import classNames from 'classnames';

import css from './LikeButton.module.css';

const HeartFilledIcon = () => (
  <svg 
    fill="#ff0000" 
    height="24" 
    width="24" 
    version="1.1" 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 455 455"
    className={`${css.heartIcon} ${css.heartIconFilled}`}
  >
    <path d="M326.632,10.346c-38.733,0-74.991,17.537-99.132,46.92c-24.141-29.383-60.399-46.92-99.132-46.92
      C57.586,10.346,0,67.931,0,138.714c0,55.426,33.049,119.535,98.23,190.546c50.162,54.649,104.729,96.96,120.257,108.626l9.01,6.769
      l9.009-6.768c15.53-11.667,70.099-53.979,120.26-108.625C421.95,258.251,455,194.141,455,138.714
      C455,67.931,397.414,10.346,326.632,10.346z"/>
  </svg>
);

const HeartOutlineIcon = () => (
  <svg 
    fill="#000000" 
    height="24" 
    width="24" 
    version="1.1" 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 455 455"
    className={css.heartIcon}
  >
    <path d="M326.632,10.346c-38.733,0-74.991,17.537-99.132,46.92c-24.141-29.384-60.398-46.92-99.132-46.92
      C57.586,10.346,0,67.931,0,138.714c0,55.426,33.05,119.535,98.23,190.546c50.161,54.647,104.728,96.959,120.257,108.626l9.01,6.769
      l9.01-6.768c15.529-11.667,70.098-53.978,120.26-108.625C421.949,258.251,455,194.141,455,138.714
      C455,67.931,397.414,10.346,326.632,10.346z M334.666,308.974c-41.259,44.948-85.648,81.283-107.169,98.029
      c-21.52-16.746-65.907-53.082-107.166-98.03C61.236,244.592,30,185.717,30,138.714c0-54.24,44.128-98.368,98.368-98.368
      c35.694,0,68.652,19.454,86.013,50.771l13.119,23.666l13.119-23.666c17.36-31.316,50.318-50.771,86.013-50.771
      c54.24,0,98.368,44.127,98.368,98.368C425,185.719,393.763,244.594,334.666,308.974z"/>
  </svg>
);

const LikeButton = props => {
  const {
    className,
    rootClassName,
    isLiked,
    onLike,
    onUnlike,
    likeInProgress,
    unlikeInProgress,
    disabled,
    likeCount = 0,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const inProgress = likeInProgress || unlikeInProgress;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || inProgress) return;
    
    if (isLiked) {
      onUnlike();
    } else {
      onLike();
    }
  };

  return (
    <button
      className={classes}
      onClick={handleClick}
      disabled={disabled || inProgress}
      type="button"
      title={isLiked ? "Unlike this listing" : "Like this listing"}
    >
      <span className={css.likeCount}>{likeCount}</span>
      {isLiked ? <HeartFilledIcon /> : <HeartOutlineIcon />}
    </button>
  );
};

LikeButton.defaultProps = {
  className: null,
  rootClassName: null,
  isLiked: false,
  likeInProgress: false,
  unlikeInProgress: false,
  disabled: false,
  likeCount: 0,
};

LikeButton.propTypes = {
  className: string,
  rootClassName: string,
  isLiked: bool,
  onLike: func.isRequired,
  onUnlike: func.isRequired,
  likeInProgress: bool,
  unlikeInProgress: bool,
  disabled: bool,
  likeCount: number,
};

export default LikeButton; 