import httpRequest from 'client/client/request';
import { ServerGroupInstanceStore } from './server-group-instance';

const A = { id: 'server-a', name: 'vm-a' };
const B = { id: 'server-b', name: 'vm-b' };
const C = { id: 'server-c', name: 'vm-c' };

describe('ServerGroupInstanceStore, through the real request path', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists each member once, and no server outside the group', async () => {
    // Like nova for a member: `uuid` is ignored, every call returns the
    // whole project.
    jest
      .spyOn(httpRequest.request, 'get')
      .mockResolvedValue({ servers: [B, A, C] });
    const result = await new ServerGroupInstanceStore().fetchList({
      members: [A.id, C.id],
      isServerGroup: true,
    });
    expect(result.map((it) => it.id)).toEqual([A.id, C.id]);
  });
});
