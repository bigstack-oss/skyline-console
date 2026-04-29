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

import React from 'react';
import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalQoSPolicyStore from 'stores/neutron/qos-policy';
import { firstUpperCase } from 'utils';

export class EditBandwidthIngressRule extends ModalAction {
  static id = 'edit_bandwidth_ingress_limit_rule';

  static title = t('Edit Bandwidth Ingress Limit Rule');

  static buttonText = t('BandWidth Limit Ingress');

  static policy = 'update_policy_bandwidth_limit_rule';

  get name() {
    return t('Edit Bandwidth Ingress Limit Rule');
  }

  get tips() {
    return t('Changes will immediately affect all attached ports');
  }

  get successText() {
    return firstUpperCase(t('{action} successfully.', { action: this.name }));
  }

  get errorText() {
    return t('Unable to {action}.', { action: this.name.toLowerCase() });
  }

  static allowed = (item) => {
    const { rules = [] } = item;
    const hasIngressRule = rules.some((i) => i.direction === 'ingress');
    return Promise.resolve(hasIngressRule);
  };

  onSubmit = (values) =>
    globalQoSPolicyStore.updateBandwidthLimitRule(
      this.props.item,
      this.ingressRule.id,
      {
        max_kbps: values.max_kbps * 1024,
        max_burst_kbps: values.max_burst_kbps * 1024,
      }
    );

  get defaultValue() {
    const { max_kbps, max_burst_kbps } = this.ingressRule;
    return {
      max_kbps: max_kbps / 1024,
      max_burst_kbps: max_burst_kbps / 1024,
    };
  }

  init() {
    const { rules = [] } = this.item || {};
    this.ingressRule =
      rules.find(
        (item) =>
          item.type === 'bandwidth_limit' && item.direction === 'ingress'
      ) || {};
  }

  get formItems() {
    return [
      {
        label: t('Type'),
        type: 'label',
        component: (
          <div style={{ lineHeight: '32px', marginBottom: 24 }}>
            {t('QoS Bandwidth Ingress Limit')}
          </div>
        ),
      },
      {
        name: 'max_kbps',
        label: t('Bandwidth limit'),
        type: 'slider-input',
        max: 10000,
        min: 1,
        inputMin: 1,
        inputMax: 10000,
        description: '1Mbps-10000Mbps',
      },
      {
        name: 'max_burst_kbps',
        label: t('Burst limit'),
        type: 'slider-input',
        max: 10000,
        min: 1,
        inputMin: 1,
        inputMax: 10000,
        description: '1Mbps-10000Mbps',
      },
    ];
  }
}

export default inject('rootStore')(observer(EditBandwidthIngressRule));
