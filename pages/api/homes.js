import { PrismaClient } from "@prisma/client";
import { getSession } from "next-auth/react";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getSession({ req });
  console.log(session);
  if (!session) {
    res.status(401).json({ error: "Unauthorized." });
  }
  // Retrieve the current authenticated user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  // Create new home
  if (req.method === "POST") {
    try {
      const { image, title, description, price, guests, beds, baths } =
        req.body;
      const home = await prisma.home.create({
        data: {
          image,
          title,
          description,
          price,
          guests,
          beds,
          baths,
          ownerId: user.id,
        },
      });

      return res.status(200).json(home);
    } catch (e) {
      res.status(500).json({
        message: "Something went wrong on the server, please try again.",
      });
    }
  }
  // HTTP method not supported!
  else {
    res.setHeader("Allow", ["POST"]);
    res
      .status(405)
      .json({ message: `HTTP method ${req.method} is not supported.` });
  }
}
