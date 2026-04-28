import type { UsersRepository } from './users.repository';
import { NotFoundError, ConflictError } from '../../common/errors/http-errors';
import type { UpdateProfileDto, AddSocialDto } from './users.schema';

export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getProfile(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundError('User');
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const existing = await this.usersRepository.findByUsername(dto.username);
      if (existing && existing.id !== id) throw new ConflictError('Username is already taken');
    }
    const updated = await this.usersRepository.updateProfile(id, dto);
    if (!updated) throw new NotFoundError('User');
    const { passwordHash: _, ...safe } = updated;
    return safe;
  }

  async getSocials(userId: string) {
    return this.usersRepository.getSocials(userId);
  }

  async addSocial(userId: string, dto: AddSocialDto) {
    return this.usersRepository.addSocial(userId, dto);
  }

  async deleteSocial(socialId: string) {
    await this.usersRepository.deleteSocial(socialId);
  }
}
