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
import FileSaver from 'file-saver';
import { DownloadOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Menu, Dropdown, Progress, Tooltip } from 'antd';
import { get, isObject, isArray } from 'lodash';
import { Parser } from 'json2csv';
import { toLocalTimeFilter } from 'utils/index';
import Notify from 'components/Notify';
import styles from './index.less';

export default class index extends Component {
  static propTypes = {
    columns: PropTypes.array,
    datas: PropTypes.array,
    total: PropTypes.number,
    getValueRenderFunc: PropTypes.func.isRequired,
    resourceName: PropTypes.string,
    getData: PropTypes.func,
  };

  static defaultProps = {
    columns: [],
    datas: [],
    total: 0,
    resourceName: '',
    getData: () =>
      Promise.resolve({
        data: {
          items: [],
          count: 0,
        },
      }),
  };

  constructor(props) {
    super(props);
    this.state = {
      isDownloading: false,
      current: 1,
      allData: [],
      // marker: null, // todo
    };
  }

  get pageSize() {
    return 100;
  }

  get total() {
    return this.props.total;
  }

  getDownloadHeader() {
    const { columns } = this.props;
    return columns.map((it) => ({
      label: it.title,
      value: it.dataIndex,
      default: '',
    }));
  }

  getSimpleValue = (value, data, dataIndex) => {
    if (isArray(value)) {
      return value
        .map((item, itemIndex) => {
          if (React.isValidElement(item)) {
            try {
              return data[dataIndex][itemIndex];
            } catch (e) {
              return '';
            }
          }
          return item;
        })
        .join('\n');
    }
    if (isObject(value)) {
      if (React.isValidElement(value)) {
        return (data[dataIndex] && data[dataIndex].toString()) || '-';
      }
      return data[dataIndex];
    }
    return value;
  };

  getColumnData = (data, column) => {
    const { dataIndex, render, valueRender, stringify } = column;
    const { getValueRenderFunc } = this.props;
    const value = get(data, dataIndex);
    if (!render && !valueRender && !stringify) {
      return this.getSimpleValue(value, data, dataIndex);
    }
    if (stringify) {
      return stringify(value, data);
    }
    if (valueRender) {
      const renderFunc = getValueRenderFunc(valueRender);
      return this.getSimpleValue(renderFunc(value, data), data, dataIndex);
    }
    if (render) {
      return this.getSimpleValue(render(value, data), data, dataIndex);
    }
  };

  getDownloadData() {
    const { columns, datas } = this.props;
    return datas.map((data) => {
      const item = {};
      columns.forEach((it) => {
        const value = this.getColumnData(data, it);
        item[it.dataIndex] = value;
      });
      return item;
    });
  }

  getDownloadDataAll() {
    const { columns } = this.props;
    const { allData } = this.state;
    return allData.map((data) => {
      const item = {};
      columns.forEach((it) => {
        const value = this.getColumnData(data, it);
        item[it.dataIndex] = value;
      });
      return item;
    });
  }

  downloadAllData = () => {
    this.beginDownload();
  };

  getFileName = (all) => {
    const timeStr = toLocalTimeFilter(new Date().getTime());
    const { resourceName } = this.props;
    return all
      ? `${resourceName}-${t('all')}-${timeStr}.csv`
      : `${resourceName}-${timeStr}.csv`;
  };

  exportCurrentData = (event, all) => {
    const fields = this.getDownloadHeader();
    const jsonData = this.getDownloadData();
    const parser = new Parser({ fields });
    const csv = parser.parse(jsonData);
    const exportContent = '\uFEFF';
    const blob = new Blob([exportContent + csv], {
      type: 'text/plain;charset=utf-8',
    });
    const fileName = all ? this.getFileName('all') : this.getFileName();
    FileSaver.saveAs(blob, fileName);
    if (all) {
      Notify.success(t('All data downloaded.'));
    } else {
      Notify.success(t('Current data downloaded.'));
    }
  };

