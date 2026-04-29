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
import { ModalAction } from 'containers/Action';
import { firstUpperCase } from 'utils';
import globalQoSPolicyStore from 'stores/neutron/qos-policy';
import {
  RULE_TYPE_BANDWIDTH_LIMIT,
  RULE_TYPE_DSCP_MARKING,
  RULE_DIRECTION_INGRESS,
  RULE_DIRECTION_EGRESS,
  dscpMarkingItems,
} from '../utils/const';

export class AddRule extends ModalAction {
  static id = 'add_qos_rule';

  static title = t('Add Rule');

  static buttonText = t('Add Rule');

  static policy = {
    rules: [
      'create_policy_bandwidth_limit_rule',
      'create_policy_dscp_marking_rule',
    ],
    every: false,
  };

  // It's a row-action visibility guard for "Create Rule" action
  // It decides whether the action is shown for a given QoS policy row
  static allowed = (item) => {
    const { rules = [] } = item || {};
    const hasIngress = rules.some((i) => i.direction === 'ingress');
    const hasEgress = rules.some((i) => i.direction === 'egress');
    const canBandwidth = !(hasIngress && hasEgress);
    const hasDscp = rules.some((i) => i.type === 'dscp_marking');
    const canDscp = !hasDscp;
    return Promise.resolve(canBandwidth || canDscp);
  };

  get name() {
    return t('create rule');
  }

  get nameForStateUpdate() {
    return ['rule_type'];
  }

  get actionName() {
    return t('create rule');
  }

  get successText() {
    return firstUpperCase(t('{action} successfully.', { action: this.name }));
  }

  get errorText() {
    return t('Unable to {action}.', { action: this.name.toLowerCase() });
  }

  canCreateBandwidth(rules) {
    const hasIngress = rules.some(
      (i) => i.direction === RULE_DIRECTION_INGRESS
    );
    const hasEgress = rules.some((i) => i.direction === RULE_DIRECTION_EGRESS);
    return !(hasIngress && hasEgress);
  }

  canCreateDscp(rules) {
    return !rules.some((i) => i.type === RULE_TYPE_DSCP_MARKING);
  }

  getRuleTypeOptions() {
    const { rules = [] } = this.item;
    const options = [];
    if (this.canCreateBandwidth(rules)) {
      options.push({
        label: t('QoS Bandwidth Limit'),
        value: RULE_TYPE_BANDWIDTH_LIMIT,
      });
    }
    if (this.canCreateDscp(rules)) {
      options.push({
        label: t('DSCP Marking'),
        value: RULE_TYPE_DSCP_MARKING,
      });
    }
    return options;
  }

  getDefaultRuleType() {
    const { rules = [] } = this.item;
    if (this.canCreateBandwidth(rules) && this.canCreateDscp(rules)) {
      return RULE_TYPE_BANDWIDTH_LIMIT;
    }
    if (this.canCreateBandwidth(rules)) {
      return RULE_TYPE_BANDWIDTH_LIMIT;
    }
    if (this.canCreateDscp(rules)) {
      return RULE_TYPE_DSCP_MARKING;
    }
    return RULE_TYPE_BANDWIDTH_LIMIT;
  }

  getDirectionOptions() {
    const { rules = [] } = this.item;
    const hasIngress = rules.some((i) => i.direction === 'ingress');
    const hasEgress = rules.some((i) => i.direction === 'egress');
    const opts = [];
    if (!hasEgress) {
      opts.push({ label: t('egress'), value: 'egress' });
    }
    if (!hasIngress) {
      opts.push({ label: t('ingress'), value: 'ingress' });
    }
    return opts.length
      ? opts
      : [
          { label: t('egress'), value: 'egress' },
          { label: t('ingress'), value: 'ingress' },
        ];
  }

  get defaultDirection() {
    const { rules = [] } = this.item;
    const hasIngress = rules.some((i) => i.direction === 'ingress');
    const hasEgress = rules.some((i) => i.direction === 'egress');
    if (!hasEgress) {
      return 'egress';
    }
    if (!hasIngress) {
      return 'ingress';
    }
    return 'egress';
  }

  get defaultValue() {
    return {
      rule_type: this.getDefaultRuleType(),
      max_kbps: 1,
      max_burst_kbps: 1,
      direction: this.defaultDirection,
      dscp_mark: '0',
    };
  }

  onSubmit = (values) => {
    const { rule_type, max_kbps, max_burst_kbps, direction, dscp_mark } =
      values;
    if (rule_type === RULE_TYPE_BANDWIDTH_LIMIT) {
      const data = {
        max_kbps: max_kbps * 1024,
        max_burst_kbps: max_burst_kbps * 1024,
        direction,
      };
      return globalQoSPolicyStore.createBandwidthLimitRule(
        this.props.item,
        data
      );
    }
    if (rule_type === RULE_TYPE_DSCP_MARKING) {
      return globalQoSPolicyStore.createDSCPMarkingRule(this.props.item, {
        dscp_mark: Number(
          dscp_mark === undefined || dscp_mark === null ? 0 : dscp_mark
        ),
      });
    }
    return Promise.resolve();
  };

  get formItems() {
    const typeOptions = this.getRuleTypeOptions();
    const ruleType =
      this.state.rule_type !== undefined && this.state.rule_type !== null
        ? this.state.rule_type
        : this.getDefaultRuleType();
    const isBandwidth = ruleType === RULE_TYPE_BANDWIDTH_LIMIT;
    const isDscp = ruleType === RULE_TYPE_DSCP_MARKING;

    return [
      {
        name: 'rule_type',
        label: t('Rule Type'),
        type: 'select',
        options: typeOptions,
        required: true,
      },
      {
        name: 'max_kbps',
        label: t('Max BandWidth (Mbps)'),
        type: 'slider-input',
        max: 10000,
        min: 1,
        inputMin: 1,
        inputMax: 10000,
        description: '1Mbps-10000Mbps',
        hidden: !isBandwidth,
        required: isBandwidth,
      },
      {
        name: 'max_burst_kbps',
        label: t('Max Burst (Mbps)'),
        type: 'slider-input',
        max: 10000,
        min: 1,
        inputMin: 1,
        inputMax: 10000,
        description: '1Mbps-10000Mbps',
        hidden: !isBandwidth,
        required: isBandwidth,
      },
      {
        name: 'direction',
        label: t('Direction'),
        type: 'select',
        options: this.getDirectionOptions(),
        hidden: !isBandwidth,
        required: isBandwidth,
      },
      {
        name: 'dscp_mark',
        label: t('Value'),
        type: 'select',
        options: dscpMarkingItems,
        hidden: !isDscp,
        required: isDscp,
      },
    ];
  }
}

export default inject('rootStore')(observer(AddRule));
