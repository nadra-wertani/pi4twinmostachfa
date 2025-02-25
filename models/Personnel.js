const mongoose = require("mongoose");

const PersonnelSchema = new mongoose.Schema({
  firstName: { type: String, required: [true, "Le prénom est requis"], trim: true },
  lastName: { type: String, required: [true, "Le nom est requis"], trim: true },
  email: { 
    type: String, 
    required: [true, "L'email est requis"], 
    unique: true, 
    trim: true, 
    match: [/.+\@.+\..+/, "Veuillez entrer une adresse e-mail valide"] 
  }, 
  password: { 
    type: String, 
    required: [true, "Le mot de passe est requis"], 
    minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"] 
  }, 
  role: { 
    type: String, 
    required: [true, "Le rôle est requis"], 
    enum: ["Médecin", "Infirmier", "Administrateur"] // Ajout d'une liste de rôles possibles
  },
  disponibilite: { type: Boolean, default: true },
  medicalHistory: { type: String, default: "", trim: true },
  shiftStart: { type: Date },
  shiftEnd: { type: Date },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, trim: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Personnel", PersonnelSchema);
