import {
  changePasswordInput,
  createUserWithEmailAndPasswordInput,
  loginUserWithEmailAndPasswordInput,
  updateProfileInput,
  type ChangePasswordInputType,
  type CreateUserWithEmailAndPasswordInputType,
  type LoginUserWithEmailAndPasswordInputType,
  type UpdateProfileInputType,
} from "./model";
import { db, eq } from "@repo/database";
import { usersTable } from "@repo/database/models/user";
import { currentTokenSecond, signToken } from "../auth";
import { generateUserGlobalFormSlug } from "./slug";

import { randomBytes, createHmac } from "crypto";

class UserService {
  private async getUserByEmail(email: string) {
    const result = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (!result || result.length === 0) return null;
    return result[0];
  }

  public async getUserById(id: string) {
    if (!id) return null;
    const result = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    if (!result || result.length === 0) return null;
    return result[0];
  }

  private generateHash(salt: string, password: string): string {
    return createHmac("sha256", salt).update(password).digest("hex");
  }

  public async createUserEmailAndPassword(
    payload: CreateUserWithEmailAndPasswordInputType,
  ): Promise<{ id: string; token: string }> {
    const { email, fullName, password } =
      await createUserWithEmailAndPasswordInput.parseAsync(payload);

    const existingUserWithEmail = await this.getUserByEmail(email);
    if (existingUserWithEmail) {
      throw new Error(`A user with the email ${email} already exists`);
    }

    const salt = randomBytes(16).toString("hex");
    const hash = this.generateHash(salt, password);
    const userGlobalFormSlug = generateUserGlobalFormSlug(fullName);

    const passwordChangedAt = currentTokenSecond();

    const userInsertResult = await db
      .insert(usersTable)
      .values({
        email,
        fullName,
        salt,
        password: hash,
        userGlobalFormSlug,
        passwordChangedAt,
      })
      .returning({ id: usersTable.id });

    const userId = userInsertResult[0]?.id;
    if (!userId) {
      throw new Error("Something went wrong while creating the user");
    }

    const token = signToken({ id: userId });
    return { id: userId, token };
  }

  public async loginUserWithEmailAndPassword(
    payload: LoginUserWithEmailAndPasswordInputType,
  ): Promise<{ id: string; token: string }> {
    const { email, password } =
      await loginUserWithEmailAndPasswordInput.parseAsync(payload);

    const existingUser = await this.getUserByEmail(email);
    if (!existingUser) throw new Error("Invalid email or password");

    const computed = this.generateHash(existingUser.salt!, password);
    if (computed !== existingUser.password) {
      throw new Error("Invalid email or password");
    }

    const token = signToken({ id: existingUser.id });
    return { id: existingUser.id, token };
  }

  public async updateProfile(payload: UpdateProfileInputType) {
    const { id, fullName, profileImageUrl } =
      await updateProfileInput.parseAsync(payload);

    const patch: { fullName?: string; profileImageUrl?: string | null } = {};
    if (fullName !== undefined) patch.fullName = fullName;
    if (profileImageUrl !== undefined) patch.profileImageUrl = profileImageUrl;

    const updated = await db
      .update(usersTable)
      .set(patch)
      .where(eq(usersTable.id, id))
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        fullName: usersTable.fullName,
        profileImageUrl: usersTable.profileImageUrl,
      });

    const row = updated[0];
    if (!row) throw new Error("User not found");
    return row;
  }

  /**
   * Verifies the current password, rotates salt + hash, bumps
   * `passwordChangedAt`, and issues a fresh token. Old tokens (on any device)
   * fail middleware's iat-vs-passwordChangedAt check.
   */
  public async changePassword(
    payload: ChangePasswordInputType,
  ): Promise<{ token: string }> {
    const { id, currentPassword, newPassword } =
      await changePasswordInput.parseAsync(payload);

    const user = await this.getUserById(id);
    if (!user) throw new Error("User not found");

    const computed = this.generateHash(user.salt!, currentPassword);
    if (computed !== user.password) {
      throw new Error("Current password is incorrect");
    }

    const newSalt = randomBytes(16).toString("hex");
    const newHash = this.generateHash(newSalt, newPassword);
    const passwordChangedAt = currentTokenSecond();

    await db
      .update(usersTable)
      .set({ salt: newSalt, password: newHash, passwordChangedAt })
      .where(eq(usersTable.id, id));

    const token = signToken({ id });
    return { token };
  }
}

export default UserService;
