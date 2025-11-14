import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database.js';
import scrapeRoutes from './routes/scrapeRoutes.js';
import userRoutes from './routes/userRoutes.js';
import priceLogRoutes from './routes/priceLogRoutes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/scrape', scrapeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/price-log', priceLogRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.send('Hello API - Japan Train Price Compare');
});

// Connect to MongoDB and start the server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📱 API available at: http://localhost:${PORT}`);
      console.log(`🔗 Try: http://localhost:${PORT}/api/scrape`);
      console.log(`📊 MongoDB connected: web-scraper database`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
