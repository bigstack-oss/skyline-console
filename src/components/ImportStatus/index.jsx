import React, { Component } from 'react';
import { upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import { Progress } from 'antd';
import Status from 'components/Status';
import styles from './index.less';

const IMPORT_STATUS = [
  'queued',
  'active',
  'deactivated',
  'killed',
  'deleted',
  'pending_delete',
  'saving',
  'uploading',
  'importing',
];

export default class index extends Component {
  static propType = {
    current: PropTypes.oneOf(IMPORT_STATUS),
    isProcessing: PropTypes.boolean,
    processPercent: PropTypes.number,
  };

  render() {
    const { current, isProcessing, processPercent } = this.props;

    const getColor = () => {
      if (current === 'uploading') return globalCSS.primaryColor;
      if (current === 'importing') return globalCSS.secondaryColor;
      return globalCSS.successColor;
    };

    if (!isProcessing)
      return <Status status={current} text={upperFirst(current)} />;

    return (
      <div className={styles.container}>
        <Progress
          strokeColor={getColor()}
          trailColor="#DFE1EC"
          percent={processPercent}
          showInfo={false}
        />
        <div className={styles.text}>
          {`${upperFirst(current)}  ${processPercent}%`}
        </div>
      </div>
    );
  }
}
