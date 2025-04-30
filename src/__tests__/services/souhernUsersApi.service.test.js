const apiService = require('../../services/southernUsersApi.service');
const { mockUsers } = require('../../mocks/user');

jest.useFakeTimers();

afterEach(() => {
  jest.clearAllMocks();
});

describe('southernUsersApi.service', () => {

  describe('insertUser', () => {
    it('should resolve with the first mock user', async () => {
      const promise = apiService.insertUser({ username: 'test' });

      jest.advanceTimersByTime(1000);
      const result = await promise;

      expect(result).toEqual(mockUsers[0]);
    });
  });

  describe('fetchAllUsers', () => {
    it('should return all mock users', async () => {
      const promise = apiService.fetchAllUsers();

      jest.advanceTimersByTime(1000);
      const result = await promise;

      expect(result).toEqual(mockUsers);
    });
  });

  describe('fetchSingleUser', () => {
    it('should return the user with the given ID', async () => {
      const user = mockUsers[0];
      const promise = apiService.fetchSingleUser(user.id);

      jest.advanceTimersByTime(1000);
      const result = await promise;

      expect(result).toEqual(user);
    });

    it('should return undefined for nonexistent ID', async () => {
      const promise = apiService.fetchSingleUser(999);

      jest.advanceTimersByTime(1000);
      const result = await promise;

      expect(result).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('should resolve with the first mock user', async () => {
      const promise = apiService.updateUser(1, { username: 'updated' });

      jest.advanceTimersByTime(1000);
      const result = await promise;

      expect(result).toEqual(mockUsers[0]);
    });
  });

  describe('deleteUser', () => {
    it('should resolve with the first mock user', async () => {
      const promise = apiService.deleteUser(1);

      jest.advanceTimersByTime(1000);
      const result = await promise;

      expect(result).toEqual(mockUsers[0]);
    });
  });
});
