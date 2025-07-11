import { jest } from '@jest/globals';

const mockClient = {
  all: jest.fn(),
  get: jest.fn(),
  run: jest.fn(),
  close: jest.fn(),
};

// Mock del módulo entero
await jest.unstable_mockModule('../../../lib/db.js', () => ({
  SQLiteDb: class {
    getClient = jest.fn().mockResolvedValue(mockClient);
  },
}));

// Ahora importa después del mock
const { DbService } = await import('../../services/db.service.js');

afterEach(() => {
  jest.clearAllMocks();
});

describe('DbService', () => {

  let dbService;

  beforeEach(() => {
    dbService = new DbService();
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [{ id: 1 }, { id: 2 }];
      mockClient.all.mockResolvedValue(mockUsers);
      
      const result = await dbService.getAllUsers();

      expect(mockClient.all).toHaveBeenCalledWith("SELECT * FROM user");
      expect(mockClient.close).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = { id: 1 };
      mockClient.get.mockResolvedValue(mockUser);
      const result = await dbService.getUserById(1);

      expect(mockClient.get).toHaveBeenCalledWith("SELECT * FROM user WHERE id = ?", [1]);
      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('should insert user and return result', async () => {
      const userData = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        password: 'secret',
        latitude: 50,
        longitude: -70,
        browser_language: 'en-US'
      };

      const mockResult = { lastID: 1 };
      mockClient.run.mockResolvedValue(mockResult);

      const result = await dbService.createUser(userData);

      expect(mockClient.run).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO user'), Object.values(userData));
      expect(result).toEqual(mockResult);
    });
  });

  describe('updateUser', () => {
    it('should update user and return result', async () => {
      const userData = {
        username: 'newname',
        email: 'new@example.com'
      };
      const id = 1;
      const mockResult = { changes: 1 };

      mockClient.run.mockResolvedValue(mockResult);
      const result = await dbService.updateUser(id, userData);

      expect(mockClient.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user SET'),
        [...Object.values(userData), id]
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return true if changes > 0', async () => {
      mockClient.run.mockResolvedValue({ changes: 1 });

      const result = await dbService.deleteUser(1);

      expect(mockClient.run).toHaveBeenCalledWith("DELETE FROM user WHERE id = ?", [1]);
      expect(result).toBe(true);
    });

    it('should return false if no changes', async () => {
      mockClient.run.mockResolvedValue({ changes: 0 });

      const result = await dbService.deleteUser(99);

      expect(result).toBe(false);
    });
  });
});
