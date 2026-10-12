import httpRequest from 'client/client/request';
import { CinderClient } from 'client/cinder';
import { SnapshotStore } from './snapshot';

const A = { id: 'snap-a', volume_name: 'vol-a', child_volumes: ['child-a'] };
const B = { id: 'snap-b', volume_name: 'vol-b', child_volumes: ['child-b'] };

// Mock at the HTTP layer; `list` is what /extension/volume_snapshots returns.
const mockHttp = (list) => {
  // Tests have no keystone catalog; enable the cinder client.
  jest.spyOn(CinderClient.prototype, 'enable', 'get').mockReturnValue(true);
  jest.spyOn(httpRequest.request, 'get').mockImplementation((url) => {
    if (url.endsWith('extension/volume_snapshots')) {
      return Promise.resolve({ volume_snapshots: list, count: list.length });
    }
    const match = url.match(/snapshots\/([^/]+)$/);
    if (match) {
      return Promise.resolve({ snapshot: { id: match[1], name: 'shown' } });
    }
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
};

describe('SnapshotStore detail, through the real request path', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows the opened snapshot's volume and child volumes, not the first row's", async () => {
    mockHttp([B, A]);
    const detail = await new SnapshotStore().fetchDetail({ id: A.id });
    expect(detail.volume_name).toBe('vol-a');
    expect(detail.child_volumes).toEqual(['child-a']);
  });

  it('shows none when the list does not hold the snapshot', async () => {
    mockHttp([B]);
    const detail = await new SnapshotStore().fetchDetail({ id: A.id });
    expect(detail.id).toBe(A.id);
    expect(detail.volume_name).toBeUndefined();
    expect(detail.child_volumes).toEqual([]);
  });
});
