function errorHandler(err, req, res, next) {
  console.error('Erreur non interceptée :', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    erreur: "Une erreur interne est survenue. Veuillez réessayer plus tard."
  });
}

module.exports = errorHandler;