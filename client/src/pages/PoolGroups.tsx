import { useState } from "react";
import PoolCoverageCard from "@/components/PoolCoverageCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function PoolGroups() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");

  //todo: remove mock functionality
  const mockPoolGroups = [
    {
      name: "HP EliteBook Series",
      specs: ["HP", "EliteBook", "i5", "8GB"],
      required: 150,
      units: 4,
      coverage: 2.7,
    },
    {
      name: "Dell Latitude Premium",
      specs: ["Dell", "Latitude", "i7", "16GB"],
      required: 89,
      units: 12,
      coverage: 13.5,
    },
    {
      name: "Lenovo ThinkPad X Series",
      specs: ["Lenovo", "ThinkPad", "i5", "Gen 11"],
      required: 203,
      units: 8,
      coverage: 3.9,
    },
    {
      name: "Dell Precision Workstations",
      specs: ["Dell", "Precision", "i7", "32GB"],
      required: 45,
      units: 2,
      coverage: 4.4,
    },
    {
      name: "HP ProBook Standard",
      specs: ["HP", "ProBook", "i3", "8GB"],
      required: 112,
      units: 15,
      coverage: 13.4,
    },
    {
      name: "Lenovo IdeaPad Consumer",
      specs: ["Lenovo", "IdeaPad", "Ryzen 5"],
      required: 76,
      units: 3,
      coverage: 3.9,
    },
  ];

  const handleCreateGroup = () => {
    console.log("Create group:", { groupName, description });
    setDialogOpen(false);
    setGroupName("");
    setDescription("");
  };

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
                <Label>Filter Criteria</Label>
                <p className="text-xs text-muted-foreground">
                  Select specifications to define this group (to be implemented)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={!groupName}
                data-testid="button-confirm-create"
              >
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover-elevate border-dashed" data-testid="card-create-new">
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] p-6">
            <Plus className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">Create New Group</h3>
            <p className="text-sm text-muted-foreground text-center">
              Define a custom pool group
            </p>
          </CardContent>
        </Card>

        {mockPoolGroups.map((group, idx) => (
          <PoolCoverageCard
            key={idx}
            groupName={group.name}
            specifications={group.specs}
            inventoryRequired={group.required}
            poolUnits={group.units}
            coveragePercentage={group.coverage}
            onExpand={() => console.log(`Expand pool: ${group.name}`)}
          />
        ))}
      </div>
    </div>
  );
}
