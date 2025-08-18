# DeFi México Hub - Database Migrations

This directory contains Supabase migrations for the DeFi México Hub project. Each migration file is numbered sequentially and includes proper indexes, RLS policies, triggers, and seed data.

## Migration Files

### Core Tables
- **001_create_communities_table.sql** - Communities management with member tracking
- **002_create_platform_stats_table.sql** - Cached statistics for dashboard performance
- **003_create_user_roles_table.sql** - Role-based access control system

### Form Management
- **004_create_contact_forms_table.sql** - Contact form submissions with status tracking
- **005_create_newsletter_subscribers_table.sql** - Newsletter management with engagement metrics
- **006_create_event_registrations_table.sql** - Event registration with check-in capabilities
- **007_create_startup_applications_table.sql** - Startup application review process

### System Management
- **008_create_logs_table.sql** - System event logging and audit trail
- **009_seed_initial_data.sql** - Initial development data

## Features Included

### Security & Access Control
- **Row Level Security (RLS)** on all tables
- **Role-based permissions** with user_roles table
- **Audit logging** for all major operations
- **Data validation** with check constraints

### Performance Optimization
- **Strategic indexes** for common query patterns
- **GIN indexes** for full-text search and array operations
- **Partial indexes** for filtered queries
- **Composite indexes** for complex filters

### Real-time Capabilities
- **Trigger-based updates** for timestamps and calculated fields
- **Event logging** for real-time notifications
- **Statistics caching** for dashboard performance
- **Webhook-ready** event structure

### Data Integrity
- **Foreign key constraints** with proper cascading
- **Check constraints** for data validation
- **Unique constraints** to prevent duplicates
- **Enum types** for controlled vocabularies

## Usage

### Running Migrations

```bash
# Run all migrations
supabase db push

# Run specific migration
supabase db push --include-schemas=public

# Reset database (development only)
supabase db reset
```

### Environment Setup

1. **Development Environment:**
   ```bash
   supabase start
   supabase db push
   ```

2. **Production Environment:**
   ```bash
   # Ensure you have production credentials
   supabase link --project-ref your-project-ref
   supabase db push
   ```

### Post-Migration Setup

After running migrations, you'll need to:

1. **Create your first admin user:**
   ```sql
   -- Replace with your actual admin user ID
   INSERT INTO user_roles (user_id, role) 
   VALUES ('your-admin-user-id', 'super_admin');
   ```

2. **Update platform statistics:**
   ```sql
   SELECT update_platform_stats();
   ```

3. **Set up scheduled functions** (if using Supabase Edge Functions):
   - Platform stats update (daily)
   - Log cleanup (weekly)
   - Newsletter engagement scoring (daily)

## Key Functions

### User Management
- `get_user_role(user_id)` - Get highest role for user
- `user_has_role(role, user_id)` - Check role permissions
- `user_has_permission(permission, user_id)` - Check specific permissions
- `assign_user_role(user_id, role, assigned_by)` - Assign roles

### Statistics & Analytics
- `update_platform_stats()` - Refresh cached statistics
- `get_contact_form_stats(days)` - Contact form analytics
- `get_newsletter_stats(days)` - Newsletter engagement metrics
- `get_event_registration_stats(event_id)` - Event analytics
- `get_startup_application_stats(days)` - Application pipeline metrics

### Event Management
- `register_for_event(event_id, name, email, ...)` - Register with validation
- `check_in_attendee(registration_id)` - Check in at event
- `send_registration_reminders(event_id, hours)` - Send reminders

### Application Review
- `assign_application_reviewer(app_id, reviewer_id)` - Assign reviewer
- `score_application(app_id, score, notes)` - Score applications
- `bulk_update_application_status(ids[], status)` - Bulk operations

### System Utilities
- `log_event(type, data, level, ...)` - Log system events
- `cleanup_old_logs(retention_days)` - Maintain log table size
- `track_email_event(email, event_type)` - Track newsletter engagement

## Views & Analytics

### Pre-built Analytics Views
- `active_user_roles` - Users with their current roles
- `contact_form_analytics` - Daily contact form metrics  
- `newsletter_analytics` - Weekly newsletter growth
- `event_attendance_analytics` - Event performance metrics
- `startup_application_pipeline` - Application status overview
- `reviewer_workload` - Reviewer performance tracking

### Custom Queries
The schema supports complex analytical queries:

```sql
-- Community growth over time
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_communities,
  SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as cumulative
FROM communities
GROUP BY month
ORDER BY month;

-- Newsletter engagement segmentation
SELECT 
  CASE 
    WHEN engagement_score >= 80 THEN 'High'
    WHEN engagement_score >= 50 THEN 'Medium'
    ELSE 'Low'
  END as engagement_tier,
  COUNT(*) as subscribers,
  AVG(open_count) as avg_opens,
  AVG(click_count) as avg_clicks
FROM newsletter_subscribers
WHERE status = 'active'
GROUP BY engagement_tier;
```

## Security Considerations

### Row Level Security (RLS)
All tables have RLS enabled with policies that:
- Allow public read access only to active/published content
- Restrict user data access to owners
- Grant admin/moderator access based on roles
- Log all sensitive operations

### Data Privacy
- Personal data is properly isolated with RLS
- Contact information requires authentication
- Admin operations are logged
- Unsubscribe links work without authentication

### API Security
- Functions use `SECURITY DEFINER` where appropriate
- Input validation on all user-facing functions
- Role checks before sensitive operations
- SQL injection protection via parameterized queries

## Monitoring & Maintenance

### Regular Tasks
1. **Weekly:** Run `cleanup_old_logs(90)` to maintain log table size
2. **Daily:** Update platform statistics for dashboard
3. **Monthly:** Review and archive old form submissions
4. **Quarterly:** Review user roles and permissions

### Performance Monitoring
- Monitor query performance on tables with GIN indexes
- Check RLS policy performance with large datasets
- Review log table size and cleanup frequency
- Monitor newsletter engagement scoring performance

### Backup Considerations
- Communities table contains core business data
- Contact forms may contain sensitive information
- Newsletter subscribers include marketing data
- Logs contain audit trail information

All tables are designed for point-in-time recovery and support Supabase's automatic backup features.

## Troubleshooting

### Common Issues

1. **RLS Policy Errors:**
   ```
   Error: new row violates row-level security policy
   ```
   - Check user roles in `user_roles` table
   - Verify JWT token contains correct role information
   - Ensure policies allow the operation for the user's role

2. **Foreign Key Violations:**
   ```
   Error: violates foreign key constraint
   ```
   - Ensure referenced records exist
   - Check if user_id exists in auth.users
   - Verify event_id exists before registration

3. **Check Constraint Violations:**
   ```
   Error: new row violates check constraint
   ```
   - Review input data against constraint definitions
   - Common issues: negative numbers, empty required fields
   - Validate email formats and text lengths

### Debug Queries

```sql
-- Check user roles
SELECT * FROM active_user_roles WHERE user_id = 'your-user-id';

-- Review RLS policies
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check table constraints
SELECT conname, contype, conkey, consrc
FROM pg_constraint
WHERE conrelid = 'table_name'::regclass;
```

For additional support, refer to the Supabase documentation or create an issue in the project repository.