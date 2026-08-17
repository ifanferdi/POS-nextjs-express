import e from 'express';
import asyncHandler from 'express-async-handler';
import config from '@/config/config';
import { HttpStatusCode } from '@/constants/http-status.constant';
import { FileType } from '@/domain/entities/types/storage.types';
import { handleNumberOrArrayRequest, handleOrderByRequest } from '@/helpers/common.helper';
import uploadFile from '@/helpers/multer.helper';
import { BaseFindById } from '@/validations/base-validation';
import {
  CreateProductDto,
  CreateProductSchema,
  FindAllProductDto,
  FindAllProductSchema,
  FindByIdProductDto,
  FindByIdProductSchema,
  UpdateProductDto,
  UpdateProductSchema,
} from '@/validations/product-validation';
import BaseController from '@/adapters/http/controller/_base-controller';

export default class ProductController extends BaseController {
  findAll = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    const request = req.route.methods.get ? req.query : req.body;

    const params: FindAllProductDto = {
      page: Number(request.page) || 1,
      limit: Number(request.limit) || 10,
      orderBy: handleOrderByRequest(request),
      search: request.q as string,
      columns: request.columns,
      ids: Array.isArray(request?.ids)
        ? request.ids.map((val: string) => (val ? Number(val) : undefined))
        : undefined,
      isActive: request.isActive ? request.isActive === 'true' : undefined,
      barcode: request.barcode,
      sku: request.sku,
      categoryId: handleNumberOrArrayRequest(request.categoryId),
      with: request.with,
    };

    FindAllProductSchema.parse(params);

    const result = await this.useCases.productUseCase.findAllProduct.execute(params);

    res.send(result);
  });

  findOne = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params: FindByIdProductDto = {
      id: Number(req.params.id),
      with: req.query.with as any,
    };

    FindByIdProductSchema.parse(params);

    const result = await this.useCases.productUseCase.findByIdProduct.execute(params);

    res.send(result);
  });

  create = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload: CreateProductDto = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      cost: req.body.cost,
      sku: req.body.sku,
      barcode: req.body.barcode,
      imagePath: req.body.imagePath,
      isActive: req.body.isActive,
      stock: req.body.stock,
      categoryIds: req.body.categoryIds,
    };

    CreateProductSchema.parse(payload);

    const product = await this.useCases.productUseCase.createProduct.execute(payload);

    res.status(HttpStatusCode.CREATED).send({ message: 'Success.', product });
  });

  update = asyncHandler(async (req: e.Request, res: e.Response) => {
    const payload: UpdateProductDto = {
      id: Number(req.params.id),
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      cost: req.body.cost,
      sku: req.body.sku,
      barcode: req.body.barcode,
      imagePath: req.body.imagePath,
      isActive: req.body.isActive,
      stock: req.body.stock,
      categoryIds: req.body.categoryIds,
    };

    UpdateProductSchema.parse(payload);

    const product = await this.useCases.productUseCase.updateProduct.execute(payload);

    res.send({ message: 'Success.', product });
  });

  destroy = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: Number(req.params.id) };
    BaseFindById.parse(params);

    await this.useCases.productUseCase.deleteProduct.execute(params as BaseFindById);

    res.send({ message: 'Success.' });
  });

  destroyPermanently = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: Number(req.params.id) };
    BaseFindById.parse(params);

    await this.useCases.productUseCase.deleteProduct.execute(params as BaseFindById, {
      isPermanently: true,
    });

    res.send({ message: 'Success.' });
  });

  restore = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: Number(req.params.id) };
    BaseFindById.parse(params);

    await this.useCases.productUseCase.restoreProduct.execute(params as BaseFindById);

    res.send({ message: 'Success.' });
  });

  upload = uploadFile(config.storage.maxSize, [FileType.IMAGE]).single('image');

  uploadImage = asyncHandler(async (req: e.Request, res: e.Response) => {
    const imagePath = await this.useCases.productUseCase.productImage.execute(
      req.file as Express.Multer.File,
    );

    res.send({ message: 'Success.', imagePath });
  });
}
