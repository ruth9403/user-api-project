
const { AppError } = require('../utils/error')

/**
 * Gets geolocation hemisphere
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string>} N if it is north, S if south or Error
 */
const isSouthOrNorth = (latitude, longitude) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (latitude >= 0 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
        resolve('N');
      } else if (latitude < 0 && latitude >= -90 && longitude >= -180 && longitude <= 180){
        resolve('S');
      } else {
        reject(new AppError('Bad request, coordinates are invalid', 400));
      }
    }, 700);
  });
 };

 module.exports = {
  isSouthOrNorth
 };
