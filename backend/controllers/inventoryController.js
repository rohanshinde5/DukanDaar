const Inventory = require('../models/Inventory');

const getInventory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = req.query.search ? { item_name: { $regex: req.query.search, $options: 'i' } } : {};
    
    const inventory = await Inventory.find(query)
      .sort({ item_name: 1 })
      .skip(skip)
      .limit(limit);
      
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addInventoryItem = async (req, res) => {
  try {
    if (req.body.quantity !== undefined && Number(req.body.quantity) < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }
    const item = await Inventory.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    if (req.body.quantity !== undefined && Number(req.body.quantity) < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    item.item_name = req.body.item_name !== undefined ? req.body.item_name : item.item_name;
    item.quantity = req.body.quantity !== undefined ? Number(req.body.quantity) : item.quantity;
    item.cost_price = req.body.cost_price !== undefined ? Number(req.body.cost_price) : item.cost_price;
    item.selling_price = req.body.selling_price !== undefined ? Number(req.body.selling_price) : item.selling_price;
    item.expiry_date = req.body.expiry_date !== undefined ? new Date(req.body.expiry_date) : item.expiry_date;
    item.sales_speed = req.body.sales_speed !== undefined ? Number(req.body.sales_speed) : item.sales_speed;

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.json({ message: 'Inventory item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem };
