import { ServerStore } from './instance';
import { RecycleBinStore } from '../skyline/recycle-server';

const A = { id: 'server-a-older', name: 'vm-a' };
const B = { id: 'server-b-newer', name: 'vm-b' };

describe('ServerStore.detailDidFetch', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // A non-admin's list ignores the uuid filter and comes back newest first.
  const mockList = (Store, list) =>
    jest.spyOn(Store.prototype, 'fetchList').mockResolvedValue(list);

  it('binds the opened server, not the top row of an unfiltered list', async () => {
    mockList(ServerStore, [B, A]);
    const item = await new ServerStore().detailDidFetch(
      { id: A.id },
      false,
      {}
    );
    expect(item.itemInList).toBe(A);
  });

  it('binds the opened server from the recycle bin list too', async () => {
    mockList(RecycleBinStore, [B, A]);
    const item = await new ServerStore().detailDidFetch({ id: A.id }, false, {
      isRecycleBinDetail: true,
    });
    expect(item.itemInList).toBe(A);
  });

  it('binds no server when the list does not hold the opened one', async () => {
    mockList(ServerStore, [B]);
    const item = await new ServerStore().detailDidFetch(
      { id: A.id },
      false,
      {}
    );
    expect(item.itemInList).toBeUndefined();
  });
});
