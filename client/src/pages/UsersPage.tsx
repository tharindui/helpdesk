import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type User, extractError } from "./usersApi";
import { useUsers } from "./useUsers";
import { AddUserDialog, EditUserDialog, DeleteUserDialog, RoleBadge } from "./UserDialogs";

export default function UsersPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const { query, addMutation, editMutation, deleteMutation } = useUsers();
  const { data: users = [], isPending, isError } = query;

  if (isPending) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Name", "Email", "Role", "Joined", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className={i < 4 ? "border-b border-border" : ""}>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-44" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                  <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
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
        onSubmit={(data) => addMutation.mutate(data, { onSuccess: () => setAddOpen(false) })}
        isSubmitting={addMutation.isPending}
        error={addMutation.isError ? extractError(addMutation.error) : null}
        onClose={() => { setAddOpen(false); addMutation.reset(); }}
      />

      <EditUserDialog
        user={editUser}
        onOpenChange={(open) => { if (!open) { setEditUser(null); editMutation.reset(); } }}
        onSubmit={(data) => editUser && editMutation.mutate(
          { id: editUser.id, data },
          { onSuccess: () => setEditUser(null) }
        )}
        isSubmitting={editMutation.isPending}
        error={editMutation.isError ? extractError(editMutation.error) : null}
      />

      <DeleteUserDialog
        user={deleteUser}
        onOpenChange={(open) => { if (!open) { setDeleteUser(null); deleteMutation.reset(); } }}
        onConfirm={() => deleteUser && deleteMutation.mutate(
          deleteUser.id,
          { onSuccess: () => setDeleteUser(null) }
        )}
        isDeleting={deleteMutation.isPending}
        error={deleteMutation.isError ? extractError(deleteMutation.error) : null}
      />
    </div>
  );
}
