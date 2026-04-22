import { useAdminListUsers, getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, User } from "lucide-react";

export default function AdminUsers() {
  const { data: users = [], isLoading } = useAdminListUsers({ query: { queryKey: getAdminListUsersQueryKey() } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-sidebar-foreground">Users</h1>
        <p className="text-sidebar-foreground/60">View all registered guest and admin accounts.</p>
      </div>

      <Card className="bg-sidebar border-sidebar-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-sidebar-border hover:bg-transparent">
                  <TableHead className="text-sidebar-foreground/70">Name</TableHead>
                  <TableHead className="text-sidebar-foreground/70">Contact</TableHead>
                  <TableHead className="text-sidebar-foreground/70">Role</TableHead>
                  <TableHead className="text-right text-sidebar-foreground/70">Bookings</TableHead>
                  <TableHead className="text-right text-sidebar-foreground/70">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sidebar-foreground/50">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sidebar-foreground/50">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="border-sidebar-border hover:bg-sidebar-accent/50">
                      <TableCell>
                        <div className="font-medium text-sidebar-foreground">{user.fullName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-sidebar-foreground">{user.email}</div>
                        <div className="text-xs text-sidebar-foreground/60">{user.contactNumber}</div>
                      </TableCell>
                      <TableCell>
                        {user.role === "admin" ? (
                          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 gap-1">
                            <Shield className="w-3 h-3" /> Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-sidebar-accent text-sidebar-foreground/80 border-sidebar-border gap-1">
                            <User className="w-3 h-3" /> Guest
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-sidebar-foreground">{user.bookingCount}</span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-sidebar-foreground/70">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
