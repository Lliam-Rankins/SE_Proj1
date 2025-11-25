import mongoose from "mongoose";
import User from "./models/User.model.js"; 

const MONGO_URI = "mongodb://localhost:27017/ecobites";

async function backfillRewardHistory() {
  try {
    await mongoose.connect(MONGO_URI);

    const users = await User.find();

    for (const user of users) {
      let updated = false;

      // If rewardHistory missing or empty, initialize it
      if (!user.rewardHistory || user.rewardHistory.length === 0) {
        user.rewardHistory = [
          {
            amount: 0,
            issuedAt: new Date(),
            used: false
          }
        ];
        updated = true;
      }

      // Ensure every reward has amount, issuedAt, and used fields
      user.rewardHistory = user.rewardHistory.map(reward => {
        let changed = false;

        if (reward.amount === undefined) {
          reward.amount = 0;
          changed = true;
        }
        if (!reward.issuedAt) {
          reward.issuedAt = new Date();
          changed = true;
        }
        if (reward.used === undefined) {
          reward.used = false;
          changed = true;
        }

        if (changed) updated = true;
        return reward;
      });

      if (updated) {
        await user.save();
        console.log(`Updated rewardHistory for user ${user._id}`);
      }
    }

    console.log("Backfill complete for all users");
    process.exit(0);

  } catch (err) {
    console.error("Error during backfill:", err);
    process.exit(1);
  }
}

backfillRewardHistory();
