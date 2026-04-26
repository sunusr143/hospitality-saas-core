# Role Access Matrix

This project now uses four clear product roles.

## Roles

### `SUPER_USER`
- Software owner / IT control role
- Can access all modules
- Can unlock module access
- Can create another `SUPER_USER`
- Should be reserved for platform owner, IT, or implementation partner only

### `ADMIN`
- Hotel-level administrator
- Can manage hotel operations, users, hotel profile, imports, and day-to-day control
- Cannot create another `SUPER_USER`
- Cannot unlock modules or change software-level branding
- Should be used for the property admin account, not for general managers by default

### `MANAGER`
- GM / department-head style role
- Strong operational access
- No blanket admin bypass
- No software ownership powers
- Best fit for General Manager, Rooms Division Manager, F&B Manager, Finance Manager

### `STAFF`
- Operational user
- Access controlled by enabled modules, department, and action policy

## Recommended mapping

| Real-world person | System role | Notes |
|---|---|---|
| Owner / central IT / vendor support | `SUPER_USER` | Unlock modules, recover access, manage software |
| Hotel admin / implementation lead | `ADMIN` | Hotel-level setup and user administration |
| General Manager | `MANAGER` | Strong oversight, but not software owner |
| Front Office Executive | `STAFF` | Front desk, reservations, room board |
| Housekeeping Supervisor | `STAFF` or `MANAGER` | Depends on authority level |
| Maintenance Supervisor | `STAFF` or `MANAGER` | Depends on authority level |
| Finance Controller | `MANAGER` or `ADMIN` | Use `ADMIN` only if real hotel admin responsibilities are needed |

## Governance rule

The software must never depend on the current GM for ownership access.

If a manager changes:
- keep the `SUPER_USER` login with IT/owner only
- keep the hotel `ADMIN` account under property control
- replace the GM account with a new `MANAGER` user

## Module unlocking

Module unlocking and full software potential should be treated as `SUPER_USER` responsibility.

Recommended practice:
1. `SUPER_USER` logs in for software activation, rollout, module unlocks, and emergency recovery.
2. `ADMIN` manages the property after go-live.
3. `MANAGER` runs hotel operations without software ownership powers.

This includes:
- app/software branding
- hospitality-level product setup
- enabled module changes
- tenant creation and top-level recovery access
