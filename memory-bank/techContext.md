# Technical Context

## Technology Stack

### Frontend Stack
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for utility-first styling
- **UI Components**: shadcn/ui for modern, accessible components
- **State Management**: Zustand or React Context for global state
- **Routing**: React Router v6 for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts or Chart.js for financial visualizations
- **Date Handling**: date-fns for date manipulation
- **HTTP Client**: Axios for API communication

### Backend Stack (IMPLEMENTED)
- **Backend-as-a-Service**: Supabase (PostgreSQL + Auth + Storage + RLS) ✅
- **Database**: PostgreSQL 15+ with Row Level Security policies ✅
- **Authentication**: Supabase Auth with JWT and role-based access ✅
- **File Storage**: Supabase Storage for document uploads ✅
- **Real-time**: Supabase Realtime for live updates ✅
- **API**: Auto-generated REST and GraphQL APIs ✅
- **Validation**: TypeScript interfaces and Zod validation ✅
- **Security**: RLS policies for multi-tenant data isolation ✅

### AI & External Integrations
- **AI Service**: OpenAI GPT-4 for financial insights
- **Accounting API**: QuickBooks Online API
- **Payment Processing**: Stripe for subscriptions
- **Calendar Integration**: Google Calendar API
- **Email Service**: SendGrid or Resend for notifications
- **PDF Generation**: Puppeteer for report generation

### Development Tools
- **Package Manager**: pnpm for efficient dependency management
- **Code Quality**: ESLint + Prettier for code formatting
- **Testing**: Vitest for unit/integration testing
- **Type Safety**: TypeScript strict mode enabled
- **API Documentation**: OpenAPI/Swagger for API docs
- **Environment Management**: dotenv for configuration

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis (for caching and queues)
- pnpm package manager

### Environment Configuration
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/swiftbooks"

# Authentication (Supabase)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-key"

# AI Integration
OPENAI_API_KEY="sk-your-openai-key"

# External APIs
QUICKBOOKS_CLIENT_ID="your-quickbooks-client-id"
QUICKBOOKS_CLIENT_SECRET="your-quickbooks-client-secret"
STRIPE_SECRET_KEY="sk_test_your-stripe-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Services
REDIS_URL="redis://localhost:6379"
SENDGRID_API_KEY="SG.your-sendgrid-key"
```

### Project Structure
```
swiftbooks/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/ (shadcn/ui components)
│   │   │   ├── dashboard/
│   │   │   ├── forms/
│   │   │   └── charts/
│   │   ├── pages/
│   │   │   ├── client/
│   │   │   ├── accountant/
│   │   │   └── admin/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── stores/
│   │   └── types/
│   ├── package.json
│   └── tailwind.config.js
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── models/
│   │   ├── utils/
│   │   └── types/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
├── shared/
│   └── types/ (shared TypeScript types)
└── docs/
    └── api/ (API documentation)
```

## Technical Constraints

### Performance Requirements
- **Page Load Time**: < 2 seconds for dashboard pages
- **API Response Time**: < 500ms for most endpoints
- **Real-time Updates**: WebSocket latency < 100ms
- **File Upload**: Support up to 10MB documents
- **Concurrent Users**: Handle 1000+ concurrent users

### Security Requirements
- **Authentication**: Multi-factor authentication support
- **Data Encryption**: AES-256 encryption for sensitive data
- **API Security**: Rate limiting and input validation
- **Compliance**: SOC2 and PCI DSS compliance ready
- **Audit Logging**: All user actions logged

### Scalability Constraints
- **Database**: Support up to 100k+ transactions per tenant
- **File Storage**: Unlimited document storage via cloud
- **API Throughput**: 1000+ requests per second
- **Background Jobs**: Process 10k+ jobs per hour
- **Multi-tenancy**: Support 1000+ tenants

### Integration Limitations
- **QuickBooks API**: Rate limits and sandbox limitations
- **OpenAI API**: Cost management and response time
- **Stripe API**: Webhook reliability and testing
- **Calendar APIs**: Authentication complexity

## Deployment Strategy

### Infrastructure
- **Frontend**: Vercel or Netlify for static hosting
- **Backend**: Railway, Render, or AWS for API hosting
- **Database**: Supabase or AWS RDS for PostgreSQL
- **Redis**: Redis Cloud or AWS ElastiCache
- **CDN**: CloudFlare for global content delivery

### CI/CD Pipeline
- **Source Control**: Git with feature branch workflow
- **Testing**: Automated tests on pull requests
- **Deployment**: Automatic deployment from main branch
- **Monitoring**: Uptime monitoring and error tracking
- **Rollback**: Blue-green deployment for zero downtime

### Environment Management
- **Development**: Local development with Docker
- **Staging**: Full production mirror for testing
- **Production**: Highly available with monitoring
- **Backup**: Daily database backups with retention 