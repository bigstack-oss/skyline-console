import httpRequest from 'client/client/request';
import { CinderClient } from 'client/cinder';
import { VolumeStore } from './volume';

// The volume mapper's resources module loads a UI component that reads a
// webpack global; the mapper itself does not need it.
jest.mock('components/ImportStatus', () => () => null);

const attachedTo = (serverId) => [{ server_id: serverId, device: '/dev/vdb' }];
const A = { id: 'volume-a', name: 'vol-a', attachments: attachedTo('vm-a') };
const B = { id: 'volume-b', name: 'vol-b', attachments: attachedTo('vm-b') };

// Mock at the HTTP layer. `list` is what /extension/volumes returns; the
// tests that pass [B, A] model an API that ignored the `uuid` filter.
const mockHttp = (list) => {
  // Tests have no keystone catalog; enable the cinder client.
  jest.spyOn(CinderClient.prototype, 'enable', 'get').mockReturnValue(true);
  return jest.spyOn(httpRequest.request, 'get').mockImplementation((url) => {
    if (url.endsWith('extension/volumes')) {
      return Promise.resolve({ volumes: list, count: list.length });
    }
    const match = url.match(/volumes\/([^/]+)$/);
    if (match) {
      return Promise.resolve({ volume: { id: match[1], name: 'shown' } });
    }
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
};

describe('VolumeStore detail, through the real request path', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('binds the opened volume and its attachments, not the first row', async () => {
    mockHttp([B, A]);
    const detail = await new VolumeStore().fetchDetail({ id: A.id });
    expect(detail.itemInList.id).toBe(A.id);
    expect(detail.attachmentsContrib).toEqual(A.attachments);
  });

  it('binds nothing, without throwing, when the list does not hold it', async () => {
    mockHttp([B]);
    const detail = await new VolumeStore().fetchDetail({ id: A.id });
    expect(detail.id).toBe(A.id);
    expect(detail.itemInList).toBeUndefined();
    expect(detail.attachmentsContrib).toBeUndefined();
  });
});
