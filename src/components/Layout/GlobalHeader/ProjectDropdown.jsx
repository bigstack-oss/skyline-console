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

import React, { createRef } from 'react';
import { inject, observer } from 'mobx-react';
import { Spin } from 'antd';
import ApplicationSvgIcon from 'asset/cube/monochrome/applications.svg';
import ChevronDownIcon from 'asset/cube/monochrome/chevron_down.svg';
import ItemActionButtons from 'components/Tables/Base/ItemActionButtons';
import ProjectSelect from './ProjectTable';
import styles from './index.less';

export class ProjectDropdown extends React.Component {
  projectSwitchBtnRef = createRef();

  get user() {
    const { user } = this.props.rootStore;
    return user;
  }

  get project() {
    const {
      project: {
        id: projectId = '',
        name: projectName = '',
        domain: { name: userDomainName } = {},
      } = {},
    } = this.user || {};
    return {
      projectId,
      projectName,
      userDomainName,
    };
  }

  handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const antButton =
        this.projectSwitchBtnRef.current?.querySelector('button');
      antButton?.click();
    }
  };

  render() {
    if (!this.user) {
      return (
        <Spin
          size="small"
          style={{
            marginLeft: 8,
            marginRight: 8,
            marginTop: -24,
          }}
        />
      );
    }
    const { projectName, userDomainName } = this.project;
    return (
      <div className={styles.project} id="project-switch">
        <div
          ref={this.projectSwitchBtnRef}
          className="project-switch-btn"
          role="button"
          tabIndex={0}
          onKeyDown={this.handleKeyDown}
        >
          <ApplicationSvgIcon width={16} height={16} />
          {projectName}
          <ItemActionButtons
            actions={{ moreActions: [{ action: ProjectSelect }] }}
          />
          <ChevronDownIcon
            className={styles['chevron-down-icon']}
            width={10}
            height={10}
          />
        </div>
        <span className={styles.domain}>{userDomainName}</span>
      </div>
    );
  }
}

export default inject('rootStore')(observer(ProjectDropdown));
