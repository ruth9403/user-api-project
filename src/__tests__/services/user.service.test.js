// Mock the dependencies
jest.mock("../../services/db.service");
jest.mock("../../services/southernUsersApi.service");

const userService = require("../../services/user.service");
const dbService = require("../../services/db.service");
const apiService = require("../../services/southernUsersApi.service");

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
      source: "db",
    });
  });

  it("should return user from api if db not found", async () => {
    dbService.getUserById.mockResolvedValue(undefined);
    apiService.fetchSingleUser.mockResolvedValue(mockUserSouth);

    const result = await userService.searchForUser(124);
    expect(result).toEqual({
      user: mockUserSouth,
      source: "api",
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

    const result = await userService.createUser(mockUser, "N");

    expect(dbService.createUser).toHaveBeenCalledWith(mockUser);
    expect(apiService.insertUser).not.toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  it("should call apiService.insertUser for southern hemisphere", async () => {
    apiService.insertUser.mockResolvedValue(mockUserSouth);

    const result = await userService.createUser(mockUserSouth, "S");

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

    const result = await userService.updateUser(id, userData, "api", "N");

    expect(dbService.createUser).toHaveBeenCalledWith({ id, ...userData });
    expect(apiService.deleteUser).toHaveBeenCalledWith(id);
    expect(result).toEqual({ id, ...userData });
  });

  it("should migrate from DB to API when hemisphere changes to S", async () => {
    apiService.insertUser.mockResolvedValue({ ...userData, id });
    dbService.deleteUser.mockResolvedValue();

    const result = await userService.updateUser(id, userData, "db", "S");

    expect(apiService.insertUser).toHaveBeenCalledWith({ id, ...userData });
    expect(dbService.deleteUser).toHaveBeenCalledWith(id);
    expect(result).toEqual({ id, ...userData });
  });

  it("should update user in DB when staying in North", async () => {
    dbService.updateUser.mockResolvedValue({ ...userData, id });

    const result = await userService.updateUser(id, userData, "db", "N");

    expect(dbService.updateUser).toHaveBeenCalledWith(id, userData);
    expect(result).toEqual({ id, ...userData });
  });

  it("should update user via API when staying in South", async () => {
    apiService.updateUser.mockResolvedValue({ ...userData, id });

    const result = await userService.updateUser(id, userData, "api", "S");

    expect(apiService.updateUser).toHaveBeenCalledWith(id, userData);
    expect(result).toEqual({ id, ...userData });
  });
});

describe("userService.deleteUser", () => {
  it("should delete user from DB if found", async () => {
    dbService.deleteUser.mockResolvedValue(true);
    await userService.deleteUser(1);
    expect(dbService.deleteUser).toHaveBeenCalledWith(1);
    expect(apiService.deleteUser).not.toHaveBeenCalled();
  });

  it("should delete user from API if not found in DB", async () => {
    dbService.deleteUser.mockResolvedValue(false);
    await userService.deleteUser(2);
    expect(apiService.deleteUser).toHaveBeenCalledWith(2);
  });
});
