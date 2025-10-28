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
import { SearchableSelect } from "@/components/SearchableSelect";
import { useToast } from "@/hooks/use-toast";
import type { CoveragePoolWithStats } from "@shared/schema";

export default function PoolGroups() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [poolName, setPoolName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedProcessor, setSelectedProcessor] = useState("");
  const [selectedRam, setSelectedRam] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedOrderNumber, setSelectedOrderNumber] = useState("");
  const { toast } = useToast();

  const { data: coveragePools, isLoading: coveragePoolsLoading } = useQuery<CoveragePoolWithStats[]>({
    queryKey: ["/api/coverage-pools-with-stats"],
  });

  const { data: filterOptions } = useQuery<{
    makes: string[];
    models: string[];
    processors: string[];
    rams: string[];
    categories: string[];
    customers: string[];
    orderNumbers: string[];
  }>({
    queryKey: ["/api/filters"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/coverage-pools", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coverage-pools-with-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coverage-pools"] });
      toast({
        title: "Success",
        description: "Coverage pool created successfully",
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create coverage pool",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setPoolName("");
    setDescription("");
    setSelectedMake("");
    setSelectedModel("");
    setSelectedProcessor("");
    setSelectedRam("");
    setSelectedCustomer("");
    setSelectedOrderNumber("");
  };

  const handleCreatePool = () => {
    const filterCriteria = {
      make: selectedMake || undefined,
      model: selectedModel || undefined,
      processor: selectedProcessor || undefined,
      ram: selectedRam || undefined,
      customerName: selectedCustomer || undefined,
      orderNumber: selectedOrderNumber || undefined,
    };

    createMutation.mutate({
      name: poolName,
      description: description || null,
      filterCriteria: JSON.stringify(filterCriteria),
    });
  };

  // Transform coverage pools data for display
  const poolsWithDetails = coveragePools?.map((pool) => {
    try {
      const criteria = JSON.parse(pool.filterCriteria || "{}");
      
      return {
        ...pool,
        specifications: [
          criteria.make,
          criteria.model,
          criteria.processor,
          criteria.ram,
          criteria.customerName,
          criteria.orderNumber,
        ].filter(Boolean),
      };
    } catch {
      return null;
    }
  }).filter(Boolean) || [];

  if (coveragePoolsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Coverage Pools</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track coverage ratios showing spare units available to cover deployed units with matching specifications
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
          <h1 className="text-2xl font-semibold">Coverage Pools</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track coverage ratios showing spare units available to cover deployed units with matching specifications
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-coverage-pool">
              <Plus className="h-4 w-4 mr-2" />
              Create Coverage Pool
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Coverage Pool</DialogTitle>
              <DialogDescription>
                Define a coverage pool based on laptop specifications, customer, and order details to track spare units and coverage ratios
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pool-name">Pool Name</Label>
                <Input
                  id="pool-name"
                  placeholder="e.g., HP EliteBook Series"
                  value={poolName}
                  onChange={(e) => setPoolName(e.target.value)}
                  data-testid="input-pool-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this coverage pool..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-description"
                />
              </div>
              <div className="space-y-2">
                <Label>Make</Label>
                <SearchableSelect
                  value={selectedMake}
                  onValueChange={setSelectedMake}
                  options={filterOptions?.makes || []}
                  placeholder="Select make"
                  searchPlaceholder="Search makes..."
                />
              </div>
              <div className="space-y-2">
                <Label>Model (Optional)</Label>
                <SearchableSelect
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                  options={filterOptions?.models || []}
                  placeholder="Select model"
                  searchPlaceholder="Search models..."
                />
              </div>
              <div className="space-y-2">
                <Label>Processor (Optional)</Label>
                <SearchableSelect
                  value={selectedProcessor}
                  onValueChange={setSelectedProcessor}
                  options={filterOptions?.processors || []}
                  placeholder="Select processor"
                  searchPlaceholder="Search processors..."
                />
              </div>
              <div className="space-y-2">
                <Label>RAM (Optional)</Label>
                <SearchableSelect
                  value={selectedRam}
                  onValueChange={setSelectedRam}
                  options={filterOptions?.rams || []}
                  placeholder="Select RAM"
                  searchPlaceholder="Search RAM options..."
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Name (Optional)</Label>
                <SearchableSelect
                  value={selectedCustomer}
                  onValueChange={setSelectedCustomer}
                  options={filterOptions?.customers || []}
                  placeholder="Select customer"
                  searchPlaceholder="Search customers..."
                />
              </div>
              <div className="space-y-2">
                <Label>Order Number (Optional)</Label>
                <SearchableSelect
                  value={selectedOrderNumber}
                  onValueChange={setSelectedOrderNumber}
                  options={filterOptions?.orderNumbers || []}
                  placeholder="Select order number"
                  searchPlaceholder="Search order numbers..."
                />
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
                onClick={handleCreatePool}
                disabled={!poolName || !selectedMake || createMutation.isPending}
                data-testid="button-confirm-create"
              >
                {createMutation.isPending ? "Creating..." : "Create Pool"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover-elevate border-dashed cursor-pointer" data-testid="card-create-coverage-pool" onClick={() => setDialogOpen(true)}>
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] p-6">
            <Plus className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">Create New Pool</h3>
            <p className="text-sm text-muted-foreground text-center">
              Define a custom coverage pool
            </p>
          </CardContent>
        </Card>

        {poolsWithDetails.map((pool: any) => (
          <PoolCoverageCard
            key={pool.id}
            groupName={pool.name}
            specifications={pool.specifications}
            inventoryRequired={pool.coveredCount}
            poolUnits={pool.spareCount}
            coveragePercentage={pool.coverageRatio}
            onExpand={() => console.log(`Expand pool: ${pool.name}`)}
          />
        ))}
      </div>
    </div>
  );
}
