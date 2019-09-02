const express = require("express");
const router = express.Router({ mergeParams: true }); // const router = express.Router({mergeParams: true}) if i were to use the shortcut for the app.use in app.js
const Campground = require("../models/campground.js");
const Comment = require("../models/comment.js");
const middleware = require("../middleware");

//COMMENTS ROUTES

//GET CREATE NEW COMMENT FORM
router.get(
  "/campgrounds/:id/comments/new",
  middleware.isLoggedIn,
  async (req, res) => {
    try {
      const { id } = req.params;
      const campground = await Campground.findById(id);
      res.render("comments/new", { campground });
    } catch (err) {
      req.flash("error", "Could not find campground");
    }
  }
);
//POST COMMENT
router.post(
  "/campgrounds/:id/comments",
  middleware.isLoggedIn,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        body: { comment },
        user: { _id: userId, username }
      } = req;
      const campground = await Campground.findById(id);
      const newComment = await Comment.create(comment);
      if (!newComment || !campground) {
        throw new Error(
          "Could not find what you were looking for, please try again"
        );
      }
      newComment.author.id = userId;
      newComment.author.username = username;
      newComment.save();
      campground.comments.push(newComment);
      campground.save();
      res.redirect("/campgrounds/" + campground._id);
    } catch (err) {
      req.flash("error", "Something went wrong");
      res.redirect("back");
    }
  }
);

//EDIT COMMENT
router.get(
  "/campgrounds/:id/comments/:comment_id/edit",
  middleware.checkCommentOwnership,
  async (req, res) => {
    try {
      const { id, comment_id } = req.params;
      const comment = await Comment.findById(comment_id);
      if (!foundComment) {
        throw new Error("Could not edit comment, please try again");
      }
      res.render("../views/comments/edit", { id, comment });
    } catch (err) {
      req.flash("error", "Ooops! That did not work, please try again");
    }
  }
);

//POST EDITED COMMENT
router.post(
  "/campgrounds/:id/comments/:comment_id",
  middleware.checkCommentOwnership,
  async (req, res) => {
    try {
      const {
        params: { comment_id }
      } = req;
      const {
        body: { comment }
      } = req;
      const updatedComment = await Comment.findByIdAndUpdate(
        comment_id,
        comment
      );
      res.redirect("/campgrounds/" + updatedComment._id);
      if (!updatedComment) {
        throw new Error("Could not update comment, please try again");
      }
    } catch (err) {
      req.flash("error", "Could not edit comment");
      res.redirect("back");
    }
  }
);

//DELETE COMMENT
router.delete(
  "/campgrounds/:id/comments/:comment_id",
  middleware.checkCommentOwnership,
  async (req, res) => {
    try {
      const { id, comment_id } = req.params;
      await Comment.findByIdAndRemove(comment_id);
      res.redirect("/campgrounds/" + id);
    } catch (err) {
      req.flash("error", "Could not delete comment");
      res.redirect("back");
    }
  }
);

module.exports = router;
