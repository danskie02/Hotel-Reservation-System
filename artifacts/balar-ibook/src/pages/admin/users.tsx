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
        <h1 className="text-3xl font-serif font-bold tracking-tight text-neutral-900">Users</h1>
        <p className="text-neutral-600">View all registered guest and admin accounts.</p>
      </div>

      <Card className="border-primary/20 bg-white shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-neutral-200 hover:bg-neutral-100">
                  <TableHead className="text-neutral-700 font-semibold py-4 px-6">Name</TableHead>
                  <TableHead className="text-neutral-700 font-semibold py-4 px-6 flex-1">Contact</TableHead>
                  <TableHead className="text-neutral-700 font-semibold py-4 px-6">Role</TableHead>
                  <TableHead className="text-right text-neutral-700 font-semibold py-4 px-6">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-neutral-500">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-neutral-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, index) => (
                    <TableRow key={user.id} className={`border-neutral-100 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'} hover:bg-primary/5`}>
                      <TableCell className="py-4 px-6">
                        <div className="font-medium text-neutral-900">{user.fullName}</div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="text-sm text-neutral-900">{user.email}</div>
                        <div className="text-xs text-neutral-600">{user.contactNumber}</div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        {user.role === "admin" ? (
                          <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary font-medium">
                            <Shield className="w-3 h-3" /> Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 border-neutral-300 bg-neutral-100 text-neutral-700 font-medium">
                            <User className="w-3 h-3" /> Guest
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-neutral-600 py-4 px-6">
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
