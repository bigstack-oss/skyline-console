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
import { QoSPolicyStore } from 'stores/neutron/qos-policy';
import globalPortStore, { PortStore } from 'stores/neutron/port-extension';
import { getQoSPolicyTabs } from 'resources/neutron/qos-policy';
import { qosEndpoint } from 'client/client/constants';

export class ModifyQoSPolicy extends ModalAction {
  static id = 'modify_qos_policy';

  static title = t('Modify QoS Policy');

  static buttonText = t('Modify QoS Policy');

  static policy = 'update_port';

  static allowed = () => Promise.resolve(!!qosEndpoint());

  static get modalSize() {
    return 'large';
  }

  getModalSize() {
    return 'large';
  }

  get name() {
    return t('Modify QoS Policy');
  }

  get hasAdminRole() {
    return !!this.props.rootStore?.hasAdminRole;
  }

  get currentProjectId() {
    return this.props.rootStore?.projectId;
  }

  get currentProjectName() {
    return this.props.rootStore?.projectName;
  }

  init() {
    this.portStore = new PortStore();
    this.qosPolicyStore = new QoSPolicyStore();

    this.state = {
      ...this.state,
      // Loading states (ports load before showing port-dependent fields)
      isPortsLoading: true,
      isQosPoliciesLoading: true,
      ports: [],
      qosPolicies: [],
      // Form values (default)
      activePort: null,
      enableQosPolicy: false,
      qosPolicy: {
        name: '',
        id: '',
      },
    };

    this.bootstrapInstanceNetworking().catch(() => {});
  }

  /**
   * Sequential loading:
   * Ports first → bind from port;
   * QoS list later → re-sync names/tab after both are loaded.
   */
  async bootstrapInstanceNetworking() {
    await this.loadInstancePorts();
    await this.loadQosPolicies();
  }

  async fetchPortsByInstanceId(instanceId) {
    if (!instanceId) return [];

    const ports = await this.portStore.pureFetchList({
      device_id: instanceId,
      all_projects: this.isAdminPage,
    });

    return Array.isArray(ports) ? ports : [];
  }

  /**
   * Apply port list returned for this instance into state and prime the form.
   * Runs in setState callbacks so DOM sees loading first, then one committed snapshot.
   */
  commitFetchedInstancePorts(portsList) {
    const list = Array.isArray(portsList) ? portsList : [];

    return new Promise((resolve) => {
      this.setState({ ports: list, isPortsLoading: false }, () => {
        const firstPort = list[0];
        if (!firstPort) {
          resolve();
          return;
        }
        this.updateFormValue('port_id', firstPort.id);
        Promise.resolve(this.applyPortToForm(firstPort)).then(resolve);
      });
    });
  }

  async loadInstancePorts() {
    const instance = this.item;

    if (!instance?.id) {
      await new Promise((resolve) => {
        this.setState({ isPortsLoading: false, ports: [] }, resolve);
      });
      return;
    }

    try {
      const list = await this.fetchPortsByInstanceId(instance.id);
      await this.commitFetchedInstancePorts(list);
    } catch {
      await new Promise((resolve) => {
        this.setState({ isPortsLoading: false, ports: [] }, resolve);
      });
    }
  }

  async fetchQosPolicies() {
    const qosPolicies = await this.qosPolicyStore.fetchList({
      all_projects: this.isAdminPage,
    });
    return Array.isArray(qosPolicies) ? qosPolicies : [];
  }

  /**
   * Re-run QoS switch + tab-select bindings from `activePort` after `qosPolicies` is loaded or updated.
   */
  syncActivePortQoSForm() {
    const port = this.state.activePort;
    if (!port) return;

    const attachedPolicyId = port.qos_policy_id || null;
    const enableQosPolicy = !!attachedPolicyId;

    this.setState({ enableQosPolicy });
    this.updateFormValue('enableQosPolicy', enableQosPolicy);
    this.refreshAttachedQosPolicyLabel(attachedPolicyId);
    this.updateFormValue(
      'qos_policy_id',
      attachedPolicyId
        ? this.getQosPolicyFormValueById(attachedPolicyId)
        : this.getEmptyQosPolicyFormValue()
    );
  }

