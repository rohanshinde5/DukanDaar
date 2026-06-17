const Transaction = require('../models/Transaction');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');

const createTransaction = async (req, res) => {
  try {
    const { customerId, items, payment_status, payment_method } = req.body;
    let total_cost = 0;
    
    // 1. Verify quantities and expiry sequentially
    for (let item of items) {
      const invItem = await Inventory.findById(item.inventory_item);
      if (!invItem) throw new Error(`Item ${item.inventory_item} not found`);
      
      if (invItem.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${invItem.item_name}`);
      }
      
      if (new Date(invItem.expiry_date) < new Date()) {
        throw new Error(`Product ${invItem.item_name} is expired`);
      }
      
      total_cost += item.quantity * invItem.selling_price;
      item.price_at_checkout = invItem.selling_price;
      
      // 3. Decrement inventory
      invItem.quantity -= item.quantity;
      await invItem.save();
    }

    // 2. Save transaction
    const transaction = new Transaction({
      customer: customerId || null,
      items,
      total_cost,
      payment_status,
      payment_method
    });
    await transaction.save();

    // 4. Append debt if status is Debt
    if (payment_status === 'Unpaid/Debt' && customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        customer.total_outstanding_debt += total_cost;
        await customer.save();
      }
    }

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find()
      .populate('customer', 'name phone')
      .populate('items.inventory_item', 'item_name')
      .sort({ automated_timestamp: -1 })
      .skip(skip)
      .limit(limit);
      
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTransaction, getTransactions };
