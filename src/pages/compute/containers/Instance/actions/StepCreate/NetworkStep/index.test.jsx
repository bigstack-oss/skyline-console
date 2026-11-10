import { NetworkStep } from './index';

// The real Form base and NetworkSelect pull in webpack-only imports (loader
// syntax, images) that jest cannot load. formItems needs neither.
jest.mock('components/Form', () => class Form {});
jest.mock('components/FormItem/NetworkSelect', () => () => null);

const PROJECT_ID = 'project-1';
const defaultGroup = { id: 'sg-default', name: 'default' };
const page1 = ['NMS', 'AD_Service', 'vrrp', 'OWASP', 'Nexus'].map((name) => ({
  id: `sg-${name}`,
  name,
}));
const page2 = [{ id: 'sg-MGNT', name: 'MGNT-Only' }, defaultGroup];

// Build the step without mounting it: formItems only reads state, stores,
// and the current project.
const createStep = (tablePage) => {
  const step = Object.create(NetworkStep.prototype);
  Object.defineProperty(step, 'currentProjectId', { value: PROJECT_ID });
  step.state = {
    networkSelectRows: [{ id: 'net-1', port_security_enabled: true }],
    portSelectRows: [],
  };
  step.setState = (partial) => Object.assign(step.state, partial);
  step.securityGroupStore = {
    list: { data: tablePage },
    fetchList: jest.fn(),
  };
  step.defaultSecurityGroupStore = {
    fetchList: jest.fn().mockResolvedValue([defaultGroup]),
  };
  return step;
};

const securityGroupInitValue = (step) =>
  step.formItems.find((it) => it.name === 'securityGroup').initValue;

describe('NetworkStep security group default (cubecos#1444)', () => {
  it('keeps initValue when the table moves to another page', async () => {
    const step = createStep(page1);
    if (step.fetchDefaultSecurityGroup) {
      await step.fetchDefaultSecurityGroup();
    }
    const onPage1 = securityGroupInitValue(step);
    expect(onPage1).toEqual({
      selectedRowKeys: ['sg-default'],
      selectedRows: [defaultGroup],
    });

    step.securityGroupStore.list.data = page2;
    const onPage2 = securityGroupInitValue(step);

    step.securityGroupStore.list.data = page1;
    const backOnPage1 = securityGroupInitValue(step);

    expect(onPage2).toEqual(onPage1);
    expect(backOnPage1).toEqual(onPage1);
  });

  it('preselects default with its row even when it is not on the first page', async () => {
    const step = createStep(page1);
    if (step.fetchDefaultSecurityGroup) {
      await step.fetchDefaultSecurityGroup();
    }

    expect(securityGroupInitValue(step)).toEqual({
      selectedRowKeys: ['sg-default'],
      selectedRows: [defaultGroup],
    });
  });

  it('looks up default by name and project without touching the table store', async () => {
    const step = createStep(page1);
    expect(step.fetchDefaultSecurityGroup).toBeInstanceOf(Function);
    await step.fetchDefaultSecurityGroup();

    expect(step.defaultSecurityGroupStore.fetchList).toHaveBeenCalledWith({
      name: 'default',
      project_id: PROJECT_ID,
    });
    expect(step.securityGroupStore.fetchList).not.toHaveBeenCalled();
  });

  it('preselects nothing when the project has no default group', async () => {
    const step = createStep(page2);
    step.defaultSecurityGroupStore.fetchList.mockResolvedValue([]);
    if (step.fetchDefaultSecurityGroup) {
      await step.fetchDefaultSecurityGroup();
    }

    expect(securityGroupInitValue(step)).toBeUndefined();
  });
});
