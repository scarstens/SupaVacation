import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  const session = await getSession({ req });
  console.log(session);
  if (!session) {
    res.status(401).json({ error: "Unauthorized." });
  }

  // Create new home
  if (req.method === "GET") {
    try {
      return res.status(200).json(process.env);
    } catch (e) {
      res.status(500).json({
        message: "Something went wrong on the server, please try again.",
      });
    }
  }
  // HTTP method not supported!
  else {
    res.setHeader("Allow", ["GET"]);
    res
      .status(405)
      .json({ message: `HTTP method ${req.method} is not supported.` });
  }
}
