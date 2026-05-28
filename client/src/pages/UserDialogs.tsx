import { useEffect, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserSchema,
  editUserSchema,
  type CreateUserData,
  type EditUserData,
} from "@helpdesk/core";
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
import { type Role, type User } from "./usersApi";

export type { Role, User };

// ─── Add User Dialog ──────────────────────────────────────────────────────────

export function AddUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  error,
  onClose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserData) => void;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => { onSubmit(data); reset(); })} className="space-y-4 py-2">
          {error && (
            <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="add-name">Name</Label>
            <Input id="add-name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="add-email">Email</Label>
            <Input id="add-email" type="email" {...register("email")} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="add-password">Password</Label>
            <Input id="add-password" type="password" {...register("password")} aria-invalid={!!errors.password} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="add-role">Role</Label>
            <RoleSelect id="add-role" {...register("role")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit User Dialog ─────────────────────────────────────────────────────────

export function EditUserDialog({
  user,
  onOpenChange,
  onSubmit,
  isSubmitting,
  error,
}: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EditUserData) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditUserData>({
    resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    if (user) reset({ name: user.name, email: user.email, role: user.role });
  }, [user, reset]);

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {error && (
            <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" {...register("email")} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-role">Role</Label>
            <RoleSelect id="edit-role" {...register("role")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete User Dialog ───────────────────────────────────────────────────────

export function DeleteUserDialog({
  user,
  onOpenChange,
  onConfirm,
  isDeleting,
  error,
}: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
  error: string | null;
}) {
  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {error && (
            <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{user?.name}</span>? This
            action cannot be undone.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

export const RoleSelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={`h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
      {...props}
    >
      <option value="agent">Agent</option>
      <option value="admin">Admin</option>
    </select>
  )
);
RoleSelect.displayName = "RoleSelect";

export function RoleBadge({ role }: { role: Role }) {
  if (role === "admin") {
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
