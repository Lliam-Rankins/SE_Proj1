import { User } from '../models/User.model.js';
export const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await User.find({ role: 'restaurant' })
      .select('-password')
      .sort({ restaurantName: 1 });
    
    res.json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const restaurant = await User.findOne({ _id: id, role: 'restaurant' })
      .select('-password');
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Include recent reviews
    const Review = (await import('../models/Review.model.js')).default;
    const recentReviews = await Review.find({ restaurantId: id })
      .populate('customerId', 'name')
      .limit(5)
      .sort({ createdAt: -1 });

    const restaurantData = restaurant.toObject ? restaurant.toObject() : restaurant;
    
    res.json({
      success: true,
      data: restaurantData,
      recentReviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};