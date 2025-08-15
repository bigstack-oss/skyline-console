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
import { upperFirst } from 'lodash';
import { computeSizeMiB } from 'utils/image';
import { imageFormats } from 'resources/glance/image';
import ImageType from 'components/ImageType';
import ImportStatus from 'components/ImportStatus';
import BaseList from 'containers/List';
import cosImageStore from 'stores/cos/image';
import actionConfigs from './actions';

export class Image extends BaseList {
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

  get hideRefresh() {
    return true;
  }

  get hideCustom() {
    return true;
  }

  get ableAutoFresh() {
    return false;
  }

  get isFilterByBackend() {
    return false;
  }

  get isSortByBackend() {
    return false;
  }

  get defaultSortKey() {
    return 'created_at';
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
    return false;
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
        title: t('Project'),
        dataIndex: 'imageProject',
        hidden: !this.isAdminPage && this.tab !== 'all',
        sorter: false,
        render: (value) => upperFirst(value) || '-',
      },
      {
        title: t('OS'),
        dataIndex: 'os',
        width: 80,
        sorter: false,
        render: (value) => <ImageType type={value} title={value} />,
      },
      {
        title: t('Domain'),
        dataIndex: 'imageDomain',
        sorter: false,
        render: (value) => upperFirst(value) || '-',
      },
      {
        title: t('Destination'),
        dataIndex: 'imageDestination',
        sorter: false,
        render: (value) => upperFirst(value) || '-',
      },
      {
        title: t('Disk Format'),
        dataIndex: 'disk_format',
        sorter: false,
        valueMap: imageFormats,
      },
      {
        title: t('Visibility'),
        dataIndex: 'imageVisibility',
        sorter: false,
        render: (value) => upperFirst(value) || '-',
      },
      {
        title: t('Size'),
        dataIndex: 'imageSize',
        sorter: false,
        render: (value) => computeSizeMiB(value),
      },
      {
        title: t('Created At'),
        dataIndex: 'created_at',
        valueRender: 'sinceTime',
      },
      {
        title: t('Status'),
        dataIndex: 'imageStatus',
        isStatus: false,
        sorter: false,
        render: ({ current, isProcessing, processPercent }) => (
          <ImportStatus
            current={current}
            isProcessing={isProcessing}
            processPercent={processPercent}
          />
        ),
      },
    ];
  }

  get searchFilters() {
    return [{ label: t('Name'), name: 'name' }];
  }
}

export default inject('rootStore')(observer(Image));
