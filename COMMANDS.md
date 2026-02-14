# Development Commands

## Install Dependencies
```bash
pnpm install
```

## Build Shared Package (Required before running apps)
```bash
pnpm --filter shared build
```

## Run Development Servers

### Server (Terminal 1)
```bash
pnpm --filter server dev
```
Server runs on: http://localhost:3001

### Client (Terminal 2)
```bash
pnpm --filter client dev
```
Client runs on: http://localhost:3000

## Build for Production
```bash
pnpm build
```

## Lint
```bash
pnpm lint
```

## Testing
```bash
pnpm test
```

## Full Development Workflow
```bash
# 1. Install dependencies
pnpm install

# 2. Build shared package
pnpm --filter shared build

# 3. Start server (in one terminal)
pnpm --filter server dev

# 4. Start client (in another terminal)
pnpm --filter client dev

# 5. Open browser
# Navigate to http://localhost:3000
```
