# Graduation-Project

Learning Management System (LMS): A full-stack LMS with a React frontend and Node.js backend. Features include user authentication, course management, and enrollment. Utilizes Vite, Tailwind CSS, TypeScript, Express, Sequelize, and MySQL for a modern, efficient educational platform.

# Learning Management System (LMS)

A comprehensive full-stack Learning Management System built with modern web technologies.

## Features

- User Authentication & Authorization
- Course Management
- Student Enrollment System
- Content Delivery
- Progress Tracking
- Interactive Learning Tools
- Assessment System

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Redux Toolkit

### Backend

- Node.js
- Express
- Sequelize ORM
- MySQL Database
- JSON Web Tokens (JWT)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL
- npm or yarn

### Installation

1. Clone the repository

2. Navigate to the project directory:

   ```bash
   cd Graduation-Project
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

   or if you prefer using yarn:

   ```bash
   yarn install
   ```

4. Set up the environment variables:

   - Create a `.env` file in the root directory.
   - Add the necessary environment variables as specified in `.env.example`.

5. Run the development server:

   ```bash
   npm run dev
   ```

   or with yarn:

   ```bash
   yarn dev
   ```

6. Open your browser and visit `http://localhost:3000` to view the application.

### Database Setup

1. Ensure MySQL is running on your machine.

2. Create a new database for the project.

3. Update the database configuration in the `.env` file with your database credentials.

4. Run the database migrations:

   ```bash
   npm run migrate
   ```

   or with yarn:

   ```bash
   yarn migrate
   ```

5. (Optional) Seed the database with initial data:
   ```bash
   npm run seed
   ```
   or with yarn:
   ```bash
   yarn seed
   ```

### Building for Production

1. Build the application:

   ```bash
   npm run build
   ```

   or with yarn:

   ```bash
   yarn build
   ```

2. Start the production server:
   ```bash
   npm start
   ```
   or with yarn:
   ```bash
   yarn start
   ```

### Testing

- Run tests using:
  ```bash
  npm test
  ```
  or with yarn:
  ```bash
  yarn test
  ```

For more detailed information, refer to the documentation or contact the project maintainers.
