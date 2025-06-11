# Build Log Viewer

A web application for viewing build logs with a frontend and backend service.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd build_log_view
```

2. **Important:** Add your build log files to the `build_log_examples` directory   

3. Start the application using Docker Compose:
```bash
docker compose up -d
```

This will start both the frontend and backend services:
- Frontend will be available at http://localhost:3000
- Backend will be available at http://localhost:8000
- Backend Swagger UI will be available at http://localhost:8000/docs

## Development

The application is configured for development with hot-reloading:
- Frontend changes will automatically reload
- Backend changes will automatically reload
- Node modules are persisted in a Docker volume

## Services

### Frontend
- Runs on port 3000
- Built with Node.js
- Development environment with hot-reloading

### Backend
- Runs on port 8000
- Development environment with hot-reloading

## Stopping the Application

To stop the application, press `Ctrl+C` in the terminal where Docker Compose is running, or run:
```bash
docker compose down
```

## Troubleshooting

If you encounter any issues:

1. Make sure all ports (3000 and 8000) are available on your machine
2. Try rebuilding the containers:
```bash
docker compose down
docker compose build
docker compose up
```

3. Check the logs for specific services:
```bash
docker compose logs frontend
docker compose logs backend
```