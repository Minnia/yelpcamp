const Campground = require("../models/campground");
const Comment = require("../models/comment");

const checkCampgroundOwnership = async function(req, res, next) {
  try {
    if (req.isAuthenticated()) {
      const campground = await Campground.findById(req.params.id);
      const usersCampground =
        campground.author.id.equals(req.user._id) || req.user.isAdmin;
      if (!usersCampground || !req.user.isAdmin) {
        req.flash("error", "User not authenticated");
        res.redirect("back");
      }
      next();
    }
  } catch (err) {
    console.log(err);
    res.redirect("/campgrounds");
  }
};

const checkCommentOwnership = async function(req, res, next) {
  try {
    if (req.isAuthenticated()) {
      const comment = await Comment.findById(req.params.comment_id);
      const usersComment =
        comment.author.id.equals(req.user._id) || req.user.isAdmin;
      if (!usersComment) {
        req.flash("error", "You do not have permission to do that");
        res.redirect("back");
      }
      next();
    }
    throw new Error("User not authenticated");
  } catch (err) {
    req.flash("error", "You need to be logged in to do that");
    res.redirect("back");
  }
};

const isLoggedIn = async function(req, res, next) {
  try {
    if (req.isAuthenticated()) {
      return next();
    }
    throw new Error("You need to be logged in");
  } catch (err) {
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
  }
};

module.exports = {
  checkCampgroundOwnership,
  checkCommentOwnership,
  isLoggedIn
};
