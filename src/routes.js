const express = require('express');
const router = express.Router();
const db = require('./db');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const csv = require('csv-parser');
const fs = require('fs');

router.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username, password });

  db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }
    console.log('Database row:', row);
    if (!row) {
      console.log('No matching user found');
      return res.json({ success: false, error: 'Invalid username or password' });
    }
    console.log('Login successful:', { username: row.username, role: row.role });
    res.json({ success: true, role: row.role || 'user', username: row.username, hamlet: row.hamlet });
  });
});

router.get('/api/hh-list', (req, res) => {
  const hamlet = req.query.hamlet;
  const all = req.query.all === 'true';
  console.log('Fetching HH list for hamlet:', hamlet, 'all:', all);
  const query = all
    ? (hamlet ? 'SELECT * FROM hh WHERE lower(hamlet) = lower(?)' : 'SELECT * FROM hh')
    : (hamlet ? 'SELECT customer_id, hh_name FROM hh WHERE lower(hamlet) = lower(?)' : 'SELECT customer_id, hh_name FROM hh');
  db.all(query, hamlet ? [hamlet] : [], (err, rows) => {
    if (err) {
      console.error('Error fetching HH list:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    rows.forEach(row => {
      if (all) {
        row.submissions = JSON.parse(row.submissions || '[]');
        row.drafts = JSON.parse(row.drafts || '[]');
      }
    });
    console.log('HH list:', rows);
    res.json(rows);
  });
});

router.get('/api/vec-list', (req, res) => {
  const hamlet = req.query.hamlet;
  console.log('Fetching VEC list for hamlet:', hamlet);
  const query = hamlet ? 'SELECT * FROM vec WHERE lower(hamlet) = lower(?)' : 'SELECT * FROM vec';
  db.all(query, hamlet ? [hamlet] : [], (err, rows) => {
    if (err) {
      console.error('Error fetching VEC list:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    rows.forEach(row => {
      row.submissions = JSON.parse(row.submissions || '[]');
    });
    console.log('VEC list:', rows);
    res.json(rows);
  });
});

