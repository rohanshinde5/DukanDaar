const DiaryEntry = require('../models/DiaryEntry');

// GET /api/diary  — list all entries, pinned first
const getEntries = async (req, res) => {
  try {
    const entries = await DiaryEntry.find()
      .sort({ is_pinned: -1, updated_at: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/diary  — create new entry
const createEntry = async (req, res) => {
  try {
    const { title, content, color } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Entry content cannot be empty.' });
    }
    const entry = await DiaryEntry.create({ title, content, color });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/diary/:id  — update entry (content, title, color, is_pinned)
const updateEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found.' });

    const { title, content, color, is_pinned } = req.body;

    if (content !== undefined) {
      if (content.trim() === '') {
        return res.status(400).json({ message: 'Entry content cannot be empty.' });
      }
      entry.content = content;
    }
    if (title !== undefined) entry.title = title;
    if (color !== undefined) entry.color = color;
    if (is_pinned !== undefined) entry.is_pinned = is_pinned;

    await entry.save(); // triggers pre-save to update updated_at
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/diary/:id  — delete entry
const deleteEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found.' });
    res.json({ message: 'Entry deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getEntries, createEntry, updateEntry, deleteEntry };
