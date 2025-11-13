import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  items: [{
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    enum: [
      'PLACED',
      'placed',
      'pending',
      'RECEIVED',
      'received',
      'ACCEPTED',
      'accepted',
      'PREPARING',
      'preparing',
      'READY',
      'ready',
      'DRIVER_ASSIGNED',
      'driver_assigned',
      'PICKED_UP',
      'picked_up',
      'OUT_FOR_DELIVERY',
      'out_for_delivery',
      'DELIVERED',
      'delivered',
      'CANCELLED',
      'cancelled',
      'COMBINED'
    ],
    default: 'PLACED'
  },
  packagingPreference: {
    type: String,
    enum: ['reusable', 'compostable', 'minimal'],
    default: 'minimal'
  },
  ecoRewardPoints: {
    type: Number,
    default: 0
  },
  ecoRewardCredited: {
    type: Boolean,
    default: false
  },
  driverRewardPoints: {
    type: Number,
    default: 0
  },
  driverRewardCredited: {
    type: Boolean,
    default: false
  },
  deliveryAddress: {
    street: String,
    city: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  combineGroupId: {
    type: String,
    default: null
  },
  combineWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  
  // NEW FIELDS FOR BIDDING SYSTEM
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  claimedVia: {
    type: String,
    enum: ['BID', 'DIRECT'],
    default: null
  },
  originalTotal: {
    type: Number,
    default: null
  },
  // END NEW FIELDS
  
  subtotal: {
    type: Number,
    required: false,
    default: 0
  },
  deliveryFee: {
    type: Number,
    default: 5
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online'],
    default: 'card'
  },
  specialInstructions: String,
  estimatedDeliveryTime: Date,
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: String
  }]
}, {
  timestamps: true
});

// Auto-generate order number
orderSchema.pre('validate', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export const Order = mongoose.model('Order', orderSchema);
export default Order;