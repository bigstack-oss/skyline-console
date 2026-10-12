import httpRequest from 'client/client/request';
import { SnapshotVolumeStore } from './snapshot-volume';

// The volume mapper's resources module loads a UI component that reads a
// webpack global; the mapper itself does not need it.
jest.mock('components/ImportStatus', () => () => null);

const volume = (id) => ({ id, name: id, attachments: [] });

describe('SnapshotVolumeStore, through the real request path', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists only the requested volumes', async () => {
    // An API that ignored the `uuid` filter: the whole project.
    jest.spyOn(httpRequest.request, 'get').mockResolvedValue({
      volumes: [volume('vol-9'), volume('vol-1')],
    });
    const result = await new SnapshotVolumeStore().fetchList({
      volumeIds: ['vol-1'],
    });
    expect(result.map((it) => it.id)).toEqual(['vol-1']);
  });
});
