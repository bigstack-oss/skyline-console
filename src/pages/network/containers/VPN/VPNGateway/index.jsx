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

import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import { VpnServicesStore } from 'stores/neutron/vpn-service';
import { vpnStatus, vpnStatusOptions } from 'resources/vpn';
import React from 'react';
import { actionConfigs, adminConfigs } from './actions';

@inject('rootStore')
@observer
export default class Index extends Base {
  init() {
    this.store = new VpnServicesStore();
    this.downloadStore = new VpnServicesStore();
  }

  get isFilterByBackend() {
    return true;
  }

  get fetchDataByCurrentProject() {
    // add project_id to fetch data;
    return true;
  }

  get policy() {
    return 'get_vpnservice';
  }

  get name() {
    return t('vpn services');
  }

  get adminPageHasProjectFilter() {
    return true;
  }

  get actionConfigs() {
    if (this.isAdminPage) {
      return adminConfigs;
    }
    return actionConfigs;
  }

  getColumns = () => [
    {
      title: t('ID/Name'),
      dataIndex: 'name',
      render: (name, record) => (
        <div>
          <div>{record.id}</div>
          <div>{name}</div>
        </div>
      ),
      stringify: (name, record) => `${record.id}\n${name}`,
    },
    {
      title: t('Project ID/Name'),
      dataIndex: 'project_name',
      hidden: !this.isAdminPage,
    },
    {
      title: t('Description'),
      dataIndex: 'description',
      render: (value) => value || '-',
      isHideable: true,
    },
    {
      title: t('External IP'),
      dataIndex: 'id',
      render: (value, record) => record.external_v4_ip || record.external_v6_ip,
    },
    {
      title: t('Router ID'),
      dataIndex: 'router_id',
      isHideable: true,
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      render: (v) => vpnStatus[v],
    },
  ];

  get searchFilters() {
    return [
      {
        label: t('Name'),
        name: 'name',
      },
      {
        label: t('Status'),
        name: 'status',
        options: vpnStatusOptions,
      },
      {
        label: t('Router ID'),
        name: 'router_id',
      },
      {
        label: t('External IP(V4)'),
        name: 'external_v4_ip',
      },
      {
        label: t('External IP(V6)'),
        name: 'external_v6_ip',
      },
    ];
  }
}