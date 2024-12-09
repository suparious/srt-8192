import { BaseService } from './BaseService';

// Create and start the base service
const service = new BaseService();
service.start().catch(error => {
  console.error('Failed to start service:', error);
  process.exit(1);
});