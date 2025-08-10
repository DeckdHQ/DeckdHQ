import React from 'react';
import { number, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';

import css from './LikeCount.module.css';

const LikeCount = props => {
  const { count, className } = props;
  const classes = classNames(css.root, className);

  if (count === 0) {
    return null;
  }

  return (
    <div className={classes}>
      <FormattedMessage
        id="LikeCount.likes"
        values={{ count }}
      />
    </div>
  );
};

LikeCount.defaultProps = {
  count: 0,
  className: null,
};

LikeCount.propTypes = {
  count: number.isRequired,
  className: string,
};

export default LikeCount; 