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
import { PasswordInput } from '@/components/ui/password-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { options } from '@/config/config';
import { GENDER_VALUES, RoleOption, UserList } from '@/domain';
import { createUserAction, updateUserAction } from '@/features/users/action';
import {
  CreateUserInput,
  CreateUserSchema,
  UpdateUserInput,
  UpdateUserSchema,
} from '@/features/users/schema';
import { formatDate } from '@/lib/helper';
import { zodResolver } from '@hookform/resolvers/zod';
import moment from 'moment';
import { useState, useTransition } from 'react';
import { Controller, useForm, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

interface UserFormDialogProps {
  mode: 'create' | 'edit';
  user?: UserList;
  roles: RoleOption[];
  editOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
export function UserFormDialog(props: UserFormDialogProps) {
  const { mode, user, roles, editOpen, onOpenChange } = props;
  const [internalOpen, setInternalOpen] = useState(false);
  const isEditAction = editOpen !== undefined && onOpenChange !== undefined;
  const open = isEditAction ? editOpen : internalOpen;
  const setOpen = isEditAction ? onOpenChange : setInternalOpen;
  const isEditMode = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditAction && (
        <DialogTrigger asChild>
          <DialogCreateButton text="Add New User" />
        </DialogTrigger>
      )}
      <DialogContent className="lg:max-w-xl max-h-[calc(100vh-4rem)] flex flex-col p-0 gap-0">
        {isEditMode && user ? (
          <UserForm mode="edit" user={user} roles={roles} onClose={() => setOpen(false)} />
        ) : (
          <UserForm mode="create" roles={roles} onClose={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface UserFormProps {
  mode: 'create' | 'edit';
  roles: RoleOption[];
  onClose: () => void;
  user?: UserList;
}
function UserForm(props: UserFormProps) {
  const { roles, user, mode, onClose } = props;
  const [isPending, startTransition] = useTransition();
  const isCreateMode = mode === 'create';
  const defaultValues = {
    username: !isCreateMode && user ? user.username : '',
    password: '',
    confirmPassword: '',
    isActive: !isCreateMode && user ? user.isActive : true,
    roleId: !isCreateMode && user ? user.roleId : undefined,
    profile: {
      fullName: !isCreateMode && user ? user.profile.fullName : '',
      placeOfBirth: !isCreateMode && user ? user.profile.placeOfBirth : '',
      dateOfBirth: !isCreateMode && user ? user.profile.dateOfBirth : '',
      gender: !isCreateMode && user ? user.profile.gender : undefined,
    },
  };

  const form = useForm<CreateUserInput | UpdateUserInput>({
    resolver: zodResolver(isCreateMode ? CreateUserSchema : UpdateUserSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: defaultValues as CreateUserInput | UpdateUserInput,
  });

  function onSubmit(input: CreateUserInput | UpdateUserInput) {
    startTransition(async () => {
      input.profile.dateOfBirth = moment(input.profile.dateOfBirth).format('YYYY-MM-DD');
      const result = isCreateMode
        ? await createUserAction(input as CreateUserInput)
        : await updateUserAction(user!.id, input);
      if (!result.success) {
        toast.error(result.error ?? 'Something went wrong.');
        return;
      }
      toast.success(isCreateMode ? 'Create new user successfully!' : 'Update user successfully');
      form.reset();
      onClose();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
      <DialogHeader className="px-6 py-4 border-b shrink-0">
        <DialogTitle>{isCreateMode ? 'Add New User' : 'Edit User'}</DialogTitle>
      </DialogHeader>
      <div className="overflow-y-auto flex-1 px-6 py-4">
        <UserFormFields form={form} roles={roles} isEditMode={false} isPending={isPending} />
      </div>
      <DialogFooter className="mx-0 mb-0 px-6 py-4 border-t shrink-0">
        <Button type="submit" disabled={isPending}>
          Save changes
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

interface UserFormFieldsProps {
  form: UseFormReturn<CreateUserInput | UpdateUserInput>;
  roles: RoleOption[];
  isEditMode: boolean;
  isPending: boolean;
}
function UserFormFields(props: UserFormFieldsProps) {
  const { form, roles, isEditMode, isPending } = props;
  return (
    <FieldGroup>
      <Controller
        name="profile.fullName"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="profile.fullName">Full Name</FieldLabel>
            <Input
              {...field}
              id="profile.fullName"
              aria-invalid={fieldState.invalid}
              placeholder="Full Name"
              disabled={isPending}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="username"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              {...field}
              id="username"
              aria-invalid={fieldState.invalid}
              placeholder="Username"
              disabled={isPending}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput
                {...field}
                id="password"
                aria-invalid={fieldState.invalid}
                placeholder={isEditMode ? 'Leave blank to keep current' : 'Password'}
                autoComplete="off"
                disabled={isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
              <PasswordInput
                {...field}
                id="confirmPassword"
                aria-invalid={fieldState.invalid}
                placeholder="Confirm Password"
                autoComplete="off"
                disabled={isPending}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <Field>
        <FieldLabel htmlFor="profile.placeOfBirth">Birth</FieldLabel>
        <div className="flex w-full gap-2">
          <Controller
            name="profile.placeOfBirth"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="flex-1">
                <Input
                  {...field}
                  id="profile.placeOfBirth"
                  placeholder="Place of birth"
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                />
                {fieldState.invalid && <FieldError className="mt-2" errors={[fieldState.error]} />}
              </div>
            )}
          />
          <Controller
            name="profile.dateOfBirth"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="flex-1">
                <Input
                  {...field}
                  type="date"
                  value={field.value ? formatDate(new Date(field.value)) : ''}
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                />
                {fieldState.invalid && <FieldError className="mt-2" errors={[fieldState.error]} />}
              </div>
            )}
          />
        </div>
      </Field>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Controller
          name="profile.gender"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="profile.gender">Gender</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                <SelectTrigger
                  id="profile.gender"
                  aria-invalid={fieldState.invalid}
                  className="w-full"
                >
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent position="item-aligned">
                  {GENDER_VALUES.map((value) => (
                    <SelectItem key={value} value={value} className="capitalize">
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="roleId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="roleId">Role</FieldLabel>
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={(v) => field.onChange(Number(v))}
                disabled={isPending}
              >
                <SelectTrigger id="roleId" aria-invalid={fieldState.invalid} className="w-full">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent position="item-aligned">
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
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
