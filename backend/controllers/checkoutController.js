const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const Invoice = require('../models/Invoice');

const checkout = async (req, res) => {
  try {

    const {
      customerId,
      items,
      payment_status,
      payment_method
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: 'Cart is empty'
      });
    }

    let totalAmount = 0;
    const invoiceItems = [];

    for (const item of items) {

      const product = await Inventory.findById(
        item.inventory_item
      );

      if (!product) {
        return res.status(404).json({
          message: 'Product not found'
        });
      }

      // Expiry Check
      if (
        product.expiry_date &&
        new Date(product.expiry_date) < new Date()
      ) {
        return res.status(400).json({
          message: `${product.item_name} is expired`
        });
      }

      // Stock Check
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `${product.item_name} has only ${product.quantity} units available`
        });
      }

      // Reduce Stock
      product.quantity -= item.quantity;

      await product.save();

      const subtotal =
        product.selling_price * item.quantity;

      totalAmount += subtotal;

      invoiceItems.push({
        inventory_item: product._id,
        item_name: product.item_name,
        quantity: item.quantity,
        selling_price: product.selling_price,
        subtotal
      });
    }

    // Create Invoice
    const invoice = await Invoice.create({
      customer: customerId,
      items: invoiceItems,
      total_amount: totalAmount,
      payment_status,
      payment_method
    });

    // Update Customer Khaata
    if (payment_status === 'Unpaid/Debt') {

      await Customer.findByIdAndUpdate(
        customerId,
        {
          $inc: {
            total_outstanding_debt:
              totalAmount
          }
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Transaction completed',
      invoice
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = { checkout };