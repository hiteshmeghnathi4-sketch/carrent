const { setFlash } = require("../lib/flash");

function requireAuth(req, res, next) {
  if (!req.user) {
    setFlash(req, "error", "Please log in to continue.");
    return res.redirect("/login");
  }

  return next();
}

function requireGuest(req, res, next) {
  if (req.user) {
    return res.redirect(req.user.role === "admin" ? "/admin" : "/cars");
  }

  return next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    setFlash(req, "error", "Admin access is required for that page.");
    return res.redirect("/");
  }

  return next();
}

module.exports = {
  requireAuth,
  requireGuest,
  requireAdmin,
};