router.get('/api/hh/:customer_id', (req, res) => {
  const { customer_id } = req.params;
  db.get('SELECT * FROM hh WHERE customer_id = ?', [customer_id], (err, row) => {
    if (err) {
      console.error('Error fetching HH:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      console.log('Household not found:', customer_id);
      return res.status(404).json({ error: 'Household not found' });
    }
    console.log('Raw HH Row:', row);
    row.submissions = JSON.parse(row.submissions || '[]');
    row.drafts = JSON.parse(row.drafts || '[]');
    res.json(row);
  });
});

router.post('/api/hh/:customer_id/draft', upload.fields([{ name: 'issue_img' }, { name: 'meter_image' }]), (req, res) => {
  const { customer_id } = req.params;
  const draft = JSON.parse(req.body.draft || '{}');
  db.get('SELECT drafts FROM hh WHERE customer_id = ?', [customer_id], (err, row) => {
    if (err) {
      console.error('Error fetching HH for draft:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) return res.status(404).json({ error: 'Household not found' });
    const drafts = JSON.parse(row.drafts || '[]');
    drafts.push(draft);
    db.run('UPDATE hh SET drafts = ? WHERE customer_id = ?', [JSON.stringify(drafts), customer_id], (err) => {
      if (err) {
        console.error('Error saving draft:', err);
        return res.status(500).json({ error: 'Database update error' });
      }
      console.log('Draft saved:', customer_id);
      res.json({ success: true });
    });
  });
});

router.post('/api/hh/:customer_id/submit', upload.fields([{ name: 'issue_img' }, { name: 'meter_image' }]), (req, res) => {
  const { customer_id } = req.params;
  const draftIndex = req.query.draft;
  const submission = JSON.parse(req.body.submission || '{}');
  db.get('SELECT submissions, drafts FROM hh WHERE customer_id = ?', [customer_id], (err, row) => {
    if (err) {
      console.error('Error fetching HH for submit:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) return res.status(404).json({ error: 'Household not found' });
    const submissions = JSON.parse(row.submissions || '[]');
    const drafts = JSON.parse(row.drafts || '[]');
    const submissionMonth = submission.read_date ? submission.read_date.slice(0, 7) : null;
    if (submissionMonth && submissions.some(sub => sub.read_date && sub.read_date.slice(0, 7) === submissionMonth)) {
      return res.status(400).json({ error: 'A submission for this month already exists' });
    }
    if (draftIndex !== undefined) {
      const idx = parseInt(draftIndex);
      if (idx >= 0 && idx < drafts.length) {
        submissions.push(submission);
        drafts.splice(idx, 1);
        db.run('UPDATE hh SET submissions = ?, drafts = ? WHERE customer_id = ?', 
          [JSON.stringify(submissions), JSON.stringify(drafts), customer_id], (err) => {
            if (err) {
              console.error('Error updating HH submissions:', err);
              return res.status(500).json({ error: 'Database update error' });
            }
            console.log('HH submission updated from draft:', customer_id);
            res.json({ success: true });
          });
      } else {
        return res.status(400).json({ error: 'Invalid draft index' });
      }
    } else {
      submissions.push(submission);
      db.run('UPDATE hh SET submissions = ? WHERE customer_id = ?', [JSON.stringify(submissions), customer_id], (err) => {
        if (err) {
          console.error('Error updating HH submissions:', err);
          return res.status(500).json({ error: 'Database update error' });
        }
        console.log('HH submission updated:', customer_id);
        res.json({ success: true });
      });
    }
  });
});

router.get('/api/vec/:hamlet', (req, res) => {
  const { hamlet } = req.params;
  db.get('SELECT * FROM vec WHERE hamlet = ?', [hamlet], (err, row) => {
    if (err) {
      console.error('Error fetching VEC:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      console.log('VEC not found:', hamlet);
      return res.status(404).json({ error: 'VEC not found' });
    }
    console.log('Raw VEC Row:', row);
    row.submissions = JSON.parse(row.submissions || '[]');
    res.json(row);
  });
});

router.post('/api/vec/:hamlet/submit', upload.single('issue_img'), (req, res) => {
  const { hamlet } = req.params;
  const submission = JSON.parse(req.body.submission || '{}');
  db.get('SELECT submissions FROM vec WHERE hamlet = ?', [hamlet], (err, row) => {
    if (err) {
      console.error('Error fetching VEC for submit:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) return res.status(404).json({ error: 'VEC not found' });
    const submissions = JSON.parse(row.submissions || '[]');
    const submissionMonth = submission.submission_date ? submission.submission_date.slice(0, 7) : null;
    if (submissionMonth && submissions.some(sub => sub.submission_date && sub.submission_date.slice(0, 7) === submissionMonth)) {
      return res.status(400).json({ error: 'A submission for this month already exists' });
    }
    submissions.push(submission);
    db.run('UPDATE vec SET submissions = ? WHERE hamlet = ?', [JSON.stringify(submissions), hamlet], (err) => {
      if (err) {
        console.error('Error updating VEC submissions:', err);
        return res.status(500).json({ error: 'Database update error' });
      }
      console.log('VEC submission updated:', hamlet);
      res.json({ success: true });
    });
  });
});

router.post('/api/hh/:customer_id/edit', (req, res) => {
  const { customer_id } = req.params;
  const { subIndex, ...submission } = req.body;
  db.get('SELECT submissions FROM hh WHERE customer_id = ?', [customer_id], (err, row) => {
    if (err) {
      console.error('Error fetching HH for edit:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) return res.status(404).json({ error: 'Household not found' });
    const submissions = JSON.parse(row.submissions || '[]');
    if (subIndex < 0 || subIndex >= submissions.length) {
      return res.status(400).json({ error: 'Invalid submission index' });
    }
    const submissionMonth = submission.read_date ? submission.read_date.slice(0, 7) : null;
    const otherSubmissions = submissions.filter((_, idx) => idx !== subIndex);
    if (submissionMonth && otherSubmissions.some(sub => sub.read_date && sub.read_date.slice(0, 7) === submissionMonth)) {
      return res.status(400).json({ error: 'A submission for this month already exists' });
    }
    submissions[subIndex] = submission;
    db.run('UPDATE hh SET submissions = ? WHERE customer_id = ?', [JSON.stringify(submissions), customer_id], (err) => {
      if (err) {
        console.error('Error updating HH submission:', err);
        return res.status(500).json({ error: 'Database update error' });
      }
      console.log('HH submission edited:', customer_id, subIndex);
      res.json({ success: true });
    });
  });
});

router.post('/api/vec/:hamlet/edit', (req, res) => {
  const { hamlet } = req.params;
  const { subIndex, ...submission } = req.body;
  db.get('SELECT submissions FROM vec WHERE hamlet = ?', [hamlet], (err, row) => {
    if (err) {
      console.error('Error fetching VEC for edit:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) return res.status(404).json({ error: 'VEC not found' });
    const submissions = JSON.parse(row.submissions || '[]');
    if (subIndex < 0 || subIndex >= submissions.length) {
      return res.status(400).json({ error: 'Invalid submission index' });
    }
    const submissionMonth = submission.submission_date ? submission.submission_date.slice(0, 7) : null;
    const otherSubmissions = submissions.filter((_, idx) => idx !== subIndex);
    if (submissionMonth && otherSubmissions.some(sub => sub.submission_date && sub.submission_date.slice(0, 7) === submissionMonth)) {
      return res.status(400).json({ error: 'A submission for this month already exists' });
    }
    submissions[subIndex] = submission;
    db.run('UPDATE vec SET submissions = ? WHERE hamlet = ?', [JSON.stringify(submissions), hamlet], (err) => {
      if (err) {
        console.error('Error updating VEC submission:', err);
        return res.status(500).json({ error: 'Database update error' });
      }
      console.log('VEC submission edited:', hamlet, subIndex);
      res.json({ success: true });
    });
  });
});

router.get('/api/users', (req, res) => {
  db.all('SELECT username, password, role, hamlet FROM users WHERE role = "operator"', (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

router.post('/api/users/add', (req, res) => {
  const { username, password, hamlet } = req.body;
  db.run('INSERT INTO users (username, password, role, hamlet) VALUES (?, ?, ?, ?)', 
    [username, password, 'operator', hamlet], (err) => {
      if (err) {
        console.error('Error adding user:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log('User added:', { username, hamlet });
      res.json({ success: true });
    });
});

router.post('/api/users/remove', (req, res) => {
  const { username } = req.body;
  db.run('DELETE FROM users WHERE username = ? AND role = "operator"', [username], (err) => {
    if (err) {
      console.error('Error removing user:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log('User removed:', username);
    res.json({ success: true });
  });
});

router.post('/api/hh/bulk', upload.single('file'), (req, res) => {
  const role = req.headers['x-user-role'] || 'operator';
  if (role !== 'spoc') {
    return res.status(403).json({ error: 'Bulk upload restricted to SPOC only' });
  }
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      const inserts = results.map(row => 
        new Promise((resolve, reject) => {
          const meterNum = row.meter_num || `M-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          console.log('Inserting HH:', { customer_id: row.customer_id, hh_name: row.hh_name, hamlet: row.hamlet.trim() });
          db.run('INSERT OR IGNORE INTO hh (customer_id, hh_name, hamlet, state, district, block, gp, village, vec_name, meter_num, submissions, drafts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [row.customer_id, row.hh_name, row.hamlet.trim(), row.state, row.district, row.block, row.gp, row.village, row.vec_name, meterNum, '[]', '[]'], (err) => {
              if (err) reject(err);
              else resolve();
            });
        })
      );
      Promise.all(inserts)
        .then(() => {
          fs.unlinkSync(req.file.path);
          console.log('Bulk HH upload completed:', results.length);
          res.json({ success: true, count: results.length });
        })
        .catch(err => {
          console.error('Error during bulk HH upload:', err);
          res.status(500).json({ error: 'Database error' });
        });
    });
});

router.post('/api/vec/bulk', upload.single('file'), (req, res) => {
  const role = req.headers['x-user-role'] || 'operator';
  if (role !== 'spoc') {
    return res.status(403).json({ error: 'Bulk upload restricted to SPOC only' });
  }
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      const inserts = results.map(row => 
        new Promise((resolve, reject) => {
          console.log('Inserting VEC:', { hamlet: row.hamlet, vec_name: row.vec_name });
          db.run('INSERT OR IGNORE INTO vec (hamlet, vec_name, state, district, block, gp, village, microgrid_id, submissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [row.hamlet, row.vec_name, row.state, row.district, row.block, row.gp, row.village, row.microgrid_id, '[]'], (err) => {
              if (err) reject(err);
              else resolve();
            });
        })
      );
      Promise.all(inserts)
        .then(() => {
          fs.unlinkSync(req.file.path);
          console.log('Bulk VEC upload completed:', results.length);
          res.json({ success: true, count: results.length });
        })
        .catch(err => {
          console.error('Error during bulk VEC upload:', err);
          res.status(500).json({ error: 'Database error' });
        });
    });
});

router.post('/api/hh/clear', (req, res) => {
  const role = req.headers['x-user-role'] || 'operator';
  if (role !== 'spoc') {
    return res.status(403).json({ error: 'Clearing submissions restricted to SPOC only' });
  }
  db.run('UPDATE hh SET submissions = "[]", drafts = "[]"', [], (err) => {
    if (err) {
      console.error('Error clearing HH submissions:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log('All HH submissions and drafts cleared');
    res.json({ success: true });
  });
});

router.post('/api/vec/clear', (req, res) => {
  const role = req.headers['x-user-role'] || 'operator';
  if (role !== 'spoc') {
    return res.status(403).json({ error: 'Clearing submissions restricted to SPOC only' });
  }
  db.run('UPDATE vec SET submissions = "[]"', [], (err) => {
    if (err) {
      console.error('Error clearing VEC submissions:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log('All VEC submissions cleared');
    res.json({ success: true });
  });
});

router.post('/api/hh/:customer_id/remove', (req, res) => {
  const { customer_id } = req.params;
  const { subIndex } = req.body;
  const role = req.headers['x-user-role'] || 'operator';
  if (role !== 'spoc') {
    return res.status(403).json({ error: 'Removing submissions restricted to SPOC only' });
  }
  db.get('SELECT submissions FROM hh WHERE customer_id = ?', [customer_id], (err, row) => {
    if (err) {
      console.error('Error fetching HH for remove:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) return res.status(404).json({ error: 'Household not found' });
    const submissions = JSON.parse(row.submissions || '[]');
    if (subIndex < 0 || subIndex >= submissions.length) {
      return res.status(400).json({ error: 'Invalid submission index' });
    }
    submissions.splice(subIndex, 1);
    db.run('UPDATE hh SET submissions = ? WHERE customer_id = ?', [JSON.stringify(submissions), customer_id], (err) => {
      if (err) {
        console.error('Error removing HH submission:', err);
        return res.status(500).json({ error: 'Database update error' });
      }
      console.log('HH submission removed:', customer_id, subIndex);
      res.json({ success: true });
    });
  });
});

router.post('/api/vec/:hamlet/remove', (req, res) => {
  const { hamlet } = req.params;
  const { subIndex } = req.body;
  const role = req.headers['x-user-role'] || 'operator';
  if (role !== 'spoc') {
    return res.status(403).json({ error: 'Removing submissions restricted to SPOC only' });
  }
  db.get('SELECT submissions FROM vec WHERE hamlet = ?', [hamlet], (err, row) => {
    if (err) {
      console.error('Error fetching VEC for remove:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) return res.status(404).json({ error: 'VEC not found' });
    const submissions = JSON.parse(row.submissions || '[]');
    if (subIndex < 0 || subIndex >= submissions.length) {
      return res.status(400).json({ error: 'Invalid submission index' });
    }
    submissions.splice(subIndex, 1);
    db.run('UPDATE vec SET submissions = ? WHERE hamlet = ?', [JSON.stringify(submissions), hamlet], (err) => {
      if (err) {
        console.error('Error removing VEC submission:', err);
        return res.status(500).json({ error: 'Database update error' });
      }
      console.log('VEC submission removed:', hamlet, subIndex);
      res.json({ success: true });
    });
  });
});

module.exports = router;