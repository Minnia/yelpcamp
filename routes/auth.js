const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user.js");
const Campground = require("../models/campground.js");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

router.get("/", (req, res) => {
  res.render("landing");
});

//AUTHENTICATION ROUTES
router.get("/register", (req, res) => {
  res.render("register");
});

// /register
router.post("/register", async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      avatar,
      firstName,
      lastName,
      adminCode
    } = req.body;
    const newUser = new User({
      username,
      email,
      avatar,
      firstName,
      lastName
    });
    if (adminCode === process.env.ADMIN_CODE) {
      newUser.isAdmin = true;
    }
    const registeredUser = await User.register(newUser, password);
    passport.authenticate("local")(req, res, () => {
      req.flash("success", "Signed up, " + registeredUser.username);
      return res.redirect("/campgrounds");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("back");
  }
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
  })
);

router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "logged you out!");
  res.redirect("/campgrounds");
});

//FORGOT PASSWORD
router.get("/forgot", (req, res) => {
  res.render("./campgrounds/forgot");
});

//==========CREATE VARIABLE FOR SENDING EMAIL=========================================

const smtpTransport = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    type: "OAuth2",
    user: "jasminestockholm@gmail.com",
    pass: process.env.GMAILPW,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    accessToken: process.env.GMAIL_ACCESS_TOKEN,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN
  }
});

//====================================================
router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    const token = await crypto.randomBytes(20).toString("hex");
    const user = await User.findOne({ email });
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() * 36000000;
    await user.save();
    const mailOptions = {
      to: user.email,
      from: "jasminestockholm@gmail.com",
      subject: "YelpCamp Password Reset",
      html: "",
      text:
        "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
        "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
        "http://" +
        req.headers.host +
        "/reset/" +
        token +
        "\n\n" +
        "If you did not request this, please ignore this email and your password will remain unchanged.\n"
    };
    try {
      await smtpTransport.sendMail(mailOptions);
    } catch (err) {
      throw new Error(
        JSON.stringify({ statusCode: 500, message: "Could not send the email" })
      );
    }
    res.sendStatus(200);
  } catch (err) {
    throw new Error("Could not reset the password of the user.");
  }
});

//

// //==================================
//USER PROFILE
router.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userProfile = await User.findById(id);
    const campgrounds = await Campground.find()
      .where("author.id")
      .equals(userProfile._id);
    if (err || !userProfile) {
      req.flash("error", err.message);
      res.redirect("back");
    }

    res.render("./campgrounds/userprofile", {
      user: userProfile,
      campgrounds
    });
  } catch (err) {
    req.flash("error", "Something went wrong, please try again");
    res.redirect("back");
  }
});

module.exports = router;
