var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require("mongoose");
require("dotenv").config(); // Charger les variables d'environnement
const authRoutes = require("./routes/authRoutes");
var indexRouter = require('./routes/index');
const cors = require('cors');


//var usersRouter = require('./routes/users');
//var personnelrouter = require('./routes/personnelRoutes');
//var registerRoute = require("./routes/register");

const app = express();

// Configuration et middleware

 // ⚠️ Déclarer `app` AVANT d'utiliser `app.use()`
 mongoose
  .connect("mongodb://127.0.0.1:27017/regpidecodequeen")
  .then(() => console.log("Connexion à MongoDB réussie.")) // Log de succès
  .catch((err) => console.error("Erreur de connexion à MongoDB:", err)); // Log d'erreur

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');
app.use(express.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(cors());
app.use(cors({
  origin: 'http://localhost:3002', // Autorise uniquement votre frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Définir les routes après la déclaration de `app`
app.use("/", indexRouter);
//app.use("/personnel", personnelrouter);
app.use("/auth", authRoutes);

// Gestion des erreurs 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Gestion des erreurs globales
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

// Définition du port et démarrage du serveur
var port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
