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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { inject, observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import LayerSvgIcon from 'asset/cube/monochrome/layer.svg';
import UserSvgIcon from 'asset/cube/monochrome/user.svg';
import NodeSvgIcon from 'asset/cube/monochrome/node.svg';
import CubeCard from 'components/cube/CubeCard';
import styles from '../style.less';

export const actions = [
  {
    key: 'projectNum',
    label: t('Projects'),
    Avatar: LayerSvgIcon,
    to: '/identity/project-admin',
  },
  {
    key: 'userNum',
    label: t('Users'),
    Avatar: UserSvgIcon,
    to: '/identity/user-admin',
  },
  {
    key: 'nodeNum',
    label: t('Nodes'),
    Avatar: NodeSvgIcon,
    to: '/compute/hypervisors-admin?tab=ComputeHost',
  },
];

export class ProjectInfo extends Component {
  componentDidMount() {
    this.props.store.getProjectInfoData();
  }

  get actions() {
    return this.props.actions || actions;
  }

  render() {
    const { projectInfoLoading, platformNum } = this.props.store;
    return (
      <CubeCard
        loading={projectInfoLoading}
        className={styles.project}
        title={t('Platform Info')}
        bordered={false}
      >
        <div className={styles['platform-info']}>
          {this.actions.map((item) => (
            <Link key={item.key} to={item.to} className={styles['info-link']}>
              <div className={styles['info-title']}>
                {platformNum[item.key]}
              </div>
              <div className={styles['info-text']}>
                <item.Avatar width={24} height={24} />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </CubeCard>
    );
  }
}

ProjectInfo.propTypes = {
  store: PropTypes.object.isRequired,
};

export default inject('rootStore')(observer(ProjectInfo));
