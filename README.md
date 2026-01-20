# Social Media Microservices

A scalable microservices-based social media application built with Node.js, Express, MongoDB, and Redis.

## Architecture

The project consists of several microservices, each responsible for a specific domain:

- **API Gateway**: The entry point for all client requests. It handles routing, authentication, and rate limiting.
- **User Service**: Manages user profiles, authentication, and user-related operations.
- **Post Service**: Handles social media posts, including creation, retrieval, and management.
- **Media Service**: Manages media uploads and storage (integrated with Cloudinary).
- **Search Service**: (In development) Provides search functionality across users and posts.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Databases**: MongoDB (Primary), Redis (Caching and Rate Limiting)
- **Authentication**: JSON Web Tokens (JWT)
- **Containerization**: Docker, Docker Compose
- **API Gateway**: Custom Express-based gateway with `express-http-proxy`

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- MongoDB and Redis (if running locally without Docker)
- Cloudinary Account (for media uploads)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd Social-Media-Microservices
```

### 2. Set up environment variables

Each service has an `.env.example` file. Create a `.env` file in each service directory and fill in the required values.

Services requiring `.env`:
- `api_gateway/.env`
- `user_service/.env`
- `post-service/.env`
- `media-service/.env`

### 3. Run with Docker Compose (Recommended)

This will start all microservices along with MongoDB and Redis.

```bash
docker-compose up --build
```

The API Gateway will be available at `http://localhost:3000`.

### 4. Run Locally (Development)

First, install dependencies for all services:

```bash
npm run install-all
```

Then, start all services:

```bash
npm run start-all
```

Note: Ensure MongoDB and Redis are running on your local machine if not using Docker.

## API Documentation

The services are accessible through the API Gateway:

- **Auth**: `POST /v1/auth/register`, `POST /v1/auth/login`
- **Posts**: `GET /v1/posts`, `POST /v1/posts` (Requires JWT)
- **Media**: `POST /v1/media/upload` (Requires JWT)

## Project Structure

```text
.
├── api_gateway/        # API Gateway & Authentication
├── user_service/       # User management
├── post-service/       # Post management
├── media-service/      # Media operations
├── search-service/     # Search operations
├── docker-compose.yml  # Docker orchestration
└── package.json        # Root scripts
```

## License

This project is licensed under the ISC License.
