# TeamFlow API Documentation

This directory contains the REST API backend for **TeamFlow**, built with Express 5, Prisma 7, Neon PostgreSQL, and Redis.

---

## Architecture Overview

The API follows a multi-tenant hierarchy:

```text
User
  ↓
Organization
  ↓
OrganizationMember
  ↓
Role (OWNER > ADMIN > MANAGER > MEMBER > VIEWER)
```

- **Authentication**: JWT tokens passed either via HTTP-only cookie (`token`) or HTTP `Authorization: Bearer <token>` header.
- **Validation**: Strict input validation using Zod schemas with custom error handling.
- **Storage**:
  - PostgreSQL (via Neon Serverless + Prisma 7) for persistent entities (Users, Organizations, Members, Invitations).
  - Redis for fast, expiring temporary data (Email OTPs, Password Reset OTPs, rate-limiting cooldowns, and brute-force protection counters).
- **Email Delivery**: Nodemailer with SMTP support. In development mode, OTPs and invitation tokens are also logged directly to the server terminal console to ensure testing is never blocked.

---

## Getting Started

### 1. Environment Configuration

Ensure your root `.env` (`../../.env`) contains the following variables:

```env
PORT=4000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
REDIS_URL="redis://localhost:6379"

# SMTP Email Configuration (Optional in dev mode)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM="TeamFlow <noreply@teamflow.dev>"
```

### 2. Start the Server

From the root directory:

```bash
# Start API in development mode
pnpm --filter @teamflow/api run dev

# Or build and start
pnpm --filter @teamflow/api run build
pnpm --filter @teamflow/api run start
```

Default API Base URL: `http://localhost:4000`

---

## Role & Permission Hierarchy

| Role | Rank | Permissions |
|---|---|---|
| **`OWNER`** | 5 | Full control. Can delete organization, manage all members, and change any roles. Cannot be removed or leave without transferring ownership. |
| **`ADMIN`** | 4 | Can update organization settings, invite members (`ADMIN` down to `VIEWER`), remove non-owners/non-admins, and update non-admin roles. |
| **`MANAGER`** | 3 | Can view organization, list members, and invite members as `MEMBER` or `VIEWER`. |
| **`MEMBER`** | 2 | Standard member. Can view organization details, view member list, and leave the organization. |
| **`VIEWER`** | 1 | Read-only access. Can view organization details, view member list, and leave the organization. |

---

## Common Headers

- **Content-Type**: `application/json`
- **Authorization**: `Bearer <JWT_TOKEN>` *(or send the `token` cookie set automatically on signin/signup)*

---

# API Reference

