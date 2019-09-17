const express = require("express");
const router = express.Router({ mergeParams: true });
const geo = require("mapbox-geocoding");
const multer = require("multer");
const cloudinary = require("cloudinary");

const Campground = require("../models/campground.js");
const middleware = require("../middleware");

const storage = multer.diskStorage({
  filename: (req, file, callback) => {
    callback(null, Date.now() + file.originalname);
  }
});

const imageFilter = async (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter: imageFilter });

cloudinary.config({
  cloud_name: "minnia",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

geo.setAccessToken(process.env.GEOCODER_API_KEY);

router.get("/campgrounds", async (req, res) => {
  if (req.query.search) {
    try {
      const regex = new RegExp(escapeRegex(req.query.search), "gi");
      const matchedCampground = await Campground.find({ name: regex });
      return res.render("./campgrounds/campgrounds", {
        campgrounds: matchedCampground
      });
    } catch (err) {
      req.flash("error", "Sorry, could not find what you are looking for");
      res.redirect("/campgrounds");
    }
  }
  try {
    const campgrounds = await Campground.find({});
    res.render("./campgrounds/campgrounds", {
      campgrounds
    });
  } catch (err) {
    req.flash("error", "Could not find campgrounds");
  }
});

//CREATE: Add new campground to DB
router.post(
  "/campgrounds",
  middleware.isLoggedIn,
  upload.single("image"),
  async (req, res) => {
    const {
      user: { username, _id: userId },
      body: { location, campground },
      file
    } = req;
    try {
      geo.geocode("mapbox.places", location, async (err, data) => {
        const [features] = data.features;

        const coordinates = {
          lng: features.geometry.coordinates[0],
          lat: features.geometry.coordinates[1]
        };

        const campgroundImage = await cloudinary.uploader.upload(file.path);
        campground.image = campgroundImage.secure_url;
        campground.author = {
          id: userId,
          user: username
        };
        const { lng, lat } = coordinates;
        const newCampground = {
          ...campground,
          lng,
          lat,
          location: features.place_name
        };

        await Campground.create(newCampground);
        return res.redirect("/campgrounds");
      });
    } catch (err) {
      req.flash("error", "Something went wrong");
      res.redirect("back");
    }
  }
);
//NEW CAMPGROUND
router.get("/campgrounds/new", middleware.isLoggedIn, (req, res) => {
  res.render("./campgrounds/new");
});

//SHOW CAMPGROUND
router.get("/campgrounds/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const campground = await Campground.findById(id).populate("comments");
    if (!campground) {
      throw new Error("Could not find campground");
    }
    res.render("./campgrounds/show", { campground });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("back");
  }
});

//EDIT
router.get(
  "/campgrounds/:id/edit",
  middleware.checkCampgroundOwnership,
  async (req, res) => {
    try {
      const { id } = req.params;
      const editCampground = await Campground.findById(id);
      res.render("./campgrounds/edit", { campground: editCampground });
    } catch (err) {
      res.redirect("back");
    }
  }
);

//UPDATE
router.put(
  "/campgrounds/:id",
  middleware.checkCampgroundOwnership,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { campground } = req.body;
      const updatedCampground = await Campground.findByIdAndUpdate(
        id,
        campground
      );
      res.redirect("/campgrounds/" + updatedCampground._id);
    } catch (err) {
      req.flash("error", "Could not update campground");
      res.redirect("back");
    }
  }
);

//DELETE
router.delete(
  "/campgrounds/:id",
  middleware.checkCampgroundOwnership,
  async (req, res) => {
    try {
      const { id } = req.params;
      await Campground.findByIdAndRemove(id);
      res.redirect("/campgrounds");
    } catch (err) {
      req.flash("error", "Something went wrong");
      res.redirect("back");
    }
  }
);

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;
