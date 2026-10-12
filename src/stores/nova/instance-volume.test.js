import httpRequest from 'client/client/request';
import { InstanceVolumeStore } from './instance-volume';

// The volume mapper's resources module loads a UI component that reads a
// webpack global; the mapper itself does not need it.
jest.mock('components/ImportStatus', () => () => null);

const volume = (id) => ({ id, name: id, attachments: [] });

describe('InstanceVolumeStore, through the real request path', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists only the volumes attached to the instance', async () => {
    jest.spyOn(httpRequest.request, 'get').mockImplementation((url) => {
      if (url.endsWith('servers/server-a/os-volume_attachments')) {
        return Promise.resolve({
          volumeAttachments: [{ volumeId: 'vol-1' }, { volumeId: 'vol-2' }],
        });
      }
      if (url.endsWith('extension/volumes')) {
        // An API that ignored the `uuid` filter: the whole project.
        return Promise.resolve({
          volumes: [volume('vol-9'), volume('vol-2'), volume('vol-1')],
        });
      }
      return Promise.reject(new Error(`unexpected GET ${url}`));
    });
    const result = await new InstanceVolumeStore().fetchList({
      serverId: 'server-a',
    });
    expect(result.map((it) => it.id)).toEqual(['vol-2', 'vol-1']);
  });
});
