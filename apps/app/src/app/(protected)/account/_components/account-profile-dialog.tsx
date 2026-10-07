'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { GENDER_VALUES } from '@/domain';
import { updateMyAccountAction } from '@/features/account/action';
import { AccountProfileInput, AccountProfileSchema } from '@/features/account/schema';
import { MeResponseDto } from '@/features/auth/dto';
import { getInitials } from '@/lib/helper';
import { uploadImageToS3 } from '@/lib/upload';
import { zodResolver } from '@hookform/resolvers/zod';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useState, useTransition } from 'react';
import { Controller, DefaultValues, useForm } from 'react-hook-form';
import { toast } from 'sonner';

export function AccountProfileDialog({ me }: { me: MeResponseDto }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const defaultValues: DefaultValues<AccountProfileInput> = {
    username: me.username,
    profile: {
      fullName: me.profile?.fullName ?? '',
      placeOfBirth: me.profile?.placeOfBirth ?? '',
      dateOfBirth: me.profile?.dateOfBirth
        ? moment(me.profile.dateOfBirth).format('YYYY-MM-DD')
        : '',
      gender: me.profile?.gender,
      imagePath: me.profile?.imagePath ?? undefined,
    },
  };

  const form = useForm<AccountProfileInput>({
    resolver: zodResolver(AccountProfileSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues,
  });

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function onSubmit(input: AccountProfileInput) {
    startTransition(async () => {
      try {
        const imagePath = imageFile
          ? await uploadImageToS3(imageFile, 'profiles')
          : input.profile.imagePath;

        const result = await updateMyAccountAction({
          ...input,
          profile: { ...input.profile, imagePath },
        });

        if (!result.success) {
          toast.error(result.error ?? 'Failed to update account.');
          return;
        }

        toast.success('Account updated successfully.');
        setOpen(false);
        setImageFile(null);
        setPreview(null);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to upload image.');
      }
    });
  }

  function onInvalid() {
    toast.error('Please check the form fields for errors.');
  }

  const avatarSrc = preview ?? me.profile?.imageUrl ?? undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setImageFile(null);
          setPreview(null);
          form.reset(defaultValues);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="lg:max-w-xl max-h-[calc(100vh-4rem)] flex flex-col p-0 gap-0">
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="flex flex-col flex-1 min-h-0"
        >
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="avatar">Profile Photo</FieldLabel>
                <div className="flex items-center gap-4">
                  <Avatar size="lg" className="size-16">
                    {avatarSrc && <AvatarImage src={avatarSrc} alt={me.username} />}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(me.profile?.fullName ?? me.username)}
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleFileChange}
                    disabled={isPending}
                    className="max-w-64"
                  />
                </div>
              </Field>

              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input {...field} id="username" disabled={isPending} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="profile.fullName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                    <Input {...field} id="fullName" placeholder="Full Name" disabled={isPending} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Controller
                  name="profile.placeOfBirth"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="placeOfBirth">Place of Birth</FieldLabel>
                      <Input
                        {...field}
                        id="placeOfBirth"
                        placeholder="Place of birth"
                        disabled={isPending}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name="profile.dateOfBirth"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="dateOfBirth">Date of Birth</FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        id="dateOfBirth"
                        type="date"
                        disabled={isPending}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="profile.gender"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="gender">Gender</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                      <SelectTrigger id="gender" className="w-full">
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
            </FieldGroup>
          </div>
          <DialogFooter className="mx-0 mb-0 px-6 py-4 border-t shrink-0">
            <Button type="submit" disabled={isPending}>
              Save changes
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
