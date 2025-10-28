import PoolCoverageCard from "../PoolCoverageCard";

export default function PoolCoverageCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      <PoolCoverageCard
        groupName="HP EliteBook"
        specifications={["HP", "EliteBook", "i5", "8GB RAM"]}
        inventoryRequired={150}
        poolUnits={4}
        coveragePercentage={2.7}
        onExpand={() => console.log("Expand HP EliteBook pool")}
      />
      <PoolCoverageCard
        groupName="Dell Latitude"
        specifications={["Dell", "Latitude", "i7", "16GB RAM"]}
        inventoryRequired={89}
        poolUnits={12}
        coveragePercentage={13.5}
        onExpand={() => console.log("Expand Dell Latitude pool")}
      />
      <PoolCoverageCard
        groupName="Lenovo ThinkPad"
        specifications={["Lenovo", "ThinkPad", "i5", "Gen 11"]}
        inventoryRequired={203}
        poolUnits={8}
        coveragePercentage={3.9}
        onExpand={() => console.log("Expand Lenovo ThinkPad pool")}
      />
    </div>
  );
}
