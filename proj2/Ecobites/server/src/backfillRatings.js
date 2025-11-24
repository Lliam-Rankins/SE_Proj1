import mongoose from "mongoose";
import User from "./models/User.model.js";

const run = async () => {
  await mongoose.connect("mongodb://localhost:27017/ecobites"); 

  console.log("Updating restaurants...");

  await User.updateMany(
    { role: "restaurant" },
    {
      $set: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        detailedRatings: { food: 0, service: 0, delivery: 0, value: 0 }
      }
    }
  );

  console.log("Done!");
  process.exit();
};

run();
