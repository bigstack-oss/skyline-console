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
import { merge } from 'lodash';
import { getRuleSummary } from 'pages/network/containers/QoSPolicy/utils/label';

const renderRulesColumn = (rules) => {
  if (!rules?.length) {
    return '-';
  }
  return (
    <ul style={{ margin: 0, paddingLeft: 20 }}>
      {rules.map((rule, index) => (
        <li key={rule?.id ?? index}>{getRuleSummary(rule)}</li>
      ))}
    </ul>
  );
};

export const getQosPolicyColumns = ({ self, all = false }) => {
  const ret = [
    {
      title: t('ID/Name'),
      dataIndex: 'name',
      routeName: self.getRouteName('networkQosDetail'),
    },
    {
      title: t('Description'),
      dataIndex: 'description',
      sorter: false,
    },
    {
      title: t('Rules'),
      dataIndex: 'rules',
      width: 500,
      render: renderRulesColumn,
      sorter: false,
    },
    {
      title: t('Shared'),
      dataIndex: 'shared',
      valueRender: 'yesNo',
      width: 80,
      sorter: false,
    },
  ];
  if (all && self.isAdminPage) {
    ret.splice(2, 0, {
      title: t('Project ID/Name'),
      dataIndex: 'project_name',
      sortKey: 'project_id',
    });
  }
  return ret;
};

export const getQosPolicyFilters = () => {
  return [
    {
      label: t('Name'),
      name: 'name',
    },
  ];
};

export const qosPolicySortProps = {
  isSortByBack: true,
  defaultSortKey: 'name',
  defaultSortOrder: 'descend',
};

export const getQosPolicySelectTableProps = ({ self, all, shared }) => ({
  ...qosPolicySortProps,
  columns: getQosPolicyColumns({ self, all }),
  filterParams: getQosPolicyFilters({ self, shared }),
});

/**
 *  getQosPolicyTabs in component, should used by call/apply to make ‘this' point to component
 */
export function getQoSPolicyTabs(extraProps = {}) {
  const baseProps = {
    backendPageStore: this.qosPolicyStore,
    ...extraProps,
  };
  const ret = [
    {
      title: t('Current Project QoS Policies'),
      key: 'project',
      props: merge({}, baseProps, {
        ...getQosPolicySelectTableProps({ self: this }),
        extraParams: {
          project_id: this.currentProjectId,
        },
      }),
    },
    {
      title: t('Shared QoS Policies'),
      key: 'shared',
      props: merge({}, baseProps, {
        ...getQosPolicySelectTableProps({ shared: true, self: this }),
        extraParams: {
          shared: true,
        },
      }),
    },
  ];

  if (this.hasAdminRole) {
    ret.push({
      title: t('All QoS Policies'),
      key: 'all',
      props: merge({}, baseProps, {
        ...getQosPolicySelectTableProps({ all: true, self: this }),
        extraParams: {
          all_projects: true,
        },
      }),
    });
  }

  return ret;
}
