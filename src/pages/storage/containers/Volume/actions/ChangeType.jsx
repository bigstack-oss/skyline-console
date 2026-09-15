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
import { isArray, uniq } from 'lodash';
import { ModalAction } from 'containers/Action';
import { allSettled } from 'utils';
import globalVolumeStore from 'stores/cinder/volume';
import globalVolumeTypeStore from 'stores/cinder/volume-type';
import { isAvailableOrInUse } from 'resources/cinder/volume';

// Nova's swap_volume has no root-disk guard, so a boot volume retypes like any
// other in-use one. Status is the only gate.
const canChangeType = (item) => isAvailableOrInUse(item);

export class ChangeType extends ModalAction {
  static id = 'change-type';

  static title = t('Change Type');

  get name() {
    return t('Change type');
  }

  static policy = 'volume:retype';

  static allowed = (item) => Promise.resolve(canChangeType(item));

  // A batch button is enabled on any selection, so re-check each one here.
  static disableSubmit = ({ items }) =>
    isArray(items) && items.some((it) => !canChangeType(it));

  get isBatch() {
    const { items } = this.props;
    return isArray(items) && items.length > 0;
  }

  get selectedVolumes() {
    return this.isBatch ? this.props.items : [this.item];
  }

  get currentTypes() {
    return uniq(
      this.selectedVolumes.map((it) => it.volume_type).filter((it) => !!it)
    );
  }

  // Mixed selections keep every type on offer, so some volumes may already be
  // on the chosen one.
  get skipsSameType() {
    return this.currentTypes.length > 1;
  }

  get blockedVolumes() {
    return this.selectedVolumes.filter((it) => !canChangeType(it));
  }

  get tips() {
    const tips = [
      t(
        'If the capacity of the disk is large, the type modify operation may take several hours. Please be cautious.'
      ),
    ];
    if (this.skipsSameType) {
      tips.push(t('Volumes already using the selected type are skipped.'));
    }
    if (this.blockedVolumes.length) {
      tips.push(
        t(
          'The following volumes can not change type and need to be deselected: {names}',
          { names: this.getNames(this.blockedVolumes) }
        )
      );
    }
    if (tips.length === 1) {
      return tips[0];
    }
    return (
      <>
        {tips.map((it) => (
          <div key={it}>{it}</div>
        ))}
      </>
    );
  }

  init() {
    this.store = globalVolumeStore;
    this.volumeTypeStore = globalVolumeTypeStore;
    this.getVolumeTypes();
  }

  getVolumeTypes() {
    this.volumeTypeStore.fetchList();
  }

  get isAsyncAction() {
    return true;
  }

  getNames = (volumes) => volumes.map((it) => it.name || it.id).join(', ');

  get volumeTypes() {
    const { data = [] } = this.volumeTypeStore.list;
    const [onlyType] = this.currentTypes;
    const excluded = this.currentTypes.length === 1 ? onlyType : null;
    return data
      .filter((it) => it.name !== excluded)
      .map((item) => ({ label: item.name, value: item.id }));
  }

  // Volumes already on the target type would be refused by cinder.
  getRetypeTargets(newType) {
    const { data = [] } = this.volumeTypeStore.list;
    const { name: targetName } = data.find((it) => it.id === newType) || {};
    return this.selectedVolumes.filter(
      (it) => canChangeType(it) && it.volume_type !== targetName
    );
  }

  get instanceName() {
    if (!this.isBatch) {
      return this.item.name || this.itemId;
    }
    const { new_type } = this.values || {};
    return this.getNames(this.getRetypeTargets(new_type));
  }

  get defaultValue() {
    const { name, id, volume_type, size } = this.item;
    const value = {
      volume_type: (this.volumeTypes[0] || {}).value,
    };
    if (!this.isBatch) {
      value.volume = `${name || id}(${volume_type} | ${size}GiB)`;
    }
    return value;
  }

  renderVolumes() {
    return (
      <div style={{ maxHeight: 160, overflowY: 'auto' }}>
        {this.selectedVolumes.map((it) => (
          <div key={it.id}>
            {`${it.name || it.id}(${it.volume_type} | ${it.size}GiB)`}
          </div>
        ))}
      </div>
    );
  }

  get formItems() {
    return [
      {
        name: 'volume',
        label: this.isBatch ? t('Volumes') : t('Volume'),
        type: 'label',
        iconType: 'volume',
        content: this.isBatch ? this.renderVolumes() : undefined,
      },
      {
        name: 'new_type',
        label: t('Volume Type'),
        type: 'select',
        required: true,
        options: this.volumeTypes,
      },
    ];
  }

  onSubmit = (values) => {
    const { new_type } = values;
    const body = {
      new_type,
      migration_policy: 'on-demand',
    };
    if (!this.isBatch) {
      return this.store.retype(this.item.id, body);
    }
    return allSettled(
      this.getRetypeTargets(new_type).map((it) =>
        this.store.retype(it.id, body)
      )
    );
  };
}

export default inject('rootStore')(observer(ChangeType));
