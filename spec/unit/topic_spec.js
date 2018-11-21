const sequelize = require("../../src/db/models/index").sequelize;
const Topic = require("../../src/db/models").Topic;

describe("Topic", () => {
  beforeEach(done => {
    this.topic;

    sequelize.sync({ force: true }).then(res => {
      Topic.create({
        title: "Expiditions to Alpha Centauri",
        description:
          "A compilation of reports from recent visits to the star system."
      })
        .then(topic => {
          this.topic = topic;
          done();
        })
        .catch(err => {
          console.log(err);
          done();
        });
    });
  });

  describe("#create()", () => {
    it("should create a topic object with a title and description", done => {
      Topic.create({
        title: "Everything Lions",
        description: "Everything about the greatest creatures on Earth."
      })
        .then(topic => {
          expect(topic.title).toBe("Everything Lions");
          expect(topic.description).toBe(
            "Everything about the greatest creatures on Earth."
          );
          done();
        })
        .catch(err => {
          console.log(err);
          fail("Failed to create a topic");
          done();
        });
    });

    it("should not create a topic with a missing title or body", done => {
      Topic.create({
        title: "Everything Lions"
      })
        .then(topic => {
          fail("A topic with a missing description should not be created");
          done();
        })
        .catch(err => {
          expect(err.message).toContain("Topic.description cannot be null");
          done();
        });
    });
  });
});
