const sequelize = require("../../src/db/models/index").sequelize;
const Topic = require("../../src/db/models").Topic;
const Post = require("../../src/db/models").Post;
const User = require("../../src/db/models").User;

describe("Topic", () => {
  beforeEach(done => {
    this.topic;
    this.post;
    this.user;

    sequelize.sync({ force: true }).then(res => {
      User.create({
        email: "starman@tesla.com",
        password: "Trekkie4lyfe"
      })
        .then(user => {
          this.user = user;

          Topic.create(
            {
              title: "Expiditions to Alpha Centauri",
              description:
                "A compilation of reports from recent visits to the star system.",
              posts: [
                {
                  title: "My first visit to Proxima Centauri b",
                  body: "I saw some rocks.",
                  userId: this.user.id
                }
              ]
            },
            {
              include: {
                model: Post,
                as: "posts"
              }
            }
          ).then(topic => {
            this.topic = topic;
            this.post = topic.posts[0];
            done();
          });
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

  describe("#getPosts()", () => {
    it("should return an array of associated posts", done => {
      this.topic
        .getPosts()
        .then(posts => {
          expect(posts.length).toBe(1);
          expect(posts[0].title).toBe(this.post.title);
          done();
        })
        .catch(err => {
          console.log(err);
          done();
        });
    });
  });
});
