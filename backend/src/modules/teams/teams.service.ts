import type { TeamsRepository } from './teams.repository';
import { NotFoundError, ConflictError, ForbiddenError } from '../../common/errors/http-errors';
import { generateId } from '../../utils/uuid';
import type { CreateTeamDto, UpdateTeamDto, CreateInviteDto } from './teams.schema';

export class TeamsService {
  constructor(private readonly repo: TeamsRepository) {}

  async getById(id: string) {
    const team = await this.repo.findById(id);
    if (!team) throw new NotFoundError('Team');
    return team;
  }

  async listByHackathon(hackathonId: string) {
    return this.repo.findByHackathon(hackathonId);
  }

  async create(dto: CreateTeamDto, creatorId: string) {
    const team = await this.repo.create(dto);
    await this.repo.addMember(team.id, creatorId, 'captain');
    return team;
  }

  async update(id: string, dto: UpdateTeamDto, requesterId: string) {
    await this.assertCaptain(id, requesterId);
    const updated = await this.repo.update(id, dto);
    if (!updated) throw new NotFoundError('Team');
    return updated;
  }

  async remove(id: string, requesterId: string) {
    await this.assertCaptain(id, requesterId);
    await this.repo.remove(id);
  }

  async getMembers(teamId: string) {
    await this.getById(teamId);
    return this.repo.getMembers(teamId);
  }

  async removeMember(teamId: string, userId: string, requesterId: string) {
    await this.assertCaptain(teamId, requesterId);
    await this.repo.removeMember(teamId, userId);
  }

  async createInvite(teamId: string, dto: CreateInviteDto, requesterId: string) {
    await this.assertCaptain(teamId, requesterId);
    const token = generateId();
    const expiresAt = new Date(Date.now() + dto.expiresInHours * 60 * 60 * 1000);
    return this.repo.createInvite({ teamId, token, createdBy: requesterId, expiresAt, maxUses: dto.maxUses });
  }

  async joinViaToken(token: string, userId: string) {
    const invite = await this.repo.findInviteByToken(token);
    if (!invite || !invite.active || invite.expiresAt < new Date()) {
      throw new NotFoundError('Invite token is invalid or expired');
    }
    if (invite.usesCount >= invite.maxUses) {
      throw new ForbiddenError('Invite link has reached its maximum uses');
    }
    const alreadyMember = await this.repo.isMember(invite.teamId, userId);
    if (alreadyMember) throw new ConflictError('You are already a member of this team');

    await this.repo.addMember(invite.teamId, userId);
    await this.repo.incrementInviteUses(invite.id, invite.usesCount);
    return this.repo.findById(invite.teamId);
  }

  async updateApproval(
    teamId: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISQUALIFIED',
    approverId: string,
    comment?: string,
  ) {
    await this.getById(teamId);
    return this.repo.upsertApproval({ teamId, status, approvedBy: approverId, comment });
  }

  private async assertCaptain(teamId: string, userId: string): Promise<void> {
    const members = await this.repo.getMembers(teamId);
    const isCaptain = members.some((m) => m.userId === userId && m.role === 'captain');
    if (!isCaptain) throw new ForbiddenError('Only the team captain can perform this action');
  }
}
