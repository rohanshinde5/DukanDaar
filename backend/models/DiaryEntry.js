const mongoose = require('mongoose');

const diaryEntrySchema = new mongoose.Schema({
  title: { type: String, default: '' },
  content: { type: String, required: true },
  is_pinned: { type: Boolean, default: false },
  color: {
    type: String,
    enum: ['default', 'yellow', 'green', 'blue', 'red', 'purple'],
    default: 'default'
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Auto-update `updated_at` on every save (async style — required for Mongoose v7+)
diaryEntrySchema.pre('save', async function () {
  this.updated_at = new Date();
});


module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);
