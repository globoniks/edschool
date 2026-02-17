# Component Library - Global Patterns

## Quick Start

### Loading States
```tsx
import { LoadingState } from '../components';

<LoadingState variant="table" />  // For tables
<LoadingState variant="card" items={6} />  // For card grids
<LoadingState variant="spinner" message="Loading..." />  // Simple spinner
```

### Empty States
```tsx
import { EmptyState, EmptySearchState, EmptyDataState } from '../components';

<EmptyState title="No data" description="Get started by..." />
<EmptySearchState searchTerm={search} onClearSearch={handleClear} />
<EmptyDataState type="students" onCreate={handleCreate} />
```

### Error States
```tsx
import { ErrorState, QueryWrapper } from '../components';

// Automatic (Recommended)
<QueryWrapper query={query}>
  {(data) => <YourComponent data={data} />}
</QueryWrapper>

// Manual
<ErrorState error={error} onRetry={handleRetry} />
```

## QueryWrapper Pattern (Recommended)

The `QueryWrapper` component automatically handles loading, error, and empty states:

```tsx
import { QueryWrapper } from '../components';
import { useQuery } from '@tanstack/react-query';

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
      showEmpty={(data) => !data?.students?.length}
    >
      {(data) => (
        <DataTable 
          data={data.students} 
          columns={columns} 
        />
      )}
    </QueryWrapper>
  );
}
```

## Migration Guide

### Before
```tsx
if (isLoading) return <div>Loading...</div>;
if (isError) return <div>Error: {error.message}</div>;
if (!data) return <div>No data</div>;
return <YourComponent data={data} />;
```

### After
```tsx
return (
  <QueryWrapper query={query}>
    {(data) => <YourComponent data={data} />}
  </QueryWrapper>
);
```

