'use client';

import { DialogCreateButton } from '@/components/shared/button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { options } from '@/config/config';
import { CategoryOption, ProductList } from '@/domain';
import { createCategoryAction } from '@/features/categories/action';
import { createProductAction, updateProductAction } from '@/features/products/action';
import {
  CreateProductInput,
  CreateProductSchema,
  UpdateProductInput,
} from '@/features/products/schema';
import { generatePresignUrlAction } from '@/features/uploads/api';
import { ImageFileSchema, PresignUrlInput, PresignUrlSchema } from '@/features/uploads/schema';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import _ from 'lodash';
import { ChevronDown, Loader2Icon, PlusIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Controller, useForm, UseFormRegisterReturn, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

async function uploadImageToS3(file: File) {
  const input: PresignUrlInput = {
    filename: file.name,
    fileType: 'image',
    contentType: file.type as PresignUrlInput['contentType'],
    fileSize: file.size,
  };
  PresignUrlSchema.parse(input);

  const presign = await generatePresignUrlAction(input);
  await axios.put(presign.presignUrl, file, { headers: { 'Content-Type': file.type } });

  return presign.key;
}

type ProductFormValues = (CreateProductInput | UpdateProductInput) & { imageFile?: FileList };
const ProductFormSchema = CreateProductSchema.extend({ imageFile: ImageFileSchema });

interface ProductFormDialogProps {
  mode: 'create' | 'edit';
  product?: ProductList;
  categories: CategoryOption[];
  editOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
export function ProductFormDialog(props: ProductFormDialogProps) {
  const { mode, product, categories, editOpen, onOpenChange } = props;
  const [internalOpen, setInternalOpen] = useState(false);
  const isEditAction = editOpen !== undefined && onOpenChange !== undefined;
  const open = isEditAction ? editOpen : internalOpen;
  const setOpen = isEditAction ? onOpenChange : setInternalOpen;
  const isEditMode = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditAction && (
        <DialogTrigger asChild>
          <DialogCreateButton text="Add New Product" />
        </DialogTrigger>
      )}
      <DialogContent className="lg:max-w-xl max-h-[calc(100vh-4rem)] flex flex-col p-0 gap-0">
        {isEditMode && product ? (
          <ProductForm
            mode="edit"
            product={product}
            categories={categories}
            onClose={() => setOpen(false)}
          />
        ) : (
          <ProductForm mode="create" categories={categories} onClose={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  categories: CategoryOption[];
  onClose: () => void;
  product?: ProductList;
}
function ProductForm(props: ProductFormProps) {
  const { mode, product, categories, onClose } = props;
  const [isPending, startTransition] = useTransition();
  const isCreateMode = mode === 'create';
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.imageUrl ?? null);

  const defaultValues = {
    name: !isCreateMode && product ? product.name : '',
    description: !isCreateMode && product ? (product.description ?? '') : '',
    price: !isCreateMode && product ? product.price : '',
    cost: !isCreateMode && product ? (product.cost ?? '') : '',
    sku: !isCreateMode && product ? (product.sku ?? '') : '',
    barcode: !isCreateMode && product ? (product.barcode ?? '') : '',
    imagePath: !isCreateMode && product ? product.imagePath : '',
    isActive: !isCreateMode && product ? product.isActive : true,
    stock: !isCreateMode && product ? product.stock : '',
    categoryIds: !isCreateMode && product ? _.map(product.categories, 'id') : [],
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: defaultValues as ProductFormValues,
  });

  const imageField = form.register('imageFile', {
    onChange: (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) setPreviewUrl(URL.createObjectURL(file));
    },
  });

  useEffect(() => {
    if (previewUrl?.startsWith('blob:')) return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const onSubmit = (input: ProductFormValues) =>
    startTransition(async () => {
      try {
        const { imageFile, ...rest } = input;
        const imagePath = imageFile?.[0]
          ? await uploadImageToS3(imageFile[0])
          : (rest.imagePath ?? null);
        const payload = { ...rest, imagePath } as CreateProductInput | UpdateProductInput;

        const result = isCreateMode
          ? await createProductAction(payload)
          : await updateProductAction(product!.id, payload);

        if (!result.success) {
          toast.error(result.error ?? 'Something went wrong.');
          return;
        }
        toast.success(
          isCreateMode ? 'Product created successfully!' : 'Product updated successfully',
        );
        form.reset();
        onClose();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to upload image.');
      }
    });

  function handleImageClear() {
    form.setValue('imageFile', undefined);
    form.setValue('imagePath', '');
    form.clearErrors('imageFile');
    setPreviewUrl(null);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
      <DialogHeader className="px-6 py-4 border-b shrink-0">
        <DialogTitle>{isCreateMode ? 'Add New Product' : 'Edit Product'}</DialogTitle>
      </DialogHeader>
      <div className="overflow-y-auto flex-1 px-6 py-4">
        <ProductFormFields
          form={form}
          categories={categories}
          isPending={isPending}
          previewUrl={previewUrl}
          imageField={imageField}
          onImageClear={handleImageClear}
          autoFocus={isCreateMode}
        />
      </div>
      <DialogFooter className="mx-0 mb-0 px-6 py-4 border-t shrink-0">
        <Button type="submit" disabled={isPending}>
          Save Changes
        </Button>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isPending}>
            Reset
          </Button>
        </DialogClose>
      </DialogFooter>
    </form>
  );
}

interface ProductFormFieldsProps {
  form: UseFormReturn<ProductFormValues>;
  categories: CategoryOption[];
  isPending: boolean;
  previewUrl: string | null;
  imageField: UseFormRegisterReturn;
  onImageClear: () => void;
  autoFocus?: boolean;
}
function ProductFormFields(props: ProductFormFieldsProps) {
  const { form, categories, isPending, previewUrl, imageField, onImageClear, autoFocus } = props;
  const { formState } = form;
  const imageError = formState.errors.imageFile;
  return (
    <FieldGroup className="gap-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="name">Product Name</FieldLabel>
            <Input
              {...field}
              id="name"
              autoFocus={autoFocus}
              aria-invalid={fieldState.invalid}
              placeholder="Product Name"
              disabled={isPending}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              {...field}
              value={field.value ?? ''}
              id="description"
              rows={4}
              aria-invalid={fieldState.invalid}
              placeholder="Description"
              disabled={isPending}
              // className="min-h-0"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Controller
          name="price"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="price">Selling Price</FieldLabel>
              <Input
                {...field}
                onChange={(e) =>
                  field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                }
                id="price"
                type="number"
                aria-invalid={fieldState.invalid}
                placeholder="Rp. 0"
                disabled={isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="cost"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="cost">Cost Price</FieldLabel>
              <Input
                {...field}
                onChange={(e) =>
                  field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                }
                id="cost"
                type="number"
                aria-invalid={fieldState.invalid}
                placeholder="Rp. 0"
                disabled={isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Controller
          name="sku"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sku">SKU</FieldLabel>
              <Input
                {...field}
                id="sku"
                value={field.value ?? ''}
                aria-invalid={fieldState.invalid}
                placeholder="SKU"
                disabled={isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="barcode"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="barcode">Barcode</FieldLabel>
              <Input
                {...field}
                value={field.value ?? ''}
                id="barcode"
                aria-invalid={fieldState.invalid}
                placeholder="Barcode"
                disabled={isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Controller
          name="stock"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="stock">Stock</FieldLabel>
              <Input
                {...field}
                onChange={(e) =>
                  field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                }
                id="stock"
                type="number"
                aria-invalid={fieldState.invalid}
                placeholder="0"
                disabled={isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="isActive"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="isActive">Status</FieldLabel>
              <Select
                value={String(field.value)}
                onValueChange={(v) => field.onChange(v === 'true')}
                disabled={isPending}
              >
                <SelectTrigger id="isActive" aria-invalid={fieldState.invalid} className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent position="item-aligned">
                  {options.activeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <Controller
        name="categoryIds"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="categoryIds">Categories</FieldLabel>
            <CategoryMultiSelect
              categories={categories}
              value={field.value ? field.value.map((v) => Number(v)) : []}
              onChange={field.onChange}
              disabled={isPending}
            />
            {field.value?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {field.value.map((id) => {
                  const cat = categories.find((c) => c.id === id);
                  return cat ? (
                    <Badge key={id as number} variant="secondary">
                      {cat.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Field data-invalid={!!imageError}>
        <FieldLabel htmlFor="image">Image</FieldLabel>
        <ProductImageInput
          previewUrl={previewUrl}
          imageField={imageField}
          onClear={onImageClear}
          disabled={isPending}
        />
        {imageError && <FieldError errors={[imageError]} />}
        <FieldDescription className="text-[11px]">PNG or JPG, max 15 MB.</FieldDescription>
      </Field>
    </FieldGroup>
  );
}

function ProductImageInput({
  previewUrl,
  imageField,
  onClear,
  disabled,
}: {
  previewUrl: string | null;
  imageField: UseFormRegisterReturn;
  onClear: () => void;
  disabled?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(true);

  if (previewUrl) {
    return (
      <div key={previewUrl}>
        <div className="relative size-44">
          {isLoading && (
            <div className="flex size-44 items-center justify-center rounded-lg border border-border/60 bg-muted">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            <Image
              src={previewUrl}
              width={500}
              height={500}
              loading="lazy"
              alt="Product preview"
              onLoad={() => setIsLoading(false)}
              className={cn(
                'size-44 rounded-lg border border-border/60 object-cover transition-opacity',
                isLoading ? 'opacity-0' : 'opacity-100',
              )}
            />
          </a>
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            aria-label="Remove image"
            className="absolute right-2 top-2 rounded-full border border-border/60 bg-background/90 p-1 text-muted-foreground transition opacity-50 hover:opacity-100 hover:text-foreground disabled:opacity-50"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      </div>
    );
  }
  return (
    <Input
      type="file"
      id="image"
      accept="image/png,image/jpeg"
      {...imageField}
      disabled={disabled}
      className="cursor-pointer"
    />
  );
}

function CategoryMultiSelect({
  categories,
  value,
  onChange,
  disabled,
}: {
  categories: CategoryOption[];
  value: number[];
  onChange: (v: number[]) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [added, setAdded] = useState<CategoryOption[]>([]);
  const [isCreating, startCreating] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);
  const allCategories = useMemo(() => [...categories, ...added], [categories, added]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? allCategories.filter((c) => c.name.toLowerCase().includes(q)) : allCategories;
  }, [allCategories, query]);

  function toggle(id: number, checked: boolean) {
    onChange(checked ? [...value, id] : value.filter((v) => v !== id));
  }

  function handleAddNew() {
    const name = query.trim();
    if (!name) return;
    startCreating(async () => {
      const result = await createCategoryAction({ name });
      if (!result.success || !result.data) {
        toast.error(result.error ?? 'Failed to create category.');
        return;
      }
      setAdded((prev) => [...prev, result.data!]);
      onChange([...value, result.data!.id]);
      setQuery('');
      toast.success(`Category "${result.data!.name}" created successfully.`);
    });
  }

  const showAddNew = query.trim();

  return (
    <DropdownMenu onOpenChange={(open) => open && setTimeout(() => searchRef.current?.focus(), 0)}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {value.length > 0 ? `${value.length} selected` : 'Select Categories'}
          <ChevronDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
        <div className="relative p-1">
          <Input
            ref={searchRef}
            placeholder="Search categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="h-8 pr-7"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filtered.length === 0 && !showAddNew ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">No results.</div>
          ) : (
            filtered.map((cat) => (
              <DropdownMenuCheckboxItem
                key={cat.id}
                checked={value.includes(cat.id)}
                onCheckedChange={(checked) => toggle(cat.id, checked)}
                onSelect={(e) => e.preventDefault()}
              >
                {cat.name}
              </DropdownMenuCheckboxItem>
            ))
          )}
          {showAddNew && (
            <button
              type="button"
              onClick={handleAddNew}
              disabled={isCreating}
              className="flex w-full items-center gap-2 border-t border-border/60 px-2 py-2.5 text-left text-sm transition hover:bg-muted disabled:opacity-50"
            >
              <PlusIcon className="size-4 text-primary" />
              <span>
                Add <strong className="font-medium">&quot;{query.trim()}&quot;</strong> as new
                category
              </span>
            </button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
