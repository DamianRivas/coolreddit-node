const request = require("request");
const server = require("../../src/server");
const base = "http://localhost:3000/topics";

const sequelize = require("../../src/db/models/index").sequelize;
const Topic = require("../../src/db/models").Topic;
const Post = require("../../src/db/models").Post;
const User = require("../../src/db/models").User;

const authorizeUser = require("../support/authorizeUser");

describe("routes: posts", () => {
  beforeEach(done => {
    this.topic;
    this.post;
    this.user;

    sequelize.sync({ force: true }).then(res => {
      User.create({
        email: "starman@tesla.com",
        password: "Trekkie4lyfe",
        role: "member"
      })
        .then(user => {
          this.user = user;

          Topic.create(
            {
              title: "Winter Games",
              description: "Post your Winter Games stories.",
              posts: [
                {
                  title: "Snowball Fighting",
                  body: "So much snow!",
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

  // Guest user context

  describe("guest user performing CRUD actions for Post", () => {
    describe("GET /topics/:topicId/posts/new", () => {
      it("should redirect to the posts view", done => {
        request.get(`${base}/${this.topic.id}/posts/new`, (err, res, body) => {
          expect(err).toBeNull();
          expect(body).toContain("Posts");
          done();
        });
      });
    });

    describe("POST /topics/:topicId/posts/create", () => {
      it("should not create a new post", done => {
        const options = {
          url: `${base}/${this.topic.id}/posts/create`,
          form: {
            title: "Watching snow melt",
            body:
              "Without a doubt my favorite thing to do besides watching paint dry!"
          }
        };

        request.post(options, (err, res, body) => {
          Post.findOne({ where: { title: "Watching snow melt" } })
            .then(post => {
              expect(post).toBeNull();
              done();
            })
            .catch(err => {
              console.log(err);
              done();
            });
        });
      });
    });

    describe("GET /topics/:topicId/posts/:id", () => {
      it("should render a view with the selected post", done => {
        request.get(
          `${base}/${this.topic.id}/posts/${this.post.id}`,
          (err, res, body) => {
            expect(err).toBeNull();
            expect(body).toContain("Snowball Fighting");
            done();
          }
        );
      });
    });

    describe("POST /topics/:topicId/posts/:id/destroy", () => {
      it("should not delete the post with the associated id", done => {
        expect(this.post.id).toBe(1);
        const postCountBeforeDelete = this.topic.posts.length;
        expect(postCountBeforeDelete).toBe(1);

        request.post(
          `${base}/${this.topic.id}/posts/${this.post.id}/destroy`,
          (err, res, body) => {
            Post.findById(1).then(post => {
              expect(err).toBeNull();
              expect(post).not.toBeNull();
              expect(this.topic.posts.length).toBe(postCountBeforeDelete);
              done();
            });
          }
        );
      });
    });

    describe("GET /topics/:topicId/posts/:id/edit", () => {
      it("should not render a view with an edit post form", done => {
        request.get(
          `${base}/${this.topic.id}/posts/${this.post.id}/edit`,
          (err, res, body) => {
            expect(err).toBeNull();
            expect(body).not.toContain("Edit Post");
            expect(body).toContain("Snowball Fighting"); // confirm redirect to post show view
            done();
          }
        );
      });
    });

    describe("POST /topics/:topicId/posts/:id/update", () => {
      it("should not update the post with the given values", done => {
        const options = {
          url: `${base}/${this.topic.id}/posts/${this.post.id}/update`,
          form: {
            title: "Snowman Building Competition",
            body: "I love watching snow melt slowly"
          }
        };

        request.post(options, (err, res, body) => {
          expect(err).toBeNull();

          Post.findOne({
            where: { id: this.post.id }
          }).then(post => {
            expect(post.title).toBe("Snowball Fighting");
            done();
          });
        });
      });
    });
  });

  // Admin user context

  describe("admin user performing CRUD actions for Post", () => {
    beforeEach(done => {
      authorizeUser("admin", done);
    });

    describe("GET /topics/:topicId/posts/new", () => {
      it("should render a new post form", done => {
        request.get(`${base}/${this.topic.id}/posts/new`, (err, res, body) => {
          expect(err).toBeNull();
          expect(body).toContain("New Post");
          done();
        });
      });
    });

    describe("POST /topics/:topicId/posts/create", () => {
      it("should create a new post and redirect", done => {
        const options = {
          url: `${base}/${this.topic.id}/posts/create`,
          form: {
            title: "Watching snow melt",
            body:
              "Without a doubt my favorite thing to do besides watching paint dry!"
          }
        };
        request.post(options, (err, res, body) => {
          Post.findOne({ where: { title: "Watching snow melt" } })
            .then(post => {
              expect(post).not.toBeNull();
              expect(post.title).toBe("Watching snow melt");
              expect(post.body).toBe(
                "Without a doubt my favorite thing to do besides watching paint dry!"
              );
              expect(post.topicId).not.toBeNull();
              done();
            })
            .catch(err => {
              // console.log(err);
              done();
            });
        });
      });

      it("should not create a new post that fails validations", done => {
        const options = {
          url: `${base}/${this.topic.id}/posts/create`,
          form: {
            title: "a",
            body: "b"
          }
        };
        request.post(options, (err, res, body) => {
          Post.findOne({ where: { title: "a" } })
            .then(post => {
              expect(post).toBeNull();
              done();
            })
            .catch(err => {
              console.log(err);
              done();
            });
        });
      });
    });

    describe("GET /topics/:topicId/posts/:id", () => {
      it("should render a view with the selected post", done => {
        request.get(
          `${base}/${this.topic.id}/posts/${this.post.id}`,
          (err, res, body) => {
            expect(err).toBeNull();
            expect(body).toContain("Snowball Fighting");
            done();
          }
        );
      });
    });

    describe("POST /topics/:topicId/posts/:id/destroy", () => {
      it("should delete the post with the associated id", done => {
        expect(this.post.id).toBe(1);
        request.post(
          `${base}/${this.topic.id}/posts/${this.post.id}/destroy`,
          (err, res, body) => {
            Post.findById(1).then(post => {
              expect(err).toBeNull();
              expect(post).toBeNull();
              done();
            });
          }
        );
      });
    });

    describe("GET /topics/:topicId/posts/:id/edit", () => {
      it("should render a view with an edit post form", done => {
        request.get(
          `${base}/${this.topic.id}/posts/${this.post.id}/edit`,
          (err, res, body) => {
            expect(err).toBeNull();
            expect(body).toContain("Edit Post");
            expect(body).toContain("Snowball Fighting");
            done();
          }
        );
      });
    });

    describe("POST /topics/:topicId/posts/:id/update", () => {
      it("should return a status code 302", done => {
        request.post(
          {
            url: `${base}/${this.topic.id}/posts/${this.post.id}/update`,
            form: {
              title: "Snowman Building Competition",
              body: "I love watching snow melt slowly."
            }
          },
          (err, res, body) => {
            expect(res.statusCode).toBe(302);
            done();
          }
        );
      });

      it("should update the post with the given values", done => {
        const options = {
          url: `${base}/${this.topic.id}/posts/${this.post.id}/update`,
          form: {
            title: "Snowman Building Competition",
            body: "I love watching snow melt slowly"
          }
        };
        request.post(options, (err, res, body) => {
          expect(err).toBeNull();

          Post.findOne({
            where: { id: this.post.id }
          }).then(post => {
            expect(post.title).toBe("Snowman Building Competition");
            done();
          });
        });
      });
    });
  });

  // Member user context

  describe("member user performing CRUD actions for Post", () => {
    beforeEach(done => {
      authorizeUser("member", done);
    });

    describe("GET /topics/:topicId/posts/new", () => {
      it("should render a new post form", done => {
        request.get(`${base}/${this.topic.id}/posts/new`, (err, res, body) => {
          expect(err).toBeNull();
          expect(body).toContain("New Post");
          done();
        });
      });
    });

    describe("POST /topics/:topicId/posts/create", () => {
      it("should create a new post and redirect", done => {
        const options = {
          url: `${base}/${this.topic.id}/posts/create`,
          form: {
            title: "Watching snow melt",
            body:
              "Without a doubt my favorite thing to do besides watching paint dry!"
          }
        };

        request.post(options, (err, res, body) => {
          Post.findOne({ where: { title: "Watching snow melt" } })
            .then(post => {
              expect(post).not.toBeNull();
              expect(post.title).toBe("Watching snow melt");
              expect(post.body).toBe(
                "Without a doubt my favorite thing to do besides watching paint dry!"
              );
              expect(post.topicId).not.toBeNull();
              done();
            })
            .catch(err => {
              // console.log(err);
              done();
            });
        });
      });

      it("should not create a new post that fails validations", done => {
        const options = {
          url: `${base}/${this.topic.id}/posts/create`,
          form: {
            title: "a",
            body: "b"
          }
        };

        request.post(options, (err, res, body) => {
          Post.findOne({ where: { title: "a" } })
            .then(post => {
              expect(post).toBeNull();
              done();
            })
            .catch(err => {
              console.log(err);
              done();
            });
        });
      });
    });

    describe("GET /topics/:topicId/posts/:id", () => {
      it("should render a view with the selected post", done => {
        request.get(
          `${base}/${this.topic.id}/posts/${this.post.id}`,
          (err, res, body) => {
            expect(err).toBeNull();
            expect(body).toContain("Snowball Fighting");
            done();
          }
        );
      });
    });

    describe("POST /topics/:topicId/posts/:id/destroy", () => {
      it("should delete an owned post with the associated id", done => {
        const options = {
          url: `${base}/${this.topic.id}/posts/create`,
          form: {
            title: "Watching snow melt",
            body:
              "Without a doubt my favorite thing to do besides watching paint dry!"
          }
        };

        request.post(options, (err, res, body) => {
          expect(err).toBeNull();

          Post.findOne({ where: { title: "Watching snow melt" } })
            .then(post => {
              expect(post).not.toBeNull();

              request.post(
                `${base}/${this.topic.id}/posts/${post.id}/destroy`,
                (err, res, body) => {
                  Post.findOne({ where: { title: "Watching snow melt" } }).then(
                    postAfterDelete => {
                      expect(err).toBeNull();
                      expect(postAfterDelete).toBeNull();
                      done();
                    }
                  );
                }
              );
            })
            .catch(err => {
              console.log(err);
              done();
            });
        });
      });

      it("should not delete a post not owned by the user", done => {
        expect(this.post.id).toBe(1);
        const postCountBeforeDelete = this.topic.posts.length;
        expect(postCountBeforeDelete).toBe(1);

        request.post(
          `${base}/${this.topic.id}/posts/${this.post.id}/destroy`,
          (err, res, body) => {
            Post.findById(1).then(post => {
              expect(err).toBeNull();
              expect(post).not.toBeNull();
              expect(this.topic.posts.length).toBe(postCountBeforeDelete);
              done();
            });
          }
        );
      });
    });

    describe("GET /topics/:topicId/posts/:id/edit", () => {
      it("should render a view with an edit post form for an owned post", done => {
        const options = {
          url: `${base}/${this.topic.id}/posts/create`,
          form: {
            title: "My post",
            body: "This is my new post"
          }
        };

        request.post(options, (err, res, body) => {
          Post.findOne({ where: { title: "My post" } })
            .then(post => {
              expect(post).not.toBeNull();

              request.get(
                `${base}/${this.topic.id}/posts/${post.id}/edit`,
                (err, res, body) => {
                  expect(err).toBeNull();
                  expect(body).toContain("Edit Post");
                  expect(body).toContain("My post");
                  done();
                }
              );
            })
            .catch(err => {
              console.log(err);
              done();
            });
        });
      });

      it("should redirect to the post view for a non-owned post", done => {
        request.get(
          `${base}/${this.topic.id}/posts/${this.post.id}/edit`,
          (err, res, body) => {
            expect(err).toBeNull();
            expect(body).not.toContain("Edit Post");
            expect(body).toContain("Snowball Fighting"); // confirm redirect to post show view
            done();
          }
        );
      });
    });

    describe("POST /topics/:topicId/posts/:id/update", () => {
      it("should update an owned post with the given values", done => {
        request.post(
          {
            url: `${base}/${this.topic.id}/posts/create`,
            form: {
              title: "My post",
              body: "This is my post"
            }
          },
          (err, res, body) => {
            Post.findOne({ where: { title: "My post" } })
              .then(post => {
                expect(post).not.toBeNull();

                const options = {
                  url: `${base}/${this.topic.id}/posts/${post.id}/update`,
                  form: {
                    title: "Snowman Building Competition",
                    body: "I love watching snow melt slowly"
                  }
                };

                request.post(options, (err, res, body) => {
                  expect(err).toBeNull();

                  Post.findOne({
                    where: { id: post.id }
                  })
                    .then(updatedPost => {
                      expect(updatedPost.title).toBe(
                        "Snowman Building Competition"
                      );
                      done();
                    })
                    .catch(err => {
                      console.log(err);
                      done();
                    });
                });
              })
              .catch(err => {
                console.log(err);
                done();
              });
          }
        );
      });

      it("should not update a non-owned post", done => {
        const options = {
          url: `${base}/${this.topic.id}/posts/${this.post.id}/update`,
          form: {
            title: "Snowman Building Competition",
            body: "I love watching snow melt slowly"
          }
        };

        request.post(options, (err, res, body) => {
          expect(err).toBeNull();

          Post.findOne({
            where: { id: this.post.id }
          }).then(post => {
            expect(post.title).toBe("Snowball Fighting");
            done();
          });
        });
      });
    });
  });
});
