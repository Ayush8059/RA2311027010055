# Stage 1

## Priority Inbox Approach

The Priority Inbox shows the top `n` unread notifications first. Each notification is ranked using three rules:

1. Higher priority value comes first.
2. If priority is the same, notification type is ranked as `Placement > Result > Event`.
3. If priority and type are both the same, the most recent notification comes first.

The frontend implements this in `notification_app_fe/src/App.jsx` using `getPriorityInbox()`. The function filters unread notifications, sorts them by the ranking rules, and returns the top `n` items.

## Efficient Top 10 Maintenance

For the current frontend API response size, filtering and sorting the loaded page is simple and reliable.

For a continuous stream of new notifications, the efficient approach is to maintain a min-heap of size `n`. The heap stores only the current top `n` unread notifications. When a new notification arrives, it is compared with the lowest ranked item in the heap. If it ranks higher, it replaces that item.

This keeps updates efficient because each new notification costs `O(log n)` instead of sorting the full notification list repeatedly.
