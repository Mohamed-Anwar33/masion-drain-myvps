const mongoose = require('mongoose');
const Order = require('./models/Order');
const Product = require('./models/Product');
require('dotenv').config();

async function testOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check existing orders
    const existingOrders = await Order.find().limit(5);
    console.log(`📦 Orders in database: ${await Order.countDocuments()}`);
    
    if (existingOrders.length > 0) {
      console.log('📋 Sample orders:');
      existingOrders.forEach(order => {
        console.log(`  - ${order.orderNumber} - ${order.customerInfo.firstName} ${order.customerInfo.lastName} - $${order.total} - ${order.orderStatus}`);
      });
    } else {
      console.log('📋 No orders found. Creating sample orders...');
      
      // Get some products to create orders
      const products = await Product.find().limit(3);
      if (products.length === 0) {
        console.log('❌ No products found to create orders');
        return;
      }

      // Create sample orders
      const sampleOrders = [
        {
          items: [
            {
              product: products[0]._id,
              quantity: 2,
              price: products[0].price,
              name: products[0].name
            }
          ],
          total: products[0].price * 2,
          customerInfo: {
            firstName: 'أحمد',
            lastName: 'محمد',
            email: 'ahmed.mohamed@example.com',
            phone: '+201234567890',
            address: '123 شارع النيل',
            city: 'القاهرة',
            postalCode: '12345',
            country: 'مصر'
          },
          paymentMethod: 'card',
          paymentStatus: 'completed',
          orderStatus: 'confirmed'
        },
        {
          items: [
            {
              product: products[1]._id,
              quantity: 1,
              price: products[1].price,
              name: products[1].name
            },
            {
              product: products[2]._id,
              quantity: 1,
              price: products[2].price,
              name: products[2].name
            }
          ],
          total: products[1].price + products[2].price,
          customerInfo: {
            firstName: 'فاطمة',
            lastName: 'علي',
            email: 'fatima.ali@example.com',
            phone: '+201987654321',
            address: '456 شارع الجمهورية',
            city: 'الإسكندرية',
            postalCode: '54321',
            country: 'مصر'
          },
          paymentMethod: 'paypal',
          paymentStatus: 'pending',
          orderStatus: 'pending'
        },
        {
          items: [
            {
              product: products[0]._id,
              quantity: 3,
              price: products[0].price,
              name: products[0].name
            }
          ],
          total: products[0].price * 3,
          customerInfo: {
            firstName: 'محمد',
            lastName: 'حسن',
            email: 'mohamed.hassan@example.com',
            phone: '+201555666777',
            address: '789 شارع المعز',
            city: 'الجيزة',
            postalCode: '67890',
            country: 'مصر'
          },
          paymentMethod: 'bank_transfer',
          paymentStatus: 'completed',
          orderStatus: 'shipped'
        }
      ];

      for (const orderData of sampleOrders) {
        const orderNumber = await Order.generateOrderNumber();
        const order = new Order({
          ...orderData,
          orderNumber
        });
        await order.save();
        console.log(`✅ Created order: ${order.orderNumber}`);
      }
    }

    // Test order statistics
    const stats = await Order.getOrderStats();
    console.log('\n📊 Order Statistics:');
    console.log(`  - Total Orders: ${stats.totalOrders}`);
    console.log(`  - Total Revenue: $${stats.totalRevenue}`);
    console.log(`  - Average Order Value: $${stats.averageOrderValue}`);
    console.log(`  - Status Breakdown: ${JSON.stringify(stats.statusBreakdown)}`);

    // Test order filtering
    const pendingOrders = await Order.findWithFilters({ orderStatus: 'pending' });
    console.log(`\n🔍 Pending Orders: ${pendingOrders.length}`);

    const completedPayments = await Order.findWithFilters({ paymentStatus: 'completed' });
    console.log(`💳 Completed Payments: ${completedPayments.length}`);

    console.log('\n✅ Order tests completed successfully');

  } catch (error) {
    console.error('❌ Error testing orders:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testOrders();