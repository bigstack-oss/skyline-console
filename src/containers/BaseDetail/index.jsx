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
import classnames from 'classnames';
import Card from 'components/DetailCard';
import { toJS } from 'mobx';
import { has, isEmpty } from 'lodash';
import { isAdminPage } from 'utils/index';
import styles from './index.less';

export default class BaseDetail extends React.Component {
  constructor(props) {
    super(props);
    this.init();
  }

  componentDidMount() {
    this.fetchData();
  }

  get id() {
    const { id } = this.props.match.params;
    return id;
  }

  get currentProject() {
    return globals.user.project.id;
  }

  get projectId() {
    const { project_id, tenant_id, owner, owner_id } = this.detailData;
    return project_id || tenant_id || owner || owner_id;
  }

  get isMyResource() {
    return this.projectId === this.currentProject;
  }

  get detailData() {
    return this.props.detail || toJS(this.store.detail);
  }

  get isLoading() {
    return this.store.isLoading;
  }

  get routing() {
    return this.props.rootStore.routing;
  }

  get leftCards() {
    return [];
  }

  get rightCards() {
    return [];
  }

  get isAdminPage() {
    const { pathname = '' } = this.props.location || {};
    return isAdminPage(pathname);
  }

  getUrl(path, adminStr) {
    return this.isAdminPage ? `${path}${adminStr || '-admin'}` : path;
  }

  getDetailData = () => {
    const { detail } = this.props;
    if (!detail || isEmpty(detail)) {
      this.fetchData();
    }
  };

  fetchData = (params) => {
    this.store
      .fetchDetail({
        id: this.id,
        ...params,
      })
      .catch(this.catch);
  };

  init() {
    this.store = {};
  }

  renderLeftCards() {
    return this.leftCards.map((it, index) => {
      const {
        title,
        titleHelp,
        options,
        render,
        labelCol,
        contentCol,
        button,
        sourceData = undefined,
      } = it;
      if (render) {
        return render();
      }
      return (
        <Card
          key={`card-left-${index}`}
          className="detail-left-card"
          data={sourceData || this.detailData}
          title={title}
          titleHelp={titleHelp}
          options={options}
          loading={this.isLoading}
          labelCol={labelCol}
          contentCol={contentCol}
          button={button}
        />
      );
    });
  }

  renderRightCards() {
    return this.rightCards.map((it, index) => {
      const { title, options, labelCol, titleHelp, render, button } = it;
      if (render) {
        return render();
      }
      let realLabelCol = 8;
      let contentCol = 16;
      if (has(it, 'labelCol')) {
        realLabelCol = labelCol;
        contentCol = 24 - realLabelCol;
      }
      return (
        <Card
          key={`card-right-${index}`}
          className="detail-right-card"
          data={this.detailData}
          title={title}
          titleHelp={titleHelp}
          options={options}
          loading={this.isLoading}
          labelCol={realLabelCol}
          contentCol={contentCol}
          button={button}
        />
      );
    });
  }

  renderModal() {
    return null;
  }

  render() {
    return (
      <div className={classnames(styles.main)}>
        <div className={styles['left-side']} id="detail-left-side">
          {this.renderLeftCards()}
        </div>
        <div className={styles['right-side']} id="detail-right-side">
          {this.renderRightCards()}
        </div>
        {this.renderModal()}
      </div>
    );
  }
}