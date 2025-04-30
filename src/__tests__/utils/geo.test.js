const { isSouthOrNorth } = require('../../utils/geoLocation');
describe('isSouthOrNorth', () => {
  it('should return "N" for positive latitude', async () => {
    const result = await isSouthOrNorth(40.7128, -74.006);
    expect(result).toBe("N");
  });

  it('should return "S" for negative latitude', async () => {
    expect(await isSouthOrNorth(-33.8688, 151.2093)).toBe("S");
  });

  it('should throw error on invalid input', async () => {
    await expect(isSouthOrNorth("abc", 10)).rejects.toThrow("Bad request, coordinates are invalid");
  });
});