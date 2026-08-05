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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
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
import { CategoryOption, Product } from '@/domain';
import { createCategoryAction } from '@/features/categories/action';
import { createProductAction, updateProductAction } from '@/features/products/action';
import {
  CreateProductInput,
  CreateProductSchema,
  UpdateProductInput,
  UpdateProductSchema,
} from '@/features/products/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { ChevronDown, PlusIcon, XIcon } from 'lucide-react';
import { useMemo, useRef, useState, useTransition } from 'react';
import { Controller, useForm, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

interface ProductFormDialogProps {
  mode: 'create' | 'edit';
  product?: Product;
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
      <DialogContent className="md:max-w-lg">
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
  product?: Product;
}
function ProductForm(props: ProductFormProps) {
  const { mode, product, categories, onClose } = props;
  const [isPending, startTransition] = useTransition();
  const isCreateMode = mode === 'create';

  const defaultValues = {
    name: isCreateMode ? '' : product!.name,
    description: isCreateMode ? '' : (product!.description ?? ''),
    price: isCreateMode ? '' : product!.price,
    cost: isCreateMode ? '' : (product!.cost ?? ''),
    sku: isCreateMode ? '' : (product!.sku ?? ''),
    barcode: isCreateMode ? '' : (product!.barcode ?? ''),
    // imagePath: isCreateMode ? '' : product!.imagePath,
    isActive: isCreateMode ? true : product!.isActive,
    stock: isCreateMode ? '' : product!.stock,
    categoryIds: isCreateMode ? [] : _.map(product!.categories, 'id'),
  };

  const form = useForm<CreateProductInput | UpdateProductInput>({
    resolver: zodResolver(isCreateMode ? CreateProductSchema : UpdateProductSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: defaultValues as CreateProductInput | UpdateProductInput,
  });

  const onSubmit = (input: CreateProductInput | UpdateProductInput) =>
    startTransition(async () => {
      const result = isCreateMode
        ? await createProductAction(input)
        : await updateProductAction(product!.id, input);

      if (!result.success) {
        toast.error(result.error ?? 'Something went wrong.');
        return;
      }
      toast.success(
        isCreateMode ? 'Create new product successfully!' : 'Update product successfully',
      );
      form.reset();
      onClose();
    });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{isCreateMode ? 'Add New Product' : 'Edit Product'}</DialogTitle>
      </DialogHeader>
      <ProductFormFields form={form} categories={categories} isPending={isPending} />
      <DialogFooter>
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
  form: UseFormReturn<CreateProductInput | UpdateProductInput>;
  categories: CategoryOption[];
  isPending: boolean;
}
function ProductFormFields(props: ProductFormFieldsProps) {
  const { form, categories, isPending } = props;
  return (
    <FieldGroup>
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="name">Product Name</FieldLabel>
            <Input
              {...field}
              id="name"
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
              aria-invalid={fieldState.invalid}
              placeholder="Description"
              disabled={isPending}
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
              <FieldLabel htmlFor="price">Price</FieldLabel>
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
              <FieldLabel htmlFor="cost">Cost</FieldLabel>
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
              <FieldLabel htmlFor="sku">Stock Keeping Unit</FieldLabel>
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
      </div>
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
    </FieldGroup>
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
      toast.success(`Category "${result.data!.name}" created.`);
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
