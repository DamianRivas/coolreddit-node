module.exports = {
  index(req, res, next) {
    res.render("static/index", { title: "Welcome to CoolReddit!" });
  },

  about(req, res, next) {
    res.render("static/about");
  }
};
