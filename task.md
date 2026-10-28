# Tasks - Admin Stats Fix, Historical Timelines & Ingestion Rates

- [x] Reset admin password directly in production DB to restore admin access.
- [x] Configure automatic logout on 401 Unauthorized responses to prevent stale sessions showing 0 stats.
- [x] Verify API responses for admin user and content statistics endpoints.
- [x] Implement the Recharts line graph mapping report counts chronologically by source.
- [x] Build the backend monthly reports aggregation endpoint.
- [x] Build the stacked bar chart tracking monthly report ingestion rates in the admin dashboard.
- [x] Implement Ingestion Analytics as a standalone navigation tab (on both desktop and mobile layouts).
- [x] Deploy and build the updated codebase on the production VPS.
- [x] Verify that all Docker containers are running properly on the VPS.
- [x] Implement 18-hour rolling question rate limits (maximum 10 questions) for authenticated and guest users.
- [x] Implement database query answer caching to automatically reuse identical past answers.
