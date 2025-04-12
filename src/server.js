const express = require('express');
const path = require('path');
const routes = require('./routes');
const { exec } = require('child_process');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  exec('start http://localhost:3000/index.html', (err) => {
    if (err) console.error('Error opening browser:', err);
  });
});