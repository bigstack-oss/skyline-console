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

import React, { Component, forwardRef } from 'react';
import { inject } from 'mobx-react';
import { Menu, Dropdown } from 'antd';
import { isArray, isEqual } from 'lodash';
import classnames from 'classnames';
import ChevronRightSvgIcon from 'asset/cube/monochrome/chevron_right.svg';
import CubeMoreActionsButton from 'components/cube/CubeButton/CubeMoreActionsButton';
import ActionMenuItem from '../ActionButton/ActionMenuItem';
import ActionButton from '../ActionButton';
import { getAllowedResults, getAction } from '../Action';
import styles from './index.less';

const { SubMenu } = Menu;

function getActionConf(action) {
  const { id, title, actionType, buttonText, isDanger = false } = action;
  return {
    id,
    title,
    name: buttonText || title,
    actionType,
    action,
    isDanger,
  };
}

function getIsAllowedValue(alloweds, index) {
  const result = alloweds[index];
  if (isArray(result)) {
    return result.every((value) => !!value);
  }
  return result;
}

// The first action must be reserved, shown as: first action | more actions
function DropdownActionButton({
  firstAction = null,
  moreActions = [],
  alloweds = [],
  item,
  onFinishAction,
  routing,
  containerProps,
  firstActionClassName,
  onClickAction,
  onCancelAction,
  isWide,
}) {
  if (alloweds.length === 0) {
    return null;
  }
  if (!firstAction && moreActions.length === 0) {
    return null;
  }
  let firstElement = null;
  let moreElement = null;
  if (firstAction) {
    const isAllowed = getIsAllowedValue(alloweds, 0);
    const config = getActionConf(firstAction.action, item);
    firstElement = (
      <ActionButton
        {...config}
        buttonType="link"
        routing={routing}
        needHide={false}
        isAllowed={isAllowed}
        item={item}
        onFinishAction={onFinishAction}
        onCancelAction={onCancelAction}
        buttonClassName={classnames(
          styles['first-action'],
          firstActionClassName
        )}
        containerProps={containerProps}
        maxLength={8}
        onClickAction={onClickAction}
        isFirstAction
      />
    );
  }

  let allowedFatherCount = 0;
  if (moreActions.length > 0) {
    const buttonClassName =
      isWide || moreActions.length > 1 ? styles['more-action-btn'] : '';

    const menuContent = moreActions.map((it, index) => {
      if (!it.actions) {
        const isAllowed = getIsAllowedValue(alloweds, it.allowedIndex);
        const key = it.key || `key-more-${index}`;
        const config = getActionConf(it.action, item);
        if (!isAllowed) {
          return null;
        }
        allowedFatherCount += 1;

        return (
          <div key={key}>
            <ActionMenuItem
              {...config}
              isAllowed={isAllowed}
              buttonType="link"
              item={item}
              onFinishAction={onFinishAction}
              onCancelAction={onCancelAction}
              routing={routing}
              containerProps={containerProps}
              onClickAction={onClickAction}
              buttonClassName={buttonClassName}
            />
          </div>
        );
      }

      let allowedCount = 0;

      const menuItems = it.actions.map((action, actionIndex) => {
        const isAllowed = getIsAllowedValue(alloweds, action.allowedIndex);
        const key = action.key || `key-more-${index}-${actionIndex}`;
        if (isAllowed) {
          allowedCount += 1;
          allowedFatherCount += 1;
        }
        const config = getActionConf(action.action, item);
        return (
          <div key={key}>
            <ActionMenuItem
              {...config}
              isAllowed={isAllowed}
              buttonType="link"
              item={item}
              onFinishAction={onFinishAction}
              onCancelAction={onCancelAction}
              routing={routing}
              containerProps={containerProps}
              onClickAction={onClickAction}
              buttonClassName={buttonClassName}
            />
          </div>
        );
      });

      const menuKey = `sub-menu-${index}`;
      return (
        <SubMenu
          key={menuKey}
          title={it.title}
          disabled={allowedCount === 0}
          popupClassName={styles['action-sub-menu']}
          expandIcon={
            <ChevronRightSvgIcon
              width={12}
              height={12}
              style={{ marginLeft: '16px' }}
            />
          }
        >
          {menuItems}
        </SubMenu>
      );
    });

    const menu = <Menu>{menuContent}</Menu>;

    if (allowedFatherCount > 0) {
      moreElement = (
        <Dropdown overlay={menu}>
          <CubeMoreActionsButton type="link" variant="in-table">
            {t('More')}
          </CubeMoreActionsButton>
        </Dropdown>
      );
    }
  }

  return (
    <div className={styles['action-button-container']}>
      {firstElement}
      {moreElement}
    </div>
  );
}

