import { supabase } from "@/lib/supabase";
import { decode } from "base64-arraybuffer";
import { nanoid } from "nanoid";

// Configure nextjs to allow 10mb uploads at this API endpoint.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    console.log("API starting image upload.");
    // Check if the body has a value
    let { image } = req.body;
    if (!image) {
      console.log("API image not found in request body.");
      return res.status(500).json({ message: "No image provided" });
    }

    try {
      // Make sure the body is a base64 image
      const contentType = image.match(/data:(.*);base64/)?.[1];
      const base64FileData = image.split("base64,")?.[1];
      if (!contentType || !base64FileData) {
        console.log("Image data not valid");
        return res.status(500).json({ message: "Image data not valid" });
      }
      // Upload image to Supabase
      // TODO: Try using supabase events files method instead of base64
      const fileName = nanoid();
      const ext = contentType.split("/")[1];
      const path = `image-${fileName}.${ext}`;
      console.log("build intended filename and path", path);
      const { data, error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(path, decode(base64FileData), { contentType, upsert: true });
      if (uploadError) {
        throw new Error("Unable to upload image to remote storage.");
      }
      // TODO: update URL generator to use the supabase API to fetch the public URL.
      const url = `${process.env.SUPABASE_URL.replace(
        ".co",
        ".in"
      )}/storage/v1/object/public/${data.Key}`;
      console.log("URL Generated for uploaded image:", url);
      return res.status(200).json({ url });
    } catch (e) {
      console.trace("API try catch failed.");
      res.status(500).json({ message: "Event error: image-upload", e });
    }
  }
  // HTTP method not supported!
  else {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ message: `HTTP method ${req.method} is not supported.` });
  }
}
