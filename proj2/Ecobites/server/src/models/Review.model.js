import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  // Restaurant owner's response to the review
  response: {
    text: {
      type: String,
      maxlength: 1000,
      trim: true
    },
    respondedAt: Date
  },
  // Optional: breakdown ratings for different aspects
  ratings: {
    food: {
      type: Number,
      min: 1,
      max: 5
    },
    service: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  // Helpful votes from other users
  helpfulCount: {
    type: Number,
    default: 0
  },
  // Track users who marked this review as helpful
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Flag for moderation
  flagged: {
    type: Boolean,
    default: false
  },
  flaggedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Verification status
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per customer per restaurant
reviewSchema.index({ restaurantId: 1, customerId: 1 }, { unique: true });

// Index for querying reviews by rating
reviewSchema.index({ restaurantId: 1, rating: 1 });

// Pre-save middleware to verify order if orderId is provided
reviewSchema.pre('save', async function(next) {
  if (this.isNew && this.orderId) {
    const Order = mongoose.model('Order');
    const order = await Order.findOne({
      _id: this.orderId,
      customerId: this.customerId,
      restaurantId: this.restaurantId,
      status: { $in: ['DELIVERED', 'delivered'] }
    });
    
    if (order) {
      this.verified = true;
    }
  }
  next();
});

// Static method to update restaurant's aggregate ratings
reviewSchema.statics.updateRestaurantRating = async function(restaurantId) {
  const stats = await this.aggregate([
    { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        // Calculate average for detailed ratings if they exist
        avgFood: { $avg: '$ratings.food' },
        avgService: { $avg: '$ratings.service' },
        avgDelivery: { $avg: '$ratings.delivery' },
        avgValue: { $avg: '$ratings.value' },
        // Rating distribution
        fiveStars: {
          $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
        },
        fourStars: {
          $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
        },
        threeStars: {
          $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] }
        },
        twoStars: {
          $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] }
        },
        oneStar: {
          $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }
        }
      }
    }
  ]);

  if (stats.length > 0) {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(restaurantId, {
      'restaurantInfo.averageRating': Math.round(stats[0].averageRating * 10) / 10,
      'restaurantInfo.totalReviews': stats[0].totalReviews,
      'restaurantInfo.ratingDistribution': {
        5: stats[0].fiveStars,
        4: stats[0].fourStars,
        3: stats[0].threeStars,
        2: stats[0].twoStars,
        1: stats[0].oneStar
      },
      'restaurantInfo.detailedRatings': {
        food: stats[0].avgFood ? Math.round(stats[0].avgFood * 10) / 10 : null,
        service: stats[0].avgService ? Math.round(stats[0].avgService * 10) / 10 : null,
        delivery: stats[0].avgDelivery ? Math.round(stats[0].avgDelivery * 10) / 10 : null,
        value: stats[0].avgValue ? Math.round(stats[0].avgValue * 10) / 10 : null
      }
    });
  } else {
    // No reviews, reset to defaults
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(restaurantId, {
      'restaurantInfo.averageRating': 0,
      'restaurantInfo.totalReviews': 0,
      'restaurantInfo.ratingDistribution': {
        5: 0, 4: 0, 3: 0, 2: 0, 1: 0
      }
    });
  }
  
  return stats.length > 0 ? stats[0] : null;
};

// Instance method to mark review as helpful
reviewSchema.methods.markHelpful = async function(userId) {
  if (!this.helpfulBy.includes(userId)) {
    this.helpfulBy.push(userId);
    this.helpfulCount = this.helpfulBy.length;
    await this.save();
  }
  return this;
};

// Instance method to unmark review as helpful
reviewSchema.methods.unmarkHelpful = async function(userId) {
  const index = this.helpfulBy.indexOf(userId);
  if (index > -1) {
    this.helpfulBy.splice(index, 1);
    this.helpfulCount = this.helpfulBy.length;
    await this.save();
  }
  return this;
};

export const Review = mongoose.model('Review', reviewSchema);

// Default export for compatibility
export default Review;
