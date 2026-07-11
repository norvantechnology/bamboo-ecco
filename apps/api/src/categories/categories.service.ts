import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { CreateCategoryDto, UpdateCategoryDto } from '../admin/dto/admin.dto';

export interface CategoryNode {
  _id: string;
  slug: string;
  name: string;
  imageUrl?: string;
  parentId: string | null;
  children: CategoryNode[];
}

type LeanCategory = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  imageUrl?: string;
  parentId?: Types.ObjectId | null;
  meta?: { title?: string; description?: string };
};

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  private tid(tenantId: string) {
    return new Types.ObjectId(tenantId);
  }

  private format(cat: LeanCategory) {
    return {
      _id: cat._id.toString(),
      slug: cat.slug,
      name: cat.name,
      imageUrl: cat.imageUrl,
      parentId: cat.parentId ? cat.parentId.toString() : null,
      meta: {
        title: cat.meta?.title ?? '',
        description: cat.meta?.description ?? '',
      },
    };
  }

  buildTree(categories: LeanCategory[]): CategoryNode[] {
    const nodes = new Map<string, CategoryNode>();
    for (const cat of categories) {
      const id = cat._id.toString();
      nodes.set(id, { ...this.format(cat), children: [] });
    }

    const roots: CategoryNode[] = [];
    for (const cat of categories) {
      const node = nodes.get(cat._id.toString())!;
      const parentId = cat.parentId?.toString();
      if (parentId && nodes.has(parentId)) {
        nodes.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const sortNodes = (list: CategoryNode[]) => {
      list.sort((a, b) => a.name.localeCompare(b.name));
      list.forEach((n) => sortNodes(n.children));
    };
    sortNodes(roots);
    return roots;
  }

  async findAll(tenantId: string) {
    const categories = await this.categoryModel
      .find({ tenantId: this.tid(tenantId) })
      .sort({ name: 1 })
      .lean()
      .exec();
    return categories.map((c) => this.format(c as LeanCategory));
  }

  async findTree(tenantId: string) {
    const categories = await this.categoryModel
      .find({ tenantId: this.tid(tenantId) })
      .sort({ name: 1 })
      .lean()
      .exec();
    return this.buildTree(categories as LeanCategory[]);
  }

  async findBySlug(tenantId: string, slug: string) {
    return this.categoryModel.findOne({ tenantId: this.tid(tenantId), slug }).lean().exec();
  }

  async findBySlugEnriched(tenantId: string, slug: string) {
    const tid = this.tid(tenantId);
    const category = await this.categoryModel.findOne({ tenantId: tid, slug }).lean().exec();
    if (!category) return null;

    const [parent, children] = await Promise.all([
      category.parentId
        ? this.categoryModel.findById(category.parentId).select('slug name').lean().exec()
        : null,
      this.categoryModel
        .find({ tenantId: tid, parentId: category._id })
        .sort({ name: 1 })
        .select('slug name imageUrl')
        .lean()
        .exec(),
    ]);

    return {
      ...this.format(category as LeanCategory),
      parent: parent
        ? { _id: parent._id.toString(), slug: parent.slug, name: parent.name }
        : null,
      children: children.map((c) => ({
        _id: c._id.toString(),
        slug: c.slug,
        name: c.name,
        imageUrl: c.imageUrl,
      })),
    };
  }

  async getScopeCategoryIds(tenantId: string, categoryId: string) {
    const tid = this.tid(tenantId);
    const rootId = new Types.ObjectId(categoryId);
    const all = await this.categoryModel.find({ tenantId: tid }).select('_id parentId').lean().exec();

    const childrenByParent = new Map<string, string[]>();
    for (const cat of all) {
      const pid = cat.parentId?.toString();
      if (!pid) continue;
      const list = childrenByParent.get(pid) ?? [];
      list.push(cat._id.toString());
      childrenByParent.set(pid, list);
    }

    const ids = new Set<string>([categoryId]);
    const queue = [categoryId];
    while (queue.length) {
      const current = queue.shift()!;
      for (const childId of childrenByParent.get(current) ?? []) {
        if (!ids.has(childId)) {
          ids.add(childId);
          queue.push(childId);
        }
      }
    }

    return [...ids].map((id) => new Types.ObjectId(id));
  }

  async create(tenantId: string, dto: CreateCategoryDto) {
    const tid = this.tid(tenantId);
    const exists = await this.categoryModel.findOne({ tenantId: tid, slug: dto.slug }).exec();
    if (exists) throw new ConflictException('Category slug already exists');

    if (dto.parentId) {
      const parent = await this.categoryModel
        .findOne({ _id: dto.parentId, tenantId: tid })
        .exec();
      if (!parent) throw new BadRequestException('Parent category not found');
    }

    const created = await this.categoryModel.create({
      slug: dto.slug,
      name: dto.name,
      imageUrl: dto.imageUrl,
      meta: {
        title: dto.meta?.title?.trim() || '',
        description: dto.meta?.description?.trim() || '',
      },
      tenantId: tid,
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
    });

    return this.format(created.toObject() as LeanCategory);
  }

  async update(tenantId: string, id: string, dto: UpdateCategoryDto) {
    const tid = this.tid(tenantId);
    const patch: Record<string, unknown> = {};

    if (dto.slug !== undefined) patch.slug = dto.slug;
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.imageUrl !== undefined) patch.imageUrl = dto.imageUrl;
    if (dto.meta !== undefined) {
      patch.meta = {
        title: dto.meta?.title?.trim() || '',
        description: dto.meta?.description?.trim() || '',
      };
    }

    if ('parentId' in dto) {
      if (dto.parentId) {
        if (dto.parentId === id) {
          throw new BadRequestException('Category cannot be its own parent');
        }
        const parent = await this.categoryModel.findOne({ _id: dto.parentId, tenantId: tid }).exec();
        if (!parent) throw new BadRequestException('Parent category not found');

        const scope = await this.getScopeCategoryIds(tenantId, id);
        if (scope.some((cid) => cid.toString() === dto.parentId)) {
          throw new BadRequestException('Cannot set a descendant as parent');
        }
        patch.parentId = new Types.ObjectId(dto.parentId);
      } else {
        patch.parentId = null;
      }
    }

    const category = await this.categoryModel
      .findOneAndUpdate({ _id: id, tenantId: tid }, patch, { new: true })
      .lean()
      .exec();
    if (!category) throw new NotFoundException('Category not found');
    return this.format(category as LeanCategory);
  }

  async remove(tenantId: string, id: string) {
    const tid = this.tid(tenantId);
    const childCount = await this.categoryModel.countDocuments({ tenantId: tid, parentId: id }).exec();
    if (childCount > 0) {
      throw new BadRequestException('Remove sub-categories before deleting this category');
    }

    const productCount = await this.productModel.countDocuments({ tenantId: tid, categoryId: id }).exec();
    if (productCount > 0) {
      throw new BadRequestException('Reassign or delete products in this category first');
    }

    const result = await this.categoryModel.deleteOne({ _id: id, tenantId: tid }).exec();
    if (result.deletedCount === 0) throw new NotFoundException('Category not found');
    return { deleted: true };
  }
}
