import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import PoolCoverageCard from "@/components/PoolCoverageCard";
import { PoolDetailDialog } from "@/components/PoolDetailDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelectCombobox } from "@/components/MultiSelectCombobox";
import { useToast } from "@/hooks/use-toast";
import type { CoveragePoolWithStats } from "@shared/schema";

export default function PoolGroups() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<CoveragePoolWithStats | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [poolToDelete, setPoolToDelete] = useState<string | null>(null);
  const [poolName, setPoolName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedProcessors, setSelectedProcessors] = useState<string[]>([]);
  const [selectedRams, setSelectedRams] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedOrderNumbers, setSelectedOrderNumbers] = useState<string[]>([]);
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/coverage-pools/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coverage-pools-with-stats"] });
      toast({ 
        title: "Success", 
        description: "Coverage pool deleted successfully" 
      });
      setDeleteDialogOpen(false);
      setPoolToDelete(null);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete coverage pool", 
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setPoolName("");
    setDescription("");
    setSelectedMakes([]);
    setSelectedModels([]);
    setSelectedProcessors([]);
    setSelectedRams([]);
    setSelectedCustomers([]);
    setSelectedOrderNumbers([]);
  };

  const handleCreatePool = () => {
    const filterCriteria = {
      make: selectedMakes.length > 0 ? selectedMakes : undefined,
      model: selectedModels.length > 0 ? selectedModels : undefined,
      processor: selectedProcessors.length > 0 ? selectedProcessors : undefined,
      ram: selectedRams.length > 0 ? selectedRams : undefined,
      customerName: selectedCustomers.length > 0 ? selectedCustomers : undefined,
      orderNumber: selectedOrderNumbers.length > 0 ? selectedOrderNumbers : undefined,
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
      
      const specifications = [
        ...(Array.isArray(criteria.make) ? criteria.make : criteria.make ? [criteria.make] : []),
        ...(Array.isArray(criteria.model) ? criteria.model : criteria.model ? [criteria.model] : []),
        ...(Array.isArray(criteria.processor) ? criteria.processor : criteria.processor ? [criteria.processor] : []),
        ...(Array.isArray(criteria.ram) ? criteria.ram : criteria.ram ? [criteria.ram] : []),
        ...(Array.isArray(criteria.customerName) ? criteria.customerName : criteria.customerName ? [criteria.customerName] : []),
        ...(Array.isArray(criteria.orderNumber) ? criteria.orderNumber : criteria.orderNumber ? [criteria.orderNumber] : []),
      ];
      
      return {
        ...pool,
        specifications,
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
          <DialogContent className="max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Create New Coverage Pool</DialogTitle>
              <DialogDescription>
                Define a coverage pool based on laptop specifications, customer, and order details to track spare units and coverage ratios
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
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
                <MultiSelectCombobox
                  values={selectedMakes}
                  onValuesChange={setSelectedMakes}
                  options={filterOptions?.makes || []}
                  placeholder="Select makes"
                  searchPlaceholder="Search makes..."
                />
              </div>
              <div className="space-y-2">
                <Label>Model (Optional)</Label>
                <MultiSelectCombobox
                  values={selectedModels}
                  onValuesChange={setSelectedModels}
                  options={filterOptions?.models || []}
                  placeholder="Select models"
                  searchPlaceholder="Search models..."
                />
              </div>
              <div className="space-y-2">
                <Label>Processor (Optional)</Label>
                <MultiSelectCombobox
                  values={selectedProcessors}
                  onValuesChange={setSelectedProcessors}
                  options={filterOptions?.processors || []}
                  placeholder="Select processors"
                  searchPlaceholder="Search processors..."
                />
              </div>
              <div className="space-y-2">
                <Label>RAM (Optional)</Label>
                <MultiSelectCombobox
                  values={selectedRams}
                  onValuesChange={setSelectedRams}
                  options={filterOptions?.rams || []}
                  placeholder="Select RAM"
                  searchPlaceholder="Search RAM options..."
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Name (Optional)</Label>
                <MultiSelectCombobox
                  values={selectedCustomers}
                  onValuesChange={setSelectedCustomers}
                  options={filterOptions?.customers || []}
                  placeholder="Select customers"
                  searchPlaceholder="Search customers..."
                />
              </div>
              <div className="space-y-2">
                <Label>Order Number (Optional)</Label>
                <MultiSelectCombobox
                  values={selectedOrderNumbers}
                  onValuesChange={setSelectedOrderNumbers}
                  options={filterOptions?.orderNumbers || []}
                  placeholder="Select order numbers"
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
                disabled={!poolName || selectedMakes.length === 0 || createMutation.isPending}
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
            onExpand={() => {
              setSelectedPool(pool);
              setDetailDialogOpen(true);
            }}
            onDelete={() => {
              setPoolToDelete(pool.id);
              setDeleteDialogOpen(true);
            }}
          />
        ))}
      </div>

      <PoolDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        poolName={selectedPool?.name || ""}
        filterCriteria={selectedPool?.filterCriteria || "{}"}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coverage Pool</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this coverage pool? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (poolToDelete) {
                  deleteMutation.mutate(poolToDelete);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
