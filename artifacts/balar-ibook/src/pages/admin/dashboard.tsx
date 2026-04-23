import { useAdminStats, getAdminStatsQueryKey, useAdminOccupancyReport, getAdminOccupancyReportQueryKey, useAdminRecentActivity, getAdminRecentActivityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { CalendarDays, Users, BedDouble, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: stats, isLoading: isLoadingStats } = useAdminStats({ query: { queryKey: getAdminStatsQueryKey() } });
  const { data: occupancyData = [], isLoading: isLoadingOcc } = useAdminOccupancyReport({ query: { queryKey: getAdminOccupancyReportQueryKey() } });
  const { data: recentActivity = [], isLoading: isLoadingRec } = useAdminRecentActivity({ query: { queryKey: getAdminRecentActivityQueryKey() } });

  if (isLoadingStats || isLoadingOcc || isLoadingRec) {
    return <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
      </div>
      <div className="h-[400px] bg-muted rounded-xl"></div>
    </div>;
  }

  if (!stats) return null;

  const occupancyRate = stats.totalUnits > 0 ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) : 0;

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600">Overview of hotel operations and reservations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-primary/20 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-neutral-700">Total Bookings</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-neutral-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-neutral-700">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">{stats.pendingBookings}</div>
            <p className="text-xs text-neutral-500 mt-1">Require attention</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-neutral-700">Current Occupancy</CardTitle>
            <BedDouble className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{occupancyRate}%</div>
            <p className="text-xs text-neutral-500 mt-1">
              {stats.occupiedUnits} of {stats.totalUnits} units occupied
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-neutral-700">Total Guests</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalGuests}</div>
            <p className="text-xs text-neutral-500 mt-1">Registered accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 border-primary/20 bg-white">
          <CardHeader>
            <CardTitle>Room Occupancy</CardTitle>
            <CardDescription className="text-neutral-500">Current utilization across all room types.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ececec" vertical={false} />
                  <XAxis dataKey="roomName" stroke="#666" tick={{ fill: '#666' }} />
                  <YAxis stroke="#666" tick={{ fill: '#666' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', color: '#111' }}
                    itemStyle={{ color: '#111' }}
                  />
                  <Legend />
                  <Bar dataKey="occupied" name="Occupied" fill="#bfa15f" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="available" name="Available" fill="#111" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-white flex flex-col">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription className="text-neutral-500">Latest booking requests.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-6">
              {recentActivity.length === 0 ? (
                <div className="text-center text-neutral-500 py-8">No recent activity</div>
              ) : (
                recentActivity.map((booking) => (
                  <div key={booking.id} className="flex items-start gap-4 pb-4 border-b border-primary/15 last:border-0 last:pb-0">
                    <div className="mt-1">
                      {booking.status === 'pending' && <Clock className="h-5 w-5 text-yellow-500" />}
                      {booking.status === 'approved' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {booking.status === 'rejected' && <XCircle className="h-5 w-5 text-red-500" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {booking.guestName}
                      </p>
                      <p className="text-xs text-neutral-600">
                        Booked {booking.roomName} for {booking.guestCount} {booking.guestCount === 1 ? 'guest' : 'guests'}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {format(new Date(booking.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
