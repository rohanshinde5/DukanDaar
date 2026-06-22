const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = req.query.search ? { phone: { $regex: req.query.search, $options: 'i' } } : {};

    const customers = await Customer.find(query)
      .sort({ total_outstanding_debt: -1 })
      .skip(skip)
      .limit(limit);
      
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addCustomer = async (req, res) => {
  try {

    const existingCustomer = await Customer.findOne({
      phone: req.body.phone
    });

    if (existingCustomer) {
      return res.status(400).json({
        message: "Customer already exists"
      });
    }

    const customer = await Customer.create({
      name: req.body.name,
      phone: req.body.phone,
      age: req.body.age
    });

    res.status(201).json(customer);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const updateCustomerDebt = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const { amountPaid, clearAll, paymentMethod } = req.body;
    let actualPaid = 0;

    if (clearAll) {
      actualPaid = customer.total_outstanding_debt;
      customer.total_outstanding_debt = 0;
    } else if (amountPaid !== undefined) {
      const parsedAmount = Number(amountPaid);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: 'Repayment amount must be greater than 0' });
      }
      if (customer.total_outstanding_debt - parsedAmount < 0) {
        return res.status(400).json({ message: 'Payment amount exceeds outstanding debt' });
      }
      actualPaid = parsedAmount;
      customer.total_outstanding_debt -= parsedAmount;
    } else {
      return res.status(400).json({ message: 'Please specify amountPaid or clearAll' });
    }

    await customer.save();

    // Log the debt payment transaction for invoice history
    if (actualPaid > 0) {
      const transaction = new Transaction({
        customer: customer._id,
        items: [],
        total_cost: actualPaid,
        payment_status: 'Paid',
        payment_method: paymentMethod || 'Cash',
        is_repayment: true
      });
      await transaction.save();
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCustomers, getCustomerById, addCustomer, updateCustomerDebt };