  async refreshAttachedQosPolicyLabel(policyId) {
    if (!policyId) {
      this.setState({ qosPolicy: { name: '', id: '' } });
      return;
    }

    const idStr = String(policyId);
    const fromList = this.getQosPolicyById(policyId);
    if (fromList?.name) {
      this.setState({
        qosPolicy: { id: fromList.id ?? policyId, name: fromList.name },
      });
      return;
    }

    const stillHasThisAttachment = () =>
      String(this.state.activePort?.qos_policy_id) === idStr;

    try {
      const item = await this.qosPolicyStore.pureFetchDetail({ id: policyId });
      if (!stillHasThisAttachment() || !item) return;
      this.setState({
        qosPolicy: {
          id: item.id ?? policyId,
          name: item.name ?? idStr,
        },
      });
    } catch {
      // The port that’s currently selected is no longer the one that had this policyId.
      // Therefore we drop the late result instead of overwriting the label with wrong data.
      if (!stillHasThisAttachment()) return;
      this.setState({ qosPolicy: { id: policyId, name: policyId } });
    }
  }

  commitFetchedQosPolicies(qosPoliciesList) {
    const list = Array.isArray(qosPoliciesList) ? qosPoliciesList : [];

    return new Promise((resolve) => {
      this.setState({ qosPolicies: list, isQosPoliciesLoading: false }, () => {
        this.syncActivePortQoSForm();
        resolve();
      });
    });
  }

  async loadQosPolicies() {
    try {
      const list = await this.fetchQosPolicies();
      await this.commitFetchedQosPolicies(list);
    } catch {
      await new Promise((resolve) => {
        this.setState(
          { isQosPoliciesLoading: false, qosPolicies: [] },
          resolve
        );
      });
    }
  }

  get isNetworkingReady() {
    const { isPortsLoading, isQosPoliciesLoading } = this.state;
    return !isPortsLoading && !isQosPoliciesLoading;
  }

  get disableSubmit() {
    return !this.isNetworkingReady;
  }

  get hasPorts() {
    return (this.state.ports || []).length > 0;
  }

  get portOptions() {
    const { ports = [] } = this.state;
    return ports.map((port) => {
      const addresses = (port?.fixed_ips || [])?.map((it) => it.ip_address);
      const ipText = addresses.length ? addresses.join(', ') : '-';
      return {
        label: `${port.name || port.id} (${ipText})`,
        value: port.id,
      };
    });
  }

  onValuesChange(changedFields, allFields) {
    if (!('port_id' in changedFields)) return;

    const { ports = [] } = this.state;
    if (!ports.length) return;

    const id = allFields?.port_id;
    const port = id
      ? ports.find((p) => String(p.id) === String(id)) || null
      : null;

    this.applyPortToForm(port).catch(() => {});
  }

  getQosPolicyById(policyId) {
    if (!policyId) return undefined;

    const idStr = String(policyId);
    const { qosPolicies = [] } = this.state;
    return qosPolicies.find((policy) => String(policy.id) === idStr);
  }

  getQosPolicyDisplay(policyId) {
    if (!policyId) return null;

    const matchedPolicy = this.getQosPolicyById(policyId);
    return {
      id: matchedPolicy?.id ?? policyId,
      name: matchedPolicy?.name ?? policyId,
    };
  }

  getQosPolicyTab = (policy) => {
    if (!policy) return 'project';
    if (policy.project_id === this.currentProjectId) return 'project';
    if (policy.shared) return 'shared';
    return this.hasAdminRole ? 'all' : 'project';
  };

  getEmptyQosPolicyFormValue() {
    return {
      selectedRowKeys: [],
      selectedRows: [],
      tab: 'project',
    };
  }

