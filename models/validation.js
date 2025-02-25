const Joi = require("joi");

const personnelSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    "string.base": "Le prénom doit être une chaîne de caractères.",
    "string.min": "Le prénom doit contenir au moins 2 caractères.",
    "string.max": "Le prénom ne peut pas dépasser 50 caractères.",
    "any.required": "Le prénom est obligatoire."
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    "any.required": "Le nom est obligatoire."
  }),
  contactInfo: Joi.string().email().required().messages({
    "string.email": "L'adresse email n'est pas valide.",
    "any.required": "L'email est obligatoire."
  }),
  role: Joi.string().valid("Médecin", "Infirmier", "Administratif").required().messages({
    "any.only": "Le rôle doit être 'Médecin', 'Infirmier' ou 'Administratif'."
  }),
  disponibilite: Joi.boolean(),
  medicalHistory: Joi.string().allow(""),
  shiftStart: Joi.date().iso(),
  shiftEnd: Joi.date().iso(),
});

module.exports = personnelSchema;
