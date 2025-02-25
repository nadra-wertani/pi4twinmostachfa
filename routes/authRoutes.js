// routes/authRoutes.js
const express = require("express");
const { login, register, verifyAccount, forgotPassword,showResetPasswordForm,resetPassword,validateRegistration ,updatePersonnel,deletePersonnel} = require("../controllers/authController");
const authenticateJWT = require("../middleware/authenticateJWT"); // Importer le middleware JWT
const bcrypt = require('bcryptjs');

const router = express.Router();
require("dotenv").config();

// Routes publiques
router.post("/register", validateRegistration, register);
router.get("/verify/:token", verifyAccount);

router.post("/login", login);
// Mise à jour des informations d'un utilisateur
router.put("/update/:id", authenticateJWT, updatePersonnel);

// Suppression d'un utilisateur
router.delete("/delete/:id", authenticateJWT, deletePersonnel);
router.post("/forgot-password", forgotPassword);

// Ajoutez cette route GET pour afficher le formulaire de réinitialisation
router.get("/reset-password/:token", showResetPasswordForm);
// Route protégée (exemple)
router.get("/protected-route", authenticateJWT, (req, res) => {
  // Cette route est protégée, elle ne sera accessible que si le JWT est valide
  res.status(200).json({
    message: "Vous êtes connecté et votre JWT est valide.",
    user: req.user,  // Contient les informations de l'utilisateur décodées du JWT
  });
});

module.exports = router;
