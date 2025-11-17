import { Router } from 'express';
import { 
  createReview, 
  getReviewsByRestaurant, 
  updateReview, 
  deleteReview,
  respondToReview,
  markReviewHelpful,
  getMyReviews
} from '../controller/review.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// IMPORTANT: place specific routes BEFORE parameterized routes

// Get my reviews (customer's own reviews)
router.get('/my-reviews', protect, authorize('customer'), getMyReviews);

// Get all reviews for a restaurant (public)
router.get('/restaurant/:restaurantId', getReviewsByRestaurant);

// Create a review (customers only)
router.post('/', protect, authorize('customer'), createReview);

// Mark review as helpful
router.post('/:reviewId/helpful', protect, markReviewHelpful);

// Restaurant owner responds to review
router.post('/:reviewId/response', protect, authorize('restaurant'), respondToReview);

// Update own review (customers only)
router.put('/:reviewId', protect, authorize('customer'), updateReview);

// Delete own review (customers only)
router.delete('/:reviewId', protect, authorize('customer'), deleteReview);

export default router;