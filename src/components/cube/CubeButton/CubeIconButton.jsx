/* eslint-disable react/prefer-stateless-function */
import React, { Component } from 'react';
import { Button } from 'antd';
import styles from './index.less';

export default class CubeIconButton extends Component {
  render() {
    const { icon, type = 'default', ...restProps } = this.props;
    const IconElement = icon;
    return (
      <Button
        {...restProps}
        size="middle"
        type={type}
        className={styles['icon-button']}
        icon={
          <IconElement
            width={16}
            height={16}
            className={
              type === 'default'
                ? styles['icon-default']
                : styles['icon-primary']
            }
          />
        }
      />
    );
  }
}
