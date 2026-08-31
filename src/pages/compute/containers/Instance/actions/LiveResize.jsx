// Copyright 2026 Bigstack
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
import { Tooltip } from 'antd';
import {
  PoweroffOutlined,
  StopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { inject, observer } from 'mobx-react';
import globalFlavorStore from 'stores/nova/flavor';
import globalServerStore from 'stores/nova/instance';
import { ModalAction } from 'containers/Action';
import {
  isNotLockedOrAdmin,
  checkStatus,
  isIronicInstance,
  isBootFromVolume,
} from 'resources/nova/instance';
import { checkPolicyRule } from 'resources/skyline/policy';
import FlavorSelectTable from '../components/FlavorSelectTable';
import {
  fetchQuota,
  checkFlavorDisable,
  getQuotaInfo,
  getFlavorLabel,
} from './Resize';

// Mirrors cube_live_resize.headroom() on the API side: an extra-spec override
// wins outright (0 opts the flavor out), otherwise the deployment default is a
// multiple of the current flavor. Keep in sync with live_resize_headroom_factor.
const DEFAULT_HEADROOM_FACTOR = 4;

// cube_live_resize.blocked(): specs whose memory/CPU layout cannot carry
// hotplug headroom.
const BLOCKING_SPECS = ['hw:numa_nodes', 'hw:mem_page_size'];

const blockedSpec = (flavorInfo) => {
  const { extra_specs: extra = {} } = flavorInfo || {};
  const found = BLOCKING_SPECS.find((key) => extra[key]);
  if (found) {
    return found;
  }
  return extra['hw:cpu_policy'] === 'dedicated'
    ? 'hw:cpu_policy=dedicated'
    : null;
};

const getHeadroom = (flavorInfo) => {
  const { vcpus = 0, ram = 0, extra_specs: extra = {} } = flavorInfo || {};
  if (blockedSpec(flavorInfo)) {
    return { maxVcpus: 0, maxRam: 0 };
  }
  const overridden = 'hw:max_vcpus' in extra || 'hw:max_memory_mb' in extra;
  let maxVcpus = overridden
    ? parseInt(extra['hw:max_vcpus'] || 0, 10)
    : vcpus * DEFAULT_HEADROOM_FACTOR;
  let maxRam = overridden
    ? parseInt(extra['hw:max_memory_mb'] || 0, 10)
    : ram * DEFAULT_HEADROOM_FACTOR;
  if (!(maxVcpus >= vcpus)) {
    maxVcpus = 0;
  }
  if (!(maxRam >= ram)) {
    maxRam = 0;
  }
  return { maxVcpus, maxRam };
};

export class LiveResize extends ModalAction {
  static id = 'live-resize';

  static title = t('Resize');

  init() {
    this.store = globalFlavorStore;
    this.state.plan = null;
    fetchQuota(this);
    this.fetchPlan();
  }

  // Ceiling, boot source and current shape in one call. Falls back to the
  // config-derived estimate; plan.ceiling_is_exact says which one this is.
  async fetchPlan() {
    try {
      const plan = await globalServerStore.getResizePlan(this.item.id);
      this.setState({ plan });
    } catch (e) {
      this.setState({ plan: null });
    }
  }

  get name() {
    return t('resize');
  }

  static get modalSize() {
    return 'large';
  }

  getModalSize() {
    return 'large';
  }

  get tips() {
    return t(
      'Each flavor is marked LIVE or COLD. LIVE grows CPU / memory with no reboot, live-migrating the instance if the current host is full; it does not guarantee the guest brings the new resources online. COLD restarts the instance, may move it to another host, and waits for you to confirm or revert.'
    );
  }

  get showQuota() {
    return true;
  }

  get quotaInfo() {
    return getQuotaInfo(this);
  }

  get defaultValue() {
    const { name } = this.item;
    return {
      instance: name,
      flavor: getFlavorLabel(this),
    };
  }

  // Either right opens the dialog; which one is enforced depends on the mode
  // the operator picks. Gating on live_resize alone hid the whole dialog from a
  // tenant who can cold-resize their own instance, undoing the policy split the
  // API deliberately supports.
  static policy = {
    rules: [
      'os_compute_api:servers:live_resize',
      'os_compute_api:servers:resize',
    ],
    every: false,
  };

  static canLiveResize = () =>
    checkPolicyRule('os_compute_api:servers:live_resize');

  static allowed = (item, containerProps) => {
    const { isAdminPage } = containerProps;
    return Promise.resolve(
      checkStatus(['active', 'shutoff'], item, false) &&
        isNotLockedOrAdmin(item, isAdminPage) &&
        !isIronicInstance(item)
    );
  };

  onFlavorChange = (flavor) => {
    const { selectedRows = [] } = flavor || {};
    this.setState({
      flavor: selectedRows[0],
    });
  };

  // Why this flavor is not a legal live-resize target, or null if it is.
  // Mirrors the API's _lr_validate so the table never greys a row out
  // without saying why.
  get headroom() {
    const { plan } = this.state;
    if (plan) {
      return { maxVcpus: plan.max_vcpus, maxRam: plan.max_memory_mb };
    }
    return getHeadroom(this.item.flavor_info || {});
  }

  get isBfv() {
    const { plan } = this.state;
    return plan ? plan.boot_from_volume : isBootFromVolume(this.item);
  }

  // Why this flavor cannot be grown LIVE, or null if it can. A reason here
  // does not mean the flavor is unusable -- cold resize can do everything
  // live cannot, which is the point of badging rather than greying out.
  liveResizeReason = (flavor) => {
    const { plan } = this.state;
    // No plan means nova predates the endpoint, leaving only a client-side
    // estimate built on a headroom factor the operator may have retuned. Never
    // promise LIVE on that; cubecmp badges the same case COLD.
    if (!plan) {
      return t('Live resize is unavailable on this cluster');
    }
    if (!checkStatus(['active'], this.item, false)) {
      return t('Instance is not running');
    }
    if (!LiveResize.canLiveResize()) {
      return t('You do not have permission to live resize');
    }
    const current = this.item.flavor_info || {};
    const { vcpus: curVcpus, ram: curRam, disk: curDisk } = current;
    const { vcpus, ram, disk } = flavor || {};
    const { maxVcpus, maxRam } = this.headroom;
    // Config-derived estimate, not the domain's real ceiling -- never promise
    // LIVE on a guess. Clears on the instance's next hard reboot.
    if (plan && plan.ceiling_is_exact === false) {
      return t('This instance has no recorded hotplug ceiling yet');
    }
    if (!maxVcpus && !maxRam) {
      return t('This instance opts out of live resize');
    }
    const targetBlocked = blockedSpec(flavor);
    if (targetBlocked) {
      return t('Flavor uses {spec}', { spec: targetBlocked });
    }
    if (vcpus < curVcpus || ram < curRam) {
      return t('Live resize is grow-only');
    }
    // boot-from-volume roots come from the volume, so the flavor's root_gb is
    // ignored -- the API skips this check for them too
    if (!this.isBfv && curDisk !== undefined && disk !== curDisk) {
      return t('Root disk size must not change');
    }
    if (vcpus > curVcpus && vcpus > maxVcpus) {
      return t('Above the hotplug ceiling of {max} vCPU', { max: maxVcpus });
    }
    if (ram > curRam && ram > maxRam) {
      return t('Above the hotplug ceiling of {max} MB memory', { max: maxRam });
    }
    return null;
  };

  // Genuinely unusable by either path. Everything else is at worst COLD, so it
  // stays selectable with a badge rather than being silently greyed out.
  unusableReason = (flavor) => {
    const current = this.item.flavor_info || {};
    // identity, not shape: two different flavors can share vCPU/RAM and still
    // differ in disk or extra specs, and a cold resize between them is
    // legitimate. The API compares flavor id for the same reason.
    const currentName = current.original_name;
    if (currentName !== undefined && flavor && flavor.name === currentName) {
      return t('Already the current flavor');
    }
    if (checkFlavorDisable(flavor, this)) {
      return t('Exceeds your remaining quota');
    }
    return null;
  };

  resizeMode = (flavor) =>
    this.liveResizeReason(flavor) === null ? 'live' : 'cold';

  disabledFlavor = (flavor) => !!this.unusableReason(flavor);

  // Icon plus tooltip rather than a sentence per row: the reason can be long,
  // and a table of prose is unreadable. Shape carries the meaning, not just
  // colour, so the distinction survives a mono display.
  renderModeIcon = (record) => {
    const blocked = this.unusableReason(record);
    if (blocked) {
      return (
        <Tooltip title={blocked}>
          <StopOutlined
            aria-label={blocked}
            style={{ color: '#bfbfbf', fontSize: 16 }}
          />
        </Tooltip>
      );
    }
    const why = this.liveResizeReason(record);
    if (why === null) {
      const label = t('LIVE - no reboot');
      return (
        <Tooltip title={label}>
          <ThunderboltOutlined
            aria-label={label}
            style={{ color: '#52c41a', fontSize: 16 }}
          />
        </Tooltip>
      );
    }
    const label = `${t('COLD - restarts the instance')}: ${why}`;
    return (
      <Tooltip title={label}>
        <PoweroffOutlined
          aria-label={label}
          style={{ color: '#fa8c16', fontSize: 16 }}
        />
      </Tooltip>
    );
  };

  get reasonColumn() {
    return [
      {
        title: t('Resize Mode'),
        dataIndex: 'cube_resize_mode',
        width: 110,
        render: (value, record) => this.renderModeIcon(record),
      },
    ];
  }

  get formItems() {
    const { flavor } = this.item;
    return [
      {
        name: 'instance',
        label: t('Instance'),
        type: 'label',
        iconType: 'instance',
      },
      {
        name: 'flavor',
        label: t('Current Flavor'),
        type: 'label',
        iconType: 'flavor',
      },
      {
        name: 'newFlavor',
        label: t('Flavor'),
        type: 'select-table',
        component: (
          <FlavorSelectTable
            flavor={flavor}
            onChange={this.onFlavorChange}
            disabledFunc={this.disabledFlavor}
            extraColumns={this.reasonColumn}
          />
        ),
        required: true,
        wrapperCol: {
          xs: {
            span: 24,
          },
          sm: {
            span: 18,
          },
        },
      },
      // Downtime is consented to, never inferred. The box appears only when the
      // chosen flavor resolves to COLD, so a live grow is not made to feel
      // dangerous and a restart is never a surprise.
      ...(this.selectedIsCold
        ? [
            {
              name: 'coldConsent',
              label: t('Forced Shutdown'),
              type: 'check',
              content: t('Agree to restart the instance'),
              required: true,
              validator: (rule, value) =>
                value === true
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error(t('Force shutdown must be checked!'))
                    ),
            },
          ]
        : []),
    ];
  }

  get selectedIsCold() {
    const { flavor } = this.state;
    return !!flavor && this.resizeMode(flavor) === 'cold';
  }

  onSubmit = (values) => {
    const { id } = this.item;
    const { newFlavor } = values;
    const flavor = newFlavor.selectedRowKeys[0];
    // Send the mode the operator was shown. The API re-checks it and refuses a
    // 'live' request it can no longer honour rather than quietly going cold --
    // the envelope this decision came from was fetched when the dialog opened.
    const mode = this.resizeMode(newFlavor.selectedRows[0]);
    return globalServerStore.cubeResize({ id, flavor, mode });
  };
}

export default inject('rootStore')(observer(LiveResize));
