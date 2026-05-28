const { setFlash } = require("../lib/flash");

function requireAuth(req, res, next) {
  if (!req.user) {
    setFlash(req, "error", "આગળ વધવા માટે કૃપા કરીને લોગિન કરો.");
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
    setFlash(req, "error", "આ પેજ માટે એડમિન ઍક્સેસ જરૂરી છે.");
    return res.redirect("/");
  }

  return next();
}

module.exports = {
  requireAuth,
  requireGuest,
  requireAdmin,
};
