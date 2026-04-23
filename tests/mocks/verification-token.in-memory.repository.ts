import { IVerificationTokenRepository } from "../../src/server/core/repositories/verification-token.repository";
import { VerificationTokenEntity } from "../../src/server/core/entities/verification-token.entity";

export class InMemoryVerificationTokenRepository implements IVerificationTokenRepository {
  private tokens: VerificationTokenEntity[] = [];

  async save(userId: string, token: string, expiresAt: Date): Promise<VerificationTokenEntity> {
    const entity = new VerificationTokenEntity(
      crypto.randomUUID(),
      userId,
      token,
      expiresAt,
      new Date(),
    );
    this.tokens.push(entity);
    return entity;
  }

  async find(token: string): Promise<VerificationTokenEntity | null> {
    return this.tokens.find((t) => t.token === token) ?? null;
  }

  async delete(token: string): Promise<void> {
    this.tokens = this.tokens.filter((t) => t.token !== token);
  }

  async deleteAllForUser(userId: string): Promise<void> {
    this.tokens = this.tokens.filter((t) => t.userId !== userId);
  }
}
