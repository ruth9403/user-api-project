jest.mock("../../services/user.service");

const userController = require("../../controllers/user.controller");
const userService = require("../../services/user.service");
const { mockUsers } = require("../../mocks/user");
const geolocation = require("../../utils/geoLocation");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

afterEach(() => {
  jest.clearAllMocks();
});

beforeEach(() => {
  jest.clearAllMocks();
});

const mockNext = jest.fn();

describe("userController.getAllUsers", () => {
  it("should return all users with status 200", async () => {
    const users = mockUsers;
    userService.getAllUsers.mockResolvedValue(users);

    const req = {};
    const res = mockRes();

    await userController.getAllUsers(req, res, mockNext);

    expect(userService.getAllUsers).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(users);
  });

  it("should handle errors with next()", async () => {
    const error = new Error("DB failed");
    jest.spyOn(userService, "getAllUsers").mockRejectedValue(error);

    const req = {};
    const res = mockRes();

    await userController.getAllUsers(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(new Error("DB failed"));
  });
});

describe("userController.getUserById", () => {
  it("should return a user if found", async () => {
    const user = { id: 2, username: "Ana" };
    userService.getUserById.mockResolvedValue(user);

    const req = { params: { id: 2 } };
    const res = mockRes();

    await userController.getUserById(req, res, mockNext);

    expect(userService.getUserById).toHaveBeenCalledWith(2);
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it("should return 404 if user not found", async () => {
    const req = { params: { id: "999" } };
    const res = { json: jest.fn() };
    const next = jest.fn();
    jest.spyOn(userService, "getUserById").mockResolvedValue(null);

    await userController.getUserById(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found",
        statusCode: 404,
      })
    );
  });

  it("should call next on error", async () => {
    const error = new Error("Service error");
    userService.getUserById.mockRejectedValue(error);

    const req = { params: { id: "5" } };
    const res = mockRes();

    await userController.getUserById(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});

describe("userController.createUser", () => {
  it("should return 400 if required fields are missing", async () => {
    const req = { body: { username: "testuser" } }; // Missing email, password, latitude, longitude
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await userController.createUser(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Bad request, one or more of the following fields are missing: username, email, password, latitude, longitude",
        statusCode: 400,
      })
    );
  });

  it("should return 400 if coordinates are invalid", async () => {
    const req = {
      body: {
        username: "testuser",
        email: "testuser@example.com",
        password: "password",
        latitude: 200,
        longitude: 200,
      },
    }; // Invalid coordinates
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    // Mock the coordinate validation function to return false (invalid)
    jest.spyOn(geolocation, "isSouthOrNorth").mockResolvedValue(false);

    await userController.createUser(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Bad request, coordinates are invalid",
        statusCode: 400,
      })
    );
  });

  it("should create a user and return 201 with user details", async () => {
    const req = {
      body: {
        username: "testuser",
        email: "testuser@example.com",
        password: "password",
        latitude: 45,
        longitude: -73,
        browser_language: "en-US",
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    // Mock the coordinate validation to return a valid hemisphere
    jest.spyOn(geolocation, "isSouthOrNorth").mockResolvedValue("N");

    // Mock the service method
    jest.spyOn(userService, "createUser").mockResolvedValue();

    await userController.createUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: expect.any(String),
      username: "testuser",
      email: "testuser@example.com",
    });
  });

  it("should return 409 if username or email already exists", async () => {
    const req = {
      body: {
        username: "testuser",
        email: "testuser@example.com",
        password: "password",
        latitude: 45,
        longitude: -73,
        browser_language: "en-US",
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    // Mock the coordinate validation to return a valid hemisphere
    jest.spyOn(geolocation, "isSouthOrNorth").mockResolvedValue(false);

    // Mock the service method to throw a UNIQUE constraint error
    jest
      .spyOn(userService, "createUser")
      .mockRejectedValue(new Error("UNIQUE constraint failed: user.username"));

    await userController.createUser(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Username or email already exists",
        statusCode: 409,
      })
    );
  });

  it("should handle other errors and pass them to next", async () => {
    const req = {
      body: {
        username: "testuser",
        email: "testuser@example.com",
        password: "password",
        latitude: 45,
        longitude: -73,
        browser_language: "en-US",
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    // Mock the coordinate validation to return a valid hemisphere
    jest.spyOn(geolocation, "isSouthOrNorth").mockResolvedValue("N");

    // Mock the service method to throw an unknown error
    jest
      .spyOn(userService, "createUser")
      .mockRejectedValue(new Error("Some unknown error"));

    await userController.createUser(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("userController.deleteUser", () => {
  const res = { json: jest.fn() };
  const next = jest.fn();

  it("should delete user and return success message", async () => {
    const req = { params: { id: "1" } };
    const res = { json: jest.fn() };
    const next = jest.fn();
    const user = { id: "1", username: "test" };

    jest
      .spyOn(userService, "searchForUser")
      .mockResolvedValue({ user, source: "db" });
    const deleteSpy = jest.spyOn(userService, "deleteUser").mockResolvedValue();

    await userController.deleteUser(req, res, next);

    expect(deleteSpy).toHaveBeenCalledWith("1", "db");
    expect(res.json).toHaveBeenCalledWith({
      id: "1",
      message: "User deleted successfully",
    });
  });

  it("should return 404 if user not found", async () => {
    const req = { params: { id: "99" } };
    jest.spyOn(userService, "searchForUser").mockResolvedValue({ user: null });

    await userController.deleteUser(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found",
        statusCode: 404,
      })
    );
  });

  it("should handle unknown errors", async () => {
    const req = { params: { id: "1" } };
    jest
      .spyOn(userService, "searchForUser")
      .mockRejectedValue(new Error("Unknown"));

    await userController.deleteUser(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("userController.updateUser", () => {
  const res = { json: jest.fn() };
  const next = jest.fn();

  it("should update user and return result", async () => {
    const req = {
      params: { id: "1" },
      body: { username: "updated", latitude: 10, longitude: 20 },
    };
    const user = { id: "1", username: "test", latitude: 0, longitude: 0 };

    jest
      .spyOn(userService, "searchForUser")
      .mockResolvedValue({ user, source: "db" });
    jest
      .spyOn(userService, "updateUser")
      .mockResolvedValue({ id: "1", username: "updated" });
    jest.spyOn(geolocation, "isSouthOrNorth").mockResolvedValue("N");

    await userController.updateUser(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ id: "1", username: "updated" });
  });

  it("should return 404 if user not found", async () => {
    const req = { params: { id: "2" }, body: {} };
    jest.spyOn(userService, "searchForUser").mockResolvedValue({ user: null });

    await userController.updateUser(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "User not found",
        statusCode: 404,
      })
    );
  });

  it("should handle unique constraint error", async () => {
    const req = {
      params: { id: "1" },
      body: { username: "dup", latitude: 10, longitude: 20 },
    };
    const user = { id: "1", username: "test", latitude: 0, longitude: 0 };

    jest
      .spyOn(userService, "searchForUser")
      .mockResolvedValue({ user, source: "db" });
    jest
      .spyOn(userService, "updateUser")
      .mockRejectedValue(new Error("UNIQUE constraint failed"));
    jest.spyOn(geolocation, "isSouthOrNorth").mockResolvedValue("N");

    await userController.updateUser(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Username or email already exists",
        statusCode: 409,
      })
    );
  });

  it("should handle unknown errors", async () => {
    const req = { params: { id: "1" }, body: {} };
    jest
      .spyOn(userService, "searchForUser")
      .mockRejectedValue(new Error("Unknown"));

    await userController.updateUser(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
