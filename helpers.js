/////////////////////////////////////////////////////////////////////////////////
// Helper functions
/////////////////////////////////////////////////////////////////////////////////

const generateRandomString = function () {
  let result = "";
  const characters = "ABCDEFHIJKLMNOPQRSTUVWXYSabcdefghijklmnopqrstuvwxyz1234567890";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  } return result;
};

const getUserByEmail = function (email, database) {
  const userInfo = Object.values(database);
  const specificUser = userInfo.find(user => user.email === email);

  if (specificUser) {
    return specificUser;
  } return null;
};

const urlsForUser = function (id, database) {
  let usersURLS = {};

  for (let url in database) {
    if (database[url].userID === id) {
      usersURLS[url] = database[url];
    }
  } return usersURLS;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser
};