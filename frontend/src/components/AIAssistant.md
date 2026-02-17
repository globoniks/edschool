# AI Assistant Component

## Overview

A complete AI Assistant UI placeholder with floating action button and chat panel. Ready for backend integration.

## Components

### 1. `AIAssistant` (Main Component)
All-in-one component that includes both the floating button and chat panel.

**Usage:**
```tsx
import AIAssistant from '../components/AIAssistant';

// In your App.tsx or Layout
<AIAssistant position="bottom-right" />
```

**Props:**
- `position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'` - Position of the FAB
- `className?: string` - Additional CSS classes

### 2. `AIAssistantButton` (Standalone Button)
Just the floating action button, if you want to control the panel separately.

**Usage:**
```tsx
import AIAssistantButton from '../components/AIAssistantButton';

<AIAssistantButton 
  onClick={handleOpenChat}
  position="bottom-right"
  showBadge={true}
/>
```

### 3. `AIChatPanel` (Standalone Panel)
Just the chat panel, if you want to control state externally.

**Usage:**
```tsx
import AIChatPanel, { Message } from '../components/AIChatPanel';

const [messages, setMessages] = useState<Message[]>([]);
const [isOpen, setIsOpen] = useState(false);

<AIChatPanel
  isOpen={isOpen}
  isMinimized={false}
  onClose={() => setIsOpen(false)}
  onMinimize={() => {}}
  messages={messages}
  onSendMessage={(msg) => {
    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    }]);
    // Call your API here
  }}
  isTyping={false}
/>
```

## Features

### Floating Action Button
- ✅ Gradient background (primary colors)
- ✅ Animated pulse effect
- ✅ Notification badge
- ✅ Smooth hover animations
- ✅ Accessible (ARIA labels)

### Chat Panel
- ✅ Modern, clean design
- ✅ Minimize/maximize functionality
- ✅ Message bubbles (user & assistant)
- ✅ Typing indicator
- ✅ Auto-scroll to latest message
- ✅ Timestamp display
- ✅ Empty state when no messages
- ✅ Input field with send button
- ✅ Keyboard support (Enter to send)
- ✅ Responsive design

## Current Behavior

- **Placeholder Responses**: Currently shows placeholder AI responses
- **No Backend**: All responses are simulated with a 1-second delay
 
## Backend Integration (Future)

When ready to integrate with backend:

1. **Update `AIAssistant.tsx`**:
   ```tsx
   const handleSend = async () => {
     // Add user message
     const userMessage = { ... };
     setMessages(prev => [...prev, userMessage]);
     setInputValue('');
     setIsTyping(true);

     try {
       // Call your API
       const response = await api.post('/ai/chat', {
         message: inputValue,
         conversationId: conversationId,
       });

       const assistantMessage = {
         id: response.data.id,
         role: 'assistant',
         content: response.data.message,
         timestamp: new Date(),
       };
       setMessages(prev => [...prev, assistantMessage]);
     } catch (error) {
       // Handle error
     } finally {
       setIsTyping(false);
     }
   };
   ```

2. **Add API endpoint** (backend):
   ```typescript
   POST /api/ai/chat
   Body: { message: string, conversationId?: string }
   Response: { id: string, message: string, conversationId: string }
   ```

## Styling

The component uses:
- Tailwind CSS for styling
- Design system components (Button)
- Custom animations for typing indicator
- Gradient backgrounds
- Shadow effects

## Accessibility

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Screen reader friendly

## Customization

You can customize:
- Position (4 corners)
- Colors (via CSS variables or Tailwind classes)
- Size (modify width/height in component)
- Animation speed
- Badge visibility

