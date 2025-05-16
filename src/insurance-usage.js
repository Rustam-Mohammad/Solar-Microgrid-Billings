const express = require('express');
const router = express.Router();

let submissions = [];
let drafts = [];

// GET all submissions and drafts
router.get('/', (req, res) => {
  res.json({ submissions, drafts });
});

// GET draft by id
router.get('/drafts/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id >= 0 && id < drafts.length) {
    res.json(drafts[id]);
  } else {
    res.status(404).json({ error: 'Draft not found' });
  }
});

// GET submission by id
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id >= 0 && id < submissions.length) {
    res.json(submissions[id]);
  } else {
    res.status(404).json({ error: 'Submission not found' });
  }
});

// POST submit new usage record
router.post('/submit', (req, res) => {
  const data = req.body;
  // Basic validation
  if (!data.fiscalYear || !data.usageDate || !data.insuranceAmountUsed) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  submissions.push(data);
  res.json({ message: 'Submission saved successfully' });
});

// POST save draft
router.post('/draft', (req, res) => {
  const data = req.body;
  drafts.push(data);
  res.json({ message: 'Draft saved successfully' });
});

// DELETE draft by id
router.delete('/drafts/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id >= 0 && id < drafts.length) {
    drafts.splice(id, 1);
    res.json({ message: 'Draft deleted successfully' });
  } else {
    res.status(404).json({ error: 'Draft not found' });
  }
});

module.exports = router;
