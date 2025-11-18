import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  bidderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    default: 'PENDING'
  },
  message: {
    type: String,
    maxlength: 500
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
bidSchema.index({ orderId: 1, status: 1 });
bidSchema.index({ bidderId: 1, status: 1 });
bidSchema.index({ expiresAt: 1 });

export const Bid = mongoose.model('Bid', bidSchema);
export default Bid;