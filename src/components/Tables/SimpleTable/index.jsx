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
import PropTypes from 'prop-types';
import { get, isString, isEmpty, isEqual, has } from 'lodash';
import { Table } from 'antd';
import {
  getColumnSorter,
  getSortOrder,
  updateColumnSort,
  checkIsStatusColumn,
  getStatusRender,
  getRender,
} from 'utils/table';
import { Link } from 'react-router-dom';
import { getNoValue } from 'utils/index';
import styles from './index.less';

export default class SimpleTable extends React.Component {
  static propTypes = {
    datas: PropTypes.array.isRequired,
    filters: PropTypes.object,
    searchFilters: PropTypes.array,
    columns: PropTypes.array.isRequired,
    className: PropTypes.string,
    onChange: PropTypes.func,
    isLoading: PropTypes.bool,
    rowSelection: PropTypes.object,
    pagination: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    filterByBackend: PropTypes.bool,
    // eslint-disable-next-line react/no-unused-prop-types
    isSortByBack: PropTypes.bool,
    // eslint-disable-next-line react/no-unused-prop-types
    defaultSortKey: PropTypes.string,
    // eslint-disable-next-line react/no-unused-prop-types
    defaultSortOrder: PropTypes.string,
    onRow: PropTypes.func,
  };

  static defaultProps = {
    filters: {},
    searchFilters: [],
    isLoading: false,
    rowSelection: null,
    pagination: {},
    filterByBackend: false,
    isSortByBack: false,
    defaultSortKey: '',
    defaultSortOrder: '',
  };

  handleChange = (pagination, filters, sorter, extra) => {
    const { onChange } = this.props;
    onChange && onChange(pagination, filters, sorter, extra);
  };

  getBaseColumns = (columns) =>
    columns.map((column) => {
      const {
        sortable,
        dataIndex,
        valueRender,
        sorter,
        sortOrder,
        render,
        isStatus,
        isName,
        ...rest
      } = column;
      if (column.key === 'operation') {
        return column;
      }
      const newSorter = getColumnSorter(column, this.props);
      const newSortOrder =
        sortOrder || newSorter ? getSortOrder(dataIndex, this.props) : null;
      let newRender = render || getRender(valueRender);
      if (checkIsStatusColumn(dataIndex, isStatus)) {
        newRender = getStatusRender(newRender);
      }
      if (dataIndex === 'description') {
        newRender = this.getNoValueRender(newRender);
      }
      if (dataIndex === 'project_name') {
        newRender = this.getProjectRender(newRender);
      }
      if (dataIndex === 'name' || isName) {
        newRender = this.getNameRender(newRender, column);
      }
      const newColumn = {
        ...rest,
        dataIndex,
        align: column.align || 'left',
      };
      if (newSorter) {
        newColumn.sorter = newSorter;
      }
      if (sortOrder) {
        newColumn.sortOrder = newSortOrder;
      }
      if (newRender) {
        newColumn.render = newRender;
      }
      updateColumnSort(newColumn, this.props);
      return newColumn;
    });

  getProjectId = (record) =>
    record.project_id || record.owner || record.fingerprint || record.tenant;

  getProjectRender = (render) => {
    if (render) {
      return render;
    }
    return (value, record) => {
      const projectId = this.getProjectId(record);
      if (!projectId) {
        return '-';
      }
      const url = `/identity/project-admin/detail/${projectId}`;
      return (
        <>
          <div>
            <Link to={url}>{projectId}</Link>
          </div>
          <div>{value || '-'}</div>
        </>
      );
    };
  };

  getNoValueRender = (render) => {
    if (render) {
      return render;
    }
    return (value) => getNoValue(value);
  };

