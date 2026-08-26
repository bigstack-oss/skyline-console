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

  static title = t('Live Resize');

  init() {
    this.store = globalFlavorStore;
    fetchQuota(this);
  }

  get name() {
    return t('live resize');
  }

  static get modalSize() {
    return 'large';
  }

  getModalSize() {
    return 'large';
  }

  get tips() {
    return t(
      'Grows the CPU / memory of a running instance without reboot, up to its hotplug ceiling (4x the current flavor by default). Instances created before this feature was enabled need one hard reboot first. If the current host is full, the instance is live-migrated to a fitting host automatically.'
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

  static policy = 'os_compute_api:servers:live_resize';

  static allowed = (item, containerProps) => {
    const { isAdminPage } = containerProps;
    return Promise.resolve(
      checkStatus(['active'], item, false) &&
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
  liveResizeReason = (flavor) => {
    const current = this.item.flavor_info || {};
    const { vcpus: curVcpus, ram: curRam, disk: curDisk } = current;
    const { vcpus, ram, disk } = flavor || {};
    const { maxVcpus, maxRam } = getHeadroom(current);
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
    if (
      !isBootFromVolume(this.item) &&
      curDisk !== undefined &&
      disk !== curDisk
    ) {
      return t('Root disk size must not change');
    }
    if (vcpus === curVcpus && ram === curRam) {
      return t('Already the current flavor');
    }
    if (vcpus > curVcpus && vcpus > maxVcpus) {
      return t('Above the hotplug ceiling of {max} vCPU', { max: maxVcpus });
    }
    if (ram > curRam && ram > maxRam) {
      return t('Above the hotplug ceiling of {max} MB memory', { max: maxRam });
    }
    if (checkFlavorDisable(flavor, this)) {
      return t('Exceeds your remaining quota');
    }
    return null;
  };

  disabledFlavor = (flavor) => !!this.liveResizeReason(flavor);

  get reasonColumn() {
    return [
      {
        title: t('Not Selectable Because'),
        dataIndex: 'cube_live_resize_reason',
        render: (value, record) => this.liveResizeReason(record) || '-',
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
    ];
  }

  onSubmit = (values) => {
    const { id } = this.item;
    const { newFlavor } = values;
    const flavor = newFlavor.selectedRowKeys[0];
    return globalServerStore.liveResize({ id, flavor });
  };
}

export default inject('rootStore')(observer(LiveResize));
