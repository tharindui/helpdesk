import { useEffect, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserSchema,
  editUserSchema,
  Role,
  type CreateUserData,
  type EditUserData,
} from "@helpdesk/core";
import { AlertMessage } from "@/components/AlertMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { type User } from "./usersApi";

export type { User };

export type DialogState =
  | { mode: "add" }
  | { mode: "edit"; user: User }
  | { mode: "delete"; user: User }
  | null;

// ─── Single Dialog ────────────────────────────────────────────────────────────

export function UserDialog({
  state,
  onClose,
  onAdd,
  onEdit,
  onDelete,
  isSubmitting,
  error,
}: {
  state: DialogState;
  onClose: () => void;
  onAdd: (data: CreateUserData) => void;
  onEdit: (data: EditUserData) => void;
  onDelete: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  return (
    <Dialog open={!!state} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        {state?.mode === "add" && (
          <AddForm onSubmit={onAdd} onClose={onClose} isSubmitting={isSubmitting} error={error} />
        )}
        {state?.mode === "edit" && (
          <EditForm user={state.user} onSubmit={onEdit} onClose={onClose} isSubmitting={isSubmitting} error={error} />
        )}
        {state?.mode === "delete" && (
          <DeleteConfirm user={state.user} onConfirm={onDelete} onClose={onClose} isDeleting={isSubmitting} error={error} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Form ─────────────────────────────────────────────────────────────────

function AddForm({
  onSubmit,
  onClose,
  isSubmitting,
  error,
}: {
  onSubmit: (data: CreateUserData) => void;
  onClose: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add User</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
        {error && <AlertMessage message={error} />}

        <Field label="Name" htmlFor="add-name" error={errors.name?.message}>
          <Input id="add-name" {...register("name")} aria-invalid={!!errors.name} />
        </Field>

        <Field label="Email" htmlFor="add-email" error={errors.email?.message}>
          <Input id="add-email" type="email" {...register("email")} aria-invalid={!!errors.email} />
        </Field>

        <Field label="Password" htmlFor="add-password" error={errors.password?.message}>
          <Input id="add-password" type="password" {...register("password")} aria-invalid={!!errors.password} />
        </Field>

        <Field label="Role" htmlFor="add-role">
          <RoleSelect id="add-role" {...register("role")} />
        </Field>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create User"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditForm({
  user,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}: {
  user: User;
  onSubmit: (data: EditUserData) => void;
  onClose: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditUserData>({
    resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    reset({ name: user.name, email: user.email, role: user.role });
  }, [user, reset]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
        {error && <AlertMessage message={error} />}

        <Field label="Name" htmlFor="edit-name" error={errors.name?.message}>
          <Input id="edit-name" {...register("name")} aria-invalid={!!errors.name} />
        </Field>

        <Field label="Email" htmlFor="edit-email" error={errors.email?.message}>
          <Input id="edit-email" type="email" {...register("email")} aria-invalid={!!errors.email} />
        </Field>

        <Field label="Role" htmlFor="edit-role">
          <RoleSelect id="edit-role" {...register("role")} />
        </Field>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  user,
  onConfirm,
  onClose,
  isDeleting,
  error,
}: {
  user: User;
  onConfirm: () => void;
  onClose: () => void;
  isDeleting: boolean;
  error: string | null;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Delete User</DialogTitle>
      </DialogHeader>

      <div className="py-2 space-y-4">
        {error && <AlertMessage message={error} />}
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">{user.name}</span>? This
          action cannot be undone.
        </p>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={isDeleting}>Cancel</Button>
        <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? "Deleting…" : "Delete"}
        </Button>
      </DialogFooter>
    </>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────


function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export const RoleSelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={`h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
      {...props}
    >
      <option value={Role.agent}>Agent</option>
      <option value={Role.admin}>Admin</option>
    </select>
  )
);
RoleSelect.displayName = "RoleSelect";

export function RoleBadge({ role }: { role: Role }) {
  if (role === Role.admin) {
    return (
      <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      Agent
    </span>
  );
}
