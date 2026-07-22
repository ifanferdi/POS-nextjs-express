'use client';

import { PermissionTransferList } from '@/app/(protected)/roles/_components/permission-transfer-list';
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
import { Permission } from '@/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, UseFormReturn, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const createRoleSchema = z.object({
  name: z.string().trim().min(1, 'Role name is required').max(255),
  permissionIds: z.array(z.number()).optional().default([]),
});

const updateRoleSchema = z.object({
  name: z.string().trim().min(1, 'Role name is required').max(255),
  permissionIds: z.array(z.number()).optional().default([]),
});

interface RoleFormValues {
  name: string;
  permissionIds: number[];
}

function RoleFormFields({
  form,
  permissions,
  isPending,
}: {
  form: UseFormReturn<RoleFormValues>;
  permissions: Permission[];
  isPending: boolean;
}) {
  return (
    <FieldGroup>
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="name">Role Name</FieldLabel>
            <Input
              {...field}
              id="name"
              aria-invalid={fieldState.invalid}
              placeholder="e.g. Content Manager"
              disabled={isPending}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="permissionIds"
        control={form.control}
        render={({ field }) => (
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Permissions</FieldLabel>
              <span className="text-xs text-muted-foreground">
                {(field.value ?? []).length} / {permissions.length} selected
              </span>
            </div>
            <PermissionTransferList
              permissions={permissions}
              selectedIds={field.value ?? []}
              onChange={field.onChange}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Click a permission to assign &rarr; &nbsp; &larr; hover + click &times; to remove
            </p>
          </Field>
        )}
      />
    </FieldGroup>
  );
}

function CreateRoleForm({
  permissions,
  onClose,
}: {
  permissions: Permission[];
  onClose: () => void;
}) {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(createRoleSchema) as never,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { name: '', permissionIds: [] },
  });

  function onSubmit() {
    toast.success('Role created successfully (mock).');
    form.reset();
    onClose();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Add New Role</DialogTitle>
      </DialogHeader>
      <RoleFormFields form={form} permissions={permissions} isPending={false} />
      <DialogFooter>
        <Button type="submit">Save Role</Button>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
        </DialogClose>
      </DialogFooter>
    </form>
  );
}

function EditRoleForm({
  role,
  permissions,
  onClose,
}: {
  role: { id: number; name: string; permissions?: Permission[] };
  permissions: Permission[];
  onClose: () => void;
}) {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(updateRoleSchema) as never,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      name: role.name,
      permissionIds: role.permissions?.map((p) => p.id) ?? [],
    },
  });

  function onSubmit() {
    toast.success('Role updated successfully (mock).');
    form.reset();
    onClose();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit Role</DialogTitle>
      </DialogHeader>
      <RoleFormFields form={form} permissions={permissions} isPending={false} />
      <DialogFooter>
        <Button type="submit">Save Changes</Button>
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
        </DialogClose>
      </DialogFooter>
    </form>
  );
}

interface RoleFormDialogProps {
  mode: 'create' | 'edit';
  role?: { id: number; name: string; permissions?: Permission[] };
  permissions: Permission[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function RoleFormDialog({
  mode,
  role,
  permissions,
  open: controlledOpen,
  onOpenChange,
}: RoleFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  const isEditMode = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant={isEditMode ? 'outline' : 'default'}>
            {isEditMode ? 'Edit' : 'Add New Role'}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="md:max-w-2xl">
        {isEditMode && role ? (
          <EditRoleForm role={role} permissions={permissions} onClose={() => setOpen(false)} />
        ) : (
          <CreateRoleForm permissions={permissions} onClose={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