  exportCurrentDataAll = () => {
    this.exportCurrentData(null, true);
  };

  exportAllData = () => {
    const fields = this.getDownloadHeader();
    const jsonData = this.getDownloadDataAll();
    const parser = new Parser({ fields });
    const csv = parser.parse(jsonData);
    const exportContent = '\uFEFF';
    const blob = new Blob([exportContent + csv], {
      type: 'text/plain;charset=utf-8',
    });
    const fileName = this.getFileName('all');
    FileSaver.saveAs(blob, fileName);
    Notify.success(t('All data downloaded.'));
  };

  cancelDownload = () => {
    this.setState(
      {
        isDownloading: false,
      },
      () => {
        const { onFinishDownload } = this.props;
        onFinishDownload && onFinishDownload();
      }
    );
    Notify.warn(t('Download canceled!'));
  };

  beginDownload = () => {
    this.setState(
      {
        isDownloading: true,
        percent: 0,
        current: 1,
        allData: [],
      },
      () => {
        const { onBeginDownload } = this.props;
        onBeginDownload && onBeginDownload();
        this.getDownloadDataForAll();
      }
    );
  };

  finishDownload = () => {
    this.setState(
      {
        isDownloading: false,
      },
      () => {
        this.exportAllData();
        const { onFinishDownload } = this.props;
        onFinishDownload && onFinishDownload();
      }
    );
  };

  getDownloadDataForAll = async () => {
    const { current, allData, isDownloading } = this.state;
    // todo: api response counts
    const counts = this.total || 0;
    if (!isDownloading) {
      return;
    }
    const { getData } = this.props;
    const items = await getData({ page: current, limit: this.pageSize });
    const newDatas = [...allData, ...items];
    const isFinish = items.length < this.pageSize;
    if (isFinish) {
      this.setState(
        {
          allData: newDatas,
          percent: 100,
        },
        () => {
          this.finishDownload();
        }
      );
    } else {
      let percent = 0;
      if (counts) {
        percent = Math.floor((newDatas.length / counts) * 100);
      } else {
        percent = current * 10;
      }
      if (percent > 100) {
        percent = 100;
      }
      this.setState(
        {
          allData: newDatas,
          current: current + 1,
          percent,
        },
        () => {
          this.getDownloadDataForAll();
        }
      );
    }
  };

  renderDownloadCurrent() {
    return (
      <Tooltip title={t('Download all data')}>
        <Button
          type="default"
          onClick={this.exportCurrentDataAll}
          icon={<DownloadOutlined />}
        />
      </Tooltip>
    );
  }

  renderProgress() {
    const { isDownloading, percent } = this.state;
    if (!isDownloading) {
      return null;
    }
    return (
      <Progress percent={percent} status="active" className={styles.progress} />
    );
  }

  renderCancelBtn() {
    const { isDownloading } = this.state;
    if (!isDownloading) {
      return null;
    }
    return (
      <Tooltip title={t('Cancel Download')}>
        <Button
          type="danger"
          shape="circle"
          onClick={this.cancelDownload}
          icon={<CloseOutlined />}
          size="small"
        />
      </Tooltip>
    );
  }

  renderDownloadAll() {
    const menu = (
      <Menu>
        <Menu.Item key="current" onClick={this.exportCurrentData}>
          {t('Download current data')}
        </Menu.Item>
        <Menu.Item key="all" onClick={this.downloadAllData}>
          {t('Download all data')}
        </Menu.Item>
      </Menu>
    );
    return (
      <>
        <Dropdown overlay={menu}>
          <Button type="default" icon={<DownloadOutlined />} />
        </Dropdown>
        {this.renderProgress()}
        {this.renderCancelBtn()}
      </>
    );
  }

  render() {
    const { total, datas } = this.props;
    if (total === datas.length) {
      return this.renderDownloadCurrent();
    }
    return this.renderDownloadAll();
  }
}