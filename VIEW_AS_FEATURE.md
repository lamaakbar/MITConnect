# 👁️ View As Feature

## Overview
The "View As" feature allows Admin users to temporarily preview how the MITConnect app appears to different user roles (Employee, Trainee, Admin) without affecting the actual user role in the database.

## 🛡️ Safety Features
- **Temporary Only**: Changes are local and don't persist to the database
- **Reversible**: Easy reset to actual role with one click
- **Non-Destructive**: No real user data is modified
- **Admin Only**: Only available to users with admin role

## 🚀 How It Works

### 1. UserContext Updates
```typescript
interface UserContextType {
  userRole: UserRole;           // Actual role from database
  viewAs: UserRole | null;      // Temporary view role
  effectiveRole: UserRole;      // viewAs || userRole (what UI shows)
  setViewAs: (role: UserRole | null) => void;
  // ... other properties
}
```

### 2. Usage in Components
```typescript
// Instead of using userRole directly
const { userRole } = useUserContext();

// Use effectiveRole for UI decisions
const { effectiveRole } = useUserContext();

// Check if currently in "view as" mode
const { viewAs, setViewAs } = useUserContext();
if (viewAs) {
  // Currently previewing a different role
}
```

### 3. Admin Interface
The admin home page now includes a "View As" section with:
- Three role buttons (Admin, Employee, Trainee)
- Visual indication of current view
- Reset button to return to actual role
- Clear labeling and instructions

## 📱 UI Components

### View As Container
- Located on admin home page
- Styled with green border to indicate admin feature
- Shows current effective role with highlighted button
- Includes reset functionality

### Role Buttons
- Three equal-width buttons
- Active state shows green background
- Inactive state shows border color
- Responsive to theme changes

## 🔧 Implementation Details

### Context Provider
```typescript
const [viewAs, setViewAs] = useState<UserRole | null>(null);
const effectiveRole = viewAs || userRole;
```

### Component Integration
```typescript
// In any component that needs role-based logic
const { effectiveRole, viewAs } = useUserContext();

// Use effectiveRole for conditional rendering
if (effectiveRole === 'employee') {
  // Show employee-specific content
}
```

## 🎯 Use Cases

1. **Feature Testing**: Admins can test new features as different user types
2. **UI Validation**: Verify that role-specific UI elements work correctly
3. **User Experience**: Understand how the app feels for different users
4. **Bug Reporting**: Reproduce issues from different user perspectives

## 🔄 Reset Functionality

- **Manual Reset**: "Reset to Actual Role" button
- **Automatic Reset**: App restart clears viewAs state
- **Visual Feedback**: Alert confirmation when reset

## 🎨 Styling

### Light Mode
- Container: White background with green border
- Active button: Green background (#3CB371)
- Inactive button: Light gray border
- Text: Dark text on light backgrounds

### Dark Mode
- Container: Dark background with green border
- Active button: Green background (#3CB371)
- Inactive button: Dark gray border
- Text: Light text on dark backgrounds

## 🔮 Future Enhancements

1. **Persistent View**: Option to remember viewAs preference
2. **Role-Specific Navigation**: Navigate to role-specific pages in view mode
3. **Feature Flags**: Show/hide features based on effectiveRole
4. **Audit Trail**: Log when admins use viewAs feature

## 🛠️ Technical Notes

- Uses React Context for state management
- Integrates with existing theme system
- Maintains backward compatibility
- No database changes required
- Safe for production use

## 📋 Checklist for Implementation

- [x] Update UserContext with viewAs state
- [x] Add effectiveRole calculation
- [x] Create View As UI in admin home
- [x] Update employee-home to use effectiveRole
- [x] Add reset functionality
- [x] Test with different themes
- [x] Verify no database impact
- [x] Add documentation

## 🚨 Important Notes

1. **Never use viewAs for database operations**
2. **Always use effectiveRole for UI decisions**
3. **Reset viewAs when navigating away from admin pages**
4. **Test thoroughly with all user roles**
5. **Monitor for any unintended side effects** 