# BITS Call Center Management System

A full-stack call center management application built to streamline student enquiry processing, executive assignment, and agent data entry for an educational institution.

![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)
![Material](https://img.shields.io/badge/Angular_Material-Premium_UI-3f51b5)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [User Roles & Portals](#user-roles--portals)
- [Database Models](#database-models)

---

## Overview

The BITS Call Center System provides a centralized platform for managing the lifecycle of a student enquiry — from initial form submission through OTP verification, executive assignment,follow-up tracking, and final resolution. It supports multiple user roles: **Admin**, **Executive**, **Agent**, and **Student**.

---

## Features

### Student Portal
- Multi-step enquiry form with real-time validation
- Dynamic dropdowns for State → District → Place (hierarchical)
- Dynamic dropdowns for Qualification → Sub-Qualification
- Semester selection from admin-managed list
- OTP-based verification after submission

### Executive Portal
- Login with session management
- Dashboard to view assigned enquiries
- Add call notes with follow-up status tracking (contacted, callback, no answer, escalated)
- Schedule follow-up dates and preferred times
- PDF export of enquiry data

### Agent Portal
- Agent login and authentication
- Individual enquiry data entry (same dynamic dropdowns as student form)
- Bulk upload of enquiries via CSV/XLSX/XLS files
- Auto-verification for agent-submitted enquiries (no OTP required)

### Admin Panel
- Secure admin login
- Manage **Courses** (add / edit / delete)
- Manage **Executives** (register / edit)
- Manage **Agents** (register / edit)
- **Dropdown Management** — full CRUD for:
  - States
  - Districts (linked to State)
  - Places (linked to District)
  - Qualifications
  - Sub-Qualifications (linked to Qualification)
  - Semesters
- View and manage all enquiries
- OTP verification and executive assignment
- Enquiry status tracking

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Angular 21, Angular Material, RxJS |
| Backend    | Node.js, Express 5                 |
| Database   | MongoDB with Mongoose 9            |
| Auth       | JWT (jsonwebtoken), bcryptjs       |
| File Upload| Multer, XLSX parsing               |
| PDF Export | jsPDF, jspdf-autotable             |
| Notifications | ngx-toastr                      |
| Dev Tools  | Nodemon, TypeScript, Vitest        |

---

## Project Structure

```
Bits-callcenter/
├── backend/
│   ├── config/               # Environment configs (dev.json, prod.json)
│   ├── middleware/            # Auth middleware (JWT verification)
│   ├── models/               # Mongoose schemas
│   │   ├── Agent.js
│   │   ├── Course.js
│   │   ├── District.js
│   │   ├── Enquiry.js
│   │   ├── Executive.js
│   │   ├── ExecutiveSession.js
│   │   ├── Place.js
│   │   ├── Qualification.js
│   │   ├── Semester.js
│   │   ├── Settings.js
│   │   ├── State.js
│   │   ├── SubQualification.js
│   │   └── User.js
│   ├── modules/              # Feature modules (controller + routes)
│   │   ├── agents/
│   │   ├── auth/
│   │   ├── courses/
│   │   ├── dropdowns/
│   │   ├── enquiries/
│   │   ├── executives/
│   │   ├── sessions/
│   │   ├── settings/
│   │   └── users/
│   ├── uploads/              # Uploaded CSV/XLSX files
│   ├── seed-admin.js         # Script to seed the default admin user
│   ├── reset-admin.js        # Script to reset admin credentials
│   └── server.js             # Application entry point
│
├── frontend/
│   └── src/app/
│       ├── admin/            # Admin dashboard (login, manage everything)
│       ├── agent/            # Agent login page
│       ├── agent-data-portal/# Agent data entry & bulk upload
│       ├── auth/             # Auth guard logic
│       ├── core/             # Shared services (ApiService) & guards
│       ├── executive/        # Executive dashboard
│       ├── student-enquiry/  # Student enquiry form
│       ├── app.routes.ts     # Angular routing
│       └── app.config.ts     # App configuration
│
├── package.json              # Root dependencies (backend)
└── README.md
```

---

## Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 10.x
- **MongoDB** ≥ 6.x (local or Atlas)
- **Angular CLI** ≥ 21.x (`npm install -g @angular/cli`)

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Bits-callcenter
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Seed the Admin User

```bash
node backend/seed-admin.js
```

---

## Configuration

Backend configuration files are located in `backend/config/`.

### Development (`dev.json`)

```json
{
    "PORT": 5000,
    "MONGODB_URI": "mongodb://localhost:27017/bits-callcenter-dev",
    "JWT_SECRET": "your_jwt_secret_here"
}
```

### Production (`prod.json`)

Create a `prod.json` with your production MongoDB URI and a strong JWT secret. Set the environment variable:

```bash
set NODE_ENV=prod    # Windows
export NODE_ENV=prod # Linux/Mac
```

---

## Running the Application

### Backend (Development)

```bash
npm run dev
```

The API server starts at **http://localhost:5000**.

### Frontend (Development)

```bash
cd frontend
ng serve
```

The Angular app starts at **http://localhost:4200**.

### Production Build

```bash
cd frontend
ng build --configuration production
```

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| POST   | `/login`         | Admin/Executive login    |
| POST   | `/register`      | Register new user        |

### Courses (`/api/courses`)
| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| GET    | `/`              | List all courses         |
| POST   | `/`              | Create a course          |
| PUT    | `/:id`           | Update a course          |
| DELETE | `/:id`           | Delete a course          |

### Enquiries (`/api/enquiries`)
| Method | Endpoint             | Description                    |
|--------|----------------------|--------------------------------|
| GET    | `/`                  | List all enquiries             |
| POST   | `/`                  | Submit a new enquiry           |
| POST   | `/agent`             | Agent-submitted enquiry        |
| POST   | `/upload`            | Bulk upload via file           |
| PUT    | `/:id/verify`        | Verify enquiry OTP             |
| PUT    | `/:id/assign`        | Assign executive to enquiry    |
| PUT    | `/:id/call-notes`    | Add call notes                 |

### Executives (`/api/executives`)
| Method | Endpoint         | Description                    |
|--------|------------------|--------------------------------|
| GET    | `/`              | List all executives            |
| POST   | `/`              | Register an executive          |
| PUT    | `/:id`           | Update executive details       |

### Agents (`/api/agents`)
| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| GET    | `/`              | List all agents          |
| POST   | `/`              | Register an agent        |
| POST   | `/login`         | Agent login              |
| PUT    | `/:id`           | Update agent details     |

### Dropdowns (`/api/dropdowns`)
| Method | Endpoint                   | Description                    |
|--------|----------------------------|--------------------------------|
| GET    | `/states`                  | List all states                |
| POST   | `/states`                  | Create a state                 |
| PUT    | `/states/:id`              | Update a state                 |
| DELETE | `/states/:id`              | Delete a state                 |
| GET    | `/districts`               | List all districts             |
| POST   | `/districts`               | Create a district              |
| PUT    | `/districts/:id`           | Update a district              |
| DELETE | `/districts/:id`           | Delete a district              |
| GET    | `/places`                  | List all places                |
| POST   | `/places`                  | Create a place                 |
| PUT    | `/places/:id`              | Update a place                 |
| DELETE | `/places/:id`              | Delete a place                 |
| GET    | `/qualifications`          | List all qualifications        |
| POST   | `/qualifications`          | Create a qualification         |
| PUT    | `/qualifications/:id`      | Update a qualification         |
| DELETE | `/qualifications/:id`      | Delete a qualification         |
| GET    | `/sub-qualifications`      | List all sub-qualifications    |
| POST   | `/sub-qualifications`      | Create a sub-qualification     |
| PUT    | `/sub-qualifications/:id`  | Update a sub-qualification     |
| DELETE | `/sub-qualifications/:id`  | Delete a sub-qualification     |
| GET    | `/semesters`               | List all semesters             |
| POST   | `/semesters`               | Create a semester              |
| PUT    | `/semesters/:id`           | Update a semester              |
| DELETE | `/semesters/:id`           | Delete a semester              |

---

## User Roles & Portals

| Role       | URL Path             | Description                                       |
|------------|----------------------|---------------------------------------------------|
| Student    | `/enquiry`           | Submit an enquiry with dynamic dropdowns & OTP     |
| Executive  | `/executive`         | View assigned enquiries, add notes, track status   |
| Agent      | `/agent`             | Login page for agents                              |
| Agent Data | `/agent-data-portal` | Data entry & bulk upload for agents                |
| Admin      | `/admin`             | Full system management dashboard                   |

---

## Database Models

| Model               | Description                                      |
|----------------------|--------------------------------------------------|
| `User`               | Admin and executive accounts                    |
| `Agent`              | Agent accounts with hashed passwords            |
| `Executive`          | Executive profiles                               |
| `ExecutiveSession`   | Login session tracking for executives           |
| `Course`             | Courses offered by the institution              |
| `Enquiry`            | Student enquiry data with status lifecycle      |
| `State`              | Indian states for location dropdown             |
| `District`           | Districts linked to a state                     |
| `Place`              | Places/cities linked to a district              |
| `Qualification`      | Academic qualifications                          |
| `SubQualification`   | Sub-categories linked to a qualification        |
| `Semester`           | Semester options with sort order                |
| `Settings`           | Application-wide settings                        |

---

## License

ISC

---

> Built with ❤️ for BITS Educational Institution
