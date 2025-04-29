# Important Information for AI Agents Working on Reconnect Codebase

This document summarizes key findings, workarounds, and potential pitfalls discovered during development and debugging, particularly concerning database interactions and Next.js API routes.

## Database Utilities (`src/db/dbUtils.ts`)

*   **Function Return Values:**
    *   `dbUtils.query<T extends RowDataPacket[]>(...)` returns **only the `rows` array** (`T`), *not* the `[rows, fields]` tuple commonly returned by raw `mysql2`.
    *   `dbUtils.queryOne<T extends RowDataPacket>(...)` returns the first row object (`T`) or `null`.
    *   `dbUtils.insert(...)` returns the `insertId`.
    *   `dbUtils.update(...)` (also used for DELETE) returns the `affectedRows` count.
*   **Connection Handling:** The basic functions (`query`, `queryOne`, `insert`, `update`) now explicitly get/release connections from the pool for each operation. They do **not** rely on the shorthand `pool.query()`.
*   **Transactions:**
    *   A `dbUtils.transaction(async (connection) => { ... })` wrapper exists for performing multiple operations atomically.
    *   **Crucially:** During debugging, the default `autocommit` behavior of the database pool seemed unreliable when multiple separate API requests (e.g., a POST followed by a GET) interacted with the same data. Changes made via direct `dbUtils.insert`/`update` calls were not consistently visible to subsequent `dbUtils.query` calls in separate requests.
    *   **Recommendation:** Use the `dbUtils.transaction` wrapper for any operation involving writes (INSERT, UPDATE, DELETE), especially if data consistency across requests is critical. The license assignment POST route (`/api/licenses/[id]/assignment`) was modified to use this wrapper successfully.

## Next.js API Routes

*   **Context Parameter Typing:**
    *   When defining API route handlers (e.g., `GET`, `POST`), using specific types for the `context` parameter (like `context: { params: { id: string } }`) caused persistent build errors in the Docker environment (Next.js 15.3.0).
    *   **Workaround:** Use `context: any` as the type annotation for the second argument of the route handler function.
    *   **Consequence:** When accessing route parameters, you **must** use optional chaining and type casting, e.g., `const idStr = (context?.params?.id as string) || ''; const id = parseInt(idStr, 10);`.
    *   **Recurrence (2024-08-28):** This issue resurfaced while creating the `PUT /api/admin/groups/[groupId]/platforms` route. Despite trying explicit types (`{ params: { groupId: string } }` and a defined `RouteContext` type), the build failed with the error `Type "{ params: { groupId: string; }; }" is not a valid type for the function's second argument.` The `context: any` workaround was required again.
*   **Dynamic Route Naming:** Next.js requires dynamic route segments at the same level to use the same name (e.g., use `[license_id]` consistently, not `[id]` and `[license_id]` under the same parent directory).

## Frontend (`React Components`)

*   **Array Mapping:** Runtime errors like `t.map is not a function` often occur when trying to map over a variable expected to be an array (fetched from an API) that is actually `null`, `undefined`, or an object. Always ensure data fetched from APIs intended for mapping is validated (e.g., using `Array.isArray()`) before calling `.map()`.
*   **Non-Null Assertions (`!`):** Avoid using the non-null assertion operator (`!`) on potentially null/undefined state variables or props during rendering (e.g., `selectedItem.id!`). This can cause client-side crashes if the object is unexpectedly null during a render cycle. Use conditional rendering or optional chaining (`?.`) instead.

## Specific Feature Notes

*   **License Assignment:**
    *   Managed via `POST/DELETE /api/licenses/[license_id]/assignment`.
    *   Viewable from the License perspective (in `LicensesList` modal).
    *   Viewable from the PC perspective via `GET /api/pcs/[pc_id]/licenses` (in `PcOverviewList` modal).
    *   The POST route uses the explicit `dbUtils.transaction` wrapper for reliability. 

## Additional MYSQL Changes:

*   **Status**
    UPDATE pc_overview
    SET status = 'in_use'
    WHERE active_user IS NOT NULL 
      AND active_user <> '' 
      AND LOWER(status) <> 'offline' 
      AND LOWER(status) <> 'in_use';

    UPDATE pc_overview
    SET status = 'online'
    WHERE (active_user IS NULL OR active_user = '') 
      AND LOWER(status) <> 'offline'
      AND LOWER(status) <> 'online';

*   **Userpasswords**
    ALTER TABLE users CHANGE COLUMN contact_info company_username VARCHAR(255) NULL;
    ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL UNIQUE;
    ALTER TABLE users 
    ADD COLUMN password_hash VARCHAR(255) NOT NULL,
    ADD COLUMN salt VARCHAR(64) NOT NULL;

## Permission and Access Control System

This outlines the intended logic for user permissions and platform access control:

*   **Roles/Permissions:** Defined in the `permissions` table (e.g., 'Admin', 'Edit', 'Read', 'Default').
*   **Groups:** Users belong to a single group defined in `user_groups`. Each group is assigned exactly one `permission_id` from the `permissions` table.
*   **Platform Access:** The `group_platform_access` table links `user_groups` to the specific `platforms` they are allowed to interact with.
*   **Permission Utility (`src/utils/server/permissionUtils.ts`):**
    *   The `getUserPermissions(userId)` function returns an object `{ permissionName: string, accessiblePlatformIds: number[] }`.
    *   `permissionName` is the name corresponding to the user's group's `permission_id`.
    *   `accessiblePlatformIds` is an array of platform IDs the user's group has access to via `group_platform_access`.
*   **API Enforcement Rules:**
    *   **Admin Role:** Users whose group has the 'Admin' `permissionName` generally bypass platform-specific restrictions in API endpoints.
        *   `GET /api/servers`: Admins see data associated with *all* platforms.
        *   Other actions (POST/PUT/DELETE): Admins are typically allowed to perform actions on any resource, regardless of platform association.
    *   **Non-Admin Roles:**
        *   `GET /api/servers`: Data is filtered to only include items linked to platforms listed in the user's `accessiblePlatformIds`.
        *   Actions (POST/PUT/DELETE on `/api/servers`): Require:
            1.  An appropriate permission level (e.g., 'Edit' might be needed for PUT, potentially 'Admin' needed for DELETE). **Note:** The exact level required for each action needs consistent implementation.
            2.  Access to the specific platform(s) involved in the operation (checked via `accessiblePlatformIds`).
    *   **Admin Routes (`/api/admin/*`):** These routes should explicitly check if the user's `permissionName` is 'Admin' and deny access otherwise.