  getNameRender = (render, column) => {
    if (render) {
      return render;
    }
    const { linkPrefix, dataIndex, idKey, linkPrefixFunc, linkFunc } = column;
    const { rowKey } = this.props;
    return (value, record) => {
      const idValue = get(record, idKey || rowKey);
      let url = null;
      if (linkFunc) {
        url = linkFunc(value, record);
      } else {
        const linkValue = linkPrefixFunc
          ? linkPrefixFunc(value, record)
          : linkPrefix;
        url = this.getLinkUrl(linkValue, idValue);
      }
      const nameValue = value || get(record, dataIndex) || '-';
      if (!url) {
        return nameValue;
      }
      return (
        <div>
          <div>
            <Link to={url}>{idValue}</Link>
          </div>
          <div>{nameValue}</div>
        </div>
      );
    };
  };

  getLinkUrl = (prefix, id) => {
    if (!prefix) {
      return null;
    }
    if (prefix[prefix.length - 1] === '/') {
      return `${prefix}${id}`;
    }
    return `${prefix}/${id}`;
  };

  getColumns = () => {
    const { columns } = this.props;
    const baseColumns = this.getBaseColumns(columns);
    return baseColumns;
  };

  getDataSource = () => {
    const { datas, filters, filterByBackend } = this.props;
    if (filterByBackend) {
      return datas;
    }
    const tmpDatas = datas.map((it) => {
      if (it.key) {
        return it;
      }
      return {
        ...it,
        key: it.id,
      };
    });
    if (!filters || isEmpty(filters)) {
      return tmpDatas;
    }
    return tmpDatas.filter((it) => this.filterData(it, filters));
  };

  onRow = (record, index) => {
    const { rowSelection, onRow } = this.props;
    if (onRow) {
      return onRow(record, index);
    }
    return {
      onClick: () => {
        const { selectedRowKeys, onChange, type, getCheckboxProps } =
          rowSelection;
        if (getCheckboxProps) {
          const { disabled } = getCheckboxProps(record);
          if (disabled) {
            return;
          }
        }
        const idx = selectedRowKeys.indexOf(record.key);
        if (type === 'checkbox') {
          const newKeys = [...selectedRowKeys];
          if (idx > -1) {
            newKeys.splice(idx, 1);
          } else {
            newKeys.push(record.key);
          }
          onChange(newKeys);
        } else if (type === 'radio') {
          onChange([record.key]);
        }
      },
    };
  };

  getPagination(dataSource) {
    const { pagination } = this.props;
    return (
      pagination && {
        ...pagination,
        total: dataSource.length,
      }
    );
  }

  filterData = (data, filters) => {
    const { searchFilters } = this.props;
    const failed = Object.keys(filters).find((key) => {
      const value = get(data, key);
      const filterValue = filters[key];

      const { filterFunc } = searchFilters.find((i) => i.name === key);
      if (filterFunc) {
        return !filterFunc(value, filterValue);
      }

      const isInclude = this.checkFilterInclude(key);
      if (isString(value) && isString(filterValue)) {
        if (isInclude) {
          return value.toLowerCase().indexOf(filterValue.toLowerCase()) < 0;
        }
        return value.toLowerCase() !== filterValue.toLowerCase();
      }
      return !isEqual(value, filterValue);
    });
    return !failed;
  };

  checkFilterInclude = (key) => {
    const { searchFilters } = this.props;
    const item = searchFilters.find((it) => it.name === key);
    if (has(item, 'include')) {
      return item.include;
    }
    if (has(item, 'options')) {
      return false;
    }
    return true;
  };

  render() {
    const { className, isLoading, rowSelection, footer } = this.props;

    const currentColumns = this.getColumns();
    const dataSource = this.getDataSource();
    return (
      <Table
        className={classnames(styles['sl-simple-table'], className)}
        columns={currentColumns}
        dataSource={dataSource}
        loading={isLoading}
        onChange={this.handleChange}
        pagination={this.getPagination(dataSource)}
        rowSelection={rowSelection}
        sortDirections={['ascend', 'descend', 'ascend']}
        showSorterTooltip={false}
        footer={footer}
        onRow={this.onRow}
      />
    );
  }
}