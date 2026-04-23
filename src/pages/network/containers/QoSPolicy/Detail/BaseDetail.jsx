// Copyright 2021 99cloud
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

import { inject, observer } from 'mobx-react';
import Base from 'containers/BaseDetail';
import {
  RULE_DIRECTION_EGRESS,
  RULE_DIRECTION_INGRESS,
  RULE_TYPE_BANDWIDTH_LIMIT,
  RULE_TYPE_DSCP_MARKING,
} from '../utils/const';
import { getBandwidthLimitOptions } from '../utils/label';

export class BaseDetail extends Base {
  getBandwidthOptions(rule) {
    const { limitInMbps, burstInMbps } = getBandwidthLimitOptions(rule);
    return [
      {
        label: t('Max BandWidth'),
        content: `${limitInMbps} Mbps`,
      },
      {
        label: t('Max Burst'),
        content: `${burstInMbps} Mbps`,
      },
    ];
  }

  get BandwidthCards() {
    const { rules = [] } = this.detailData;
    const egressRule = rules.find(
      (item) =>
        item.type === RULE_TYPE_BANDWIDTH_LIMIT &&
        item.direction === RULE_DIRECTION_EGRESS
    );
    const ingressRule = rules.find(
      (item) =>
        item.type === RULE_TYPE_BANDWIDTH_LIMIT &&
        item.direction === RULE_DIRECTION_INGRESS
    );

    const cards = [];
    if (egressRule) {
      cards.push({
        title: t('BandWidth Limit Egress'),
        options: this.getBandwidthOptions(egressRule),
      });
    }
    if (ingressRule) {
      cards.push({
        title: t('BandWidth Limit Ingress'),
        options: this.getBandwidthOptions(ingressRule),
      });
    }

    return cards;
  }

  get DSCPMarkingCards() {
    const { rules = [] } = this.detailData;
    const dscpRule = rules.find((item) => item.type === RULE_TYPE_DSCP_MARKING);

    const card = [];
    if (dscpRule) {
      card.push({
        title: t('DSCP Marking'),
        options: [
          {
            label: t('Value'),
            content: dscpRule.dscp_mark,
          },
        ],
      });
    }

    return card;
  }

  get emptyRulesCard() {
    return {
      title: t('No rules are configured'),
      options: [
        {
          label: '-',
          content: '',
        },
      ],
    };
  }

  get leftCards() {
    const cards = [...this.BandwidthCards, ...this.DSCPMarkingCards];
    return cards.length ? cards : [this.emptyRulesCard];
  }
}

export default inject('rootStore')(observer(BaseDetail));
