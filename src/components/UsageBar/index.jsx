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
import { formatUsagePercent, usageColor } from 'resources/prometheus/usage';
import styles from './index.less';

// One gauge row: optional label, bar, percentage, and a trailing tag when the
// figure came from the block layer rather than the guest filesystem. A tag
// rather than a colour: colour already means "close to the alert threshold",
// and one channel cannot carry two meanings.
const UsageBar = ({ label, value, blockLevel, tip }) => {
  const known = !(value === undefined || value === null || Number.isNaN(value));

  // No bar at all when nothing was measured. An empty track reads as 0% -- as
  // "this disk is empty" rather than "nobody could tell us".
  const row = (
    <div className={styles['usage-row']}>
      {label ? <span className={styles['usage-label']}>{label}</span> : null}
      {known ? (
        <Progress
          percent={value}
          size="small"
          showInfo={false}
          strokeColor={usageColor(value)}
        />
      ) : (
        <span className={styles['usage-unknown']}>{t('Not measured')}</span>
      )}
      <span className={styles['usage-value']}>{formatUsagePercent(value)}</span>
      {known && blockLevel ? (
        <span className={styles['usage-tag']}>{t('block level')}</span>
      ) : null}
    </div>
  );

  return tip ? <Tooltip title={tip}>{row}</Tooltip> : row;
};

UsageBar.propTypes = {
  label: PropTypes.string,
  value: PropTypes.number,
  blockLevel: PropTypes.bool,
  tip: PropTypes.node,
};

UsageBar.defaultProps = {
  label: '',
  value: undefined,
  blockLevel: false,
  tip: null,
};

export default UsageBar;
