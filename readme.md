# TT - Article Management Platform

A full-stack article management platform built with Angular and Node.js microservices architecture, featuring real-time notifications, user management, and role-based access control.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Architecture Overview](#architecture-overview)
- [Environment Configuration](#environment-configuration)

## ✨ Features

- **User Management**: Complete authentication and authorization system with role-based access control (Admin/User)
- **Article Management**: Create, read, update, and delete articles with rich text editing
- **Real-time Notifications**: Socket.io-powered real-time notifications and comments
- **Dashboard Analytics**: Comprehensive statistics dashboard with charts and metrics
- **Microservices Architecture**: Scalable backend with dedicated services for different domains
- **API Gateway**: Centralized routing and request handling
- **Caching Layer**: Redis integration for improved performance
- **Modern UI**: Built with Fuse Angular template and Material Design

## 🛠 Tech Stack

### Frontend

- **Framework**: Angular 16.2.12
- **UI Library**: Angular Material 16.2.14
- **Template**: Fuse Angular Starter
- **Rich Text Editor**: Quill (ngx-quill)
- **Real-time**: Socket.io Client
- **Charts**: ng-apexcharts (ApexCharts)
- **Styling**: TailwindCSS + Custom CSS
- **State Management**: RxJS

### Backend

- **Runtime**: Node.js 22
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Cache**: Redis
- **Real-time**: Socket.io
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, bcryptjs, express-rate-limit
- **Validation**: express-validator

### Microservices

1. **API Gateway**: Routes requests to appropriate services
2. **UserService**: Handles authentication, authorization, and user management
3. **ArticleService**: Manages articles, comments, and content
4. **NotificationService**: Real-time notifications and web push

## 📁 Project Structure

```
TT/
├── backend/
│   ├── ApiGateway/          # API Gateway service
│   │   ├── src/
│   │   └── package.json
│   ├── UserService/         # User authentication & management
│   │   ├── src/
│   │   └── package.json
│   ├── ArticleService/      # Article CRUD operations
│   │   ├── src/
│   │   └── package.json
│   ├── NotificationService/ # Real-time notifications
│   │   ├── src/
│   │   └── package.json
│   └── tsconfig.json        # Shared TypeScript config
├── fuse-template-main/
│   └── fuse-angular-starter/ # Angular frontend
│       ├── src/
│       ├── package.json
│       └── angular.json
└── README.md
```

### Technical Choices

#### Microservices Architecture

- **Separation of Concerns**: Each service handles a specific domain (users, articles, notifications)
- **Scalability**: Services can be scaled independently based on load
- **Maintainability**: Easier to develop, test, and deploy individual services
- **Technology Flexibility**: Each service can use different technologies if needed

#### API Gateway Pattern

- **Single Entry Point**: Centralized routing for all client requests
- **Load Distribution**: Routes requests to appropriate microservices
- **Security**: Centralized authentication and rate limiting
- **Simplified Client**: Frontend only needs to communicate with one endpoint

#### Redis Caching

- **Performance**: Reduces database load by caching frequently accessed data
- **Session Management**: Stores user sessions and JWT tokens
- **Rate Limiting**: Tracks API request counts per user
- **Real-time Data**: Supports pub/sub for real-time features

#### MongoDB Database

- **Flexible Schema**: Easy to evolve data models as requirements change
- **JSON-like Documents**: Natural fit for JavaScript/TypeScript ecosystem
- **Scalability**: Horizontal scaling with sharding
- **Rich Queries**: Powerful aggregation framework for complex queries

## 📦 Prerequisites

Before installation, ensure you have the following installed:

- **Node.js**: Version 22.x
- **npm**: Version 10.x or higher
- **MongoDB**: Version 5.x or higher (running locally or remote instance)
- **Redis**: Version 7.x or higher (running locally or remote instance)
- **Angular CLI**: Version 16.x (`npm install -g @angular/cli@16`)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TT
```

### 2. Backend Services Installation

Install dependencies for each microservice:

#### API Gateway

```bash
cd backend/ApiGateway
npm install
```

#### User Service

```bash
cd backend/UserService
npm install
```

#### Article Service

```bash
cd backend/ArticleService
npm install
```

#### Notification Service

```bash
cd backend/NotificationService
npm install
```

### 3. Frontend Installation

```bash
cd fuse-template-main/fuse-angular-starter
npm install
```

## ▶️ Running the Application

### 1. Start MongoDB

Ensure MongoDB is running on your system:

```bash
# Windows (if installed as service)
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
mongod --dbpath /path/to/data
```

### 2. Start Redis

Ensure Redis is running:

```bash
# Windows (if installed as service)
redis-server

# macOS/Linux
sudo systemctl start redis
# or
redis-server
```

### 3. Start Backend Services

Open separate terminal windows for each service:

#### API Gateway (Port: 8000)

```bash
cd backend/ApiGateway
npm start
# or for development with auto-reload
npm run dev
```

#### User Service (Port: 4000)

```bash
cd backend/UserService
npm run dev
```

#### Article Service (Port: 7000)

```bash
cd backend/ArticleService
npm run dev
```

#### Notification Service (Port: 2000)

```bash
cd backend/NotificationService
npm run dev
```

### 4. Start Frontend

```bash
cd fuse-template-main/fuse-angular-starter
npm start
```

The application will be available at `http://localhost:4200`

## 🏗 Architecture Overview

### Request Flow

```
Client (Angular)
    ↓
API Gateway (Port 8000)
    ↓
┌─────────────┬──────────────────┬────────────────────┐
│             │                  │                    │
UserService   ArticleService    NotificationService
(Port 4000)   (Port 7000)       (Port 2000)
│             │                  │
└─────────────┴──────────────────┴────────────────────┘
                ↓                ↓
            MongoDB           Redis
```

### Service Responsibilities

#### API Gateway

- Routes `/api/users/*` → UserService
- Routes `/api/articles/*` → ArticleService
- Routes `/api/notifications/*` → NotificationService
- CORS handling
- Request logging

#### UserService

- User registration and login
- JWT token generation and validation
- Password hashing with bcryptjs
- Role-based access control (Admin/User)
- User profile management
- Session management with Redis

#### ArticleService

- Article CRUD operations
- Comment system with nested replies
- Article search and filtering
- Rate limiting for content creation
- Rich text content handling

#### NotificationService

- Real-time notifications via Socket.io
- Web push notifications
- Notification history
- User subscription management

## ⚙️ Environment Configuration

Create `.env` files in each service directory:

### UserService/.env

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/users
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

### ArticleService/.env

```env
PORT=7000
MONGODB_URI=mongodb://localhost:27017/articles
REDIS_URL=redis://localhost:6379
```

### NotificationService/.env

```env
PORT=2000
REDIS_URL=redis://localhost:6379
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### ApiGateway/.env

```env
PORT=8000
USER_SERVICE_URL=http://localhost:4000
ARTICLE_SERVICE_URL=http://localhost:7000
NOTIFICATION_SERVICE_URL=http://localhost:2000
```

## 📊 Dashboard Statistics (NEW)

The platform now includes a comprehensive analytics dashboard with real-time metrics and visualizations.

### Features

- **Article Analytics**
  - Total articles, published, and drafts count
  - Articles created over time (line chart)
  - Articles by author distribution
  - Top articles by engagement
  - Status distribution (polar area chart)

- **User Analytics**
  - Total users and active users (30 days)
  - New user signups tracking
  - User signups by day (time-series)
  - Users by role distribution
  - Active users per hour (24h)
  - Top contributors ranking

### API Endpoints

#### ArticleService
```
GET /api/v1/articles/summary
GET /api/v1/articles/count-by-day?days=30
GET /api/v1/articles/count-by-author
GET /api/v1/articles/top-by-comments?limit=10
GET /api/v1/articles/status-distribution
```

#### UserService
```
GET /api/v1/users/summary
GET /api/v1/users/signups-by-day?days=30
GET /api/v1/users/by-role
GET /api/v1/users/active-per-hour?hours=24
GET /api/v1/users/top-contributors?limit=10
```

### Documentation

For detailed documentation on the dashboard implementation:

- **[Dashboard Implementation Guide](./DASHBOARD_IMPLEMENTATION.md)** - Complete technical documentation
- **[API Examples](./API_EXAMPLES.md)** - Sample requests and responses
- **[Setup Guide](./DASHBOARD_SETUP_GUIDE.md)** - Quick setup and troubleshooting
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Overview and status

### Quick Start

1. Ensure all backend services are running
2. Navigate to the dashboard: `http://localhost:4200/dashboards/project`
3. View real-time statistics and charts

The dashboard automatically fetches data from both ArticleService and UserService, displaying comprehensive analytics with interactive charts.

## 🧪 API Testing with Postman

A comprehensive Postman collection is included for testing all API endpoints with automatic authentication handling.

### Features

- ✅ **40+ API endpoints** organized in folders
- ✅ **Automatic token management** - login once, use everywhere
- ✅ **Auto-refresh tokens** - never manually refresh expired tokens
- ✅ **Pre-configured environment** - ready to import and use
- ✅ **Test scripts** - automatic response validation
- ✅ **CLI test runner** - for automation and CI/CD

### Quick Start

1. **Import to Postman**:
   - Import `Fuse16tt_API_Collection.postman_collection.json`
   - Import `Fuse16tt_Environment.postman_environment.json`
   - Select "Fuse16tt Local Environment" (top-right)

2. **First Test** (30 seconds):
   - Open **Authentication** → **Register User** → Send
   - Open **Users** → **Get Current User** → Send
   - ✅ Token automatically attached!

3. **Run from CLI**:
   ```bash
   # Install Newman (once)
   npm install -g newman newman-reporter-htmlextra
   
   # Run tests
   ./run-api-tests.sh
   ```

### Documentation

- **[Quick Start Guide](./POSTMAN_QUICK_START.md)** - Get started in 60 seconds
- **[Complete Guide](./POSTMAN_GUIDE.md)** - Full documentation with troubleshooting
- **[Test Scenarios](./POSTMAN_TEST_SCENARIOS.md)** - 30+ test scenarios with expected results
- **[Collection Overview](./POSTMAN_COLLECTION_README.md)** - Package details and features

### What's Included

**Files**:
- `Fuse16tt_API_Collection.postman_collection.json` - Main collection
- `Fuse16tt_Environment.postman_environment.json` - Environment variables
- `run-api-tests.sh` - Automated test runner script

**API Coverage**:
- Authentication (Register, Login, Refresh, Logout)
- User Management (Get user, List users, Update roles)
- User Statistics (5 dashboard endpoints)
- Article Management (CRUD operations)
- Article Statistics (5 dashboard endpoints)
- Comments (Create, List)

**Smart Features**:
- Auto-save access tokens after login
- Auto-refresh tokens before expiry
- Auto-attach Bearer tokens to requests
- Auto-save resource IDs (userId, articleId, etc.)
- Built-in test validation
- Rate limit handling

See the [Quick Start Guide](./POSTMAN_QUICK_START.md) to begin testing immediately!

## 📝 License

This project is private and proprietary.

## 👥 Author

Developed by the TT Team

---

**Note**: Make sure all services are running before accessing the frontend application. The application requires MongoDB and Redis to be running and accessible.

