const request = require("request");
const User = require("../../src/db/models").User;

module.exports = function(role, done) {
  User.create({
    email: `${role}@example.com`,
    password: "123456",
    role: role
  }).then(user => {
    request.get(
      {
        url: "http://localhost:3000/auth/fake",
        form: {
          role: user.role,
          userId: user.id,
          email: user.email
        }
      },
      (err, res, body) => {
        done();
      }
    );
  });
};
