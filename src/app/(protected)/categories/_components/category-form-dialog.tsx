'use client';

import { DialogCreateButton } from '@/components/shared/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Category, CategoryOption } from '@/domain';
import { createCategoryAction, updateCategoryAction } from '@/features/categories/action';
import {
  CreateCategoryInput,
  CreateCategorySchema,
  UpdateCategoryInput,
  UpdateCategorySchema,
} from '@/features/categories/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { Controller, useForm, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

interface CategoryFormDialogProps {
  mode: 'create' | 'edit';
  category?: Category;
  editOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
export function CategoryFormDialog(props: CategoryFormDialogProps) {
  const { mode, category, editOpen, onOpenChange } = props;

  const [internalOpen, setInternalOpen] = useState(false);
  const isEditAction = editOpen !== undefined && onOpenChange !== undefined;
  const open = isEditAction ? editOpen : internalOpen;
  const setOpen = isEditAction ? onOpenChange : setInternalOpen;
  const isEditMode = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditAction && (
        <DialogTrigger asChild>
          <DialogCreateButton text="Add New Category" />
        </DialogTrigger>
      )}
      <DialogContent className="md:max-w-lg">
        {isEditMode && category ? (
          <CategoryForm mode="edit" category={category} onClose={() => setOpen(false)} />
        ) : (
          <CategoryForm mode="create" onClose={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CategoryFormProps {
  mode: 'create' | 'edit';
  onClose: () => void;
  category?: Category;
}
function CategoryForm(props: CategoryFormProps) {
  const { category, mode, onClose } = props;
  const [isPending, startTransition] = useTransition();
  const isCreateMode = mode === 'create';

  const defaultValues = {
    name: isCreateMode ? '' : category!.name,
    description: isCreateMode ? '' : (category!.description ?? ''),
  };

  const form = useForm<CreateCategoryInput | UpdateCategoryInput>({
    resolver: zodResolver(isCreateMode ? CreateCategorySchema : UpdateCategorySchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: defaultValues as CreateCategoryInput | UpdateCategoryInput,
  });

  const onSubmit = (input: CreateCategoryInput | UpdateCategoryInput) =>
    startTransition(async () => {
      const result = isCreateMode
        ? await createCategoryAction(input)
        : await updateCategoryAction(category!.id, input);

      if (!result.success) {
        toast.error(result.error ?? 'Something went wrong.');
        return;
      }
      toast.success(
        isCreateMode ? 'Create new Category successfully!' : 'Update Category successfully',
      );
      form.reset();
      onClose();
    });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{isCreateMode ? 'Add New Category' : 'Edit Category'}</DialogTitle>
      </DialogHeader>
      <CategoryFormFields form={form} isPending={isPending} />
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

interface CategoryFormFieldsProps {
  form: UseFormReturn<CreateCategoryInput | UpdateCategoryInput>;
  isPending: boolean;
}
function CategoryFormFields(props: CategoryFormFieldsProps) {
  const { form, isPending } = props;
  return (
    <FieldGroup>
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              {...field}
              id="name"
              aria-invalid={fieldState.invalid}
              placeholder="Name"
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
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories;
  }, [categories, query]);

  function toggle(id: number, checked: boolean) {
    onChange(checked ? [...value, id] : value.filter((v) => v !== id));
  }

  return (
    <DropdownMenu>
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
        <div className="p-1">
          <Input
            placeholder="Search categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="h-8"
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
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
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
