import { useState, useEffect, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
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
import api from "@/lib/axios";

type Role = "admin" | "agent";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

const addSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "agent"]),
});

const editSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["admin", "agent"]),
});

type AddFormData = z.infer<typeof addSchema>;
type EditFormData = z.infer<typeof editSchema>;

// ─── API ──────────────────────────────────────────────────────────────────────

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) return err.response?.data?.error ?? "Request failed";
  return "Request failed";
}

const usersApi = {
  list: () => api.get<User[]>("/api/users").then((r) => r.data),
  create: (data: AddFormData) => api.post<User>("/api/users", data).then((r) => r.data),
  update: ({ id, data }: { id: string; data: EditFormData }) =>
    api.patch<User>(`/api/users/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/api/users/${id}`),
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const { data: users = [], isPending, isError } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
  });

  const addMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: (user) => {
      queryClient.setQueryData<User[]>(["users"], (prev = []) => [...prev, user]);
      setAddOpen(false);
    },
  });

  const editMutation = useMutation({
    mutationFn: usersApi.update,
    onSuccess: (updated) => {
      queryClient.setQueryData<User[]>(["users"], (prev = []) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
      setEditUser(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: (_, id) => {
      queryClient.setQueryData<User[]>(["users"], (prev = []) =>
        prev.filter((u) => u.id !== id)
      );
      setDeleteUser(null);
    },
  });

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} {users.length === 1 ? "user" : "users"}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>Add User</Button>
      </div>

      {isError && (
        <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
          Something went wrong. Please try again.
        </div>
      )}

      {!isError && users.length === 0 ? (
        <div className="rounded-lg border border-border bg-background py-12 text-center">
          <p className="text-sm text-muted-foreground">No users found.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className={i < users.length - 1 ? "border-b border-border" : ""}
                >
                  <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditUser(user)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteUser(user)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddUserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={(data) => addMutation.mutate(data)}
        isSubmitting={addMutation.isPending}
        error={addMutation.isError ? extractError(addMutation.error) : null}
        onClose={() => { setAddOpen(false); addMutation.reset(); }}
      />

      <EditUserDialog
        user={editUser}
        onOpenChange={(open) => { if (!open) { setEditUser(null); editMutation.reset(); } }}
        onSubmit={(data) => editUser && editMutation.mutate({ id: editUser.id, data })}
        isSubmitting={editMutation.isPending}
        error={editMutation.isError ? extractError(editMutation.error) : null}
      />

      <DeleteUserDialog
        user={deleteUser}
        onOpenChange={(open) => { if (!open) { setDeleteUser(null); deleteMutation.reset(); } }}
        onConfirm={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
        isDeleting={deleteMutation.isPending}
        error={deleteMutation.isError ? extractError(deleteMutation.error) : null}
      />
    </div>
  );
}

// ─── Add User Dialog ──────────────────────────────────────────────────────────

function AddUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  error,
  onClose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddFormData) => void;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddFormData>({
    resolver: zodResolver(addSchema),
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

function EditUserDialog({
  user,
  onOpenChange,
  onSubmit,
  isSubmitting,
  error,
}: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EditFormData) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
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

function DeleteUserDialog({
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

// ─── Shared Components ────────────────────────────────────────────────────────

const RoleSelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
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

function RoleBadge({ role }: { role: Role }) {
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