function getActionList(actions, item, containerProps) {
  const { firstAction = null, moreActions = [] } = actions;
  const actionList = [];
  const newFirst = firstAction
    ? {
        action: getAction(firstAction, item, containerProps),
        allowedIndex: 0,
      }
    : null;
  const newMoreActions = [];
  if (firstAction) {
    actionList.push(newFirst);
  }

  moreActions.forEach((it) => {
    if (it.actions) {
      const newActions = [];
      it.actions.forEach((action) => {
        const newAction = {
          action: getAction(action, item, containerProps),
          allowedIndex: actionList.length,
        };
        newActions.push(newAction);
        actionList.push(newAction);
      });
      newMoreActions.push({
        ...it,
        actions: newActions,
      });
    } else if (it.action) {
      const newAction = {
        action: getAction(it.action, item, containerProps),
        allowedIndex: actionList.length,
      };
      newMoreActions.push(newAction);
      actionList.push(newAction);
    }
  });
  return {
    actionList,
    firstAction: newFirst,
    moreActions: newMoreActions,
  };
}

class ItemActionButtonsInner extends Component {
  constructor(props) {
    super(props);
    this.actionList = [];
    this.firstAction = null;
    this.moreActions = [];
    this._isMounted = false;
    this.state = {
      results: [],
    };
  }

  componentDidMount() {
    this._isMounted = true;
    const { item, containerProps } = this.props;
    this.updateResult(item, containerProps);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { item, containerProps } = this.props;
    const { results } = this.state;
    if (!isEqual(nextProps.item, item)) {
      this.updateResult(nextProps.item, containerProps);
      return true;
    }
    if (!isEqual(results, nextState.results)) {
      return true;
    }
    return false;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (!isEqual(nextProps.item, prevState.item)) {
      const { item } = nextProps;
      return {
        item,
      };
    }
    return null;
  }

  get routing() {
    return this.props.rootStore.routing;
  }

  async updateResult(item, containerProps) {
    const { actions, isAdminPage } = this.props;
    const { actionList, firstAction, moreActions } = getActionList(
      actions,
      item,
      containerProps
    );
    this.actionList = actionList;
    this.firstAction = firstAction;
    this.moreActions = moreActions;
    const results = await getAllowedResults({
      actions: this.actionList,
      data: item,
      key: 'action',
      containerProps,
      isAdminPage,
    });
    if (this._isMounted) {
      this.setState({ results });
    }
  }

  render() {
    const {
      item,
      onFinishAction,
      containerProps,
      firstActionClassName,
      onClickAction,
      onCancelAction,
      isWide,
      innerRef,
    } = this.props;

    const { results } = this.state;

    return (
      <div ref={innerRef}>
        <DropdownActionButton
          onFinishAction={onFinishAction}
          onCancelAction={onCancelAction}
          firstAction={this.firstAction}
          moreActions={this.moreActions}
          alloweds={results}
          item={item}
          routing={this.routing}
          containerProps={containerProps}
          firstActionClassName={firstActionClassName}
          onClickAction={onClickAction}
          isWide={isWide}
        />
      </div>
    );
  }
}

const InjectedItemActionButtons = inject('rootStore')(ItemActionButtonsInner);

export default forwardRef((props, ref) => (
  <InjectedItemActionButtons {...props} innerRef={ref} />
));
