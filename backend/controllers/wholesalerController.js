const Wholesaler = require('../models/Wholesaler');

// GET /api/wholesalers
const getWholesalers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const wholesalers = await Wholesaler.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(wholesalers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/wholesalers/:id
const getWholesalerById = async (req, res) => {
  try {
    const wholesaler = await Wholesaler.findById(req.params.id);
    if (!wholesaler) {
      return res.status(404).json({ message: 'Wholesaler not found' });
    }
    res.json(wholesaler);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/wholesalers
const createWholesaler = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const wholesaler = new Wholesaler({ name, phone, purchases: [] });
    await wholesaler.save();
    res.status(201).json(wholesaler);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/wholesalers/:id
const updateWholesaler = async (req, res) => {
  try {
    const wholesaler = await Wholesaler.findById(req.params.id);
    if (!wholesaler) {
      return res.status(404).json({ message: 'Wholesaler not found' });
    }
    wholesaler.name = req.body.name || wholesaler.name;
    wholesaler.phone = req.body.phone || wholesaler.phone;
    await wholesaler.save();
    res.json(wholesaler);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/wholesalers/:id
const deleteWholesaler = async (req, res) => {
  try {
    const wholesaler = await Wholesaler.findByIdAndDelete(req.params.id);
    if (!wholesaler) {
      return res.status(404).json({ message: 'Wholesaler not found' });
    }
    res.json({ message: 'Wholesaler deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/wholesalers/:id/purchases
const addPurchase = async (req, res) => {
  try {
    const wholesaler = await Wholesaler.findById(req.params.id);
    if (!wholesaler) {
      return res.status(404).json({ message: 'Wholesaler not found' });
    }

    const { amount, description, purchase_date, status } = req.body;

    const purchaseData = { amount: Number(amount), description, status };
    if (purchase_date) {
      purchaseData.purchase_date = new Date(purchase_date);
      // Auto calculate due date 3 months later from provided purchase_date
      const d = new Date(purchaseData.purchase_date);
      d.setMonth(d.getMonth() + 3);
      purchaseData.due_date = d;
    }

    wholesaler.purchases.push(purchaseData);
    await wholesaler.save(); // Triggers pre-save middleware to compute dues/due_date
    res.status(201).json(wholesaler);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/wholesalers/:id/purchases/:purchaseId
const updatePurchase = async (req, res) => {
  try {
    const wholesaler = await Wholesaler.findById(req.params.id);
    if (!wholesaler) {
      return res.status(404).json({ message: 'Wholesaler not found' });
    }

    const purchase = wholesaler.purchases.id(req.params.purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    purchase.amount = req.body.amount !== undefined ? Number(req.body.amount) : purchase.amount;
    purchase.description = req.body.description !== undefined ? req.body.description : purchase.description;
    purchase.status = req.body.status !== undefined ? req.body.status : purchase.status;
    
    if (req.body.purchase_date !== undefined) {
      purchase.purchase_date = new Date(req.body.purchase_date);
      const d = new Date(purchase.purchase_date);
      d.setMonth(d.getMonth() + 3);
      purchase.due_date = d;
    }

    await wholesaler.save(); // Triggers pre-save middleware to compute dues/due_date
    res.json(wholesaler);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/wholesalers/:id/purchases/:purchaseId
const deletePurchase = async (req, res) => {
  try {
    const wholesaler = await Wholesaler.findById(req.params.id);
    if (!wholesaler) {
      return res.status(404).json({ message: 'Wholesaler not found' });
    }

    const purchase = wholesaler.purchases.id(req.params.purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    // In modern mongoose, subdocs are deleted using purchase.deleteOne()
    if (typeof purchase.deleteOne === 'function') {
      purchase.deleteOne();
    } else {
      purchase.remove();
    }

    await wholesaler.save(); // Triggers pre-save middleware to compute dues/due_date
    res.json(wholesaler);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getWholesalers,
  getWholesalerById,
  createWholesaler,
  updateWholesaler,
  deleteWholesaler,
  addPurchase,
  updatePurchase,
  deletePurchase
};
