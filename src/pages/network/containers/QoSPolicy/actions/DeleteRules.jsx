import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalQoSPolicyStore from 'stores/neutron/qos-policy';
import {
  getRuleDirectionLabel,
  getRuleTypeLabel,
  getRuleDetail,
} from '../utils/label';

export class DeleteRules extends ModalAction {
  static id = 'delete-rules';

  static title = t('Delete Rules');

  static buttonText = t('Delete Rules');

  static isDanger = true;

  static allowed = (item) => Promise.resolve((item.rules || []).length > 0);

  static get modalSize() {
    return 'middle';
  }

  get isAsyncAction() {
    return true;
  }

  get ruleData() {
    const { rules = [] } = this.item;
    return rules.map((rule) => ({
      ...rule,
      key: rule.id,
    }));
  }

  get defaultValue() {
    return {
      rules: {
        selectedRowKeys: [],
        selectedRows: [],
      },
    };
  }

  get tips() {
    return 'Changes will immediately affect all attached ports';
  }

  get formItems() {
    return [
      {
        name: 'rules',
        label: t('Rules'),
        type: 'select-table',
        data: this.ruleData,
        isMulti: true,
        canSearch: false,
        required: true,
        columns: [
          {
            title: t('Type'),
            dataIndex: 'type',
            render: (value) => getRuleTypeLabel(value),
          },
          {
            title: t('Direction'),
            dataIndex: 'direction',
            render: (value) => getRuleDirectionLabel(value),
          },
          {
            title: t('Details'),
            dataIndex: 'detail',
            render: (_, record) => getRuleDetail(record),
          },
        ],
      },
    ];
  }

  onValuesChange = (changedFields, allFields) => {
    const selectedRowKeys =
      (((allFields || {}).rules || {}).selectedRowKeys || []).length > 0;
    const { onModalActionFormChange } = this.props;
    if (onModalActionFormChange) {
      onModalActionFormChange(!selectedRowKeys);
    }
  };

  onSubmit = async (values) => {
    const selectedRules = (values.rules && values.rules.selectedRows) || [];
    const { id } = this.item;

    const promises = selectedRules.map((rule) => {
      if (rule.type === 'dscp_marking') {
        return globalQoSPolicyStore.deleteDSCPMarkingRules({ id }, rule.id);
      }
      if (rule.type === 'bandwidth_limit') {
        return globalQoSPolicyStore.deleteBandwidthLimitRules({ id }, rule.id);
      }
      return Promise.resolve();
    });
    return Promise.all(promises);
  };
}

export default inject('rootStore')(observer(DeleteRules));
