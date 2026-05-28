const { readData, writeData } = require("../lib/store");

function unauthorized(res, message) {
  return res.status(401).json({
    error: message,
  });
}

function extractBearerToken(req) {
  const authorization = String(req.get("authorization") || "");

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice("Bearer ".length).trim();
}

function requireApiAuth(req, res, next) {
  const tokenValue = extractBearerToken(req);

  if (!tokenValue) {
    return unauthorized(res, "ઓથેન્ટિકેશન ટોકન જરૂરી છે.");
  }

  const data = readData();
  const tokenRecord = data.apiTokens.find((token) => token.token === tokenValue);

  if (!tokenRecord) {
    return unauthorized(res, "સેશન સમાપ્ત થયું છે. કૃપા કરીને ફરી લોગિન કરો.");
  }

  const user = data.users.find((item) => item.id === tokenRecord.userId);

  if (!user || !user.active) {
    data.apiTokens = data.apiTokens.filter((token) => token.token !== tokenValue);
    writeData(data);
    return unauthorized(res, "આ એકાઉન્ટ હવે સક્રિય નથી.");
  }

  req.apiData = data;
  req.apiUser = user;
  req.apiToken = tokenRecord;
  req.apiTokenValue = tokenValue;

  return next();
}

function requireApiAdmin(req, res, next) {
  return requireApiAuth(req, res, () => {
    if (req.apiUser.role !== "admin") {
      return res.status(403).json({
        error: "એડમિન ઍક્સેસ જરૂરી છે.",
      });
    }

    return next();
  });
}

module.exports = {
  extractBearerToken,
  requireApiAdmin,
  requireApiAuth,
};
