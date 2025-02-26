const bcrypt = require('bcryptjs');


const jwt = require("jsonwebtoken");
const Personnel = require("../models/Personnel");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");
require("dotenv").config();
//const bcrypt = require("bcrypt");
const crypto = require('crypto');



// Transporteur Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Fonction d'envoi de l'email générique
const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: options.email,
    subject: options.subject,
    text: options.text || '',
    html: options.html || '',
  };

  await transporter.sendMail(mailOptions);
};

// Fonction d'envoi de l'email de vérification
const sendVerificationEmail = async (email, verificationToken) => {
  const verificationUrl = `${process.env.BASE_URL}/auth/verify/${verificationToken}`;

  await sendEmail({
    email: email,
    subject: 'Vérification de votre compte',
    html: `
      <h1>Vérification de votre compte</h1>
      <p>Bienvenue ! Pour vérifier votre compte, veuillez cliquer sur le lien ci-dessous :</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>Ce lien expirera dans 1 heure.</p>
      <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
    `,
  });
};

// Fonction de validation des données d'inscription
const validateRegistration = [
  body("email").isEmail().withMessage("Veuillez fournir un email valide."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caractères."),
  body("firstName").notEmpty().withMessage("Le prénom est requis."),
  body("lastName").notEmpty().withMessage("Le nom est requis."),
];

// Fonction d'inscription
const register = async (req, res) => {
  // Vérification des erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Vérifier si l'email existe déjà
    const existingPersonnel = await Personnel.findOne({ email });
    if (existingPersonnel) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Génération du token pour la vérification de l'email
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Création du personnel
    const personnel = new Personnel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      verificationToken,
    });

    await personnel.save();

    // Envoi de l'email de vérification
    sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      message: "Enregistrement réussi. Veuillez vérifier votre e-mail pour activer votre compte.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'inscription", error });
  }
};

// Fonction de vérification du compte
const verifyAccount = async (req, res) => {
  const { token } = req.params;
  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const personnel = await Personnel.findOne({ email: decoded.email });

    if (!personnel) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }

    // Mettre à jour le statut de vérification
    personnel.isVerified = true;
    personnel.verificationToken = null;
    await personnel.save();

    res.status(200).json({ message: "Compte vérifié avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lien de vérification invalide ou expiré", error });
  }
};

// Fonction de réinitialisation du mot de passe (demande de réinitialisation)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const personnel = await Personnel.findOne({ email });

    if (!personnel) {
      return res.status(404).json({ message: "Aucun compte associé à cet email" });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    personnel.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    personnel.resetPasswordExpires = Date.now() + 3600000; // Le token expire dans 1 heure

    await personnel.save();

    const resetUrl = `${process.env.BASE_URL}/auth/reset-password/:token${resetToken}`;

    // Envoi de l'email de réinitialisation
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: personnel.email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <h1>Vous avez demandé une réinitialisation de mot de passe</h1>
        <p>Cliquez sur ce lien pour réinitialiser votre mot de passe :</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      `,
    };

    transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Un email de réinitialisation a été envoyé à votre adresse" });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de réinitialisation :", error);
    res.status(500).json({ message: "Une erreur est survenue lors de l'envoi de l'email de réinitialisation", error });
  }
};

// Fonction pour afficher le formulaire de réinitialisation du mot de passe
const showResetPasswordForm = async (req, res) => {
  const { token } = req.params;

  try {
    // Vérifiez si le token est valide et n'a pas expiré
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const personnel = await Personnel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!personnel) {
      return res.status(400).json({ message: "Le token de réinitialisation est invalide ou a expiré" });
    }

    // Renvoi d'une page HTML avec un formulaire de réinitialisation
    res.send(`
      <h1>Réinitialisation du mot de passe</h1>
      <form action="/auth/reset-password/${token}" method="POST">
        <input type="password" name="password" placeholder="Nouveau mot de passe" required>
        <button type="submit">Réinitialiser le mot de passe</button>
      </form>
    `);
  } catch (error) {
    console.error("Erreur lors de l'affichage du formulaire de réinitialisation :", error);
    res.status(500).json({ message: "Une erreur est survenue lors de l'affichage du formulaire", error });
  }
};

// Fonction de réinitialisation du mot de passe (soumission du nouveau mot de passe)
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const personnel = await Personnel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!personnel) {
      return res.status(400).json({ message: "Le token de réinitialisation est invalide ou a expiré" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    personnel.password = hashedPassword;
    personnel.resetPasswordToken = undefined;
    personnel.resetPasswordExpires = undefined;

    await personnel.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter." });
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du mot de passe :", error);
    res.status(500).json({ message: "Une erreur est survenue lors de la réinitialisation du mot de passe", error });
  }
};

// Fonction de connexion
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const personnel = await Personnel.findOne({ email });
    if (!personnel) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }

    if (!personnel.isVerified) {
      return res.status(400).json({ message: "Veuillez vérifier votre email avant de vous connecter" });
    }

    const isMatch = await bcrypt.compare(password, personnel.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    // Générer un token JWT
    const token = jwt.sign({ email: personnel.email, role: personnel.role, id: personnel._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({
      message: "Connexion réussie",
      token: token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la connexion", error });
  }
};

// Mise à jour des informations du personnel
const updatePersonnel = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, password, role } = req.body;

  try {
    const personnel = await Personnel.findById(id);
    if (!personnel) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Mettre à jour uniquement les champs fournis
    if (firstName) personnel.firstName = firstName;
    if (lastName) personnel.lastName = lastName;
    if (email) personnel.email = email;
    if (role) personnel.role = role;

    // Si un mot de passe est fourni, le hacher avant de le mettre à jour
    if (password) {
      personnel.password = await bcrypt.hash(password, 10);
    }

    await personnel.save();

    res.status(200).json({ message: "Informations mises à jour avec succès", personnel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour des informations", error });
  }
};
const deletePersonnel = async (req, res) => {
  const { id } = req.params;

  try {
    const personnel = await Personnel.findById(id);
    if (!personnel) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await Personnel.findByIdAndDelete(id);

    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression", error });
  }
};


module.exports = {
  register,
  login,
  verifyAccount,
  forgotPassword,
  showResetPasswordForm,
  resetPassword,
  updatePersonnel,
  deletePersonnel,
  validateRegistration 
};

// Suppression d'un utilisateur

