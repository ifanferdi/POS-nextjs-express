'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Gender, Role, User } from '@/domain';
import { createUserAction, updateUserAction } from '@/features/users/action';
import {
  CreateUserInput,
  CreateUserSchema,
  UpdateUserInput,
  UpdateUserSchema,
} from '@/features/users/schema';
import { formatDate } from '@/lib/helper';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { Controller, UseFormReturn, useForm } from 'react-hook-form';
import { toast } from 'sonner';

type UserWithoutPermissions = Omit<User, 'permissions'>;

type RoleOption = Pick<Role, 'id' | 'name'>;

const genderOptions = [
  { label: 'Male', value: Gender.MALE },
  { label: 'Female', value: Gender.FEMALE },
];

const activeOptions = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

function UserFormFields({
  form,
  roles,
  isEditMode,
  isPending,
}: {
  // ponytail: union UseFormReturn breaks on password required vs optional;
  // type safety is enforced at each form's useForm<CreateUserInput | UpdateUserInput>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  roles: RoleOption[];
  isEditMode: boolean;
  isPending: boolean;
}) {
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
              <Input
                {...field}
                id="password"
                type="password"
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
              <Input
                {...field}
                id="confirmPassword"
                type="password"
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
                  value={field.value ? formatDate(field.value) : ''}
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
                  {genderOptions.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
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
                {activeOptions.map((o) => (
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

function CreateUserForm({ roles, onClose }: { roles: RoleOption[]; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      profile: {
        fullName: '',
        placeOfBirth: '',
        dateOfBirth: '',
        gender: undefined,
      },
      username: '',
      password: '',
      confirmPassword: '',
      isActive: true,
      roleId: undefined,
    },
  });

  function onSubmit(input: CreateUserInput) {
    startTransition(async () => {
      const result = await createUserAction(input);
      if (!result.success) {
        toast.error(result.error ?? 'Something went wrong.');
        return;
      }
      toast.success('Create new user successfully!');
      form.reset();
      onClose();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Add New User</DialogTitle>
      </DialogHeader>
      <UserFormFields form={form} roles={roles} isEditMode={false} isPending={isPending} />
      <DialogFooter>
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

function EditUserForm({
  user,
  roles,
  onClose,
}: {
  user: UserWithoutPermissions;
  roles: RoleOption[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(UpdateUserSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      profile: {
        fullName: user.profile.fullName,
        placeOfBirth: user.profile.placeOfBirth,
        dateOfBirth: formatDate(new Date(user.profile.dateOfBirth)),
        gender: user.profile.gender,
      },
      username: user.username,
      password: undefined,
      confirmPassword: undefined,
      isActive: user.isActive,
      roleId: user.roleId,
    },
  });

  function onSubmit(input: UpdateUserInput) {
    startTransition(async () => {
      const result = await updateUserAction(user.id, input);
      if (!result.success) {
        toast.error(result.error ?? 'Something went wrong.');
        return;
      }
      toast.success('Update user successfully!');
      form.reset();
      onClose();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
      </DialogHeader>
      <UserFormFields form={form} roles={roles} isEditMode={true} isPending={isPending} />
      <DialogFooter>
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

interface UserFormDialogProps {
  mode: 'create' | 'edit';
  user?: UserWithoutPermissions;
  roles: RoleOption[];
  // Controlled mode (optional) — saat dipakai dari dropdown item, parent yang kontrol open state.
  // Tanpa props ini, komponen render trigger button sendiri (untuk header "Add New User").
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UserFormDialog({
  mode,
  user,
  roles,
  open: controlledOpen,
  onOpenChange,
}: UserFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  const isEditMode = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="default" className="h-10 px-3">
            Add New User
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="md:max-w-lg">
        {isEditMode && user ? (
          <EditUserForm user={user} roles={roles} onClose={() => setOpen(false)} />
        ) : (
          <CreateUserForm roles={roles} onClose={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
