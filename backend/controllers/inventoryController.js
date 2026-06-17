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
    const item = await Inventory.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getInventory, addInventoryItem };
