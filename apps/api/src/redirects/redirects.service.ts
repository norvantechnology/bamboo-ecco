import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Redirect, RedirectDocument } from '../schemas/redirect.schema';
import { RedirectDto } from './redirect.dto';

@Injectable()
export class RedirectsService {
  constructor(@InjectModel(Redirect.name) private redirectModel: Model<RedirectDocument>) {}

  private tid(tenantId: string) {
    return new Types.ObjectId(tenantId);
  }

  findAll(tenantId: string) {
    return this.redirectModel
      .find({ tenantId: this.tid(tenantId) })
      .sort({ fromPath: 1 })
      .lean()
      .exec();
  }

  findByPath(tenantId: string, path: string) {
    return this.redirectModel
      .findOne({ tenantId: this.tid(tenantId), fromPath: path })
      .lean()
      .exec();
  }

  async create(tenantId: string, dto: RedirectDto) {
    const tid = this.tid(tenantId);
    const exists = await this.redirectModel.findOne({ tenantId: tid, fromPath: dto.fromPath }).exec();
    if (exists) throw new ConflictException('Redirect already exists for this path');
    return this.redirectModel.create({
      tenantId: tid,
      fromPath: dto.fromPath,
      toPath: dto.toPath,
      statusCode: dto.statusCode ?? 301,
    });
  }

  async update(tenantId: string, id: string, dto: RedirectDto) {
    const redirect = await this.redirectModel
      .findOneAndUpdate(
        { _id: id, tenantId: this.tid(tenantId) },
        { fromPath: dto.fromPath, toPath: dto.toPath, statusCode: dto.statusCode ?? 301 },
        { new: true },
      )
      .lean()
      .exec();
    if (!redirect) throw new NotFoundException('Redirect not found');
    return redirect;
  }

  async remove(tenantId: string, id: string) {
    const result = await this.redirectModel
      .deleteOne({ _id: id, tenantId: this.tid(tenantId) })
      .exec();
    if (result.deletedCount === 0) throw new NotFoundException('Redirect not found');
    return { deleted: true };
  }
}
