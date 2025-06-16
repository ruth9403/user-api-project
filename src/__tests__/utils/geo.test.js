const { HEMISPHERE_NORTH, HEMISPHERE_SOUTH } = require('../../config/constants');
const { isSouthOrNorth } = require('../../utils/geoLocation');

describe('isSouthOrNorth', () => {
  it('should return HEMISPHERE_NORTH for positive latitude', async () => {
    const result = await isSouthOrNorth(40.7128, -74.006);
    expect(result).toBe(HEMISPHERE_NORTH);
  });

  it('should return "S" for negative latitude', async () => {
    expect(await isSouthOrNorth(-33.8688, 151.2093)).toBe(HEMISPHERE_SOUTH);
  });

  it('should throw error on invalid input', async () => {
    await expect(isSouthOrNorth("abc", 10)).rejects.toThrow("Bad request, coordinates are invalid");
  });
});