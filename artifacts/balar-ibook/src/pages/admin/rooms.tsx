import { useState } from "react";
import { useAdminListRooms, getAdminListRoomsQueryKey, useAdminCreateRoom, useAdminUpdateRoom, getListRoomsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, MoreVertical, Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const roomSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  totalUnits: z.coerce.number().min(1, "Total units must be at least 1"),
  imageUrl: z.string().url("Must be a valid URL").or(z.string().length(0)),
  featuresString: z.string().min(1, "At least one feature required (comma separated)"),
});

export default function AdminRooms() {
  const { data: rooms = [], isLoading } = useAdminListRooms({ query: { queryKey: getAdminListRoomsQueryKey() } });
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createRoom = useAdminCreateRoom();
  const updateRoom = useAdminUpdateRoom();

  const form = useForm<z.infer<typeof roomSchema>>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: "", description: "", price: 0, capacity: 1, totalUnits: 1, imageUrl: "", featuresString: ""
    },
  });

  const handleOpenNew = () => {
    setEditingRoom(null);
    form.reset({ name: "", description: "", price: 0, capacity: 1, totalUnits: 1, imageUrl: "", featuresString: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (room: any) => {
    setEditingRoom(room);
    form.reset({
      name: room.name,
      description: room.description,
      price: room.price,
      capacity: room.capacity,
      totalUnits: room.totalUnits,
      imageUrl: room.imageUrl || "",
      featuresString: room.features.join(", "),
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: z.infer<typeof roomSchema>) => {
    const payload = {
      name: data.name,
      description: data.description,
      price: data.price,
      capacity: data.capacity,
      totalUnits: data.totalUnits,
      imageUrl: data.imageUrl,
      features: data.featuresString.split(",").map(f => f.trim()).filter(f => f.length > 0)
    };

    try {
      if (editingRoom) {
        await updateRoom.mutateAsync({ id: editingRoom.id, data: payload });
        toast({ description: "Room updated successfully." });
      } else {
        await createRoom.mutateAsync({ data: payload });
        toast({ description: "Room created successfully." });
      }
      queryClient.invalidateQueries({ queryKey: getAdminListRoomsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey() });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", description: error.message || "Failed to save room." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-sidebar-foreground">Rooms</h1>
          <p className="text-sidebar-foreground/60">Manage hotel accommodations and inventory.</p>
        </div>
        
        <Button onClick={handleOpenNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-sidebar animate-pulse rounded-xl border border-sidebar-border" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="bg-sidebar border-sidebar-border overflow-hidden flex flex-col">
              <div className="h-40 bg-sidebar-accent/50 relative">
                {room.imageUrl ? (
                  <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sidebar-foreground/30">
                    <Settings2 className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Button size="icon" variant="secondary" className="h-8 w-8 bg-background/80 backdrop-blur text-foreground hover:bg-background" onClick={() => handleOpenEdit(room)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif text-xl font-bold text-sidebar-foreground truncate pr-2">{room.name}</h3>
                  <div className="text-primary font-bold">₱{room.price.toLocaleString()}</div>
                </div>
                <p className="text-sm text-sidebar-foreground/60 line-clamp-2 mb-4 flex-1">
                  {room.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm mt-auto pt-4 border-t border-sidebar-border">
                  <div>
                    <span className="text-sidebar-foreground/50 block">Capacity</span>
                    <span className="text-sidebar-foreground font-medium">{room.capacity} Guests</span>
                  </div>
                  <div>
                    <span className="text-sidebar-foreground/50 block">Inventory</span>
                    <span className="text-sidebar-foreground font-medium">{room.totalUnits} Units</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-sidebar text-sidebar-foreground border-sidebar-border sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-primary">
              {editingRoom ? "Edit Room" : "Create New Room"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel className="text-sidebar-foreground/80">Room Name</FormLabel>
                      <FormControl>
                        <Input className="bg-black border-sidebar-border text-sidebar-foreground" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel className="text-sidebar-foreground/80">Price per Night (₱)</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-black border-sidebar-border text-sidebar-foreground" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sidebar-foreground/80">Description</FormLabel>
                    <FormControl>
                      <Textarea className="bg-black border-sidebar-border text-sidebar-foreground resize-none" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sidebar-foreground/80">Max Guests</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-black border-sidebar-border text-sidebar-foreground" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalUnits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sidebar-foreground/80">Total Units Available</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-black border-sidebar-border text-sidebar-foreground" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="featuresString"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sidebar-foreground/80">Features (Comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ocean view, King bed, Mini bar..." className="bg-black border-sidebar-border text-sidebar-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sidebar-foreground/80">Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." className="bg-black border-sidebar-border text-sidebar-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4 border-t border-sidebar-border mt-6">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-sidebar-foreground hover:bg-sidebar-accent">
                  Cancel
                </Button>
                <Button type="submit" disabled={createRoom.isPending || updateRoom.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {editingRoom ? "Save Changes" : "Create Room"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
