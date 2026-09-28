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
import Base from 'components/Form';
import globalHostStore from 'src/stores/masakari/hosts';
import globalComputeHostStore from 'src/stores/nova/compute-host';
import { Input, Switch } from 'antd';
import { hostControlAttributes, hostType } from 'resources/masakari/segment';

export class StepHost extends Base {
  init() {
    this.store = globalHostStore;
    this.state = {
      host: [],
      hostLoading: true,
      ...this.state,
    };

    this.getHostList();
  }

  get title() {
    return 'StepHost';
  }

  get name() {
    return 'StepHost';
  }

  get isStep() {
    return true;
  }

  allowed = () => Promise.resolve();

  async getHostList() {
    const response = await globalComputeHostStore.fetchList({
      binary: 'nova-compute',
    });
    const hostList = await globalHostStore.fetchList();
    const usedNames = new Set(hostList.map((it) => it.name));
    // The payload is built from these row objects, so the fixed values have
    // to live here rather than only as an input's defaultValue.
    const host = response
      .filter((it) => !usedNames.has(it.host))
      .map((it) => ({
        ...it,
        type: hostType,
        control_attributes: hostControlAttributes,
      }));

    const hostMap = Object.fromEntries(host.map((it) => [it.id, it]));
    this.setState({ host, hostMap, hostLoading: false });
  }

  get getHostName() {
    return (this.state.host || []).map((it) => ({
      value: it.host,
      label: it.host,
    }));
  }

  get formItems() {
    const columns = [
      { title: t('Name'), dataIndex: 'host' },
      { title: t('Zone'), dataIndex: 'zone' },
      {
        title: t('Updated'),
        dataIndex: 'updated_at',
        valueRender: 'toLocalTime',
      },
      {
        name: 'reserved',
        title: t('Reserved'),
        dataIndex: 'reserved',
        required: true,
        render: (reserved, row) => (
          <Switch
            checked={reserved}
            onChange={(checked) => {
              this.setState((prevState) => {
                const host = prevState.hostMap;
                host[row.id].reserved = checked;
                return { hostMap: host };
              });
            }}
          />
        ),
      },
      {
        name: 'type',
        title: t('Type'),
        dataIndex: 'type',
        required: true,
        render: (type) => <Input value={type} disabled />,
      },
      {
        name: 'control_attributes',
        title: t('Control Attributes'),
        dataIndex: 'control_attributes',
        render: (controlAttributes) => (
          <Input value={controlAttributes} disabled />
        ),
      },
      {
        name: 'on_maintenance',
        title: t('On Maintenance'),
        dataIndex: 'on_maintenance',
        render: (maintain, row) => (
          <Switch
            checked={maintain}
            onChange={(checked) => {
              this.setState((prevState) => {
                const host = prevState.hostMap;
                host[row.id].on_maintenance = checked;
                return { hostMap: host };
              });
            }}
          />
        ),
      },
    ];

    return [
      {
        name: 'name',
        label: t('Host Name'),
        type: 'select-table',
        required: true,
        data: this.state.host,
        isMulti: true,
        onRow: () => {},
        columns,
        isLoading: this.state.hostLoading,
        filterParams: [
          { label: t('Name'), name: 'host' },
          { label: t('Zone'), name: 'zone' },
        ],
      },
    ];
  }
}

export default inject('rootStore')(observer(StepHost));