  getQosPolicyFormValueById = (policyId) => {
    if (!policyId) {
      return this.getEmptyQosPolicyFormValue();
    }
    const matchedPolicy = this.getQosPolicyById(policyId);
    const id = matchedPolicy?.id ?? policyId;
    const name = matchedPolicy?.name ?? policyId;
    return {
      selectedRowKeys: [policyId],
      selectedRows: [{ id, name }],
      tab: this.getQosPolicyTab(matchedPolicy),
    };
  };

  applyPortToForm(port) {
    if (!port) {
      return new Promise((resolve) => {
        this.setState(
          {
            activePort: null,
            enableQosPolicy: false,
          },
          () => {
            this.refreshAttachedQosPolicyLabel(null);
            this.updateFormValue('enableQosPolicy', false);
            this.updateFormValue(
              'qos_policy_id',
              this.getEmptyQosPolicyFormValue()
            );
            resolve();
          }
        );
      });
    }

    const attachedPolicyId = port.qos_policy_id || null;
    const enableQosPolicy = !!attachedPolicyId;

    return new Promise((resolve) => {
      this.setState(
        {
          activePort: port,
          enableQosPolicy,
        },
        () => {
          this.updateFormValue('enableQosPolicy', enableQosPolicy);
          this.updateFormValue(
            'qos_policy_id',
            this.getQosPolicyFormValueById(attachedPolicyId)
          );
          this.refreshAttachedQosPolicyLabel(attachedPolicyId);
          resolve();
        }
      );
    });
  }

  onSubmit = (values) => {
    const { port_id, enableQosPolicy, qos_policy_id } = values;

    if (!port_id) return Promise.resolve();

    const selectedPolicyId =
      qos_policy_id?.selectedRowKeys && qos_policy_id.selectedRowKeys.length > 0
        ? qos_policy_id.selectedRowKeys[0]
        : null;

    const payload = {
      qos_policy_id: enableQosPolicy ? selectedPolicyId : null,
    };

    return globalPortStore.update({ id: port_id }, payload);
  };

  get formItems() {
    const { enableQosPolicy, isPortsLoading, activePort, qosPolicy } =
      this.state;

    const { hasPorts, isNetworkingReady } = this;

    const currentQosPolicyName =
      qosPolicy?.name ||
      this.getQosPolicyDisplay(activePort?.qos_policy_id)?.name ||
      t('Not yet bound');

    const portPlaceholder = isPortsLoading
      ? t('Loading')
      : hasPorts
      ? t('Please select a port')
      : t('This instance has no ports');

    return [
      {
        name: 'networking_loading',
        label: t('Status'),
        type: 'label',
        content: t('Loading ports and QoS policies...'),
        display: !isNetworkingReady,
      },
      {
        name: 'port_id',
        label: t('Port'),
        type: 'select',
        options: this.portOptions,
        required: hasPorts,
        disabled: isPortsLoading || !hasPorts,
        placeholder: portPlaceholder,
        display: isNetworkingReady,
      },
      {
        name: 'no_ports_hint',
        label: t('Hint'),
        type: 'label',
        content: t('No ports found on this instance.'),
        display: isNetworkingReady && !hasPorts,
      },
      {
        name: 'enableQosPolicy',
        label: t('Enable QoS Policy'),
        type: 'switch',
        onChange: (e) => {
          this.setState({ enableQosPolicy: e });
        },
        display: isNetworkingReady && hasPorts,
      },
      {
        name: 'name',
        label: t('Current QoS policy name'),
        type: 'label',
        content: <div>{currentQosPolicyName}</div>,
        hidden: !enableQosPolicy,
        display: isNetworkingReady && hasPorts,
      },
      {
        name: 'qos_policy_id',
        label: t('QoS Policy'),
        type: 'tab-select-table',
        tabs: getQoSPolicyTabs.call(this),
        isMulti: false,
        required: true,
        tip: t('Choosing a QoS policy can limit bandwidth and DSCP'),
        hidden: !enableQosPolicy,
        display: isNetworkingReady && hasPorts,
      },
    ];
  }
}

export default inject('rootStore')(observer(ModifyQoSPolicy));
