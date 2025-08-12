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
import ImageType from 'components/ImageType';
import Base from 'containers/List';
import cosImageStore from 'src/stores/cos/image';
import actionConfigs from './actions';

export class Image extends Base {
  init() {
    this.store = cosImageStore;
    this.downloadStore = cosImageStore;
  }

  get policy() {
    return 'get_images';
  }

  get name() {
    return t('images');
  }

  get actionConfigs() {
    return this.isAdminPage
      ? actionConfigs.actionConfigsAdmin
      : actionConfigs.actionConfigs;
  }

  get isFilterByBackend() {
    return false;
  }

  get isSortByBackend() {
    return true;
  }

  get defaultSortKey() {
    return 'createdAt';
  }

  get hasTab() {
    return !this.isAdminPage;
  }

  updateFetchParams = (params) => {
    if (this.isAdminPage) {
      return {
        ...params,
        all_projects: true,
      };
    }
    switch (this.tab) {
      case 'public':
        return {
          ...params,
          visibility: 'public',
        };
      case 'shared':
        return {
          ...params,
          visibility: 'shared',
        };
      case 'project':
        return {
          ...params,
          owner: this.currentProjectId,
        };
      case 'all':
        return {
          ...params,
          all_projects: true,
        };
      default:
        break;
    }
  };

  get tab() {
    if (this.isAdminPage) {
      return null;
    }
    const { tab = 'project' } = this.props;
    return tab;
  }

  get adminPageHasProjectFilter() {
    return true;
  }

  get projectFilterKey() {
    return 'owner';
  }

  getColumns() {
    return [
      {
        title: t('ID/Name'),
        dataIndex: 'name',
        routeName: this.getRouteName('imageDetail'),
        sorter: false,
      },
      {
        title: t('Project ID/Name'),
        dataIndex: 'project',
        hidden: !this.isAdminPage && this.tab !== 'all',
        sorter: false,
      },
      {
        title: t('Type'),
        dataIndex: 'os',
        render: (value) => <ImageType type={value} title={value} />,
        width: 80,
        sorter: false,
      },
      {
        title: 'Destination',
        dataIndex: 'destination',
        sorter: false,
      },
      {
        title: t('Visibility'),
        dataIndex: 'visibility',
        sorter: false,
      },
      {
        title: t('Size'),
        dataIndex: 'sizeMiB',
        valueRender: 'formatSize',
        sorter: false,
      },
      {
        title: t('Created At'),
        dataIndex: 'createdAt',
        valueRender: 'sinceTime',
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        isStatus: false,
        sorter: false,
        render: ({ current }) => <div>{current}</div>,
      },
    ];
  }

  get searchFilters() {
    return [{ label: t('Name'), name: 'name' }];
  }
}

export default inject('rootStore')(observer(Image));
