import axios from 'axios';
import { User } from '../models/User.model.js';
import { PACKAGING_OPTIONS } from '../config/constants.js';

// Geocode address using OpenStreetMap Nominatim
async function geocodeAddress({ street, city, zipCode }) {
  const query = encodeURIComponent(`${street}, ${city}, ${zipCode}`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'EcoBites/1.0 (contact@example.com)' }
  });
  if (response.data && response.data.length > 0) {
    const { lat, lon } = response.data[0];
    return { lat: parseFloat(lat), lng: parseFloat(lon) };
  }
  throw new Error('Address not found');
}

// Geocode address without updating user profile (for one-time orders)
export const geocodeOnly = async (req, res) => {
  try {
    const { street, city, zipCode } = req.body;
    if (!street || !city || !zipCode) {
      return res.status(400).json({ success: false, message: 'Missing address fields' });
    }
    // Geocode
    const coordinates = await geocodeAddress({ street, city, zipCode });
    res.json({ success: true, coordinates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { street, city, zipCode } = req.body;
    if (!street || !city || !zipCode) {
      return res.status(400).json({ success: false, message: 'Missing address fields' });
    }
    // Geocode
    const coordinates = await geocodeAddress({ street, city, zipCode });
    // Update user profile
    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { 'address.street': street, 'address.city': city, 'address.zipCode': zipCode, 'address.coordinates': coordinates } },
      { new: true }
    ).select('-password');
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, address: updated.address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRewardPoints = async (req, res) => {
  try {
    const { userId } = req.params;
    const { points, useRewardId } = req.body;

    if (typeof points !== "number") {
      return res.status(400).json({ success: false, message: "Points must be a number" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Add points
    user.rewardPoints += points;

    // Auto-generate $5 rewards for every 100 points
    {/*
    let rewardsIssued = 0;
    while (user.rewardPoints >= 100) {
      user.rewardPoints -= 100;
      user.rewardHistory.push({ amount: 5 });
      rewardsIssued++;
    } */}
    const rewardsIssued = Math.floor(user.rewardPoints / 100);
    if (rewardsIssued > 0){
      for (let i = 0; i < rewardsIssued; i++){
        user.rewardHistory.push({ amount: 5, used: false });
      }
      user.rewardPoints = user.rewardPoints % 100;
    }

    // mark reward as used if rewardId is passed
    if (useRewardId) {
      const reward = user.rewardHistory.id(useRewardId);
      if (reward && !reward.used) {
        reward.used = true;
      } else {
        return res.status(400).json({ success: false, message: "reward not found or already used"});
      }
    }

    await user.save();

    return res.json({
      success: true,
      message: "Points updated successfully",
      rewardPoints: user.rewardPoints,
      rewardsIssued,
      rewards: user.rewardHistory
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markRewardUsed = async (req, res) => {
  try {
    const { userId, rewardId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const reward = user.rewardHistory.id(rewardId);
    if (!reward || reward.used) {
      return res.status(400).json({ success: false, message: 'Reward not found or already used' });
    }

    reward.used = true;
    await user.save();

    res.json({ success: true, message: 'Reward marked as used', reward });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { packaging } = req.body;
    const allowedPackaging = Object.values(PACKAGING_OPTIONS);

    if (!packaging || !allowedPackaging.includes(packaging)) {
      return res.status(400).json({ success: false, message: 'Invalid packaging preference' });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { 'preferences.packaging': packaging } },
      { new: true }
    ).select('-password');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, preferences: updated.preferences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
