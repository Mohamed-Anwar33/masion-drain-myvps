const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  customerInfo: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
    notes: { type: String, trim: true }
  },

  items: [orderItemSchema],

  subtotal: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },

  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'bank_transfer', 'credit_card', 'paypal'],
    default: 'cash_on_delivery'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  trackingNumber: { type: String, trim: true },
  orderDate: { type: Date, default: Date.now },
  adminNotes: { type: String, trim: true },
  
  // PayPal specific fields
  paypalOrderId: { type: String, trim: true },
  paypalCaptureId: { type: String, trim: true },
  paymentDetails: {
    paypalOrderId: { type: String },
    paypalCaptureId: { type: String },
    captureTime: { type: Date },
    amount: {
      currency_code: { type: String },
      value: { type: String }
    }
  }
}, {
  timestamps: true
});

// Generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const todayStart = new Date(year, date.getMonth(), date.getDate());
    const todayEnd = new Date(year, date.getMonth(), date.getDate() + 1);
    
    const lastOrder = await this.constructor.findOne({
      createdAt: { $gte: todayStart, $lt: todayEnd }
    }).sort({ createdAt: -1 });
    
    let orderCount = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-').pop());
      orderCount = lastNumber + 1;
    }
    
    this.orderNumber = `MD-${year}${month}${day}-${String(orderCount).padStart(3, '0')}`;
  }
  next();
});

// Static method to generate order number
orderSchema.statics.generateOrderNumber = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const todayStart = new Date(year, date.getMonth(), date.getDate());
  const todayEnd = new Date(year, date.getMonth(), date.getDate() + 1);
  
  const lastOrder = await this.findOne({
    createdAt: { $gte: todayStart, $lt: todayEnd }
  }).sort({ createdAt: -1 });
  
  let orderCount = 1;
  if (lastOrder && lastOrder.orderNumber) {
    const lastNumber = parseInt(lastOrder.orderNumber.split('-').pop());
    if (!isNaN(lastNumber)) {
      orderCount = lastNumber + 1;
    }
  }
  
  return `MD-${year}${month}${day}-${String(orderCount).padStart(3, '0')}`;
};

// Add static method for filtering orders
orderSchema.statics.findWithFilters = function(filters = {}) {
  const query = this.find();
  
  // Apply filters
  if (filters.status) {
    query.where('status').equals(filters.status);
  }
  
  if (filters.paymentStatus) {
    query.where('paymentStatus').equals(filters.paymentStatus);
  }
  
  if (filters.startDate && filters.endDate) {
    query.where('createdAt').gte(filters.startDate).lte(filters.endDate);
  }
  
  if (filters.search) {
    query.or([
      { orderNumber: { $regex: filters.search, $options: 'i' } },
      { 'customerInfo.name': { $regex: filters.search, $options: 'i' } },
      { 'customerInfo.email': { $regex: filters.search, $options: 'i' } }
    ]);
  }
  
  // Apply sorting
  if (filters.sortBy) {
    const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
    query.sort({ [filters.sortBy]: sortOrder });
  } else {
    query.sort({ createdAt: -1 }); // Default sort by newest first
  }
  
  // Apply pagination
  if (filters.limit) {
    query.limit(parseInt(filters.limit));
  }
  
  if (filters.skip) {
    query.skip(parseInt(filters.skip));
  }
  
  return query.populate('items.productId');
};

module.exports = mongoose.model('Order', orderSchema);