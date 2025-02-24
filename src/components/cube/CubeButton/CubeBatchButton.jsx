/* eslint-disable react/prefer-stateless-function */
import React, { Component } from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import styles from './index.less';

class CubeBatchButton extends Component {
  render() {
    const { children, danger, ...restProps } = this.props;
    return (
      <Button
        {...restProps}
        size="middle"
        type="outline"
        className={styles['batch-button']}
      >
        {children}
      </Button>
    );
  }
}

CubeBatchButton.propTypes = {
  children: PropTypes.node,
};

export default CubeBatchButton;
