require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const localStrategy = require("passport-local");
const methodOverride = require("method-override");

const commentRoutes = require("./routes/comments.js");
const campgroundRoutes = require("./routes/campgrounds.js");
const authRoutes = require("./routes/auth.js");

Campground = require("./models/campground.js");
Comment = require("./models/comment.js");
User = require("./models/user.js");

mongoose.connect(
  `mongodb+srv://JasmineP:${process.env.MONGOOSE_CONNECTION_PASSWORD}@yelpcamp-gsdfx.mongodb.net/yelp_camp?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true
  }
);

app.use(
  require("express-session")({
    secret: "Minnia is so good",
    resave: false,
    saveUninitialized: false
  })
);

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  app.locals.moment = require("moment");
  next();
});

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.set("useFindAndModify", false);
app.use(methodOverride("_method"));

app.use(commentRoutes);
app.use(campgroundRoutes);
app.use(authRoutes);
app.set("view engine", "ejs");

app.listen(8080, () => {
  console.log("Server listening to port 80");
});
