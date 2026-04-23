import { useState, type ChangeEvent } from "react";
import { useAdminListRooms, getAdminListRoomsQueryKey, useAdminCreateRoom, useAdminUpdateRoom, getListRoomsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Settings2, ImagePlus } from "lucide-react";
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
  featuresString: z.string().min(1, "At least one feature required (comma separated)"),
});

export default function AdminRooms() {
  const { data: rooms = [], isLoading } = useAdminListRooms({ query: { queryKey: getAdminListRoomsQueryKey() } });
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createRoom = useAdminCreateRoom();
  const updateRoom = useAdminUpdateRoom();

  const form = useForm<z.infer<typeof roomSchema>>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: "", description: "", price: 0, capacity: 1, totalUnits: 1, featuresString: ""
    },
  });

  const handleOpenNew = () => {
    setEditingRoom(null);
    setImageFile(null);
    setImagePreview("");
    form.reset({ name: "", description: "", price: 0, capacity: 1, totalUnits: 1, featuresString: "" });
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
      featuresString: room.features.join(", "),
    });
    setImageFile(null);
    setImagePreview(room.imageUrl || "");
    setIsDialogOpen(true);
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setImageFile(selected);
    if (selected) {
      const objectUrl = URL.createObjectURL(selected);
      setImagePreview(objectUrl);
      return;
    }
    setImagePreview(editingRoom?.imageUrl || "");
  };

  const uploadImageIfNeeded = async (): Promise<string> => {
    if (!imageFile) return editingRoom?.imageUrl || "";

    const formData = new FormData();
    formData.append("image", imageFile);

    setIsUploadingImage(true);
    try {
      const response = await fetch("/api/admin/uploads/room-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }
      return data.url;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof roomSchema>) => {
    const payload = {
      name: data.name,
      description: data.description,
      price: data.price,
      capacity: data.capacity,
      totalUnits: data.totalUnits,
      imageUrl: await uploadImageIfNeeded(),
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
          <h1 className="text-3xl font-serif font-bold tracking-tight text-neutral-900">Rooms</h1>
          <p className="text-neutral-600">Manage hotel accommodations and inventory.</p>
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
            <Card key={room.id} className="overflow-hidden flex flex-col border-primary/20 bg-white shadow-sm">
              <div className="h-44 bg-neutral-100 relative">
                {room.imageUrl ? (
                  <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <Settings2 className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/80 backdrop-blur text-white hover:bg-black" onClick={() => handleOpenEdit(room)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif text-xl font-bold text-neutral-900 truncate pr-2">{room.name}</h3>
                  <div className="text-primary font-bold">₱{room.price.toLocaleString()}</div>
                </div>
                <p className="text-sm text-neutral-600 line-clamp-2 mb-4 flex-1">
                  {room.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm mt-auto pt-4 border-t border-primary/15">
                  <div>
                    <span className="text-neutral-500 block">Capacity</span>
                    <span className="text-neutral-900 font-medium">{room.capacity} Guests</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Inventory</span>
                    <span className="text-neutral-900 font-medium">{room.totalUnits} Units</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white text-neutral-900 border-primary/25 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                      <FormLabel className="text-neutral-700 font-semibold">Room Name</FormLabel>
                      <FormControl>
                        <Input className="bg-white border-neutral-300 text-neutral-900" {...field} />
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
                      <FormLabel className="text-neutral-700 font-semibold">Price per Night (₱)</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-white border-neutral-300 text-neutral-900" {...field} />
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
                    <FormLabel className="text-neutral-700 font-semibold">Description</FormLabel>
                    <FormControl>
                      <Textarea className="bg-white border-neutral-300 text-neutral-900 resize-none" rows={3} {...field} />
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
                      <FormLabel className="text-neutral-700 font-semibold">Max Guests</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-white border-neutral-300 text-neutral-900" {...field} />
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
                      <FormLabel className="text-neutral-700 font-semibold">Total Units Available</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-white border-neutral-300 text-neutral-900" {...field} />
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
                    <FormLabel className="text-neutral-700 font-semibold">Features (Comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ocean view, King bed, Mini bar..." className="bg-white border-neutral-300 text-neutral-900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-700">
                  Room Image (Upload from device)
                </label>
                <div className="rounded-lg border border-dashed border-primary/40 p-4 bg-primary/5">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
                    <ImagePlus className="h-4 w-4 text-primary" />
                    <span>Choose image file</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  </label>
                  <p className="mt-2 text-xs text-neutral-500">PNG, JPG, WEBP up to 5MB.</p>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Selected room preview"
                      className="mt-3 h-40 w-full rounded-md border border-primary/20 object-cover"
                    />
                  ) : null}
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-primary/20 mt-6">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-neutral-700 hover:bg-primary/10">
                  Cancel
                </Button>
                <Button type="submit" disabled={createRoom.isPending || updateRoom.isPending || isUploadingImage} className="bg-primary text-primary-foreground hover:bg-primary/90">
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
