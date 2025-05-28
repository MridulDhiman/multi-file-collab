import { ClerkClient, createClerkClient, User } from "@clerk/backend";
import { env } from "process";
import { logger } from "./logger/logger";

export default class ClerkService {
  private _clerkClient: ClerkClient;

  constructor() {
    this._clerkClient = createClerkClient({
      secretKey: env.CLERK_SECRET_KEY,
    });
  }

  async getUser(userId: string) : Promise<User | null> {
    try {
      const user = await this._clerkClient.users.getUser(userId);
      return user;
    } catch (error) {
      logger.error("Error getting user from Clerk", error);
      return null;
    }
  }
}