# TicketFast - AI-Powered Ticket Management System

## Overview

TicketFast is an advanced ticket management system powered by artificial intelligence designed to streamline customer support operations. It allows teams to efficiently manage, assign, and respond to support tickets with the help of AI intelligence. Teams can assign tickets to team members, generate AI-powered responses, track ticket status, and manage customer relationships all within a unified platform.

## Core Features

- **AI-Powered Ticket Management**: Leverage artificial intelligence to analyze, categorize, and suggest responses for incoming tickets
- **Team Collaboration**: Assign tickets to team members, track workloads, and collaborate on complex issues
- **Smart Inbox Management**: Organize tickets by status, priority, and assignee with advanced filtering capabilities
- **Response Templates**: Create and use templates for common inquiries to reduce response time
- **Customer Management**: Track customer history and maintain comprehensive customer profiles
- **Email Integration**: Seamless email integration with support for SMTP settings
- **Multi-Organization Support**: Manage multiple organizations with team-based access controls
- **Analytics & Reporting**: Track team performance and ticket metrics

## Technical Architecture

### Tech Stack

- **Frontend**: Next.js 15 (React) with App Router structure
- **Authentication**: Better Auth with social login providers
- **Database**: PostgreSQL with Drizzle ORM
- **Payment Processing**: Polar (polar_sh)
- **UI Components**: Shadcn UI with Tailwind CSS for styling
- **Animation**: Framer Motion
- **Form Validation**: Zod schemas

### Application Structure

TicketFast follows the Next.js App Router structure with route groups:

- **(auth)**: Authentication-related routes
- **(landing)**: Public landing pages
- **(main)**: Core application functionality

### Data Model

The application uses a relational database with the following key entities:

- **Users**: Application users with roles and permissions
- **Organizations**: Teams or companies using the platform
- **Members**: Users belonging to organizations with specific roles
- **Tickets**: Support tickets with metadata, priority, and status
- **Contacts**: Customer profiles linked to tickets
- **Ticket Messages**: Communication thread for each ticket
- **Inboxes**: Email inboxes for ticket collection
- **Subscriptions**: Payment plans and usage quotas

### Subscription Plans

TicketFast offers three subscription tiers:

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Tickets | 100 | 500 | 2,000 |
| Customers | 10 | 50 | 200 |
| Organizations | 1 | 3 | 10 |
| Team Members | 3 | 10 | 50 |

## User Workflows

### Ticket Management

1. Incoming emails are converted to tickets and appear in the inbox
2. Tickets can be assigned to team members or left unassigned
3. Tickets have status (ASSIGNED, UNASSIGNED, WAITING, CLOSED)
4. Tickets have priority levels (LOW, NORMAL, MEDIUM, HIGH)
5. Team members can respond to tickets with optional AI assistance

### User Management

1. Organization owners can invite team members
2. Members can have different roles and permissions
3. Users can belong to multiple organizations

### Subscription Management

1. Workspace owners can select subscription plans
2. Subscription limits apply to tickets, customers, and team members
3. Payment processing is handled through Polar

## Development Guidelines

### Code Organization

- Server components for data fetching and SEO
- Client components only for interactive elements
- TypeScript for all new code with proper interfaces
- Tailwind CSS for styling following utility-first approach
- Proper error handling and input validation
- Responsive design using mobile-first approach

### Performance Considerations

- Optimize Server-Side Rendering (SSR) and Static Site Generation (SSG)
- Implement loading states with loading.tsx
- Proper error handling with error.tsx
- Optimize Web Vitals (LCP, CLS, FID)

### Authentication & Authorization

- Follow Better Auth patterns for authentication flows
- Implement proper role-based access controls
- Use middleware for route protection and redirects

## Getting Started

To set up a development environment:

1. Clone the repository
2. Install dependencies with `npm install`
3. Configure environment variables
4. Run the development server with `npm run dev`

## API Endpoints

The application provides RESTful API endpoints for:

- Ticket management
- User management
- Organization settings
- Subscription handling

## Future Development

Planned features and improvements:

- Enhanced AI response capabilities
- Advanced analytics dashboard
- Multi-language support
- Mobile applications
- Integrations with third-party services
