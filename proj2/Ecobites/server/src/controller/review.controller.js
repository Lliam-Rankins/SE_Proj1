import Review from '../models/Review.model.js';
import { Order } from '../models/Order.model.js';
import { User } from '../models/User.model.js';

export const createReview = async (req, res) => {
  try {
    const { restaurantId, orderId, rating, comment, ratings } = req.body;
    const customerId = req.user._id;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        message: 'Rating must be between 1 and 5' 
      });
    }

    if (!restaurantId) {
      return res.status(400).json({ 
        success: false,
        message: 'Restaurant ID is required' 
      });
    }

    // Optional: Verify user has completed an order from this restaurant
    if (orderId) {
      const order = await Order.findOne({ 
        _id: orderId, 
        customerId,
        restaurantId,
        status: { $in: ['DELIVERED', 'delivered'] }
      });
      
      if (!order) {
        return res.status(403).json({ 
          success: false,
          message: 'You can only review restaurants you have received orders from' 
        });
      }
    }

    // Check if user already reviewed this restaurant
    const existingReview = await Review.findOne({ 
      restaurantId, 
      customerId 
    });
    
    if (existingReview) {
      return res.status(400).json({ 
        success: false,
        message: 'You have already reviewed this restaurant. Please update your existing review.' 
      });
    }

    // Create review
    const review = await Review.create({
      restaurantId,
      customerId,
      orderId,
      rating,
      comment,
      ratings
    });

    // Update restaurant's average rating
    await Review.updateRestaurantRating(restaurantId);

    // get updated res info
    const restaurant = await User.findById(restaurantId);

    // Return review with populated customer info
    const populatedReview = await Review.findById(review._id)
      .populate('customerId', 'name email');

    res.status(201).json( {
      review: populatedReview,
      stats: {
        averageRating: restaurant?.restaurantInfo?.averageRating || 0,
        totalReviews: restaurant?.restaurantInfo?.totalReviews || 0,
        ratingDistribution: restaurant?.restaurantInfo?.ratingDistribution || {},
        detailedRatings: restaurant?.restaurantInfo?.detailedRatings || {}
      }});
  } catch (error) {
    console.error('createReview error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getReviewsByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt',
      order = 'desc',
      rating,
      verified 
    } = req.query;

    // Build filter
    const filter = { restaurantId };
    if (rating) filter.rating = parseInt(rating);
    if (verified === 'true') filter.verified = true;

    const reviews = await Review.find(filter)
      .populate('customerId', 'name')
      .populate('orderId', 'orderNumber')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Review.countDocuments(filter);

    // Get aggregate stats from restaurant
    const restaurant = await User.findById(restaurantId);

    res.json({
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        averageRating: restaurant?.restaurantInfo?.averageRating || 0,
        totalReviews: restaurant?.restaurantInfo?.totalReviews || 0,
        ratingDistribution: restaurant?.restaurantInfo?.ratingDistribution || {},
        detailedRatings: restaurant?.restaurantInfo?.detailedRatings || {}
      }
    });
  } catch (error) {
    console.error('getReviewsByRestaurant error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, ratings } = req.body;
    const customerId = req.user._id;

    const review = await Review.findOne({ _id: reviewId, customerId });

    if (!review) {
      return res.status(404).json({ 
        success: false,
        message: 'Review not found or unauthorized' 
      });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          success: false,
          message: 'Rating must be between 1 and 5' 
        });
      }
      review.rating = rating;
    }
    
    if (comment !== undefined) review.comment = comment;
    if (ratings !== undefined) review.ratings = ratings;
    
    await review.save();

    // Update restaurant's average rating
    await Review.updateRestaurantRating(review.restaurantId);

    const restaurant = await User.findById(review.restaurantId);

    // Return populated review
    const updatedReview = await Review.findById(review._id)
      .populate('customerId', 'name email');

    res.json({
      review: updatedReview,
      stats: {
        averageRating: restaurant?.restaurantInfo?.averageRating || 0,
        totalReviews: restaurant?.restaurantInfo?.totalReviews || 0,
        ratingDistribution: restaurant?.restaurantInfo?.ratingDistribution || {},
        detailedRatings: restaurant?.restaurantInfo?.detailedRatings || {}
      }});
  } catch (error) {
    console.error('updateReview error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const customerId = req.user._id;

    const review = await Review.findOne({ _id: reviewId, customerId });

    if (!review) {
      return res.status(404).json({ 
        success: false,
        message: 'Review not found or unauthorized' 
      });
    }

    const restaurantId = review.restaurantId;
    await Review.deleteOne({ _id: reviewId });

    // Update restaurant's average rating
    await Review.updateRestaurantRating(restaurantId);

    const restaurant = await User.findById(restaurantId);

    res.json({ 
      success: true,
      message: 'Review deleted successfully',
      stats: {
        averageRating: restaurant?.restaurantInfo?.averageRating || 0,
        totalReviews: restaurant?.restaurantInfo?.totalReviews || 0,
        ratingDistribution: restaurant?.restaurantInfo?.ratingDistribution || {},
        detailedRatings: restaurant?.restaurantInfo?.detailedRatings || {}
      } 
    });
  } catch (error) {
    console.error('deleteReview error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const respondToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    const restaurantId = req.user._id;

    // Verify user is a restaurant owner
    if (req.user.role !== 'restaurant') {
      return res.status(403).json({ 
        success: false,
        message: 'Only restaurant owners can respond to reviews' 
      });
    }

    const review = await Review.findOne({ _id: reviewId, restaurantId });

    if (!review) {
      return res.status(404).json({ 
        success: false,
        message: 'Review not found' 
      });
    }

    review.response = {
      text: response,
      respondedAt: new Date()
    };
    
    await review.save();

    // Return populated review
    const updatedReview = await Review.findById(review._id)
      .populate('customerId', 'name');

    res.json(updatedReview);
  } catch (error) {
    console.error('respondToReview error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ 
        success: false,
        message: 'Review not found' 
      });
    }

    // Toggle helpful status
    const alreadyMarked = review.helpfulBy.some(
      id => id.toString() === userId.toString()
    );

    if (alreadyMarked) {
      await review.unmarkHelpful(userId);
    } else {
      await review.markHelpful(userId);
    }

    res.json({ 
      success: true,
      helpful: !alreadyMarked,
      helpfulCount: review.helpfulCount 
    });
  } catch (error) {
    console.error('markReviewHelpful error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ customerId })
      .populate('restaurantId', 'name restaurantInfo.cuisine')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Review.countDocuments({ customerId });

    res.json({
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('getMyReviews error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};