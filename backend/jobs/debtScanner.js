const cron = require('node-cron');
const Customer = require('../models/Customer');

// Run once a week (e.g., Sunday at midnight)
cron.schedule('0 0 * * 0', async () => {
  console.log('Running weekly debt scanner...');
  try {
    // Clustering debts > 7 days (mock logic: we just scan customers with debt)
    const highDebtCustomers = await Customer.find({ total_outstanding_debt: { $gt: 0 } });
    
    // Trigger external messaging API (placeholder)
    const triggerWhatsAppAPI = (phone, amount) => {
      console.log(`[EXTERNAL API MOCK] Sending WhatsApp reminder to ${phone} for amount ${amount}`);
    };

    highDebtCustomers.forEach(customer => {
      if (customer.total_outstanding_debt > 1000) { // e.g. clustering high debts
        triggerWhatsAppAPI(customer.phone, customer.total_outstanding_debt);
      }
    });

  } catch (error) {
    console.error('Error in debt scanner job:', error.message);
  }
});
