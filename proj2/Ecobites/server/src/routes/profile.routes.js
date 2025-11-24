import { Router } from 'express';
import { updateAddress, geocodeOnly, updateRewardPoints } from '../controller/profile.controller.js';
import { protect } from '../middleware/auth.middleware.js';


const router = Router();

// Geocode address without updating profile (for one-time orders)
router.post('/geocode', protect, geocodeOnly);

// Update address and geocode (for saving to profile)
router.post('/address', protect, updateAddress);

router.patch("/users/:userId/points", protect, updateRewardPoints);

export default router;
