import httpRequest from 'client/client/request';
import { PortStore } from './port-extension';

const port = (id, ip) => ({
  id,
  name: id,
  network_id: 'net-1',
  fixed_ips: [{ ip_address: ip, subnet_id: 'subnet-1' }],
});
const A = port('port-a', '10.0.0.10');
const B = port('port-b', '10.0.0.11');

// Mock at the HTTP layer; `list` is what /extension/ports returns.
const mockHttp = (list) =>
  jest.spyOn(httpRequest.request, 'get').mockImplementation((url, params) => {
    if (url.endsWith('extension/ports')) {
      return Promise.resolve({ ports: list });
    }
    if (url.endsWith('floatingips')) {
      const fip = { floating_ip_address: `fip-of-${params.fixed_ip_address}` };
      return Promise.resolve({ floatingips: [fip] });
    }
    const match = url.match(/ports\/([^/]+)$/);
    if (match) {
      return Promise.resolve({ port: port(match[1], '10.0.0.10') });
    }
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });

describe('PortStore detail, through the real request path', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('binds the opened port, not the first row of the list', async () => {
    mockHttp([B, A]);
    const detail = await new PortStore().fetchDetail({ id: A.id });
    expect(detail.itemInList.id).toBe(A.id);
    expect(detail.itemInList.associatedDetail).toEqual([
      { floating_ip_address: 'fip-of-10.0.0.10' },
    ]);
  });

  it('does not throw on an empty list, and keeps the opened port (cubecos#2038)', async () => {
    mockHttp([]);
    const detail = await new PortStore().fetchDetail({ id: A.id });
    expect(detail.id).toBe(A.id);
    expect(detail.itemInList.id).toBe(A.id);
    expect(detail.itemInList.associatedDetail).toEqual([
      { floating_ip_address: 'fip-of-10.0.0.10' },
    ]);
  });

  it('binds by id even if the rows were not narrowed to the uuid', async () => {
    mockHttp([]);
    jest.spyOn(PortStore.prototype, 'fetchList').mockResolvedValue([B, A]);
    const detail = await new PortStore().fetchDetail({ id: A.id });
    expect(detail.itemInList.id).toBe(A.id);
  });
});
