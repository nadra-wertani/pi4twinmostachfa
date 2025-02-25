// middleware/authenticateJWT.js
const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(403).json({ message: "Token manquant, accès interdit." });
  }

  const bearerToken = token.split(" ")[1]; // Extract the token
  if (!bearerToken) {
    return res.status(403).json({ message: "Token invalide" });
  }

  // Verify token and log user information
  jwt.verify(bearerToken, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token invalide" });
    }
    console.log("JWT_SECRET (middleware):", process.env.JWT_SECRET);
    console.log("Decoded User:", user);  // Log the decoded user info
    req.user = user;  // Attach user info to the request
    next();
  });
};



module.exports = authenticateJWT;
