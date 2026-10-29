import React, { Component } from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import TabSelectTable from './index';

jest.mock('components/FormItem/SelectTable', () => {
  const SelectTable = () => null;
  return {
    __esModule: true,
    default: SelectTable,
    renderClearButton: () => null,
  };
});

// Like NetworkSelectTable#networkTabs: a new array with new render closures on every call.
const buildTabs = (keys = ['project', 'shared', 'external']) =>
  keys.map((key) => ({
    key,
    title: key,
    props: { columns: [{ dataIndex: 'name', render: (v) => v }] },
  }));

// Acts like Form.Item + NetworkSelectTable: holds the value and rebuilds tabs on each render.
class Harness extends Component {
  constructor(props) {
    super(props);
    this.state = { value: props.value };
  }

  onChange = (value) => {
    const { onChange } = this.props;
    if (onChange) {
      onChange(value);
    }
    this.setState({ value });
  };

  render() {
    const { tabKeys } = this.props;
    const { value } = this.state;
    return (
      <TabSelectTable
        tabs={buildTabs(tabKeys)}
        value={value}
        onChange={this.onChange}
        isMulti
      />
    );
  }
}

const setup = (props = {}) => {
  const wrapper = mount(<Harness {...props} />);
  const table = () => wrapper.find(TabSelectTable).instance();
  const run = (fn) => {
    act(() => {
      fn(table());
    });
    wrapper.update();
  };
  return { wrapper, table, run };
};

const row = { id: 'net-1', name: 'public' };
const tick = (it) =>
  it.onSelectTableChange({
    selectedRowKeys: [row.id],
    selectedRows: [row],
    data: [row],
  });

describe('TabSelectTable', () => {
  it('keeps the clicked tab when the parent re-renders with rebuilt tabs', () => {
    const { wrapper, table, run } = setup();
    expect(table().state.tabKey).toBe('project');

    run((it) => it.handleChangeTab('shared'));
    act(() => {
      wrapper.setProps({});
    });

    expect(table().state.tabKey).toBe('shared');
  });

  it('keeps the tab and the selection when a row is ticked after a tab change', () => {
    const onChange = jest.fn();
    const { table, run } = setup({ onChange });

    run((it) => it.handleChangeTab('shared'));
    run(tick);

    expect(table().state.tabKey).toBe('shared');
    expect(onChange).toHaveBeenLastCalledWith({
      tab: 'shared',
      selectedRowKeys: [row.id],
      selectedRows: [row],
    });

    run((it) => it.handleChangeTab('project'));
    expect(table().state.tabKey).toBe('project');
    expect(table().state.selectedRowKeys).toEqual([row.id]);
  });

  it('still follows a tab set from outside through value.tab', () => {
    const { wrapper, table } = setup();

    act(() => {
      wrapper.setState({
        value: { tab: 'external', selectedRowKeys: ['p-1'], selectedRows: [] },
      });
    });

    expect(table().state.tabKey).toBe('external');
    expect(table().state.selectedRowKeys).toEqual(['p-1']);
  });

  it('falls back to the first tab when the current tab disappears', () => {
    const { wrapper, table, run } = setup();
    run((it) => it.handleChangeTab('external'));

    act(() => {
      wrapper.setProps({ tabKeys: ['project', 'shared'] });
    });

    expect(table().state.tabKey).toBe('project');
  });
});
