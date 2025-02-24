/* eslint-disable react/prefer-stateless-function */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Menu } from 'antd';
import styles from './index.less';

class CubeMenuItem extends Component {
  render() {
    const { children, disabled, ...restProps } = this.props;

    return (
      <Menu.Item
        {...restProps}
        disabled={disabled}
        className={
          disabled
            ? styles['cube-menu-item-disabled']
            : styles['cube-menu-item']
        }
      >
        {children}
      </Menu.Item>
    );
  }
}

CubeMenuItem.propTypes = {
  children: PropTypes.node,
  disabled: PropTypes.bool,
};

export default CubeMenuItem;
