module.exports = function basicAuth(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res
      .status(401)
      .json({ message: "Missing or invalid Authorization header" });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "utf-8"
  );
  const [username, password] = credentials.split(":");

  const validUsername = "Eviltd";
  const validPassword = "@eviltd";

  if (username !== validUsername || password !== validPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  next();
};
