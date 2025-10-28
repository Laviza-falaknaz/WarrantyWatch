import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import PoolCoverageCard from "@/components/PoolCoverageCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function PoolGroups() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedProcessor, setSelectedProcessor] = useState("");
  const [selectedRam, setSelectedRam] = useState("");
  const { toast } = useToast();

  const { data: poolGroups, isLoading: poolGroupsLoading } = useQuery({
    queryKey: ["/api/pool-groups"],
  });

  const { data: filterOptions } = useQuery({
    queryKey: ["/api/filters"],
  });

  const { data: inventoryWithWarranty } = useQuery({
    queryKey: ["/api/inventory-with-warranty"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/pool-groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pool-groups"] });
      toast({
        title: "Success",
        description: "Pool group created successfully",
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create pool group",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setGroupName("");
    setDescription("");
    setSelectedMake("");
    setSelectedModel("");
    setSelectedProcessor("");
    setSelectedRam("");
  };

  const handleCreateGroup = () => {
    const filterCriteria = {
      make: selectedMake || undefined,
      model: selectedModel || undefined,
      processor: selectedProcessor || undefined,
      ram: selectedRam || undefined,
    };

    createMutation.mutate({
      name: groupName,
      description: description || null,
      filterCriteria: JSON.stringify(filterCriteria),
    });
  };

  // Calculate pool coverage stats
  const poolCoverageStats = poolGroups?.map((group: any) => {
    try {
      const criteria = JSON.parse(group.filterCriteria || "{}");
      
      // Filter inventory based on criteria
      const matchingInventory = inventoryWithWarranty?.filter((item: any) => {
        let matches = true;
        if (criteria.make && item.make !== criteria.make) matches = false;
        if (criteria.model && item.model !== criteria.model) matches = false;
        if (criteria.processor && item.processor !== criteria.processor) matches = false;
        if (criteria.ram && item.ram !== criteria.ram) matches = false;
        return matches && item.warranty?.isActive;
      }) || [];

      // Count items in pool (not sold)
      const poolItems = matchingInventory.filter((item: any) => !item.soldOrder);
      
      const coverage = matchingInventory.length > 0 
        ? (poolItems.length / matchingInventory.length) * 100 
        : 0;

      return {
        ...group,
        inventoryRequired: matchingInventory.length,
        poolUnits: poolItems.length,
        coverage,
        specifications: [
          criteria.make,
          criteria.model,
          criteria.processor,
          criteria.ram,
        ].filter(Boolean),
      };
    } catch {
      return null;
    }
  }).filter(Boolean) || [];

  if (poolGroupsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Pool Groups</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Organize and manage warranty pool groups by specifications
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pool Groups</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize and manage warranty pool groups by specifications
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-pool-group">
              <Plus className="h-4 w-4 mr-2" />
              Create Pool Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Pool Group</DialogTitle>
              <DialogDescription>
                Define a pool group based on laptop specifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  placeholder="e.g., HP EliteBook Series"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  data-testid="input-group-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this pool group..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-description"
                />
              </div>
              <div className="space-y-2">
                <Label>Make</Label>
                <Select value={selectedMake} onValueChange={setSelectedMake}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent>
                    {(filterOptions?.makes || []).map((make: string) => (
                      <SelectItem key={make} value={make}>
                        {make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Model (Optional)</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {(filterOptions?.models || []).map((model: string) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Processor (Optional)</Label>
                <Select value={selectedProcessor} onValueChange={setSelectedProcessor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select processor" />
                  </SelectTrigger>
                  <SelectContent>
                    {(filterOptions?.processors || []).map((processor: string) => (
                      <SelectItem key={processor} value={processor}>
                        {processor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>RAM (Optional)</Label>
                <Select value={selectedRam} onValueChange={setSelectedRam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select RAM" />
                  </SelectTrigger>
                  <SelectContent>
                    {(filterOptions?.rams || []).map((ram: string) => (
                      <SelectItem key={ram} value={ram}>
                        {ram}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={!groupName || !selectedMake || createMutation.isPending}
                data-testid="button-confirm-create"
              >
                {createMutation.isPending ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover-elevate border-dashed cursor-pointer" data-testid="card-create-new" onClick={() => setDialogOpen(true)}>
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] p-6">
            <Plus className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">Create New Group</h3>
            <p className="text-sm text-muted-foreground text-center">
              Define a custom pool group
            </p>
          </CardContent>
        </Card>

        {poolCoverageStats.map((group: any) => (
          <PoolCoverageCard
            key={group.id}
            groupName={group.name}
            specifications={group.specifications}
            inventoryRequired={group.inventoryRequired}
            poolUnits={group.poolUnits}
            coveragePercentage={group.coverage}
            onExpand={() => console.log(`Expand pool: ${group.name}`)}
          />
        ))}
      </div>
    </div>
  );
}
