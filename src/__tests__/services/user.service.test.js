import { jest } from "@jest/globals";
import {
  HEMISPHERE_NORTH,
  HEMISPHERE_SOUTH,
  DATA_SOURCE_DB,
  DATA_SOURCE_API,
} from "../../config/constants.js";

const mockDbService = {
  getUserById: jest.fn(),
  getAllUsers: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

const mockApiService = {
  fetchSingleUser: jest.fn(),
  fetchAllUsers: jest.fn(),
  insertUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

// Mock antes del import
jest.unstable_mockModule("../../services/db.service.js", () => ({
  DbService: jest.fn(() => mockDbService),
}));

jest.unstable_mockModule("../../services/southernUsersApi.service.js", () => ({
  SouthernUsersApiService: jest.fn(() => mockApiService),
}));

let userService;
let dbService;
let apiService;

beforeEach(async () => {
  dbService = mockDbService;
  apiService = mockApiService;

  const { UserService } = await import("../../services/user.service.js");
  userService = new UserService(apiService, dbService);
});

afterEach(() => {
  jest.clearAllMocks();
});

const mockUser = {
  id: "124",
  username: "mockUser",
  email: "mock@example.com",
  latitude: 40,
  longitude: -73,
};

const mockUserSouth = {
  id: "124",
  username: "mockUserSouth",
  email: "south@example.com",
  latitude: -40,
  longitude: -73,
};

describe("userService.searchForUser", () => {
  it("should return user from db if found", async () => {
    dbService.getUserById.mockResolvedValue(mockUser);
    apiService.fetchSingleUser.mockResolvedValue(undefined);

    const result = await userService.searchForUser(124);
    expect(result).toEqual({
      user: mockUser,
      source: DATA_SOURCE_DB,
    });
  });

  it("should return user from api if db not found", async () => {
    dbService.getUserById.mockResolvedValue(undefined);
    apiService.fetchSingleUser.mockResolvedValue(mockUserSouth);

    const result = await userService.searchForUser(124);
    expect(result).toEqual({
      user: mockUserSouth,
      source: DATA_SOURCE_API,
    });
  });

  it("should return undefined if no user found", async () => {
    dbService.getUserById.mockResolvedValue(undefined);
    apiService.fetchSingleUser.mockResolvedValue(undefined);

    const result = await userService.searchForUser(3);
    expect(result).toEqual({ user: undefined });
  });
});

describe("userService.getAllUsers", () => {
  it("should combine and sort users from both sources", async () => {
    dbService.getAllUsers.mockResolvedValue([mockUser]);
    apiService.fetchAllUsers.mockResolvedValue([mockUserSouth]);

    const result = await userService.getAllUsers();
    expect(result).toEqual([mockUser, mockUserSouth]);
  });
});

describe("userService.getUserById", () => {
  it("should return user from searchForUser", async () => {
    jest
      .spyOn(userService, "searchForUser")
      .mockResolvedValue({ user: mockUser });

    const result = await userService.getUserById(124);
    expect(result).toEqual(mockUser);
  });
});

describe("userService.createUser", () => {
  it("should call dbService.createUser for northern hemisphere", async () => {
    dbService.createUser.mockResolvedValue(mockUser);

    const result = await userService.createUser(mockUser, HEMISPHERE_NORTH);

    expect(dbService.createUser).toHaveBeenCalledWith(mockUser);
    expect(apiService.insertUser).not.toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  it("should call apiService.insertUser for southern hemisphere", async () => {
    apiService.insertUser.mockResolvedValue(mockUserSouth);

    const result = await userService.createUser(
      mockUserSouth,
      HEMISPHERE_SOUTH
    );

    expect(apiService.insertUser).toHaveBeenCalledWith(mockUserSouth);
    expect(dbService.createUser).not.toHaveBeenCalled();
    expect(result).toEqual(mockUserSouth);
  });
});

describe("userService.updateUser", () => {
  const id = 1;
  const userData = {
    username: "updatedUser",
    email: "updated@example.com",
  };

  it("should migrate from API to DB when hemisphere changes to N", async () => {
    dbService.createUser.mockResolvedValue({ ...userData, id });
    apiService.deleteUser.mockResolvedValue();

    const result = await userService.updateUser(
      id,
      userData,
      DATA_SOURCE_API,
      HEMISPHERE_NORTH
    );

    expect(dbService.createUser).toHaveBeenCalledWith({ id, ...userData });
    expect(apiService.deleteUser).toHaveBeenCalledWith(id);
    expect(result).toEqual({ id, ...userData });
  });

  it("should migrate from DB to API when hemisphere changes to S", async () => {
    apiService.insertUser.mockResolvedValue({ ...userData, id });
    dbService.deleteUser.mockResolvedValue();

    const result = await userService.updateUser(
      id,
      userData,
      DATA_SOURCE_DB,
      HEMISPHERE_SOUTH
    );

    expect(apiService.insertUser).toHaveBeenCalledWith({ id, ...userData });
    expect(dbService.deleteUser).toHaveBeenCalledWith(id);
    expect(result).toEqual({ id, ...userData });
  });

  it("should update user in DB when staying in North", async () => {
    dbService.updateUser.mockResolvedValue({ ...userData, id });

    const result = await userService.updateUser(
      id,
      userData,
      DATA_SOURCE_DB,
      HEMISPHERE_NORTH
    );

    expect(dbService.updateUser).toHaveBeenCalledWith(id, userData);
    expect(result).toEqual({ id, ...userData });
  });

  it("should update user via API when staying in South", async () => {
    apiService.updateUser.mockResolvedValue({ ...userData, id });

    const result = await userService.updateUser(
      id,
      userData,
      DATA_SOURCE_API,
      HEMISPHERE_SOUTH
    );

    expect(apiService.updateUser).toHaveBeenCalledWith(id, userData);
    expect(result).toEqual({ id, ...userData });
  });
});

describe("userService.deleteUser", () => {
  it("should delete user from DB if source is 'db'", async () => {
    dbService.deleteUser.mockResolvedValue(true);

    await userService.deleteUser(1, "db");

    expect(dbService.deleteUser).toHaveBeenCalledWith(1);
    expect(apiService.deleteUser).not.toHaveBeenCalled();
  });

  it("should delete user from API if source is not 'db'", async () => {
    apiService.deleteUser.mockResolvedValue(true);

    await userService.deleteUser(2, DATA_SOURCE_API);

    expect(apiService.deleteUser).toHaveBeenCalledWith(2);
    expect(dbService.deleteUser).not.toHaveBeenCalled();
  });
});
