# Role-Based UI Adaptation System

## Overview

The EdSchool application now features a comprehensive role-based UI adaptation system that ensures each user role sees a dashboard and interface optimized for their specific needs and priorities.

## Role Focuses

### 1. **Parent: Finance + Alerts Focused**
- **Primary Focus**: Financial obligations and urgent notifications
- **Priority Features**: Fees, Alerts, Attendance, Homework
- **Layout**: Card-grid with prominent finance and alerts sections
- **Key Highlights**:
  - Fees Due prominently displayed with payment actions
  - Alerts section with unread count badges
  - Finance details section with pending payments
  - Quick actions prioritize "Pay Fees" and "View Alerts"

### 2. **Student: Progress Focused**
- **Primary Focus**: Academic performance and progress tracking
- **Priority Features**: Progress, Grades, Attendance, Homework
- **Layout**: Progress timeline with charts and metrics
- **Key Highlights**:
  - Progress metrics (Attendance %, Average Score, Homework completion)
  - Performance charts (Exam trends, Subject performance)
  - Progress timeline showing achievements
  - Recent exam results and pending homework

### 3. **Teacher: Action Focused**
- **Primary Focus**: Quick access to common teaching tasks
- **Priority Features**: Attendance, Homework, Marks, Classes
- **Layout**: Action-focused with prominent quick action buttons
- **Key Highlights**:
  - Quick Actions section (Mark Attendance, Assign Homework, Enter Marks)
  - Today's classes list with current period highlighting
  - Class selector dropdown for easy navigation
  - One-tap access to common tasks

### 4. **Admin: Data Focused**
- **Primary Focus**: Comprehensive analytics and data insights
- **Priority Features**: Analytics, Reports, Users, Settings
- **Layout**: Data-dense with charts and KPIs
- **Key Highlights**:
  - KPI cards with trends (Students, Teachers, Attendance, Fees)
  - Multiple charts (Attendance Trends, Fee Collection, Student-Teacher Ratio, Exam Distribution)
  - Alerts panel for system notifications
  - Quick actions for common admin tasks

## Implementation

### Components

1. **`useRoleUI` Hook** (`hooks/useRoleUI.ts`)
   - Provides role-specific configuration
   - Returns UI preferences (colors, layout, features)
   - Helper flags (isParent, isStudent, isTeacher, isAdmin)

2. **`RoleBasedLayout` Component** (`components/RoleBasedLayout.tsx`)
   - Wraps pages with role-specific styling
   - Applies CSS variables for role colors
   - Provides `RoleSection` for priority-based content ordering

3. **Role-Specific Dashboards**:
   - `ParentPortal.tsx` - Finance & Alerts focused
   - `StudentDashboard.tsx` - Progress focused
   - `TeacherDashboard.tsx` - Action focused
   - `Dashboard.tsx` - Data focused (Admin)

### Usage Example

```tsx
import { useRoleUI } from '../hooks/useRoleUI';
import RoleBasedLayout, { RoleSection } from '../components/RoleBasedLayout';

function MyPage() {
  const { config, showFinance, showAlerts, isParent } = useRoleUI();

  return (
    <RoleBasedLayout>
      {/* High priority content for this role */}
      {showFinance && (
        <RoleSection priority="high">
          <FinanceCard />
        </RoleSection>
      )}

      {/* Normal priority content */}
      <RoleSection priority="normal">
        <StandardContent />
      </RoleSection>
    </RoleBasedLayout>
  );
}
```

## Configuration

Each role has a configuration object in `useRoleUI.ts`:

```typescript
{
  focus: 'finance-alerts' | 'progress' | 'action' | 'data',
  primaryColor: string,
  accentColor: string,
  priorityFeatures: string[],
  dashboardLayout: 'card-grid' | 'action-focused' | 'data-dense' | 'progress-timeline',
  showMetrics: boolean,
  showCharts: boolean,
  showQuickActions: boolean,
  showAlerts: boolean,
  showFinance: boolean,
  showProgress: boolean,
}
```

## Benefits

1. **Improved UX**: Each role sees what matters most to them
2. **Reduced Cognitive Load**: Less clutter, more focus
3. **Faster Task Completion**: Priority features are easily accessible
4. **Better Engagement**: Role-appropriate content increases usage
5. **Scalability**: Easy to add new roles or modify existing ones

## Future Enhancements

- Role-specific color themes
- Customizable dashboard layouts
- Role-based feature toggles
- Analytics on role-specific usage patterns

