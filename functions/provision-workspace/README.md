# provision-workspace

Creates one isolated demo workspace for an authenticated Appwrite user. It also performs authenticated, owner-scoped demo actions: generating synthetic alerts, updating incident status, and resetting the caller's own workspace.

## Appwrite Function settings

- Runtime: Node.js 22 LTS (or the latest LTS offered by Appwrite)
- Entrypoint: `src/main.js`
- Build command: `npm install`
- Execute access: Users
- Dynamic API-key scopes: `rows.read`, `rows.write`

Create the variables shown in `.env.example` under the Function **Settings → Variables** section. Do not create variables beginning with `APPWRITE_`; Appwrite provides those automatically.

## Security model

- Requires the `x-appwrite-user-id` identity header added by an authenticated Function execution.
- Uses the Function dynamic API key only inside Appwrite's runtime.
- Assigns each workspace, alert, incident, and notification row only to `Role.user(userId)`.
- Uses only documentation IP ranges and synthetic content.
