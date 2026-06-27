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
      item.item_name_snapshot = invItem.item_name;
      
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
    
    const query = req.query.customer ? { customer: req.query.customer } : {};
    
    const transactions = await Transaction.find(query)
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

// GET /api/transactions/monthly-sales
// Returns current month's total sales and a 6-month history (excluding is_repayment records)
const getMonthlySales = async (req, res) => {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Current month total (only real sales, not repayments)
    const currentMonthResult = await Transaction.aggregate([
      {
        $match: {
          automated_timestamp: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
          is_repayment: { $ne: true }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total_cost' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    const currentMonthTotal = currentMonthResult[0]?.totalSales || 0;
    const currentMonthCount = currentMonthResult[0]?.transactionCount || 0;

    // 6-month history breakdown
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const monthlyHistory = await Transaction.aggregate([
      {
        $match: {
          automated_timestamp: { $gte: sixMonthsAgo },
          is_repayment: { $ne: true }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$automated_timestamp' },
            month: { $month: '$automated_timestamp' }
          },
          totalSales: { $sum: '$total_cost' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format month history with human-readable labels
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedHistory = monthlyHistory.map(m => ({
      label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      month: m._id.month,
      year: m._id.year,
      totalSales: m.totalSales,
      transactionCount: m.transactionCount,
      isCurrent: m._id.year === now.getFullYear() && m._id.month === (now.getMonth() + 1)
    }));

    res.json({
      currentMonth: {
        label: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
        totalSales: currentMonthTotal,
        transactionCount: currentMonthCount
      },
      history: formattedHistory
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTransaction, getTransactions, getMonthlySales };
