// Copyright 2026 99cloud
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from 'react';
import { Progress, Tooltip } from 'antd';
import PropTypes from 'prop-types';
import {
  ESTIMATED_COLOR,
  formatUsagePercent,
  usageColor,
} from 'resources/prometheus/usage';
import styles from './index.less';

// One gauge row: optional label, bar, percentage. Shared by the instance and
// volume lists so both read the same way.
const UsageBar = ({ label, value, estimated, tip }) => {
  const known = !(value === undefined || value === null || Number.isNaN(value));
  const row = (
    <div className={styles['usage-row']}>
      {label ? <span className={styles['usage-label']}>{label}</span> : null}
      <Progress
        percent={known ? value : 0}
        size="small"
        showInfo={false}
        strokeColor={
          // eslint-disable-next-line no-nested-ternary
          !known ? undefined : estimated ? ESTIMATED_COLOR : usageColor(value)
        }
      />
      <span
        className={
          estimated
            ? `${styles['usage-value']} ${styles['usage-value-estimated']}`
            : styles['usage-value']
        }
      >
        {known ? `${formatUsagePercent(value)}${estimated ? ' *' : ''}` : '-'}
      </span>
    </div>
  );

  return tip ? <Tooltip title={tip}>{row}</Tooltip> : row;
};

UsageBar.propTypes = {
  label: PropTypes.string,
  value: PropTypes.number,
  estimated: PropTypes.bool,
  tip: PropTypes.node,
};

UsageBar.defaultProps = {
  label: '',
  value: undefined,
  estimated: false,
  tip: null,
};

export default UsageBar;
