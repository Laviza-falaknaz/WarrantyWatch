import { db } from "./db";
import { spareUnit, coveredUnit, coveragePool } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  try {
    // Clear existing data
    await db.delete(coveragePool);
    await db.delete(coveredUnit);
    await db.delete(spareUnit);

    // Seed spare units (units in pool available to cover warranties)
    const spareUnitData = [
      // HP EliteBook series spares
      {
        serialNumber: "SPARE-HP-001",
        areaId: "WAREHOUSE-001",
        itemId: "SPARE001",
        make: "HP",
        model: "EliteBook 840 G8",
        processor: "Intel Core i5",
        generation: "11th Gen",
        ram: "8GB",
        hdd: "256GB SSD",
        displaySize: "14 inch",
        touchscreen: false,
        category: "Business",
        reservedForCase: null,
        retiredOrder: null,
        currentHolder: "Warehouse A",
        retiredDate: null,
        productDescription: "HP EliteBook 840 G8 Notebook PC - Spare Unit",
        productNumber: "HP840G8",
      },
      {
        serialNumber: "SPARE-HP-002",
        areaId: "WAREHOUSE-001",
        itemId: "SPARE002",
        make: "HP",
        model: "EliteBook 840 G8",
        processor: "Intel Core i5",
        generation: "11th Gen",
        ram: "8GB",
        hdd: "256GB SSD",
        displaySize: "14 inch",
        touchscreen: false,
        category: "Business",
        reservedForCase: "CASE-2024-001",
        retiredOrder: null,
        currentHolder: "Warehouse A",
        retiredDate: null,
        productDescription: "HP EliteBook 840 G8 Notebook PC - Spare Unit",
        productNumber: "HP840G8",
      },
      // Dell Latitude series spares
      {
        serialNumber: "SPARE-DELL-001",
        areaId: "WAREHOUSE-002",
        itemId: "SPARE003",
        make: "Dell",
        model: "Latitude 7420",
        processor: "Intel Core i7",
        generation: "11th Gen",
        ram: "16GB",
        hdd: "512GB SSD",
        displaySize: "14 inch",
        touchscreen: true,
        category: "Business",
        reservedForCase: null,
        retiredOrder: null,
        currentHolder: "Warehouse B",
        retiredDate: null,
        productDescription: "Dell Latitude 7420 Notebook - Spare Unit",
        productNumber: "DELL7420",
      },
      {
        serialNumber: "SPARE-DELL-002",
        areaId: "WAREHOUSE-002",
        itemId: "SPARE004",
        make: "Dell",
        model: "Latitude 7420",
        processor: "Intel Core i7",
        generation: "11th Gen",
        ram: "16GB",
        hdd: "512GB SSD",
        displaySize: "14 inch",
        touchscreen: true,
        category: "Business",
        reservedForCase: null,
        retiredOrder: null,
        currentHolder: "Warehouse B",
        retiredDate: null,
        productDescription: "Dell Latitude 7420 Notebook - Spare Unit",
        productNumber: "DELL7420",
      },
      // Lenovo ThinkPad series spares
      {
        serialNumber: "SPARE-LEN-001",
        areaId: "WAREHOUSE-001",
        itemId: "SPARE005",
        make: "Lenovo",
        model: "ThinkPad X1 Carbon",
        processor: "Intel Core i5",
        generation: "11th Gen",
        ram: "16GB",
        hdd: "512GB SSD",
        displaySize: "14 inch",
        touchscreen: false,
        category: "Business",
        reservedForCase: null,
        retiredOrder: null,
        currentHolder: "Warehouse A",
        retiredDate: null,
        productDescription: "Lenovo ThinkPad X1 Carbon Gen 9 - Spare Unit",
        productNumber: "LENX1C9",
      },
      // HP ProBook series spares
      {
        serialNumber: "SPARE-HP-003",
        areaId: "WAREHOUSE-003",
        itemId: "SPARE006",
        make: "HP",
        model: "ProBook 450 G8",
        processor: "Intel Core i3",
        generation: "11th Gen",
        ram: "8GB",
        hdd: "256GB SSD",
        displaySize: "15.6 inch",
        touchscreen: false,
        category: "Standard",
        reservedForCase: null,
        retiredOrder: null,
        currentHolder: "Warehouse C",
        retiredDate: null,
        productDescription: "HP ProBook 450 G8 Notebook PC - Spare Unit",
        productNumber: "HPPB450G8",
      },
    ];

    const insertedSpareUnits = await db.insert(spareUnit).values(spareUnitData).returning();
    console.log(`Inserted ${insertedSpareUnits.length} spare units`);

    // Seed covered units (units in field under warranty coverage that need coverage)
    const coveredUnitData = [
      // HP EliteBook units in field
      {
        serialNumber: "FIELD-HP-001",
        areaId: "US-EAST",
        itemId: "FIELD001",
        make: "HP",
        model: "EliteBook 840 G8",
        processor: "Intel Core i5",
        generation: "11th Gen",
        ram: "8GB",
        hdd: "256GB SSD",
        displaySize: "14 inch",
        touchscreen: false,
        category: "Business",
        coverageStartDate: new Date("2024-01-15"),
        coverageEndDate: new Date("2027-01-15"), // 3 year warranty
        coverageDescription: "Standard 3-year warranty for HP EliteBook 840 G8",
        coverageDurationDays: 1095,
        isCoverageActive: true,
        customerName: "John Smith",
        customerEmail: "john.smith@acmecorp.com",
        customerPhone: "+1-555-0101",
        orderNumber: "ORD-2024-001",
        orderDate: new Date("2024-01-10"),
        currentHolder: "Acme Corporation",
        productDescription: "HP EliteBook 840 G8 Notebook PC - Deployed Unit",
        productNumber: "HP840G8",
      },
      {
        serialNumber: "FIELD-HP-002",
        areaId: "US-WEST",
        itemId: "FIELD002",
        make: "HP",
        model: "EliteBook 840 G8",
        processor: "Intel Core i5",
        generation: "11th Gen",
        ram: "8GB",
        hdd: "256GB SSD",
        displaySize: "14 inch",
        touchscreen: false,
        category: "Business",
        coverageStartDate: new Date("2024-03-20"),
        coverageEndDate: new Date("2025-03-20"), // 1 year warranty
        coverageDescription: "Standard 1-year warranty for HP EliteBook 840 G8",
        coverageDurationDays: 365,
        isCoverageActive: true,
        customerName: "Sarah Johnson",
        customerEmail: "sarah.j@techsolutions.com",
        customerPhone: "+1-555-0102",
        orderNumber: "ORD-2024-042",
        orderDate: new Date("2024-03-15"),
        currentHolder: "Tech Solutions Inc",
        productDescription: "HP EliteBook 840 G8 Notebook PC - Deployed Unit",
        productNumber: "HP840G8",
      },
      {
        serialNumber: "FIELD-HP-003",
        areaId: "US-CENTRAL",
        itemId: "FIELD003",
        make: "HP",
        model: "EliteBook 840 G8",
        processor: "Intel Core i5",
        generation: "11th Gen",
        ram: "8GB",
        hdd: "512GB SSD",
        displaySize: "14 inch",
        touchscreen: false,
        category: "Business",
        coverageStartDate: new Date("2024-05-10"),
        coverageEndDate: (() => {
          const date = new Date();
          date.setDate(date.getDate() + 15); // Expiring in 15 days
          return date;
        })(),
        coverageDescription: "Standard 1-year warranty for HP EliteBook 840 G8 - Expiring Soon",
        coverageDurationDays: 365,
        isCoverageActive: true,
        customerName: "Michael Chen",
        customerEmail: "m.chen@globalservices.com",
        customerPhone: "+1-555-0103",
        orderNumber: "ORD-2024-088",
        orderDate: new Date("2024-05-05"),
        currentHolder: "Global Services LLC",
        productDescription: "HP EliteBook 840 G8 Notebook PC - Deployed Unit",
        productNumber: "HP840G8",
      },
      // Dell Latitude units in field
      {
        serialNumber: "FIELD-DELL-001",
        areaId: "US-NORTH",
        itemId: "FIELD004",
        make: "Dell",
        model: "Latitude 7420",
        processor: "Intel Core i7",
        generation: "11th Gen",
        ram: "16GB",
        hdd: "512GB SSD",
        displaySize: "14 inch",
        touchscreen: true,
        category: "Business",
        coverageStartDate: new Date("2024-02-01"),
        coverageEndDate: new Date("2027-02-01"), // 3 year warranty
        coverageDescription: "Premium 3-year warranty for Dell Latitude 7420",
        coverageDurationDays: 1095,
        isCoverageActive: true,
        customerName: "Robert Williams",
        customerEmail: "r.williams@enterpriseventures.com",
        customerPhone: "+1-555-0201",
        orderNumber: "ORD-2024-025",
        orderDate: new Date("2024-01-28"),
        currentHolder: "Enterprise Ventures",
        productDescription: "Dell Latitude 7420 Notebook - Deployed Unit",
        productNumber: "DELL7420",
      },
      {
        serialNumber: "FIELD-DELL-002",
        areaId: "US-SOUTH",
        itemId: "FIELD005",
        make: "Dell",
        model: "Latitude 7420",
        processor: "Intel Core i7",
        generation: "11th Gen",
        ram: "16GB",
        hdd: "512GB SSD",
        displaySize: "14 inch",
        touchscreen: true,
        category: "Business",
        coverageStartDate: new Date("2024-04-15"),
        coverageEndDate: new Date("2025-04-15"), // 1 year warranty
        coverageDescription: "Standard 1-year warranty for Dell Latitude 7420",
        coverageDurationDays: 365,
        isCoverageActive: true,
        customerName: "Jennifer Davis",
        customerEmail: "j.davis@innovationlabs.com",
        customerPhone: "+1-555-0202",
        orderNumber: "ORD-2024-075",
        orderDate: new Date("2024-04-10"),
        currentHolder: "Innovation Labs",
        productDescription: "Dell Latitude 7420 Notebook - Deployed Unit",
        productNumber: "DELL7420",
      },
      {
        serialNumber: "FIELD-DELL-003",
        areaId: "US-EAST",
        itemId: "FIELD006",
        make: "Dell",
        model: "Latitude 7420",
        processor: "Intel Core i7",
        generation: "11th Gen",
        ram: "16GB",
        hdd: "1TB SSD",
        displaySize: "14 inch",
        touchscreen: true,
        category: "Business",
        coverageStartDate: new Date("2023-06-01"),
        coverageEndDate: new Date("2024-06-01"), // Expired warranty
        coverageDescription: "Standard 1-year warranty for Dell Latitude 7420 - Expired",
        coverageDurationDays: 365,
        isCoverageActive: false,
        customerName: "David Martinez",
        customerEmail: "d.martinez@datacorp.com",
        customerPhone: "+1-555-0203",
        orderNumber: "ORD-2023-156",
        orderDate: new Date("2023-05-25"),
        currentHolder: "DataCorp Systems",
        productDescription: "Dell Latitude 7420 Notebook - Deployed Unit",
        productNumber: "DELL7420",
      },
      // Lenovo ThinkPad units in field
      {
        serialNumber: "FIELD-LEN-001",
        areaId: "US-WEST",
        itemId: "FIELD007",
        make: "Lenovo",
        model: "ThinkPad X1 Carbon",
        processor: "Intel Core i5",
        generation: "11th Gen",
        ram: "16GB",
        hdd: "512GB SSD",
        displaySize: "14 inch",
        touchscreen: false,
        category: "Business",
        coverageStartDate: new Date("2024-01-20"),
        coverageEndDate: new Date("2027-01-20"), // 3 year warranty
        coverageDescription: "Premium 3-year warranty for Lenovo ThinkPad X1 Carbon",
        coverageDurationDays: 1095,
        isCoverageActive: true,
        customerName: "Lisa Anderson",
        customerEmail: "lisa.a@creativeagency.com",
        customerPhone: "+1-555-0301",
        orderNumber: "ORD-2024-015",
        orderDate: new Date("2024-01-15"),
        currentHolder: "Creative Agency Inc",
        productDescription: "Lenovo ThinkPad X1 Carbon Gen 9 - Deployed Unit",
        productNumber: "LENX1C9",
      },
      {
        serialNumber: "FIELD-LEN-002",
        areaId: "US-CENTRAL",
        itemId: "FIELD008",
        make: "Lenovo",
        model: "ThinkPad X1 Carbon",
        processor: "Intel Core i5",
        generation: "11th Gen",
        ram: "16GB",
        hdd: "512GB SSD",
        displaySize: "14 inch",
        touchscreen: false,
        category: "Business",
        coverageStartDate: new Date("2024-07-01"),
        coverageEndDate: (() => {
          const date = new Date();
          date.setDate(date.getDate() + 25); // Expiring in 25 days
          return date;
        })(),
        coverageDescription: "Standard 1-year warranty for Lenovo ThinkPad X1 Carbon - Expiring Soon",
        coverageDurationDays: 365,
        isCoverageActive: true,
        customerName: "Kevin Thompson",
        customerEmail: "k.thompson@startupventures.com",
        customerPhone: "+1-555-0302",
        orderNumber: "ORD-2024-145",
        orderDate: new Date("2024-06-25"),
        currentHolder: "StartUp Ventures",
        productDescription: "Lenovo ThinkPad X1 Carbon Gen 9 - Deployed Unit",
        productNumber: "LENX1C9",
      },
      // HP ProBook units in field
      {
        serialNumber: "FIELD-HP-004",
        areaId: "US-SOUTH",
        itemId: "FIELD009",
        make: "HP",
        model: "ProBook 450 G8",
        processor: "Intel Core i3",
        generation: "11th Gen",
        ram: "8GB",
        hdd: "256GB SSD",
        displaySize: "15.6 inch",
        touchscreen: false,
        category: "Standard",
        coverageStartDate: new Date("2024-03-15"),
        coverageEndDate: new Date("2025-03-15"), // 1 year warranty
        coverageDescription: "Standard 1-year warranty for HP ProBook 450 G8",
        coverageDurationDays: 365,
        isCoverageActive: true,
        customerName: "Patricia Brown",
        customerEmail: "p.brown@regionalwest.com",
        customerPhone: "+1-555-0401",
        orderNumber: "ORD-2024-058",
        orderDate: new Date("2024-03-10"),
        currentHolder: "Regional Office West",
        productDescription: "HP ProBook 450 G8 Notebook PC - Deployed Unit",
        productNumber: "HPPB450G8",
      },
    ];

    const insertedCoveredUnits = await db.insert(coveredUnit).values(coveredUnitData).returning();
    console.log(`Inserted ${insertedCoveredUnits.length} covered units`);

    // Seed coverage pools
    const coveragePoolData = [
      {
        name: "HP EliteBook 840 G8 Coverage",
        description: "Coverage pool for HP EliteBook 840 G8 units in field (2 spares to cover 3 deployed units)",
        filterCriteria: JSON.stringify({
          make: "HP",
          model: "EliteBook 840 G8",
        }),
      },
      {
        name: "Dell Latitude 7420 Premium",
        description: "Coverage pool for Dell Latitude 7420 16GB configurations (2 spares to cover 3 deployed units)",
        filterCriteria: JSON.stringify({
          make: "Dell",
          model: "Latitude 7420",
          ram: "16GB",
        }),
      },
      {
        name: "Lenovo ThinkPad X1 Coverage",
        description: "Coverage pool for Lenovo ThinkPad X1 Carbon units (1 spare to cover 2 deployed units)",
        filterCriteria: JSON.stringify({
          make: "Lenovo",
          model: "ThinkPad X1 Carbon",
        }),
      },
      {
        name: "HP ProBook 450 Standard",
        description: "Coverage pool for HP ProBook 450 G8 standard units (1 spare to cover 1 deployed unit)",
        filterCriteria: JSON.stringify({
          make: "HP",
          model: "ProBook 450 G8",
        }),
      },
    ];

    const insertedCoveragePools = await db.insert(coveragePool).values(coveragePoolData).returning();
    console.log(`Inserted ${insertedCoveragePools.length} coverage pools`);

    console.log("Database seeding completed successfully!");
    console.log("\nSummary:");
    console.log(`- ${insertedSpareUnits.length} spare units in pool (available to cover warranty claims)`);
    console.log(`- ${insertedCoveredUnits.length} covered units in field (under warranty, need coverage)`);
    console.log(`- ${insertedCoveragePools.length} coverage pools (groupings showing coverage ratios)`);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("Seed script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  });
