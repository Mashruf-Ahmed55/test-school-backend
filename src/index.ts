import http from 'http';
import app from './app.js';
import connectDB from './config/dbConnection.js';
import envConfig from './config/envConfig.js';

const server = http.createServer(app);

const startServer = async () => {
  // Connect Mongodb Database
  await connectDB();

  // Start Server
  server.listen(envConfig.port, () => {
    console.log(`Server is running on http://localhost:${envConfig.port}`);
  });
};

startServer();
