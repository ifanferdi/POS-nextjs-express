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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Category } from '@/domain';
import { createCategoryAction, updateCategoryAction } from '@/features/categories/action';
import {
  CreateCategoryInput,
  CreateCategorySchema,
  UpdateCategoryInput,
  UpdateCategorySchema,
} from '@/features/categories/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
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
      <DialogContent className="lg:max-w-xl max-h-[calc(100vh-4rem)] flex flex-col p-0 gap-0">
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
