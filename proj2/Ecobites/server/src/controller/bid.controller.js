import { Bid } from '../models/Bid.model.js';
import { Order } from '../models/Order.model.js';
import { User } from '../models/User.model.js';

// Get all cancelled orders available for bidding
export const getAvailableCancelledOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: 'CANCELLED',
      claimedBy: null // Only show unclaimed orders
    })
      .populate({ path: 'restaurantId', select: 'restaurantName name address' })
      .populate({ path: 'customerId', select: 'name' })
      .sort({ updatedAt: -1 })
      .limit(50);

    // Map to include restaurant info
    const formattedOrders = orders.map(order => {
      const obj = order.toObject();
      if (obj.restaurantId && typeof obj.restaurantId === 'object') {
        obj.restaurant = obj.restaurantId.restaurantName || obj.restaurantId.name || '';
        obj.restaurantId = obj.restaurantId._id;
      }
      if (obj.customerId && typeof obj.customerId === 'object') {
        obj.originalCustomer = obj.customerId.name || '';
        obj.customerId = obj.customerId._id;
      }
      return obj;
    });

    res.json({
      success: true,
      count: formattedOrders.length,
      data: formattedOrders
    });
  } catch (error) {
    console.error('getAvailableCancelledOrders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Place a bid on a cancelled order
export const placeBid = async (req, res) => {
  try {
    const { orderId, bidAmount, message, deliveryAddress, paymentMethod } = req.body;
    const bidderId = req.user._id;

    // Validate bidder is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can place bids'
      });
    }

    // Check if order exists and is cancelled
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Order is not cancelled and not available for bidding'
      });
    }

    if (order.claimedBy) {
      return res.status(400).json({
        success: false,
        message: 'Order has already been claimed'
      });
    }

    // Prevent original customer from bidding on their own cancelled order
    if (order.customerId.toString() === bidderId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot bid on your own cancelled order'
      });
    }

    // Check if user already has a pending bid on this order
    const existingBid = await Bid.findOne({
      orderId,
      bidderId,
      status: 'PENDING'
    });

    if (existingBid) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending bid on this order'
      });
    }

    // Validate bid amount
    if (!bidAmount || bidAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bid amount'
      });
    }

    // Bids expire after 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const bid = new Bid({
      orderId,
      bidderId,
      bidAmount,
      message: message || '',
      deliveryAddress, 
      paymentMethod, 
      expiresAt
    });

    await bid.save();

    res.status(201).json({
      success: true,
      data: bid
    });
  } catch (error) {
    console.error('placeBid error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all bids for a specific order (for original customer to review)
export const getBidsForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only the original customer can view bids on their order
    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view bids for this order'
      });
    }

    const bids = await Bid.find({ orderId })
      .populate({ path: 'bidderId', select: 'name email rewardPoints' })
      .sort({ bidAmount: -1, createdAt: -1 });

    res.json({
      success: true,
      count: bids.length,
      data: bids
    });
  } catch (error) {
    console.error('getBidsForOrder error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user's own bids
export const getMyBids = async (req, res) => {
  try {
    const bids = await Bid.find({ bidderId: req.user._id })
      .populate({ path: 'orderId', populate: { path: 'restaurantId', select: 'restaurantName name' } })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bids.length,
      data: bids
    });
  } catch (error) {
    console.error('getMyBids error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Accept a bid (original customer accepts someone's bid)
export const acceptBid = async (req, res) => {
  try {
    const { bidId } = req.params;
    //const { deliveryAddress, paymentMethod } = req.body;

    const bid = await Bid.findById(bidId).populate('orderId');
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    const order = bid.orderId;

    // Only original customer can accept bids
    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this bid'
      });
    }

    // Check bid is still pending and not expired
    if (bid.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Bid is no longer pending'
      });
    }

    if (new Date() > bid.expiresAt) {
      bid.status = 'EXPIRED';
      await bid.save();
      return res.status(400).json({
        success: false,
        message: 'Bid has expired'
      });
    }

    // Get the new customer's details
    const newCustomer = await User.findById(bid.bidderId);
    if (!newCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Bidder not found'
      });
    }

    // Accept the bid
    bid.status = 'ACCEPTED';
    await bid.save();

    // Update order: transfer to new customer
    order.customerId = bid.bidderId;
    order.claimedBy = bid.bidderId;
    order.claimedVia = 'BID';
    order.originalTotal = order.total;
    order.total = bid.bidAmount;
    order.deliveryAddress = bid.deliveryAddress;
    order.paymentMethod = bid.paymentMethod;

    /** 
    // Update delivery address - use provided address or new customer's default address
    if (deliveryAddress) {
      order.deliveryAddress = deliveryAddress;
    } else if (newCustomer.address) {
      order.deliveryAddress = newCustomer.address;
    }
    
    // Update payment method - use provided method or new customer's preference
    if (paymentMethod && ['cash', 'card', 'online'].includes(paymentMethod)) {
      order.paymentMethod = paymentMethod;
    } */
    
    order.status = 'PLACED'; // Restart the order lifecycle
    order.statusHistory.push({
      status: 'CLAIMED_BY_BID',
      updatedBy: req.user._id.toString()
    });
    order.statusHistory.push({
      status: 'PLACED',
      updatedBy: bid.bidderId.toString()
    });
    await order.save();

    // Reject all other pending bids for this order
    await Bid.updateMany(
      {
        orderId: order._id,
        _id: { $ne: bidId },
        status: 'PENDING'
      },
      { status: 'REJECTED' }
    );

    // Award eco points to original customer for not wasting food
    const RECLAIM_REWARD = 30;
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { rewardPoints: RECLAIM_REWARD }
    });

    res.json({
      success: true,
      message: `Bid accepted! You earned ${RECLAIM_REWARD} eco points for preventing food waste.`,
      data: {
        bid,
        order
      }
    });
  } catch (error) {
    console.error('acceptBid error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reject a specific bid
export const rejectBid = async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId).populate('orderId');
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    const order = bid.orderId;

    // Only original customer can reject bids
    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this bid'
      });
    }

    if (bid.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Bid is no longer pending'
      });
    }

    bid.status = 'REJECTED';
    await bid.save();

    res.json({
      success: true,
      message: 'Bid rejected',
      data: bid
    });
  } catch (error) {
    console.error('rejectBid error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Cancel own bid (before it's accepted)
export const cancelBid = async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId);
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Only the bidder can cancel their own bid
    if (bid.bidderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this bid'
      });
    }

    if (bid.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending bids'
      });
    }

    bid.status = 'REJECTED';
    await bid.save();

    res.json({
      success: true,
      message: 'Bid cancelled',
      data: bid
    });
  } catch (error) {
    console.error('cancelBid error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};