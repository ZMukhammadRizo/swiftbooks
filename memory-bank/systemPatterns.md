# System Patterns

## Architecture Overview

### Multi-Tenant SaaS Architecture (IMPLEMENTED)
- **Frontend**: React 18 SPA with TypeScript and role-based routing ✅
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS) ✅
- **Authentication**: Supabase Auth with JWT tokens ✅
- **AI Integration**: OpenAI API for financial insights (in progress)
- **External APIs**: Stripe, Google Calendar integrations (planned)
- **UI Framework**: shadcn/ui + Tailwind CSS ✅

### Design Patterns

#### Role-Based Access Control (RBAC)
```
User → Role → Permissions → Resources
├── Client Role
│   ├── View own financial data
│   ├── Upload documents
│   ├── Schedule meetings
│   └── Manage billing
├── Accountant Role
│   ├── View client data
│   ├── Adjust transactions
│   ├── Approve reports
│   └── Schedule meetings
└── Admin Role
    ├── Manage all users
    ├── Configure platform
    ├── View analytics
    └── Manage subscriptions
```

#### Multi-Tenant Data Isolation
- **Database Level**: Tenant ID in all tables
- **Application Level**: Middleware enforces tenant context
- **API Level**: Route-based tenant isolation

### Component Relationships

#### Frontend Architecture
```
App
├── AuthProvider (Authentication context)
├── Router (Role-based routing)
├── Dashboard (Per-role layouts)
│   ├── ClientDashboard
│   │   ├── FinancialOverview
│   │   ├── AIAssistant
│   │   ├── DocumentUpload
│   │   └── MeetingScheduler
│   ├── AccountantDashboard
│   │   ├── ClientManager
│   │   ├── TransactionEditor
│   │   ├── ReportApproval
│   │   └── MeetingScheduler
│   └── AdminDashboard
│       ├── UserManager
│       ├── SubscriptionManager
│       ├── PlatformConfig
│       └── Analytics
└── SharedComponents
    ├── DataTable
    ├── Charts
    ├── Forms
    └── Notifications
```

#### Backend Architecture
```
API Gateway
├── Authentication Middleware
├── Tenant Context Middleware
├── Rate Limiting
└── Routes
    ├── Auth Routes
    ├── Client Routes
    │   ├── Financial Data
    │   ├── AI Insights
    │   ├── Document Upload
    │   └── Meeting Scheduling
    ├── Accountant Routes
    │   ├── Client Management
    │   ├── Transaction Management
    │   ├── Report Management
    │   └── Meeting Management
    └── Admin Routes
        ├── User Management
        ├── Subscription Management
        ├── Platform Configuration
        └── Analytics
```

### Critical Implementation Paths

#### Authentication Flow
1. User login → JWT token generation
2. Token validation → Role extraction
3. Route protection → Permission checking
4. Tenant context → Data filtering

#### AI Integration Flow
1. User query → Context gathering
2. Financial data preparation → Prompt engineering
3. AI API call → Response processing
4. Insight generation → User presentation

#### Data Synchronization
1. External API webhooks → Event processing
2. Transaction categorization → AI classification
3. Real-time updates → WebSocket notifications
4. Report generation → Background processing

### Security Patterns

#### Data Protection
- **Encryption**: At rest and in transit
- **API Security**: JWT tokens with role-based claims
- **Input Validation**: Comprehensive sanitization
- **Audit Logging**: All user actions tracked

#### Multi-Tenancy Security
- **Tenant Isolation**: Database and application level
- **Cross-Tenant Prevention**: Middleware validation
- **Role Verification**: Each request validated
- **Resource Access**: Strict permission checking

### Performance Patterns

#### Caching Strategy
- **Redis**: Session data and frequently accessed data
- **CDN**: Static assets and public content
- **Database**: Query optimization and indexing
- **API**: Response caching for expensive operations

#### Scalability Considerations
- **Horizontal Scaling**: Stateless API design
- **Database Sharding**: By tenant for large scale
- **Background Jobs**: Queue-based processing
- **Monitoring**: Performance metrics and alerts 