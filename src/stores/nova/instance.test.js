import httpRequest from 'client/client/request';
import { ServerStore } from './instance';

const show = (id, name, extra = {}) => ({
  id,
  name,
  status: 'ACTIVE',
  tenant_id: 'project-1',
  locked: false,
  image: { id: 'image-1' },
  flavor: { original_name: 'm1.tiny', vcpus: 1, ram: 512 },
  addresses: {
    net: [
      { addr: '10.0.0.5', 'OS-EXT-IPS:type': 'fixed' },
      { addr: '172.16.0.5', 'OS-EXT-IPS:type': 'floating' },
    ],
  },
  'OS-EXT-STS:vm_state': 'active',
  'OS-EXT-STS:task_state': null,
  'OS-EXT-SRV-ATTR:host': 'node-1',
  ...extra,
});

// The rows /extension/servers returns, newest first.
const row = (id, name) => ({ id, name, status: 'ACTIVE', origin_data: {} });

const A = { id: 'server-a-older', name: 'vm-a' };
const B = { id: 'server-b-newer', name: 'vm-b' };

// Mock at the HTTP layer: everything above it (client, store request path,
// guards, mappers) is the real code. Like nova for a member, the list
// endpoints ignore `uuid` and return the whole project.
const mockHttp = ({ servers = [], recycle = [] } = {}) =>
  jest.spyOn(httpRequest.request, 'get').mockImplementation((url) => {
    if (url.endsWith('extension/servers')) {
      return Promise.resolve({ servers });
    }
    if (url.endsWith('extension/recycle_servers')) {
      return Promise.resolve({ recycle_servers: recycle });
    }
    if (url.endsWith('images')) {
      return Promise.resolve({ images: [] });
    }
    const match = url.match(/servers\/([^/]+)$/);
    if (match) {
      const id = match[1];
      return Promise.resolve({ server: show(id, `name-${id}`) });
    }
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });

describe('ServerStore detail, through the real request path', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('binds the opened server, not the top row of an unfiltered list', async () => {
    mockHttp({ servers: [row(B.id, B.name), row(A.id, A.name)] });
    const detail = await new ServerStore().fetchDetail({ id: A.id });
    expect(detail.itemInList.id).toBe(A.id);
    expect(detail.itemInList.name).toBe(A.name);
    // The list row went through the store mapper.
    expect(detail.itemInList.status).toBe('active');
  });

  it('binds the opened server from the recycle bin list too', async () => {
    mockHttp({ recycle: [row(B.id, B.name), row(A.id, A.name)] });
    const detail = await new ServerStore().fetchDetail({
      id: A.id,
      isRecycleBinDetail: true,
    });
    expect(detail.itemInList.id).toBe(A.id);
    expect(detail.itemInList.name).toBe(A.name);
  });

  it('falls back to the show response when the list does not hold the server', async () => {
    // e.g. the server is older than the first `max_limit` (1000) rows.
    mockHttp({ servers: [row(B.id, B.name)] });
    const detail = await new ServerStore().fetchDetail({ id: A.id });
    const { itemInList } = detail;
    expect(itemInList.id).toBe(A.id);
    expect(itemInList.name).toBe(`name-${A.id}`);
    expect(itemInList.status).toBe('active');
    expect(itemInList.vm_state).toBe('active');
    expect(itemInList.locked).toBe(false);
    expect(itemInList.host).toBe('node-1');
    expect(itemInList.image).toBe('image-1');
    expect(itemInList.flavor).toBe('m1.tiny');
    expect(itemInList.fixed_addresses).toEqual(['10.0.0.5']);
    expect(itemInList.floating_addresses).toEqual(['172.16.0.5']);
  });

  it('falls back to the show response when the list request fails', async () => {
    mockHttp();
    jest
      .spyOn(ServerStore.prototype, 'pureFetchList')
      .mockRejectedValue(new Error('500'));
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const detail = await new ServerStore().fetchDetail({ id: A.id });
    expect(detail.itemInList.id).toBe(A.id);
  });

  it('leaves the store list alone and maps only the bound row', async () => {
    mockHttp({ servers: [row(B.id, B.name), row(A.id, A.name)] });
    const store = new ServerStore();
    const fetchList = jest.spyOn(store, 'fetchList');
    const listDidFetch = jest.spyOn(store, 'listDidFetch');
    await store.fetchDetail({ id: A.id });
    expect(fetchList).not.toHaveBeenCalled();
    expect(store.list.data).toEqual([]);
    expect(listDidFetch).toHaveBeenCalledTimes(1);
    expect(listDidFetch.mock.calls[0][0].map((it) => it.id)).toEqual([A.id]);
  });
});
