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
