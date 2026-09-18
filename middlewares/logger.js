function logger(req, res, next) {
  const debut = Date.now();

  res.on('finish', () => {
    const duree = Date.now() - debut;
    const horodatage = new Date().toISOString();

    console.log(
      `[${horodatage}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duree}ms)`
    );
  });

  next();
}

module.exports = logger;