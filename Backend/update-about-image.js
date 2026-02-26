// update-about-image.js
const { db } = require("./src/db");
const { siteMedia } = require("./src/db/schema");

async function updateAboutImage() {
  try {
    const [latest] = await db
      .select()
      .from(siteMedia)
      .orderBy(siteMedia.updatedAt.desc())
      .limit(1);

    if (!latest) {
      console.log("No siteMedia record found.");
      return;
    }

    const imageSettings = latest.imageSettings
      ? JSON.parse(latest.imageSettings)
      : {};
    // Update aboutImage to absolute URL
    imageSettings.aboutImage =
      "https://orgobloom.onrender.com/images/plant.jpg";

    await db
      .update(siteMedia)
      .set({
        imageSettings: JSON.stringify(imageSettings),
        updatedAt: new Date(),
      })
      .where(siteMedia.id.eq(latest.id));

    console.log("aboutImage updated successfully!");
  } catch (error) {
    console.error("Error updating aboutImage:", error);
  }
}

updateAboutImage();