## Table of Contents
1. [Health Check](#health-check)
2. [Authentication Endpoints](#authentication-endpoints)
   - [Sign Up](#1-sign-up)
   - [Sign In](#2-sign-in)
   - [Get Current User Profile](#3-get-current-user-profile)
   - [Send Email Verification OTP](#4-send-email-verification-otp)
   - [Verify Email](#5-verify-email)
   - [Forgot Password](#6-forgot-password)
   - [Reset Password](#7-reset-password)
   - [Log Out](#8-log-out)
3. [Organization Endpoints](#organization-endpoints)
   - [Create Organization](#1-create-organization)
   - [List User Organizations](#2-list-user-organizations)
   - [Get Organization Details](#3-get-organization-details)
   - [Update Organization](#4-update-organization)
   - [Delete Organization](#5-delete-organization)
   - [Invite Member](#6-invite-member)
   - [List Organization Invitations](#7-list-organization-invitations)
   - [Accept Invitation](#8-accept-invitation)
   - [List Organization Members](#9-list-organization-members)
   - [Change Member Role](#10-change-member-role)
   - [Remove Member](#11-remove-member)
   - [Leave Organization](#12-leave-organization)
4. [Project Endpoints](#project-endpoints)
   - [Create Project](#1-create-project)
   - [List Projects in Organization](#2-list-projects-in-organization)
   - [Get Project Details](#3-get-project-details)
   - [Update Project](#4-update-project)
   - [Archive / Unarchive Project](#5-archive--unarchive-project)
   - [Delete Project](#6-delete-project)
   - [Add Project Member](#7-add-project-member)
   - [List Project Members](#8-list-project-members)
   - [Change Project Member Role](#9-change-project-member-role)
   - [Remove Project Member](#10-remove-project-member)
5. [Task Endpoints](#task-endpoints)
   - [Create Task](#1-create-task)
   - [List Tasks in Project](#2-list-tasks-in-project)
   - [Get Task Details](#3-get-task-details)
   - [Update Task](#4-update-task)
   - [Delete Task](#5-delete-task)
6. [Search Endpoints](#search-endpoints)
   - [Unified Global Search](#1-unified-global-multi-entity-search)
   - [Dedicated Projects Search](#2-dedicated-projects-search)
   - [Dedicated Tasks Search](#3-dedicated-tasks-search)
   - [Organization-Scoped Search](#4-organization-scoped-search)
7. [Core Backend Concepts & Architecture Guide](#core-backend-concepts--architecture-guide)
   - [ACID Properties Explained with Real Project Code](#1-acid-properties-explained-with-real-project-code)
   - [Multi-Tenant Architecture & Data Security](#2-multi-tenant-architecture--data-security)
   - [Authentication & Security Strategy](#3-authentication--security-strategy)
   - [Interview Cheat Sheet: How to Explain TeamFlow in 2 Minutes](#4-interview-cheat-sheet-how-to-explain-teamflow-in-2-minutes)
   - [Search, Indexing & Pagination Engineering Concepts (Senior SDE Guide)](#5-search-indexing--pagination-engineering-concepts-senior-sde-guide)

---

## Health Check

### `GET /health-check`
Checks if the API server is alive and functioning.

- **Auth Required**: No
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "message": "TeamFlow API server is running successfully",
    "timestamp": "2026-10-05T10:00:00.000Z"
  }
  ```

---

## Authentication Endpoints

### 1. Sign Up
Creates a new user account, issues a JWT, and sets an HTTP-only cookie.

- **Method**: `POST`
- **Route**: `/api/auth/signup`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "name": "Alex Johnson",
    "email": "alex@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Validation**:
  - `name`: String, minimum 2 characters.
  - `email`: Valid email (auto-trimmed and lowercased).
  - `password`: String, minimum 8 characters.
- **Response `201 Created`**:
  ```json
  {
    "message": "Signup successful",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "c1f7b884-18e4-4d1a-824b-2292d3f787e9",
      "name": "Alex Johnson",
      "email": "alex@example.com",
      "emailVerified": false,
      "createdAt": "2026-10-05T10:00:00.000Z"
    }
  }
  ```
- **Errors**: `400 Bad Request` (invalid input), `409 Conflict` (user already exists).

---

### 2. Sign In
Authenticates existing credentials, returns user profile, issues a JWT, and sets the `token` cookie.

- **Method**: `POST`
- **Route**: `/api/auth/signin`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "alex@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Signin successful",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "c1f7b884-18e4-4d1a-824b-2292d3f787e9",
      "name": "Alex Johnson",
      "email": "alex@example.com",
      "emailVerified": true
    }
  }
  ```
- **Errors**: `401 Unauthorized` (invalid email or password).

---

### 3. Get Current User Profile
Retrieves full user record for the authenticated session.

- **Method**: `GET`
- **Route**: `/api/auth/me`
- **Auth Required**: Yes (`Bearer <token>` or cookie)
- **Response `200 OK`**:
  ```json
  {
    "user": {
      "id": "c1f7b884-18e4-4d1a-824b-2292d3f787e9",
      "name": "Alex Johnson",
      "email": "alex@example.com",
      "emailVerified": true,
      "emailVerifiedAt": "2026-10-05T10:05:00.000Z",
      "createdAt": "2026-10-05T10:00:00.000Z",
      "updatedAt": "2026-10-05T10:05:00.000Z"
    }
  }
  ```
- **Errors**: `401 Unauthorized` (missing or invalid token).

---

### 4. Send Email Verification OTP
Generates a 6-digit OTP, stores it in Redis for 10 minutes, and sends an email. Enforces a 60-second cooldown.

- **Method**: `POST`
- **Route**: `/api/auth/email/send`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "alex@example.com"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "userId": "c1f7b884-18e4-4d1a-824b-2292d3f787e9",
    "email": "alex@example.com",
    "message": "Verification OTP sent successfully"
  }
  ```
- **Errors**:
  - `400 Bad Request`: Email already verified.
  - `404 Not Found`: No user with this email.
  - `429 Too Many Requests`: 60-second cooldown active.

---

### 5. Verify Email
Validates the 6-digit OTP against Redis and marks `emailVerified: true` in PostgreSQL. Allows up to 5 attempts before invalidating the OTP.

- **Method**: `POST`
- **Route**: `/api/auth/email/verify`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "alex@example.com",
    "otp": "654321"
  }
  ```
  *(Note: Accepts either `email` or `userId`)*.
- **Response `200 OK`**:
  ```json
  {
    "message": "Email verified successfully"
  }
  ```
- **Errors**:
  - `400 Bad Request`: Invalid OTP or OTP expired.
  - `429 Too Many Requests`: Maximum 5 attempts exceeded.

---

### 6. Forgot Password
Sends a 6-digit password reset code to the user's email (stored in Redis for 10 minutes).

- **Method**: `POST`
- **Route**: `/api/auth/forgot-password`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "alex@example.com"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "If that email address is registered, a password reset code has been sent."
  }
  ```
- **Errors**: `429 Too Many Requests` (60-second cooldown).

---

### 7. Reset Password
Validates the reset OTP and updates the password hash in the database.

- **Method**: `POST`
- **Route**: `/api/auth/reset-password`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "alex@example.com",
    "otp": "654321",
    "newPassword": "NewStrongPassword456!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Password reset successfully. You can now sign in with your new password."
  }
  ```
- **Errors**: `400 Bad Request` (invalid or expired OTP).

---

### 8. Log Out
Clears the `token` cookie with matching security flags.

- **Method**: `POST`
- **Route**: `/api/auth/logout`
- **Auth Required**: No
- **Response `200 OK`**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

---

## Organization Endpoints

All organization endpoints require the user to be authenticated (`requireAuth`).

### 1. Create Organization
Creates a new organization. The authenticated user automatically becomes the `owner` and an `OrganizationMember` with role `OWNER`.

- **Method**: `POST`
- **Route**: `/api/organizations`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "name": "TeamFlow Labs",
    "slug": "teamflow-labs",
    "description": "Developer tooling and workflow automation",
    "websiteUrl": "https://teamflow.dev",
    "linkedinUrl": "https://linkedin.com/company/teamflow",
    "logoUrl": "https://teamflow.dev/logo.png"
  }
  ```
  *(Only `name` is required; `slug` will be generated automatically if omitted)*.
- **Response `201 Created`**:
  ```json
  {
    "message": "Organization created successfully",
    "organization": {
      "id": "e2a3c790-a29d-4cb1-807d-304a43b23612",
      "name": "TeamFlow Labs",
      "slug": "teamflow-labs",
      "description": "Developer tooling and workflow automation",
      "websiteUrl": "https://teamflow.dev",
      "linkedinUrl": "https://linkedin.com/company/teamflow",
      "logoUrl": "https://teamflow.dev/logo.png",
      "ownerId": "c1f7b884-18e4-4d1a-824b-2292d3f787e9",
      "createdAt": "2026-10-05T10:10:00.000Z",
      "updatedAt": "2026-10-05T10:10:00.000Z"
    }
  }
  ```

---

### 2. List User Organizations
Lists all organizations the authenticated user belongs to, along with their role in each.

- **Method**: `GET`
- **Route**: `/api/organizations`
- **Auth Required**: Yes
- **Response `200 OK`**:
  ```json
  {
    "count": 1,
    "organizations": [
      {
        "id": "e2a3c790-a29d-4cb1-807d-304a43b23612",
        "name": "TeamFlow Labs",
        "slug": "teamflow-labs",
        "description": "Developer tooling and workflow automation",
        "owner": {
          "id": "c1f7b884-18e4-4d1a-824b-2292d3f787e9",
          "name": "Alex Johnson",
          "email": "alex@example.com"
        },
        "_count": {
          "members": 3
        },
        "userRole": "OWNER",
        "joinedAt": "2026-10-05T10:10:00.000Z"
      }
    ]
  }
  ```

---

### 3. Get Organization Details
Returns details for a specific organization, including its members and owner. Caller must be an active member.

- **Method**: `GET`
- **Route**: `/api/organizations/:id`
- **Auth Required**: Yes
- **Permissions Required**: Member (`VIEWER` or higher)
- **Response `200 OK`**:
  ```json
  {
    "organization": {
      "id": "e2a3c790-a29d-4cb1-807d-304a43b23612",
      "name": "TeamFlow Labs",
      "slug": "teamflow-labs",
      "description": "Developer tooling and workflow automation",
      "owner": {
        "id": "c1f7b884-18e4-4d1a-824b-2292d3f787e9",
        "name": "Alex Johnson",
        "email": "alex@example.com"
      },
      "members": [
        {
          "id": "m1",
          "role": "OWNER",
          "createdAt": "2026-10-05T10:10:00.000Z",
          "user": {
            "id": "c1f7b884-18e4-4d1a-824b-2292d3f787e9",
            "name": "Alex Johnson",
            "email": "alex@example.com"
          }
        }
      ],
      "_count": {
        "members": 1
      }
    },
    "userRole": "OWNER"
  }
  ```
- **Errors**: `403 Forbidden` (caller is not a member), `404 Not Found`.

---

### 4. Update Organization
Updates organization metadata.

- **Method**: `PATCH`
- **Route**: `/api/organizations/:id`
- **Auth Required**: Yes
- **Permissions Required**: `ADMIN` or `OWNER`
- **Request Body**:
  ```json
  {
    "name": "TeamFlow Global Labs",
    "description": "Updated enterprise description",
    "websiteUrl": "https://teamflow.io"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Organization updated successfully",
    "organization": { ... }
  }
  ```
- **Errors**: `403 Forbidden` (insufficient role), `409 Conflict` (slug already taken).

---

### 5. Delete Organization
Permanently deletes the organization and cascades to all memberships and invitations.

- **Method**: `DELETE`
- **Route**: `/api/organizations/:id`
- **Auth Required**: Yes
- **Permissions Required**: `OWNER` only
- **Response `200 OK`**:
  ```json
  {
    "message": "Organization deleted successfully"
  }
  ```
- **Errors**: `403 Forbidden` (non-owners cannot delete).

---

### 6. Invite Member
Generates a secure 7-day invitation token and emails the invitee.

- **Method**: `POST`
- **Route**: `/api/organizations/:id/invitations` *(alias: `/api/organizations/:id/invite`)*
- **Auth Required**: Yes
- **Permissions Required**: `MANAGER` or higher
  - `MANAGER`: Can invite as `MEMBER` or `VIEWER`.
  - `ADMIN` / `OWNER`: Can invite as `ADMIN`, `MANAGER`, `MEMBER`, or `VIEWER`.
- **Request Body**:
  ```json
  {
    "email": "sarah@example.com",
    "role": "MEMBER"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "message": "Invitation sent successfully",
    "invitation": {
      "id": "i123",
      "email": "sarah@example.com",
      "role": "MEMBER",
      "token": "4f2a713919e8cf78e9b0...",
      "expiresAt": "2026-10-12T10:00:00.000Z"
    }
  }
  ```
- **Errors**:
  - `400 Bad Request`: User is already a member.
  - `409 Conflict`: An active pending invitation already exists for this email.

---

### 7. List Organization Invitations
Lists all pending invitations sent for the organization.

- **Method**: `GET`
- **Route**: `/api/organizations/:id/invitations`
- **Auth Required**: Yes
- **Permissions Required**: `MANAGER` or higher
- **Response `200 OK`**:
  ```json
  {
    "count": 1,
    "invitations": [
      {
        "id": "i123",
        "email": "sarah@example.com",
        "role": "MEMBER",
        "status": "PENDING",
        "expiresAt": "2026-10-12T10:00:00.000Z",
        "invitedBy": {
          "id": "c1f7b884...",
          "name": "Alex Johnson",
          "email": "alex@example.com"
        }
      }
    ]
  }
  ```

---

### 8. Accept Invitation
Allows any authenticated user holding the invitation token to join the organization.

- **Method**: `POST`
- **Route**: `/api/organizations/invitations/accept`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "token": "4f2a713919e8cf78e9b0..."
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Successfully joined TeamFlow Labs",
    "organization": {
      "id": "e2a3c790-a29d-4cb1-807d-304a43b23612",
      "name": "TeamFlow Labs"
    },
    "role": "MEMBER"
  }
  ```
- **Errors**: `400 Bad Request` (token expired or already accepted), `404 Not Found` (invalid token).

---

### 9. List Organization Members
Lists all active members in the organization.

- **Method**: `GET`
- **Route**: `/api/organizations/:id/members`
- **Auth Required**: Yes
- **Permissions Required**: Member (`VIEWER` or higher)
- **Response `200 OK`**:
  ```json
  {
    "count": 2,
    "members": [
      {
        "id": "mem_1",
        "userId": "usr_1",
        "organizationId": "org_1",
        "role": "OWNER",
        "createdAt": "2026-10-05T10:10:00.000Z",
        "user": {
          "id": "usr_1",
          "name": "Alex Johnson",
          "email": "alex@example.com"
        }
      },
      {
        "id": "mem_2",
        "userId": "usr_2",
        "organizationId": "org_1",
        "role": "MEMBER",
        "createdAt": "2026-10-05T10:20:00.000Z",
        "user": {
          "id": "usr_2",
          "name": "Sarah Connor",
          "email": "sarah@example.com"
        }
      }
    ]
  }
  ```

---

### 10. Change Member Role
Updates a member's role in the organization.

- **Method**: `PATCH`
- **Route**: `/api/organizations/:id/members/:memberId/role`
  *(Note: `:memberId` can be either the `OrganizationMember.id` or the user's `userId`)*.
- **Auth Required**: Yes
- **Permissions Required**: `ADMIN` or `OWNER`
  - `ADMIN`: Cannot alter other Admins' roles, and cannot promote members to `ADMIN`.
  - `OWNER`: Full role management.
- **Request Body**:
  ```json
  {
    "role": "ADMIN"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Member role updated successfully",
    "member": {
      "id": "mem_2",
      "userId": "usr_2",
      "role": "ADMIN",
      "user": { ... }
    }
  }
  ```
- **Errors**: `400 Bad Request` (cannot alter owner role), `403 Forbidden` (insufficient privileges).

---

### 11. Remove Member
Removes a member from the organization.

- **Method**: `DELETE`
- **Route**: `/api/organizations/:id/members/:memberId`
  *(Note: `:memberId` can be either the `OrganizationMember.id` or the user's `userId`)*.
- **Auth Required**: Yes
- **Permissions Required**: `ADMIN` or `OWNER`
  - `ADMIN`: Cannot remove other `ADMIN`s or the `OWNER`.
  - `OWNER`: Can remove any member (except cannot remove self).
- **Response `200 OK`**:
  ```json
  {
    "message": "Member Sarah Connor removed from organization successfully"
  }
  ```
- **Errors**: `400 Bad Request` (cannot remove owner), `403 Forbidden`.

---

### 12. Leave Organization
Allows a member to voluntarily leave an organization.

- **Method**: `POST`
- **Route**: `/api/organizations/:id/leave`
- **Auth Required**: Yes
- **Permissions Required**: Non-owner Member
- **Response `200 OK`**:
  ```json
  {
    "message": "You have left the organization successfully"
  }
  ```
- **Errors**: `400 Bad Request` (owner cannot leave without transferring ownership or deleting the organization).


---

## Project Endpoints

Projects belong to an Organization:
```text
Organization
  │
  ├── Project A
  ├── Project B
  └── Project C
```

- Project Roles: `TEAMLEAD`, `MEMBER`.
- Project Statuses: `ACTIVE`, `ARCHIVED`.
- Only members of the parent organization can be added to its projects.
- Creating a project automatically designates the creator as `TEAMLEAD`.

### 1. Create Project
Creates a new project inside an organization.

- **Method**: `POST`
- **Route**: `/api/organizations/:organizationId/projects` *(or `/api/projects` with `organizationId` in body)*
- **Auth Required**: Yes
- **Permissions Required**: Member of the Organization (`MEMBER` or higher)
- **Request Body**:
  ```json
  {
    "name": "Backend Refactor",
    "slug": "backend-refactor",
    "description": "Migrating APIs and database queries"
  }
  ```
  *(Only `name` is required; `slug` will be automatically generated if omitted)*.
- **Response `201 Created`**:
  ```json
  {
    "message": "Project created successfully",
    "project": {
      "id": "p1234",
      "name": "Backend Refactor",
      "slug": "backend-refactor",
      "description": "Migrating APIs and database queries",
      "status": "ACTIVE",
      "createdBy": "usr_123",
      "organizationId": "org_456",
      "createdAt": "2026-10-05T12:00:00.000Z",
      "updatedAt": "2026-10-05T12:00:00.000Z"
    }
  }
  ```

---

### 2. List Projects in Organization
Lists all projects belonging to an organization.

- **Method**: `GET`
- **Route**: `/api/organizations/:organizationId/projects` *(or `/api/projects?organizationId=...`)*
- **Auth Required**: Yes
- **Permissions Required**: Member of the Organization
- **Query Parameters**:
  - `status`: Optional filter (`ACTIVE` or `ARCHIVED`).
- **Response `200 OK`**:
  ```json
  {
    "count": 2,
    "projects": [
      {
        "id": "p1234",
        "name": "Backend Refactor",
        "slug": "backend-refactor",
        "status": "ACTIVE",
        "creator": {
          "id": "usr_123",
          "name": "Alex Johnson",
          "email": "alex@example.com"
        },
        "_count": {
          "projectMembers": 3
        }
      }
    ]
  }
  ```

---

### 3. Get Project Details
Returns project details, including parent organization, creator, member count, and caller's project role.

- **Method**: `GET`
- **Route**: `/api/projects/:id`
- **Auth Required**: Yes
- **Permissions Required**: Member of the Organization
- **Response `200 OK`**:
  ```json
  {
    "project": {
      "id": "p1234",
      "name": "Backend Refactor",
      "slug": "backend-refactor",
      "status": "ACTIVE",
      "organization": {
        "id": "org_456",
        "name": "TeamFlow Labs",
        "slug": "teamflow-labs"
      },
      "creator": { ... },
      "projectMembers": [ ... ],
      "_count": {
        "projectMembers": 3
      }
    },
    "userProjectRole": "TEAMLEAD"
  }
  ```

---

### 4. Update Project
Updates project name, slug, or description.

- **Method**: `PATCH`
- **Route**: `/api/projects/:id`
- **Auth Required**: Yes
- **Permissions Required**: Project `TEAMLEAD`, Organization `ADMIN`, or Organization `OWNER`
- **Request Body**:
  ```json
  {
    "name": "Backend Refactor v2",
    "description": "Expanded migration scope"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Project updated successfully",
    "project": { ... }
  }
  ```

---

### 5. Archive Project
Toggles or sets project status between `ACTIVE` and `ARCHIVED`.

- **Method**: `PATCH`
- **Route**: `/api/projects/:id/archive`
- **Auth Required**: Yes
- **Permissions Required**: Project `TEAMLEAD`, Organization `ADMIN`, or Organization `OWNER`
- **Request Body** *(Optional)*:
  ```json
  {
    "status": "ARCHIVED"
  }
  ```
  *(If body is omitted, toggles the current status)*.
- **Response `200 OK`**:
  ```json
  {
    "message": "Project archived successfully",
    "project": {
      "id": "p1234",
      "status": "ARCHIVED"
    }
  }
  ```

---

### 6. Delete Project
Permanently deletes a project and cascades to all its project memberships.

- **Method**: `DELETE`
- **Route**: `/api/projects/:id`
- **Auth Required**: Yes
- **Permissions Required**: Project `TEAMLEAD`, Organization `ADMIN`, or Organization `OWNER`
- **Response `200 OK`**:
  ```json
  {
    "message": "Project deleted successfully"
  }
  ```

---

### 7. Add Project Member
Adds a user to a project. **The user must already be an active member of the parent organization.**

- **Method**: `POST`
- **Route**: `/api/projects/:id/members`
- **Auth Required**: Yes
- **Permissions Required**: Project `TEAMLEAD`, Organization `ADMIN`, or Organization `OWNER`
- **Request Body**:
  ```json
  {
    "email": "dev@example.com",
    "role": "MEMBER"
  }
  ```
  *(Accepts either `userId` or `email`, and `role`: `"MEMBER"` or `"TEAMLEAD"`)*.
- **Response `201 Created`**:
  ```json
  {
    "message": "Project member added successfully",
    "member": {
      "id": "pm_123",
      "projectId": "p1234",
      "userId": "usr_789",
      "role": "MEMBER",
      "user": {
        "id": "usr_789",
        "name": "Sarah Connor",
        "email": "dev@example.com"
      }
    }
  }
  ```
- **Errors**: `400 Bad Request` (user is not an organization member), `409 Conflict` (already in project).

---

### 8. List Project Members
Lists all members assigned to a project.

- **Method**: `GET`
- **Route**: `/api/projects/:id/members`
- **Auth Required**: Yes
- **Permissions Required**: Member of the Organization
- **Response `200 OK`**:
  ```json
  {
    "count": 2,
    "members": [
      {
        "id": "pm_1",
        "role": "TEAMLEAD",
        "user": { ... }
      },
      {
        "id": "pm_2",
        "role": "MEMBER",
        "user": { ... }
      }
    ]
  }
  ```

---

### 9. Change Project Member Role
Updates a member's role in a project (`TEAMLEAD` or `MEMBER`).

- **Method**: `PATCH`
- **Route**: `/api/projects/:id/members/:memberId/role`
  *(Note: `:memberId` can be the `ProjectMember.id` or the user's `userId`)*.
- **Auth Required**: Yes
- **Permissions Required**: Project `TEAMLEAD`, Organization `ADMIN`, or Organization `OWNER`
- **Request Body**:
  ```json
  {
    "role": "TEAMLEAD"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Project member role updated successfully",
    "member": { ... }
  }
  ```

---

### 10. Remove Project Member
Removes a member from a project.

- **Method**: `DELETE`
- **Route**: `/api/projects/:id/members/:memberId`
  *(Note: `:memberId` can be the `ProjectMember.id` or the user's `userId`)*.
- **Auth Required**: Yes
- **Permissions Required**: Project `TEAMLEAD`, Organization `ADMIN`, or Organization `OWNER`
- **Response `200 OK`**:
  ```json
  {
    "message": "Member Sarah Connor removed from project successfully"
  }
  ```


---

## Task Endpoints

Tasks are work items belonging to a Project:
```text
Organization
  │
  └── Project
        │
        ├── Task 1 (Assignee, Status, Priority)
        ├── Task 2
        └── Task 3
```

- **Task Statuses**: `BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE` (Default: `BACKLOG`).
- **Task Priorities**: `LOW`, `MEDIUM`, `HIGH`, `URGENT` (Default: `MEDIUM`).
- **Assignees**: Must be an active member of the project's parent organization.

### 1. Create Task
Creates a new task in a project.

- **Method**: `POST`
- **Route**: `/projects/:projectId/tasks` *(alias: `/api/projects/:projectId/tasks`)*
- **Auth Required**: Yes
- **Permissions Required**: Member of the Organization
- **Request Body**:
  ```json
  {
    "title": "Implement OAuth2 PKCE Flow",
    "description": "Build robust authorization code with PKCE verification",
    "priority": "HIGH",
    "status": "TODO",
    "assigneeId": "c1f7b884-18e4-4d1a-824b-2292d3f787e9"
  }
  ```
  *(Only `title` is required; `assigneeId` is optional)*.
- **Response `201 Created`**:
  ```json
  {
    "message": "Task created successfully",
    "task": {
      "id": "t123",
      "title": "Implement OAuth2 PKCE Flow",
      "description": "Build robust authorization code with PKCE verification",
      "status": "TODO",
      "priority": "HIGH",
      "projectId": "p1234",
      "createdBy": "usr_123",
      "assigneeId": "usr_456",
      "createdAt": "2026-10-06T10:00:00.000Z",
      "updatedAt": "2026-10-06T10:00:00.000Z",
      "creator": {
        "id": "usr_123",
        "name": "Alex Johnson",
        "email": "alex@example.com"
      },
      "assignee": {
        "id": "usr_456",
        "name": "Sarah Connor",
        "email": "sarah@example.com"
      }
    }
  }
  ```
- **Errors**: `400 Bad Request` (assignee not in org, or project archived), `403 Forbidden`, `404 Not Found`.

---

### 2. List Tasks in Project
Lists and filters all tasks in a project.

- **Method**: `GET`
- **Route**: `/projects/:projectId/tasks` *(alias: `/api/projects/:projectId/tasks`)*
- **Auth Required**: Yes
- **Permissions Required**: Member of the Organization
- **Query Parameters**:
  - `status`: Optional filter (`BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`).
  - `priority`: Optional filter (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - `assigneeId`: Optional filter (`<USER_ID>` or `unassigned`).
  - `search`: Search query matching task title or description.
  - `page`: Page number (default: `1`).
  - `limit`: Items per page (default: `50`, max: `100`).
  - `sortBy`: Field to sort by (`createdAt`, `updatedAt`, `priority`, `status`, `title`).
  - `order`: `asc` or `desc` (default: `desc`).
- **Response `200 OK`**:
  ```json
  {
    "count": 1,
    "total": 1,
    "page": 1,
    "limit": 50,
    "totalPages": 1,
    "tasks": [
      {
        "id": "t123",
        "title": "Implement OAuth2 PKCE Flow",
        "status": "TODO",
        "priority": "HIGH",
        "creator": { ... },
        "assignee": { ... }
      }
    ]
  }
  ```

---

### 3. Get Task Details
Returns complete task details including project, parent organization, creator, and assignee.

- **Method**: `GET`
- **Route**: `/tasks/:taskId` *(alias: `/api/tasks/:taskId`)*
- **Auth Required**: Yes
- **Permissions Required**: Member of the Organization
- **Response `200 OK`**:
  ```json
  {
    "task": {
      "id": "t123",
      "title": "Implement OAuth2 PKCE Flow",
      "description": "Build robust authorization code with PKCE verification",
      "status": "TODO",
      "priority": "HIGH",
      "projectId": "p1234",
      "createdBy": "usr_123",
      "assigneeId": "usr_456",
      "createdAt": "2026-10-06T10:00:00.000Z",
      "updatedAt": "2026-10-06T10:00:00.000Z",
      "creator": { ... },
      "assignee": { ... },
      "project": {
        "id": "p1234",
        "name": "Backend Refactor",
        "slug": "backend-refactor",
        "status": "ACTIVE",
        "organizationId": "org_456",
        "organization": {
          "id": "org_456",
          "name": "TeamFlow Labs",
          "slug": "teamflow-labs"
        }
      }
    }
  }
  ```
- **Errors**: `403 Forbidden`, `404 Not Found`.

---

### 4. Update Task
Updates task title, description, status, priority, or assignee.

- **Method**: `PATCH`
- **Route**: `/tasks/:taskId` *(alias: `/api/tasks/:taskId`)*
- **Auth Required**: Yes
- **Permissions Required**: Member of the Organization
- **Request Body**:
  ```json
  {
    "status": "IN_PROGRESS",
    "priority": "URGENT",
    "description": "Work started by dev team"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Task updated successfully",
    "task": {
      "id": "t123",
      "status": "IN_PROGRESS",
      "priority": "URGENT",
      "description": "Work started by dev team",
      ...
    }
  }
  ```
- **Errors**: `400 Bad Request` (invalid input or project archived), `403 Forbidden`, `404 Not Found`.

---

### 5. Delete Task
Deletes a task.

- **Method**: `DELETE`
- **Route**: `/tasks/:taskId` *(alias: `/api/tasks/:taskId`)*
- **Auth Required**: Yes
- **Permissions Required**: Task Creator, Project TeamLead, or Organization Admin/Owner
- **Response `200 OK`**:
  ```json
  {
    "message": "Task deleted successfully"
  }
  ```
- **Errors**: `403 Forbidden` (insufficient permissions), `404 Not Found`.


// ----------------------------------------------------
// Search Endpoints
// ----------------------------------------------------

---

## Search Endpoints

TeamFlow provides high-performance multi-tenant search capabilities across Projects, Tasks, and Members. Every search query is strictly isolated to the caller's organization to prevent cross-tenant information leaks (IDOR).

### 1. Unified Global Multi-Entity Search
Searches across Projects, Tasks, and Organization Members in a single query. Ideal for command palettes (Cmd+K / Ctrl+K) and top-bar search inputs.

- **Method**: `GET`
- **Route**: `/api/search` *(alias: `/search`)*
- **Auth Required**: Yes
- **Query Parameters**:
  - `q` *(required, string)*: Search keyword.
  - `organizationId` *(optional, UUID)*: If provided, scopes the search strictly to this organization. **If omitted, searches across ALL organizations the authenticated user belongs to!**
  - `type` *(optional)*: `all` (default), `organizations`, `projects`, `tasks`, or `members`.
  - `limit` *(optional, integer)*: Maximum items returned per category (default: 10, max: 50).
- **Response `200 OK`**:
  ```json
  {
    "query": "design",
    "organizationId": "e2a3c790-a29d-4cb1-807d-304a43b23612",
    "counts": {
      "projects": 1,
      "tasks": 2,
      "members": 1,
      "total": 4
    },
    "results": {
      "projects": [
        {
          "id": "p1234",
          "name": "Website Redesign",
          "slug": "website-redesign",
          "description": "Revamping homepage and UI tokens",
          "status": "ACTIVE",
          "createdAt": "2026-10-06T10:00:00.000Z",
          "updatedAt": "2026-10-06T11:00:00.000Z"
        }
      ],
      "tasks": [
        {
          "id": "t101",
          "title": "Design Landing Page",
          "status": "TODO",
          "priority": "HIGH",
          "project": {
            "id": "p1234",
            "name": "Website Redesign",
            "slug": "website-redesign"
          },
          "assignee": {
            "id": "usr_1",
            "name": "Alex Johnson",
            "email": "alex@example.com"
          }
        }
      ],
      "members": [
        {
          "id": "mem_1",
          "role": "ADMIN",
          "user": {
            "id": "usr_2",
            "name": "Design Lead",
            "email": "designer@teamflow.dev"
          },
          "joinedAt": "2026-10-05T10:00:00.000Z"
        }
      ]
    }
  }
  ```
- **Errors**: `400 Bad Request` (missing organizationId), `403 Forbidden` (caller not a member).

---

### 2. Dedicated Projects Search
Dedicated endpoint for searching projects in an organization with status filtering, dynamic sorting, and pagination.

- **Method**: `GET`
- **Route**: `/api/search/projects` *(alias: `/api/projects/search`)*
- **Auth Required**: Yes
- **Query Parameters**:
  - `organizationId` *(required, UUID)*: The organization ID.
  - `q` *(optional, string)*: Keyword matching name, slug, or description (case-insensitive).
  - `status` *(optional)*: `ACTIVE` or `ARCHIVED`.
  - `sortBy` *(optional)*: `createdAt`, `updatedAt`, `name`, or `status` (default: `updatedAt`).
  - `order` *(optional)*: `asc` or `desc` (default: `desc`).
  - `page` *(optional, integer)*: 1-indexed page (default: 1).
  - `limit` *(optional, integer)*: Items per page (default: 20, max: 100).
- **Response `200 OK`**:
  ```json
  {
    "query": "mobile",
    "organizationId": "e2a3c790-a29d-4cb1-807d-304a43b23612",
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "count": 1,
    "projects": [
      {
        "id": "p5678",
        "name": "Mobile App iOS",
        "slug": "mobile-app-ios",
        "description": "Native iOS client",
        "status": "ACTIVE",
        "creator": {
          "id": "usr_1",
          "name": "Alex Johnson",
          "email": "alex@example.com"
        },
        "_count": {
          "projectMembers": 4,
          "tasks": 12
        }
      }
    ]
  }
  ```

---

### 3. Dedicated Tasks Search
Search tasks across an entire organization (or scoped to a specific project) with status, priority, and assignee filters.

- **Method**: `GET`
- **Route**: `/api/search/tasks`
- **Auth Required**: Yes
- **Query Parameters**:
  - `organizationId` *(required, UUID)*: The parent organization.
  - `projectId` *(optional, UUID)*: Narrow search to a specific project.
  - `q` *(optional, string)*: Keyword matching task title or description.
  - `status` *(optional)*: `BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`.
  - `priority` *(optional)*: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
  - `assigneeId` *(optional, UUID or "unassigned")*: Filter by assignee.
  - `sortBy` *(optional)*: `createdAt`, `updatedAt`, `priority`, `status`, `title` (default: `updatedAt`).
  - `order` *(optional)*: `asc` or `desc` (default: `desc`).
  - `page` *(optional, integer)*: Default 1.
  - `limit` *(optional, integer)*: Default 20, max 100.
- **Response `200 OK`**:
  ```json
  {
    "query": "auth",
    "organizationId": "e2a3c790-a29d-4cb1-807d-304a43b23612",
    "total": 3,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "count": 3,
    "tasks": [
      {
        "id": "t201",
        "title": "Implement Auth Middleware",
        "status": "IN_PROGRESS",
        "priority": "URGENT",
        "project": {
          "id": "p1234",
          "name": "Backend Refactor",
          "slug": "backend-refactor"
        },
        "assignee": {
          "id": "usr_1",
          "name": "Alex Johnson",
          "email": "alex@example.com"
        }
      }
    ]
  }
  ```

---

### 4. Organization-Scoped Search
A RESTful convenience route directly scoped by organization ID.

- **Method**: `GET`
- **Route**: `/api/organizations/:id/search`
- **Auth Required**: Yes
- **Permissions Required**: Member of the organization
- **Query Parameters**: Same as `/api/search` (`q`, `type`, `limit`).

---

# Core Backend Concepts & Architecture Guide
*(Use this section to learn, master, and explain the backend engineering principles behind TeamFlow in interviews, presentations, and code reviews).*

---

## 1. ACID Properties Explained with Real Project Code

When designing a production-grade relational database backend, **ACID** guarantees that data operations remain reliable, consistent, and resilient even under heavy concurrency or system crashes.

---

### A — Atomicity ("All or Nothing")

#### The Concept:
A transaction groups multiple database operations into a single logical unit. If **any** operation within the transaction fails, all preceding changes are completely **rolled back**, leaving the database in its original state.

#### How It Is Used in TeamFlow:
When a user creates an organization, two separate tables must be updated:
1. Insert a row into the `Organization` table.
2. Insert a row into the `OrganizationMember` table assigning the creator as `OWNER`.

Without atomicity, if Step 2 crashes (due to a network error, constraint violation, or server reboot), you would be left with a **corrupted, orphaned organization with no owner and no members**.

#### The Code Implementation:
In [`apps/api/src/controllers/organization.controller.ts`](file:///c:/Users/chand/Projects/TeamFlow/apps/api/src/controllers/organization.controller.ts):

```typescript
// Atomicity: If adding the owner membership fails, the organization creation is rolled back.
const organization = await prisma.$transaction(async (tx) => {
    // Step 1: Create Organization
    const org = await tx.organization.create({
        data: {
            name,
            slug,
            description: description || null,
            websiteUrl: websiteUrl || null,
            linkedinUrl: linkedinUrl || null,
            logoUrl: logoUrl || null,
            ownerId: req.user!.userId,
        },
    });

    // Step 2: Create Owner Membership
    await tx.organizationMember.create({
        data: {
            userId: req.user!.userId,
            organizationId: org.id,
            role: "OWNER",
        },
    });

    return org;
});
```

#### Another Example: Accepting an Invitation
In [`apps/api/src/controllers/organization.controller.ts`](file:///c:/Users/chand/Projects/TeamFlow/apps/api/src/controllers/organization.controller.ts):

```typescript
// Atomicity: Adding the member and marking the invitation as ACCEPTED must happen together.
const membership = await prisma.$transaction(async (tx) => {
    const member = await tx.organizationMember.create({
        data: {
            userId: req.user!.userId,
            organizationId: invitation.organizationId,
            role: invitation.role,
        },
    });

    await tx.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
    });

    return member;
});
```

> **How to explain in an interview**:  
> *"In TeamFlow, multi-step mutations like organization creation and invitation acceptance are wrapped inside Prisma interactive transactions (`prisma.$transaction`). This enforces atomicity so that if any step throws an error, the database rolls back completely, preventing half-written or orphaned state."*

---

### C — Consistency ("Preserving Invariants and Rules")

#### The Concept:
Consistency guarantees that the database transitions only from one valid state to another, strictly adhering to all schema definitions, constraints, foreign keys, and application-level business rules.

#### How It Is Used in TeamFlow:

1. **Foreign Key Referential Integrity & Cascades**:  
   In [`packages/db/prisma/schema.prisma`](file:///c:/Users/chand/Projects/TeamFlow/packages/db/prisma/schema.prisma):
   ```prisma
   model Task {
     id         String   @id @default(uuid())
     projectId  String
     assigneeId String?

     // Invariant: A task cannot reference a non-existent project
     // When a project is deleted, its tasks are automatically deleted
     project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

     // Invariant: If an assigned user is deleted, assigneeId is set to NULL rather than a broken ID
     assignee   User?    @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
   }
   ```

2. **Composite Unique Constraints**:  
   In [`packages/db/prisma/schema.prisma`](file:///c:/Users/chand/Projects/TeamFlow/packages/db/prisma/schema.prisma):
   ```prisma
   model OrganizationMember {
     // A user cannot be added to the same organization twice
     @@unique([userId, organizationId])
   }

   model Project {
     // Two projects in the same organization cannot have the same slug
     @@unique([organizationId, slug])
   }

   model ProjectMember {
     // A user cannot be added to the same project twice
     @@unique([projectId, userId])
   }
   ```

3. **Application-Level Tenant Invariants**:  
   In [`apps/api/src/controllers/task.controller.ts`](file:///c:/Users/chand/Projects/TeamFlow/apps/api/src/controllers/task.controller.ts):
   ```typescript
   // Cross-tenant Invariant: An assignee must belong to the project's parent organization!
   if (assigneeId) {
       const assigneeOrgMembership = await prisma.organizationMember.findUnique({
           where: {
               userId_organizationId: {
                   userId: assigneeId,
                   organizationId: project.organizationId,
               },
           },
       });

       if (!assigneeOrgMembership) {
           return res.status(400).json({
               message: "The assigned user is not a member of this organization.",
           });
       }
   }
   ```

> **How to explain in an interview**:  
> *"We enforce consistency on two layers: at the database layer via PostgreSQL foreign keys, `onDelete: Cascade` / `SetNull`, and composite unique constraints (`@@unique`); and at the application layer via Zod schema parsing and multi-tenant boundary checks to ensure foreign entities cannot be cross-assigned."*

---

### I — Isolation ("Preventing Concurrent Collisions")

#### The Concept:
Isolation ensures that concurrent transactions execute independently without interfering with each other. Intermediate, uncommitted reads from one transaction must not cause dirty reads, non-repeatable reads, or phantom records in another transaction.

#### How It Is Used in TeamFlow:

1. **PostgreSQL MVCC & Row-Level Locking on Unique Keys**:  
   If two requests simultaneously try to create a project with the same slug `mobile-app` in the same organization:
   - Both requests execute concurrently.
   - When both reach the commit phase, PostgreSQL's row-level lock on the `@@unique([organizationId, slug])` B-Tree index guarantees that one transaction commits successfully while the second is rejected with error `P2002` (Unique constraint violation).
   - Neither transaction overwrites the other.

2. **Atomic Single-Threaded Isolation in Redis**:  
   In [`apps/api/src/controllers/auth.controller.ts`](file:///c:/Users/chand/Projects/TeamFlow/apps/api/src/controllers/auth.controller.ts) & [`apps/api/src/controllers/email.controller.ts`](file:///c:/Users/chand/Projects/TeamFlow/apps/api/src/controllers/email.controller.ts):
   ```typescript
   // Atomic isolation: Redis executes commands sequentially in an event loop
   await redis.set(`pwd-reset:${user.id}`, otp, { EX: 10 * 60 });
   await redis.set(`pwd-reset-cooldown:${user.id}`, "1", { EX: 60 });
   ```
   Even if an attacker spams thousands of simultaneous requests to generate reset OTPs, Redis serializes each `SET` and `GET` atomically, eliminating race conditions.

> **How to explain in an interview**:  
> *"PostgreSQL uses Multi-Version Concurrency Control (MVCC) along with row locks on unique index constraints to prevent duplicate entries under race conditions. For ephemeral operations like rate limiting and OTP cooldowns, we use Redis which operates on an atomic, single-threaded execution loop."*

---

### D — Durability ("Surviving Crashes and Power Outages")

#### The Concept:
Once a transaction is committed, its changes are **permanently saved** to non-volatile storage. Even if the server crashes, power is lost, or the container restarts immediately after, the data will not be lost.

#### How It Works in TeamFlow & PostgreSQL:
- When `await prisma.task.create(...)` resolves, PostgreSQL has written the transaction to disk in its **Write-Ahead Log (WAL)**.
- In our Neon Serverless PostgreSQL database, the WAL pages are replicated across multi-AZ storage nodes.
- If the Node.js Express process terminates or restarts, all persisted records (`User`, `Organization`, `Project`, `Task`) remain completely intact.

> **How to explain in an interview**:  
> *"Durability is guaranteed by PostgreSQL's Write-Ahead Log (WAL). Before a commit acknowledgement is returned to our API layer, the changes are flushed to durable storage, ensuring that our committed state survives application crashes and restarts."*

---

## 2. Multi-Tenant Architecture & Data Security

TeamFlow is designed as a **hierarchical multi-tenant system**:

```text
User
  │
  └── Organization (Tenant Boundary)
        │
        ├── OrganizationMember (OWNER, ADMIN, MANAGER, MEMBER, VIEWER)
        │
        └── Project
              │
              ├── ProjectMember (TEAMLEAD, MEMBER)
              │
              └── Task (Assignee, Status, Priority)
```

### Data Isolation & IDOR Protection:
An **IDOR (Insecure Direct Object Reference)** vulnerability occurs when an authenticated user accesses a resource belonging to another organization simply by knowing its UUID.

To prevent IDOR across all endpoints:
1. Every task endpoint validates that the target task belongs to a project whose `organizationId` matches the caller's membership.
2. Every project endpoint validates caller membership in the parent organization before returning or mutating data.
3. Every member assignment validates that the assigned user belongs to that same organization.

---

## 3. Authentication & Security Strategy

1. **Dual Token Delivery**:
   - **HTTP-Only Cookies**: Automatically set on `signup` and `signin` with `sameSite: "lax"`, `secure` in production, and `httpOnly: true` (protects against XSS token theft).
   - **Bearer Header**: Supports `Authorization: Bearer <token>` for REST clients (Postman, curl) and mobile apps.
2. **Password Security**:
   - Salted and hashed using **Bcrypt with cost factor 12**.
   - Timing attack mitigation: Consistent comparison paths to prevent email enumeration.
   - Input normalization: Auto-trimming and lowercasing email addresses before hashing or querying.
3. **Brute Force Protection**:
   - OTP verification is tracked in Redis (`email-verify-attempts:${userId}`).
   - If a caller fails 5 consecutive OTP attempts, the OTP is destroyed, and the caller is locked out with `429 Too Many Requests`.

---

## 4. Interview Cheat Sheet: How to Explain TeamFlow in 2 Minutes

When presenting this project to an interviewer or senior engineer, structure your explanation with this 4-point narrative:

1. **The Product**:
   > *"TeamFlow is a full-featured project and task management backend built with Express 5, Prisma 7, PostgreSQL, and Redis, structured as a Turborepo monorepo."*
2. **The Architecture**:
   > *"The data model follows a multi-tenant hierarchy: Users create Organizations, Organizations host Projects, and Projects contain Tasks with role-based access control ranging from Organization Owner down to Project TeamLead."*
3. **The Data Integrity (ACID)**:
   > *"We treat data consistency as a first-class requirement. We use Prisma interactive transactions (`$transaction`) for atomic multi-table operations like organization creation and invitation acceptance. Database integrity is preserved via foreign keys with cascading deletes, composite unique constraints, and multi-tenant invariants."*
4. **The Security & Resilience**:
   > *"For security, we employ Bcrypt with cost factor 12, dual JWT delivery via HTTP-only cookies and Bearer headers, and Redis-backed rate limiting with OTP brute-force defense. For developer ergonomics, SMTP failures fall back to terminal logging so endpoint testing is never blocked."*

---

## 5. Search, Indexing & Pagination Engineering Concepts (Senior SDE Guide)

Search and pagination are critical backend capabilities. Below is the comprehensive conceptual and architectural reference explaining how database engines execute search, how indexes function under the hood, and how to scale queries in high-throughput systems.

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SEARCH SPECTRUM                              │
│                                                                                 │
│   Exact & Prefix           Substring & Fuzzy        Full-Text Search (FTS)      │
│   B-Tree Index             Trigram Index (pg_trgm)  GIN Index + tsvector        │
│   WHERE name = 'X'         WHERE name ILIKE '%X%'   WHERE tsv @@ to_tsquery('X')│
│   O(log N)                 O(log N)                 O(log N) Inverted Index     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### A — Pagination Architecture: Offset vs Keyset (Cursor)

#### 1. Offset-Based Pagination (`OFFSET` / `LIMIT`)
- **SQL Mechanics**:
  ```sql
  SELECT id, title, status, created_at 
  FROM "Task" 
  WHERE "projectId" = 'p-123' 
  ORDER BY "createdAt" DESC 
  LIMIT 20 OFFSET 100000;
  ```
- **How PostgreSQL Executes This Under the Hood**:
  1. Scans the index or heap table for matching rows.
  2. Traverses and reads **100,020 rows** into memory.
  3. Discards the first 100,000 rows.
  4. Returns the final 20 rows.
- **Time Complexity**: $\mathcal{O}(N)$ where $N$ is the offset depth.
- **The "Deep Pagination" Bottleneck**:
  As page numbers increase (e.g., page 5,000), queries become drastically slower and consume excessive disk I/O and RAM.
- **The "Page Drift" / Phantom Row Problem**:
  If a new task is created while a user is on page 1, when they click "Page 2", the bottom item from page 1 shifts into page 2, causing the user to see a duplicate record.
- **When to Use**:
  - Administrative back-offices or dashboards where users must jump directly to a specific page number (e.g., "Go to Page 7").
  - Small to moderate datasets (< 100,000 rows).

#### 2. Keyset / Cursor-Based Pagination
- **SQL Mechanics**:
  Instead of an offset, the client sends the identifier of the last item received (`cursor`):
  ```sql
  SELECT id, title, status, created_at 
  FROM "Task" 
  WHERE "projectId" = 'p-123' 
    AND ("createdAt", "id") < ('2026-10-06T10:00:00Z', 't-999')
  ORDER BY "createdAt" DESC, "id" DESC 
  LIMIT 20;
  ```
- **How PostgreSQL Executes This Under the Hood**:
  - With a composite index on `(projectId, createdAt DESC, id DESC)`, the query engine performs a **B-Tree Index Seek** directly to the cursor position in $\mathcal{O}(\log N)$ or $\mathcal{O}(1)$.
  - It reads only the 20 requested index tuples and returns immediately.
- **Time Complexity**: $\mathcal{O}(1)$ independent of dataset depth.
- **Trade-Offs**:
  - **Pros**: Constant time $\mathcal{O}(1)$ performance; immune to page drift; perfect for infinite scrolling (Slack, Twitter, Linear feeds).
  - **Cons**: Cannot jump to an arbitrary page (e.g. "Page 14"); requires a deterministic tie-breaker column (e.g., composite `(createdAt, id)`).

#### 3. Summary Comparison Table

| Dimension | Offset Pagination (`skip` / `take`) | Keyset / Cursor Pagination |
| :--- | :--- | :--- |
| **Prisma Usage** | `skip: (page - 1) * limit, take: limit` | `cursor: { id }, skip: 1, take: limit` |
| **Complexity at Deep Pages** | $\mathcal{O}(N)$ (Slow at high page counts) | $\mathcal{O}(1)$ (Always fast) |
| **Page Drift (Inserts/Deletes)** | Vulnerable to duplicate/skipped items | Completely stable |
| **Random Page Navigation** | Supported ("Jump to page 5") | Not supported (Next / Previous only) |
| **Total Count Overhead** | Requires expensive `SELECT COUNT(*)` | Usually omitted or cached in Redis |

---

### B — Database Indexing & Search Mechanics

#### 1. Why `LIKE '%keyword%'` Bypasses Standard B-Tree Indexes
In relational databases, the default index structure is a **B-Tree** (Balanced Tree).
- A B-Tree maintains values sorted lexicographically from left to right:
  `["Alpha", "Beta", "Gamma", "Zeta"]`
- When you execute a prefix search `LIKE 'Beta%'`, the database traverses the tree starting at root $\rightarrow$ navigates to `"B"` in $\mathcal{O}(\log N)$ steps.
- When you execute a substring search `LIKE '%eta%'` (as done by Prisma `{ contains: "eta" }`), the leading character is wildcarded. The database cannot determine which branch to search, forcing the query planner to switch from an **Index Scan** to a **Sequential Scan (Seq Scan)**, inspecting every single table block.

#### 2. Inverted Indexes (GIN — Generalized Inverted Index)
To make substring and full-text searches $\mathcal{O}(\log N)$, PostgreSQL uses **GIN (Generalized Inverted Index)**:
- **Concept**:
  Instead of mapping `RowID -> Document`, an inverted index maps `Word -> List of RowIDs`.
  ```text
  "auth"       -> [Task #12, Task #45, Task #90]
  "middleware" -> [Task #12, Task #88]
  "login"      -> [Task #3,  Task #45]
  ```
- **Query Execution**:
  Searching for `"auth AND middleware"` intersects the posting lists `[12, 45, 90] ∩ [12, 88] = [12]`, completing in sub-millisecond time.

#### 3. PostgreSQL Full-Text Search (FTS) with `tsvector` and `tsquery`
PostgreSQL includes a native search engine inside the database:
- **`tsvector`**: A parsed and normalized document representation:
  ```sql
  SELECT to_tsvector('english', 'Designing secure Authentication Middleware');
  -- Output: 'authent':3 'design':1 'middlewar':4 'secur':2
  ```
  *(Notice: Stemmed to root words, stop-words like 'the' removed, positions stored).*
- **`tsquery`**: The search query with logical operators (`&`, `|`, `!`):
  ```sql
  SELECT to_tsvector('english', 'Authentication Middleware') @@ to_tsquery('english', 'authent & middlewar');
  -- Returns TRUE
  ```
- **Relevance Ranking**: `ts_rank(tsv, query)` computes TF-IDF style relevance scores to sort results by semantic relevance.

#### 4. Fuzzy Substring Matching with Trigram Indexes (`pg_trgm`)
When users mistype words or search for arbitrary substrings:
- The `pg_trgm` extension breaks every string into 3-character slices (trigrams):
  `"project"` $\rightarrow$ `["  p", " pr", "pro", "roj", "oje", "jec", "ect", "ct "]`
- Creating a GIN index on trigrams:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX idx_project_name_trgm ON "Project" USING gin (name gin_trgm_ops);
  ```
- Enables index-accelerated `ILIKE '%term%'` substring searches and typo-tolerant similarity queries (`similarity(name, 'projeckt') > 0.3`).

#### 5. Composite Indexes & The Leftmost Prefix Rule
In multi-tenant schemas, queries almost always filter by tenant first:
```sql
SELECT * FROM "Task" WHERE "projectId" = 'p1' AND "status" = 'TODO' ORDER BY "createdAt" DESC;
```
- **Optimal Index**:
  `CREATE INDEX idx_task_proj_status_date ON "Task" ("projectId", "status", "createdAt" DESC);`
- **Leftmost Prefix Rule**:
  An index on `(A, B, C)` can satisfy queries filtering on `(A)`, `(A, B)`, or `(A, B, C)`, but **cannot** accelerate queries filtering only on `(B)` or `(C)`.
- **Index-Only Scan**:
  If all columns requested in `SELECT` exist in the index leaf nodes, PostgreSQL skips reading table heap pages entirely, delivering 3-5x faster responses.

---

### C — Dedicated Search Engines vs Relational Database Search

When should an engineering team use PostgreSQL FTS vs deploying Elasticsearch / OpenSearch?

```text
┌─────────────────────────────────┬──────────────────────────────────┐
│         POSTGRESQL FTS          │    ELASTICSEARCH / OPENSEARCH    │
│                                 │                                  │
│ • Single source of truth        │ • Distributed inverted indexes   │
│ • Strong ACID consistency       │ • Near Real-Time (NRT)           │
│ • Zero sync pipelines needed    │ • BM25 scoring & field boosting  │
│ • Great up to 10M-50M records   │ • Billions of documents, shards  │
│ • Low operational overhead      │ • High operational complexity    │
└─────────────────────────────────┴──────────────────────────────────┘
```

#### When PostgreSQL Search is Best (TeamFlow Current Architecture):
1. **Strong Data Consistency (Read-Your-Own-Writes)**: When a user creates a task, it is immediately searchable without sync lag.
2. **Zero Architecture Sprawl**: No need to maintain and monitor a separate Java-based search cluster.
3. **Multi-Tenant Data Isolation**: Multi-tenant constraints and row-level authorization remain strictly enforced in the database.

#### When to Adopt a Dedicated Search Engine (Elasticsearch / Algolia):
1. **Faceted Search**: E-commerce style aggregations across hundreds of filter dimensions simultaneously.
2. **Advanced Relevance Tuning**: Custom BM25 ranking algorithms, synonym mapping ("laptop" == "notebook"), phonetic matching, and decay functions.
3. **Data Sync Architecture**: Requires **Change Data Capture (CDC)** using Debezium and Kafka to stream WAL updates into Elasticsearch without dual-write race conditions.

---

### D — Senior SDE Interview Q&A on Search & Indexing

#### Q1: "Why does `OFFSET 1000000 LIMIT 20` cause high database CPU and latency?"
> *"Because PostgreSQL still has to scan and read 1,000,020 rows from disk/buffer cache, count past the first 1,000,000, and discard them before returning the 20 rows. It is an $\mathcal{O}(N)$ operation. In production, we resolve this by switching to Keyset (Cursor) pagination on `(createdAt, id)` which uses a B-Tree seek in $\mathcal{O}(1)$ time."*

#### Q2: "Can a B-Tree index accelerate `WHERE title ILIKE '%auth%'`? How would you fix it?"
> *"No. Standard B-Trees are ordered from left to right; a leading wildcard prevents the engine from navigating tree branches and forces a Sequential Scan. To fix this in PostgreSQL, we enable the `pg_trgm` extension and build a GIN index on `title gin_trgm_ops`, which indexes 3-character substrings and allows index scans for arbitrary wildcards."*

#### Q3: "How do you protect multi-tenant search from cross-tenant data leaks?"
> *"We enforce multi-tenant isolation at the query root: every search query explicitly filters on `organizationId` matching the authenticated caller's verified membership. Furthermore, search results are scoped through parent relations (`Task.project.organizationId`), preventing Insecure Direct Object Reference (IDOR) attacks even if a user knows an entity's UUID."*

