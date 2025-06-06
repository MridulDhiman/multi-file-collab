## Multi File Realtime Collaboration Server

### Index

- [Overview](#overview)
- [Architecture](#architecture)
- [Cache Invalidation Logic](#cache-invalidation-logic)
- [Components](#components)
- [Current Workflow](#current-workflow)
- [Local Development](#local-development)
- [Contributing](#contributing)

### Overview

It is an implementation of a scalable socket.io server for allowing realtime collaboration in browser based code editor with built-in frontend templates support like react, vue, svelte, vanillajs, angular nextjs page router etc. Each template comes up with multiple files and leverages importing certain version of packages as dependencies and dev dependencies in the browser itself. Socket.io server creates a bidirectional communication channel for realtime communiation between client and server. It uses redis pub/sub for scaling the websockets. When the user joins a collaborative project workspace, he/she is added to a room in the socket.io server. When the first user joins the room, we populate the redis cache with all the project's files, which will be storing the latest state of our application. Realtime code updates are propagated to the server having file path and latest code changes made in that file. Those changes are written in memory to redis along with the timestamp. A Bullmq based background job is also configured to handle jobs concurrently with exponential backoff based fallback mechanism. Each job is executed in a separate node.js worker thread, so that it does not block the main thread from accepting the incoming requests from the client. The job's task is to periodically sync the project's state from the redis to the database. For each project, we have a `last_sync_timestamp` field in the database, which tells the last time the sync was done. For each sync operation, it finds out all the keys which were updated since the last sync occurred, and flush only those keys to the database. Then, the `last_sync_timestamp` is updated to current timestamp for next sync job. In the end, when the last user leaves the room, we again depopulate the cache by deleting all the keys from the redis.

### Architecture

![system architecture](/public/architecture.png)

### Cache Invalidation Logic

![cache invalidation logic](https://github.com/user-attachments/assets/8e08d305-f2d8-4959-b04e-4d7086a3783a)

### Components

- `SocketService` is a socket.io server providing realtime bidirectional communication channel for sending realtime code updates from client and propagate them to other clients.

- `RedisManager` is a singleton class, i.e. there will be only one instance of this class in the entire application. This redis manager instance will have a particular connection pool of redis instances for handling KV store management, acting as pub/sub for publishing and subscribing to particular channel, and being used in running background jobs via bullmq.

```typescript
class RedisManager {
  private static redisManagerInst: RedisManager;
  private pool: Map<string, Redis> = new Map();
  private constructor() {}

  static getInstance(): RedisManager {
    if (RedisManager.redisManagerInst == null) {
      RedisManager.redisManagerInst = new RedisManager();
    }
    return RedisManager.redisManagerInst;
  }

  // checks if there is existing connection or not by connection name, and if not create new connection and add it to the pool
  getConnection(name: string = redisConfig.connection.CONN_DEFAULT): Redis {
    if (!this.pool.has(name)) {
      const connection = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: null,
      });
      this.pool.set(name, connection);
    }
    return this.pool.get(name)!;
  }

  // close all connections and delete the corresponding values from the in-memory map
  async closeAll(): Promise<void> {
    for (const [name, connection] of this.pool.entries()) {
      await connection.quit();
      this.pool.delete(name);
    }
  }
}
```

- `ShardRepository` for Mongoose Database Query Abstractions, ensuring loose coupling between services using the repository for CRUD operations via `IShardRepository` interface.

```typescript
export interface IShardRepository {
  findById: (id: string) => Promise<Shard | null>;
  save(doc: Shard): Promise<void>;
}
```

### Current Workflow

![Current Workflow](/public/workflow.png)

### Local Development

1. Download docker desktop

2. Run redis locally on docker

- `http://localhost:8001` is the GUI platform for viewing all the (key,value) pair records that are written to local redis server at `6379` port.

```bash
docker run -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

3. Use yarn as package manager

```bash
npm i -g yarn
```

4. Install all the dependencies with their versions according to the lock file.

```bash
yarn
```

5. Setup environment variables in the `.env` file

```bash
FRONTEND_URL="http://localhost:3000"
REDIS_URL="redis://localhost:6379"
DATABASE_URL=""
NODE_ENV="development"
PORT=8080
```

6. Run the development server using `yarn dev`. It will first run the predev script, which will format all your code via prettier and then start the development server.

### Contributing

Follow the [contributing.md](https://github.com/codeshardlabs/multi-file-collab/blob/main/contributing.md) guide to resolve the issues on the basis of current order of issues to be resolved: [here](https://doc.clickup.com/9016677894/d/h/8cpz5g6-236/55cb95fbe534cf5)
