import axios from 'axios';
import httpRequest from 'client/client/request';
import { CinderClient } from 'client/cinder';
import { cosApiClientV1 } from 'src/apis/cosApi';
import { CosVolumeStore } from './volume';

// The volume mapper's resources module loads a UI component that reads a
// webpack global; the mapper itself does not need it.
jest.mock('components/ImportStatus', () => () => null);

const attachedTo = (serverId) => [{ server_id: serverId, device: '/dev/vdb' }];
const A = { id: 'volume-a', name: 'vol-a', attachments: attachedTo('vm-a') };
const B = { id: 'volume-b', name: 'vol-b', attachments: attachedTo('vm-b') };
const cos = ({ id, name }) => ({ id, name, type: 'ceph', sizeMiB: 1024 });

// Mock at the HTTP layer: the cinder list (/extension/volumes), the cinder
// show, and the COS volume list, which is the whole project.
const mockHttp = (cinderList, cosList) => {
  // Tests have no keystone catalog; enable the cinder client.
  jest.spyOn(CinderClient.prototype, 'enable', 'get').mockReturnValue(true);
  jest.spyOn(httpRequest.request, 'get').mockImplementation((url) => {
    if (url.endsWith('extension/volumes')) {
      return Promise.resolve({ volumes: cinderList, count: cinderList.length });
    }
    const match = url.match(/volumes\/([^/]+)$/);
    if (match) {
      return Promise.resolve({ volume: { id: match[1], name: 'shown' } });
    }
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
  jest
    .spyOn(axios, 'get')
    .mockResolvedValue({ data: { data: [{ name: 'dc1', isLocal: true }] } });
  jest
    .spyOn(cosApiClientV1, 'get')
    .mockResolvedValue({ data: { data: { volumes: cosList } } });
};

describe('CosVolumeStore detail, through the real request path', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // mergeData walks the COS list and sets `id` only on rows that match a
  // cinder volume, so the first merged row is B without an id.
  it('binds the opened volume after mergeData, not the first COS row', async () => {
    mockHttp([A], [cos(B), cos(A)]);
    const detail = await new CosVolumeStore().fetchDetail({ id: A.id });
    expect(detail.itemInList.id).toBe(A.id);
    expect(detail.itemInList.volumeName).toBe(A.name);
    expect(detail.attachmentsContrib).toEqual(A.attachments);
  });

  it('binds the opened volume when cinder ignored the uuid filter', async () => {
    mockHttp([B, A], [cos(B), cos(A)]);
    const detail = await new CosVolumeStore().fetchDetail({ id: A.id });
    expect(detail.itemInList.id).toBe(A.id);
    expect(detail.attachmentsContrib).toEqual(A.attachments);
  });

  it('binds nothing, without throwing, when no row matches', async () => {
    mockHttp([], [cos(B)]);
    const detail = await new CosVolumeStore().fetchDetail({ id: A.id });
    expect(detail.id).toBe(A.id);
    expect(detail.itemInList).toBeUndefined();
    expect(detail.attachmentsContrib).toBeUndefined();
  });
});
