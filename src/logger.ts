export default function (req, res, next) {
  res.on("finish", () => {
    let authHeader = "";
    try {
      authHeader = req.headers.authorization
        .replace(/Bearer\s+/, "")
        .slice(0, 20);
    } catch (error) {}

    console.log(
      `${authHeader ? authHeader + "... " : ""}${req.method} ${
        req.originalUrl
      } ${res.statusCode}${res._cacheHit ? " (CACHE HIT)" : ""}`
    );
  });

  next();
}
