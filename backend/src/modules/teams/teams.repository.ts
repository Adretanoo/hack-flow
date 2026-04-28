import type { Database } from '../../config/database';
import { teams, teamMembers, teamInvites, teamApprovals } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { CreateTeamDto, UpdateTeamDto } from './teams.schema';

export class TeamsRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string) {
    const [row] = await this.db.select().from(teams).where(eq(teams.id, id)).limit(1);
    return row ?? null;
  }

  async findByHackathon(hackathonId: string) {
    return this.db.select().from(teams).where(eq(teams.hackathonId, hackathonId));
  }

  async create(data: CreateTeamDto) {
    const [row] = await this.db.insert(teams).values(data).returning();
    return row;
  }

  async update(id: string, data: UpdateTeamDto) {
    const [row] = await this.db
      .update(teams)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return row ?? null;
  }

  async remove(id: string) {
    await this.db.delete(teams).where(eq(teams.id, id));
  }

  // ── Members ─────────────────────────────────────────────
  async getMembers(teamId: string) {
    return this.db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
  }

  async isMember(teamId: string, userId: string) {
    const [row] = await this.db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .limit(1);
    return !!row;
  }

  async addMember(teamId: string, userId: string, role: 'captain' | 'participant' = 'participant') {
    const [row] = await this.db.insert(teamMembers).values({ teamId, userId, role }).returning();
    return row;
  }

  async removeMember(teamId: string, userId: string) {
    await this.db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  // ── Invites ─────────────────────────────────────────────
  async createInvite(data: {
    teamId: string;
    token: string;
    createdBy: string;
    expiresAt: Date;
    maxUses: number;
  }) {
    const [row] = await this.db.insert(teamInvites).values(data).returning();
    return row;
  }

  async findInviteByToken(token: string) {
    const [row] = await this.db
      .select()
      .from(teamInvites)
      .where(eq(teamInvites.token, token))
      .limit(1);
    return row ?? null;
  }

  async incrementInviteUses(id: string, currentCount: number) {
    await this.db
      .update(teamInvites)
      .set({ usesCount: currentCount + 1 })
      .where(eq(teamInvites.id, id));
  }

  async deactivateInvite(id: string) {
    await this.db.update(teamInvites).set({ active: false }).where(eq(teamInvites.id, id));
  }

  // ── Approval ─────────────────────────────────────────────
  async getApproval(teamId: string) {
    const [row] = await this.db
      .select()
      .from(teamApprovals)
      .where(eq(teamApprovals.teamId, teamId))
      .limit(1);
    return row ?? null;
  }

  async upsertApproval(data: {
    teamId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISQUALIFIED';
    approvedBy?: string;
    comment?: string;
  }) {
    const existing = await this.getApproval(data.teamId);
    if (existing) {
      const [row] = await this.db
        .update(teamApprovals)
        .set({ status: data.status, approvedBy: data.approvedBy, comment: data.comment, approvedAt: new Date() })
        .where(eq(teamApprovals.id, existing.id))
        .returning();
      return row;
    }
    const [row] = await this.db.insert(teamApprovals).values(data).returning();
    return row;
  }
}
