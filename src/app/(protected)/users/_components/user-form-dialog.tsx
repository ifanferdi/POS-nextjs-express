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
import { Gender, User } from '@/domain';
import { createUserAction } from '@/features/users/actions/create-user.action';
import { updateUserAction } from '@/features/users/actions/update-user.action';
import {
  CreateUserInput,
  CreateUserSchema,
  UpdateUserInput,
  UpdateUserSchema,
} from '@/features/users/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface UserFormDialogProps {
  mode: 'create' | 'edit';
  user?: User;
}

const gender = [
  { label: 'Male', value: Gender.MALE },
  { label: 'Female', value: Gender.FEMALE },
];

export function UserFormDialog({ mode, user }: UserFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const isEditMode = mode === 'edit';

  const form = useForm<CreateUserInput | UpdateUserInput>({
    resolver: zodResolver(isEditMode ? UpdateUserSchema : CreateUserSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      username: isEditMode ? user?.username : undefined,
      password: undefined,
      confirmPassword: undefined,
      isActive: isEditMode ? (user?.isActive ?? true) : true,
      roleId: isEditMode ? user?.roleId : undefined,
      fullName: isEditMode ? user?.profile.fullName : undefined,
      placeOfBirth: isEditMode ? user?.profile.placeOfBirth : undefined,
      dateOfBirth: isEditMode ? user?.profile.dateOfBirth : undefined,
      gender: isEditMode ? user?.profile.gender : undefined,
    },
  });

  function onSubmit(input: CreateUserInput | UpdateUserInput) {
    startTransition(async function () {
      const result =
        isEditMode && user
          ? await updateUserAction(user.id, input)
          : await createUserAction(input as CreateUserInput);

      if (!result.success) {
        toast.error(result.error ?? 'Something went wrong.');
        return;
      }

      toast.success(isEditMode ? 'Update user successfully!' : 'Create new user successfully!');
      form.reset();
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={isEditMode ? 'outline' : 'default'}>
          {isEditMode ? 'Edit' : 'Add New User'}
        </Button>
      </DialogTrigger>
      <DialogContent className="md:max-w-lg">
        <form id="form-use" onSubmit={form.handleSubmit(onSubmit)} className={'space-y-4'}>
          <DialogHeader>
            <DialogTitle> {isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Controller
              name="fullName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                  <Input
                    {...field}
                    id="fullName"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="Password"
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
                    <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                    <Input
                      {...field}
                      id="confirm-password"
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
              <FieldLabel htmlFor="placeOfBirth">Birth</FieldLabel>
              <div className="flex gap-2 w-full">
                <Controller
                  name="placeOfBirth"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div className="flex-1">
                      <Input
                        {...field}
                        id="placeOfBirth"
                        placeholder="Place of birth"
                        aria-invalid={fieldState.invalid}
                        disabled={isPending}
                      />
                      {fieldState.invalid && (
                        <FieldError className="mt-2" errors={[fieldState.error]} />
                      )}
                    </div>
                  )}
                />
                <Controller
                  name="dateOfBirth"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div className="flex-1">
                      <Input
                        {...field}
                        type="date"
                        aria-invalid={fieldState.invalid}
                        disabled={isPending}
                      />
                      {fieldState.invalid && (
                        <FieldError className="mt-2" errors={[fieldState.error]} />
                      )}
                    </div>
                  )}
                />
              </div>
            </Field>
            <Controller
              name="gender"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="gender">Gender</FieldLabel>
                  <Select {...field}>
                    <SelectTrigger
                      id="gender"
                      aria-invalid={fieldState.invalid}
                      className="min-w-30"
                      disabled={isPending}
                    >
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      {gender.map((gender) => (
                        <SelectItem key={gender.value} value={gender.value}>
                          {gender.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              Save changes
            </Button>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isPending}
              >
                Reset
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
