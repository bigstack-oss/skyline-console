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
import { observer, inject } from 'mobx-react';
import { Badge } from 'antd';
import Base from 'containers/List';
import globalUserStore from 'stores/keystone/user';
import { yesNoOptions, emptyActionConfig } from 'utils/constants';
import actionConfigs from './actions';
import actionConfigsInDomain from './actionsInDomain';

@inject('rootStore')
@observer
export default class User extends Base {
  init() {
    this.store = globalUserStore;
    this.getDomains();
  }

  getDomains() {
    this.store.fetchDomain();
  }

  get tabs() {
    return [];
  }

  get policy() {
    return 'identity:list_users';
  }

  get name() {
    return t('users');
  }

  getColumns = () => {
    const {
      match: { path },
    } = this.props;
    const components = [
      {
        title: t('User ID/Name'),
        dataIndex: 'name',
        linkPrefix: `/identity/${this.getUrl('user')}/detail`,
      },
      {
        title: t('Project Scope'),
        dataIndex: 'projectScope',
        isHideable: true,
        render: (projectScope) => {
          if (projectScope && projectScope[0]) {
            return projectScope.map((it) => <div>{it}</div>);
          }
        },
      },
      // {
      //   title: t('System Scope'),
      //   dataIndex: 'systemScope',
      //   isHideable: true,
      //   render: (systemScope) => {
      //     if (systemScope === true) {
      //       return 'All';
      //     }
      //     return '-';
      //   },
      // },
      {
        title: t('True Name'),
        dataIndex: 'full_name',
        isHideable: true,
      },
      {
        title: t('Affiliated Domain'),
        dataIndex: 'domain_name',
        isHideable: true,
      },
      {
        title: t('Project Num'),
        dataIndex: 'project_num',
        render: (project_num) => {
          if (project_num === 0) {
            return <Badge color="red" text={project_num} />;
          }
          return <Badge color="green" text={project_num} />;
        },
      },
      {
        title: t('Email'),
        dataIndex: 'email',
        isHideable: true,
        // render: (name) => {
        //   if (name) {
        //     return <Link>{name}</Link>;
        //   }
        //   return '-';
        // },
      },
      {
        title: t('phone'),
        dataIndex: 'phone',
        isHideable: true,
      },
      {
        title: t('Enabled'),
        dataIndex: 'enabled',
        isHideable: true,
        render: (val) => {
          if (val === true) {
            return <Badge color="green" text={t('Yes')} />;
          }
          return <Badge color="red" text={t('No')} />;
        },
        stringify: (val) => (val ? t('Yes') : t('No')),
      },
    ];

    if (path.indexOf('role-admin/detail') === -1) {
      components.splice(1, 1);
    }
    if (path.indexOf('user-admin') === -1) {
      components.splice(4, 1);
    }
    return components;
  };

  get actionConfigs() {
    const {
      match: { path },
    } = this.props;
    if (
      path.indexOf('identity/user') >= 0 &&
      path.indexOf('identity/user-group') === -1
    ) {
      return this.isAdminPage
        ? actionConfigs.adminConfigs
        : actionConfigs.actionConfigs;
    }
    if (path.indexOf('domain-admin/detail') >= 0) {
      return this.isAdminPage
        ? actionConfigsInDomain.adminConfigs
        : actionConfigsInDomain.actionConfigs;
    }
    return emptyActionConfig;
  }

  get searchFilters() {
    return [
      {
        label: t('User Name'),
        name: 'name',
      },
      {
        label: t('True Name'),
        name: 'full_name',
      },
      {
        label: t('Enabled'),
        name: 'enabled',
        options: yesNoOptions,
      },
    ];
  }

  async getData({ silent, ...params } = {}) {
    const { match } = this.props;
    const { path } = match;
    const newParams = { ...params };
    silent && (this.list.silent = true);
    if (path.indexOf('domain-admin/detail') >= 0) {
      const { id } = match.params;
      newParams.domainId = id;
      await this.store.fetchListInDomainDetail(newParams);
    } else if (path.indexOf('project-admin/detail') >= 0) {
      const { id } = match.params;
      newParams.projectId = id;
      await this.store.fetchListInProjectDetail(newParams);
    } else if (path.indexOf('user-group-admin/detail') >= 0) {
      const { id } = match.params;
      newParams.groupId = id;
      await this.store.fetchListInGroupDetail(newParams);
    } else if (path.indexOf('role-admin/detail') >= 0) {
      const { id } = match.params;
      newParams.roleId = id;
      await this.store.fetchListInRoleDetail(newParams);
    } else {
      await this.store.fetchList(newParams);
    }
    this.list.silent = false;
  }
}