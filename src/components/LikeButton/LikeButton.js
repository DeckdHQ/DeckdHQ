import React from 'react';
import { func, bool, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';

import { PrimaryButton, SecondaryButton } from '../Button/Button';

import css from './LikeButton.module.css';

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
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const inProgress = likeInProgress || unlikeInProgress;

  if (isLiked) {
    return (
      <SecondaryButton
        className={classes}
        onClick={onUnlike}
        inProgress={unlikeInProgress}
        disabled={disabled || inProgress}
      >
        <FormattedMessage id="LikeButton.unlike" />
      </SecondaryButton>
    );
  }

  return (
    <PrimaryButton
      className={classes}
      onClick={onLike}
      inProgress={likeInProgress}
      disabled={disabled || inProgress}
    >
      <FormattedMessage id="LikeButton.like" />
    </PrimaryButton>
  );
};

LikeButton.defaultProps = {
  className: null,
  rootClassName: null,
  isLiked: false,
  likeInProgress: false,
  unlikeInProgress: false,
  disabled: false,
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
};

export default LikeButton; 