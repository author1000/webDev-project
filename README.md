# Personal Task Manager

This project is a web-based task manager.

Users can create, view, edit, complete, delete, search and filter their own tasks.

An admin can view and manage tasks for all users.

## Technologies

- HTML
- JavaScript
- Node.js
- Express
- PostgreSQL
- Docker

## Project Structure

```text
webDev-project/
├── server.js
├── package.json
├── package-lock.json
├── README.md
├── database/
│   └── Dockerfile
└── public/
    ├── index.html
    └── app.js
```

## Requirements

Before running the project, make sure these are installed:

- Node.js
- npm
- Docker

## Database setup

Build the PostgreSQL Docker image:

```bash
docker build -t taskmanager-postgres ./database
```

Create and start the database container:

```bash
docker run -d -p 5432:5432 --name taskmanager-db taskmanager-postgres
```

If the container already exists, start it with:

```bash
docker start taskmanager-db
```

To stop the database:

```bash
docker stop taskmanager-db
```

## Install Dependencies

Run:

```bash
npm install
```

## Start the Server

Run:

```bash
node server.js
```

Then open:

```text
http://localhost:3000
```

## Test Accounts

### Admin

Username: `admin`

Password: `admin123`

### Normal User

Username: `testuser`

Password: `abc123`

The test accounts are created automatically when the server starts.

## Features

### Normal User

A normal user can:

- log in and log out
- create tasks
- view their own tasks
- edit their own tasks
- delete their own tasks
- mark tasks as completed or open
- search tasks by title
- filter tasks by status

### Admin

An admin can:

- view tasks from all users
- create tasks for different users
- edit tasks from any user
- delete tasks from any user
- mark tasks as completed or open
- search and filter all tasks

## Technical Description

The client uses HTML and plain JavaScript.

JavaScript uses the `fetch()` API to communicate with the Express server.

The Express server handles authentication, sessions, users, and task CRUD operations.

PostgreSQL stores the users and tasks.

Each task belongs to one user through the `user_id` field.

Authentication uses a signed HTTP-only cookie.

Passwords are hashed before they are stored or compared.

## Validation and Error Handling

The application checks that:

- task titles are not empty
- task status is valid
- task priority is valid
- users are logged in before accessing protected routes
- normal users can only modify their own tasks

The interface also handles loading, success, empty results, invalid input, and server errors.
