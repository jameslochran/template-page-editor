const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes for template management
app.get('/api/templates', (req, res) => {
  // Placeholder for getting templates
  res.json([]);
});

app.post('/api/templates', (req, res) => {
  // Placeholder for creating templates
  res.json({ message: 'Template created successfully' });
});

app.put('/api/templates/:id', (req, res) => {
  // Placeholder for updating templates
  res.json({ message: 'Template updated successfully' });
});

app.delete('/api/templates/:id', (req, res) => {
  // Placeholder for deleting templates
  res.json({ message: 'Template deleted successfully' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Template Page Editor server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});
