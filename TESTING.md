# Testing the stack

## Launch Compose Environment

To set up and run the complete environment, use Docker Compose to bring up all services. Ensure you have Docker and Docker Compose installed.

```bash
docker-compose -p srt-8192-dev up -d
```

This command will start all defined services in the `docker-compose.yml` file.

## Backend Testing

### Overview
The backend is composed of multiple services, such as game logic, matchmaking, leaderboard, and more. Each of these services needs to be tested individually as well as in integration. Below, we'll provide steps to manually test these individual backend services.

1. **Access Backend Containers Individually**
   - Each backend service is running in its own container. To manually test and debug a specific service, first enter the respective container. For example, to access the game logic service, use:
   
   ```bash
   docker exec -it srt-8192-dev_game-logic_1 sh
   ```
   
   Similarly, replace `game-logic` with the appropriate service name, like `leaderboard`, `matchmaking`, etc., to access other services.

2. **Install Dependencies & Build**
   - Run the following commands inside the respective service container to ensure all dependencies are installed and the service is correctly built:
   
   ```bash
   npm install
   npm run build
   ```

3. **Run Tests**
   - To run unit or integration tests for each backend service, use:
   
   ```bash
   npm run test
   ```

   Make sure to execute these steps inside each container to verify that all backend services are working correctly and communicating as expected.
   - If you have unit or integration tests defined, run them with:
   
   ```bash
   npm run test
   ```

## Frontend Testing

1. **Access the Frontend Container**
   - To manually test and debug the frontend, enter the frontend container:
   
   ```bash
   docker exec -it srt-8192-dev_frontend_1 sh
   ```

2. **Install Dependencies & Build**
   - Run the following commands inside the container to install the dependencies and build the project:
   
   ```bash
   npm install
   npm run build
   ```

3. **Serve the Frontend**
   - If testing locally, you can serve the frontend using:
   
   ```bash
   npm install -g serve
   serve -s build
   ```
   - Alternatively, ensure that the frontend is accessible through the port defined in the `docker-compose.yml` file.

## Cleanup

To stop the Docker Compose environment and remove all related containers:

```bash
docker-compose -p srt-8192-dev down
```
