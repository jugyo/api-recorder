export default function (req, res, next) {
  res.on("finish", () => {
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode}${
        res._cacheHit ? " (CACHE HIT)" : ""
      }`
    );
  });

  next();
}
