const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Inventory = require('./models/Inventory');
const Wholesaler = require('./models/Wholesaler');
const Transaction = require('./models/Transaction');
const bcrypt = require('bcryptjs');

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://rohansnshinde05_db_user:66WosflgxQLxwRmy@cluster0.c8pojcg.mongodb.net/?appName=Cluster0');
    console.log('MongoDB connected for seeding.');

    // Clear existing data
    await User.deleteMany();
    await Customer.deleteMany();
    await Inventory.deleteMany();
    await Wholesaler.deleteMany();
    await Transaction.deleteMany();

    // 1. Create a mock user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    await User.create({ email: 'admin@dukandaar.com', phone: '1234567890', password: hashedPassword });

    // 2. Create Wholesalers
    await Wholesaler.create([
      { 
        name: 'Raju Traders', 
        phone: '9876543210', 
        purchases: [
          { amount: 10000, description: 'Wheat flour bulk order', status: 'Unpaid', purchase_date: new Date('2026-04-01'), due_date: new Date('2026-07-01') },
          { amount: 5000, description: 'Spices and pulses bulk', status: 'Unpaid', purchase_date: new Date('2026-04-10'), due_date: new Date('2026-07-10') },
          { amount: 8000, description: 'Edible Oils', status: 'Paid', purchase_date: new Date('2026-03-01'), due_date: new Date('2026-06-01') }
        ]
      },
      { 
        name: 'Metro Cash & Carry', 
        phone: '9876543211', 
        purchases: [
          { amount: 25000, description: 'Canned Goods and Toiletries', status: 'Unpaid', purchase_date: new Date('2026-04-15'), due_date: new Date('2026-07-15') }
        ]
      }
    ]);

    // 3. Create Inventory (including low stock and expired)
    const inventoryItems = await Inventory.insertMany([
      { item_name: 'Aashirvaad Atta 5kg', quantity: 50, cost_price: 200, selling_price: 220, expiry_date: new Date('2027-01-01'), sales_speed: 2 },
      { item_name: 'Tata Salt 1kg', quantity: 100, cost_price: 20, selling_price: 24, expiry_date: new Date('2028-01-01'), sales_speed: 5 },
      { item_name: 'Low Stock Maggi', quantity: 2, cost_price: 12, selling_price: 14, expiry_date: new Date('2027-05-01'), sales_speed: 10 },
      { item_name: 'Expired Milk', quantity: 10, cost_price: 30, selling_price: 35, expiry_date: new Date('2026-06-01'), sales_speed: 1 } // Already expired
    ]);

    // 4. Create Customers (diverse profiles for ML)
    await Customer.insertMany([
      { name: 'Ramesh Singh', phone: '9000000001', age: 45, total_outstanding_debt: 5000, risk_category: 'High', delay_velocity: 15 },
      { name: 'Sita Devi', phone: '9000000002', age: 38, total_outstanding_debt: 0, risk_category: 'Low', delay_velocity: 0 },
      { name: 'Amit Kumar', phone: '9000000003', age: 29, total_outstanding_debt: 1200, risk_category: 'Medium', delay_velocity: 5 }
    ]);

    console.log('Database seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
};

seedDB();
