/* eslint-disable react/prefer-stateless-function */
import React, { Component } from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import ChevronDownSvgIcon from 'asset/cube/monochrome/chevron_down.svg';
import styles from './index.less';

class CubeMoreActionsButton extends Component {
  render() {
    const { children, variant = 'default', ...restProps } = this.props;
    if (variant === 'in-table')
      return (
        <Button
          {...restProps}
          size="middle"
          type="outline"
          className={styles['more-actions-button-in-table']}
        >
          {children}
          <ChevronDownSvgIcon
            width={14}
            height={12}
            style={{ marginLeft: '24px' }}
          />
        </Button>
      );

    return (
      <Button
        {...restProps}
        size="middle"
        type="outline"
        className={styles['more-actions-button']}
      >
        {children}
        <ChevronDownSvgIcon
          width={14}
          height={12}
          style={{ marginLeft: '24px' }}
        />
      </Button>
    );
  }
}

CubeMoreActionsButton.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.string,
};

export default CubeMoreActionsButton;
