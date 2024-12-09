import express, { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { validateEnv } from './utils/envValidator';
import { setupHealthCheck } from './utils/healthCheck';

export class BaseService {
  protected app: express.Application;
  protected logger: winston.Logger;
  protected port: number;

  constructor() {
    // Initialize Express
    this.app = express();
    
    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    });

    // Set port
    this.port = parseInt(process.env.PORT || '8080', 10);

    // Initialize base middleware
    this.initializeMiddleware();
  }

  private initializeMiddleware(): void {
    this.app.use(express.json());
    this.app.use(this.loggerMiddleware.bind(this));
    this.app.use(this.errorHandler.bind(this));

    // Setup health check endpoint
    setupHealthCheck(this.app);
  }

  protected loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
    this.logger.info(`${req.method} ${req.path}`);
    next();
  }

  protected errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
    this.logger.error('Error occurred:', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }

  public async start(): Promise<void> {
    try {
      // Validate environment variables
      await validateEnv();

      // Start the server
      this.app.listen(this.port, () => {
        this.logger.info(`Service listening on port ${this.port}`);
      });
    } catch (err) {
      this.logger.error('Failed to start service:', { error: err instanceof Error ? err.message : 'Unknown error' });
      process.exit(1);
    }
  }
}