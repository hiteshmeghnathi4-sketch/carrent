const path = require("path");
const express = require("express");
const session = require("express-session");
const apiRoutes = require("./routes/apiRoutes");
const publicRoutes = require("./routes/publicRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { initializeStore, readData } = require("./lib/store");

initializeStore();

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(
  session({
    secret: "drivemint-session-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  const data = readData();
  const currentUser = data.users.find((user) => user.id === req.session.userId);

  if (currentUser && currentUser.active) {
    req.user = currentUser;
  } else {
    req.user = null;
    delete req.session.userId;
  }

  res.locals.user = req.user;
  res.locals.isAdmin = req.user?.role === "admin";
  res.locals.currentPath = req.path;
  res.locals.flash = req.session.flash || null;
  res.locals.formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  res.locals.formatDate = (value) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  delete req.session.flash;

  next();
});

app.use("/api", apiRoutes);
app.use(publicRoutes);
app.use(userRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).render("404", {
    title: "Page Not Found",
    message: "The page you requested does not exist.",
  });
});

module.exports = app;
