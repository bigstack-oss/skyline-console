/* eslint-disable react/prefer-stateless-function */
import React, { Component } from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import styles from './index.less';

class CubeMenuItemButton extends Component {
  render() {
    const { children, disabled, ...restProps } = this.props;
    return (
      <Button
        {...restProps}
        size="middle"
        type="outline"
        disabled={disabled}
        className={
          disabled
            ? styles['cube-menu-item-button-disabled']
            : styles['cube-menu-item-button']
        }
      >
        {children}
      </Button>
    );
  }
}

CubeMenuItemButton.propTypes = {
  children: PropTypes.node,
  disabled: PropTypes.bool,
};

export default CubeMenuItemButton;
