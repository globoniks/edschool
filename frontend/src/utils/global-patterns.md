# Global Patterns Guide

## Loading States

### When to Use
- **Spinner**: For quick operations (< 2 seconds)
- **Skeleton**: For content that takes longer to load
- **Card Skeleton**: For dashboard cards
- **Table Skeleton**: For data tables
- **List Skeleton**: For lists of items

### Usage Examples

```tsx
import { LoadingState, SkeletonCard } from '../components';

// Simple spinner
<LoadingState variant="spinner" message="Loading data..." />

// Skeleton cards
<LoadingState variant="card" items={6} />

// Skeleton table
<LoadingState variant="table" rows={10} cols={5} />

// Custom skeleton
<SkeletonCard />
<SkeletonTable rows={5} cols={4} />
```

## Empty States

### When to Use
- **EmptyState**: Generic empty state
- **EmptySearchState**: When search returns no results
- **EmptyDataState**: When no data exists (with create action)
- **EmptyFilterState**: When filters return no results
- **EmptyNetworkState**: When network connection fails
- **EmptyPermissionState**: When user lacks permissions

### Usage Examples

```tsx
import { EmptyState, EmptySearchState, EmptyDataState } from '../components';

// Generic empty state
<EmptyState 
  title="No items found"
  description="Get started by adding your first item."
  action={<Button onClick={handleCreate}>Create Item</Button>}
/>

// Search empty state
<EmptySearchState 
  searchTerm={search}
  onClearSearch={() => setSearch('')}
/>

// Data-specific empty state
<EmptyDataState 
  type="students"
  onCreate={() => setIsModalOpen(true)}
/>
```

## Error Handling

### Patterns

1. **QueryWrapper** (Recommended): Automatic handling
2. **Manual Error Handling**: For custom logic
3. **Error Boundary**: For React errors

### Usage Examples

```tsx
import { QueryWrapper, ErrorState, useErrorHandler } from '../components';
import { useQuery } from '@tanstack/react-query';

// Pattern 1: QueryWrapper (Automatic)
function StudentsPage() {
  const query = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then(res => res.data),
  });

  return (
    <QueryWrapper
      query={query}
      loadingVariant="table"
      emptyMessage="No students found"
      emptyAction={<Button onClick={handleCreate}>Add Student</Button>}
    >
      {(data) => (
        <DataTable data={data.students} columns={columns} />
      )}
    </QueryWrapper>
  );
}

// Pattern 2: Manual Handling
function StudentsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then(res => res.data),
  });

  if (isLoading) return <LoadingState variant="table" />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data?.students?.length) {
    return <EmptyDataState type="students" onCreate={handleCreate} />;
  }

  return <DataTable data={data.students} columns={columns} />;
}

// Pattern 3: Error Handler Hook
function StudentsPage() {
  const { renderError } = useErrorHandler();
  const query = useQuery({...});

  if (query.isError) {
    return renderError(query.error, () => query.refetch());
  }

  // ... rest of component
}
```

## Global Application

### 1. Wrap App with Error Boundary
```tsx
// Already done in App.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 2. Use QueryWrapper for All Queries
Replace manual loading/error/empty checks with QueryWrapper

### 3. Consistent Empty States
Use context-specific empty states (EmptyDataState, EmptySearchState)

### 4. Consistent Loading States
Use appropriate skeleton variant for content type

### 5. Error Messages
Use parseError utility for consistent error formatting

## Best Practices

1. **Always show loading state** - Never leave users wondering
2. **Use skeletons for > 2s loads** - Better UX than spinners
3. **Provide actions in empty states** - Help users take next step
4. **Handle all error types** - Network, server, permission errors
5. **Retry on network errors** - Give users a way to recover
6. **Log errors in development** - Help with debugging
7. **Use QueryWrapper** - Reduces boilerplate and ensures consistency

