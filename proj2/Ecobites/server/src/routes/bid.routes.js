import { Router } from 'express';
import {
  getAvailableCancelledOrders,
  placeBid,
  getBidsForOrder,
  getMyBids,
  acceptBid,
  rejectBid,
  cancelBid
} from '../controller/bid.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Get all cancelled orders available for bidding
router.get('/cancelled-orders', protect, getAvailableCancelledOrders);

// Place a bid on a cancelled order
router.post('/', protect, placeBid);

// Get user's own bids
router.get('/my-bids', protect, getMyBids);

// Get all bids for a specific order (for original customer)
router.get('/order/:orderId', protect, getBidsForOrder);

// Accept a bid
router.post('/:bidId/accept', protect, acceptBid);

// Reject a bid
router.post('/:bidId/reject', protect, rejectBid);

// Cancel own bid
router.delete('/:bidId', protect, cancelBid);

export default router;