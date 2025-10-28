import { db } from "./db";
import { inventory, warranty, poolGroup } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  try {
    // Clear existing data
    await db.delete(poolGroup);
    await db.delete(warranty);
    await db.delete(inventory);

    // Seed inventory
    const inventoryData = [
      // HP EliteBook series
      {
        serialNumber: "SN1001",
        areaId: "US-EAST",
        itemId: "ITEM001",
        make: "HP",
        model: "EliteBook 840 G8",
        processor: "Intel Core i5",
        generation: "11th Gen",
        ram: "8GB",
        hdd: "256GB SSD",
        displaySize: "14 inch",
        touchscreen: false,
        category: "Business",
        allocatedOrder: null,
        soldOrder: null,
        customer: null,
        soldDate: null,
        productDescription: "HP EliteBook 840 G8 Notebook PC",
        productNumber: "HP840G8",
      },
      {
        serialNumber: "SN1002",
        areaId: "US-EAST",
        itemId: "ITEM002",
        make: "HP",
        model: "EliteBook 840 G8",
        processor: "Intel Core i5",
        generation: "11th Gen",
        ram: "8GB",
        hdd: "256GB SSD",
        displaySize: "14 inch",
        touchscreen: false,
        category: "Business",
        allocatedOrder: null,
        soldOrder: null,
        customer: null,
        soldDate: null,
        productDescription: "HP EliteBook 840 G8 Notebook PC",
        productNumber: "HP840G8",
      },
      {
        serialNumber: "SN1003",
        areaId: "US-WEST",
        itemId: "ITEM003",
        make: "HP",
        model: "EliteBook 840 G8",
        processor: "Intel Core i5",
        generation: "11th Gen",
        ram: "8GB",
        hdd: "512GB SSD",
        displaySize: "14 inch",
        touchscreen: false,
        category: "Business",
        allocatedOrder: "ORD1001",
        soldOrder: "SOLD1001",
        customer: "Acme Corporation",
        soldDate: new Date("2024-06-15"),
        productDescription: "HP EliteBook 840 G8 Notebook PC",
        productNumber: "HP840G8",
      },
      {
        serialNumber: "SN1004",
        areaId: "US-WEST",
        itemId: "ITEM004",
        make: "HP",
        model: "EliteBook 840 G8",
        processor: "Intel Core i5",
        generation: "11th Gen",
        ram: "8GB",
        hdd: "256GB SSD",
        displaySize: "14 inch",
        touchscreen: false,
        category: "Business",
        allocatedOrder: "ORD1002",
        soldOrder: "SOLD1002",
        customer: "Tech Solutions Inc",
        soldDate: new Date("2024-07-20"),
        productDescription: "HP EliteBook 840 G8 Notebook PC",
        productNumber: "HP840G8",
      },
      // Dell Latitude series
      {
        serialNumber: "SN2001",
        areaId: "US-CENTRAL",
        itemId: "ITEM005",
        make: "Dell",
        model: "Latitude 7420",
        processor: "Intel Core i7",
        generation: "11th Gen",
        ram: "16GB",
        hdd: "512GB SSD",
        displaySize: "14 inch",
        touchscreen: true,
        category: "Business",
        allocatedOrder: null,
        soldOrder: null,
        customer: null,
        soldDate: null,
        productDescription: "Dell Latitude 7420 Notebook",
        productNumber: "DELL7420",
      },
      {
        serialNumber: "SN2002",
        areaId: "US-CENTRAL",
        itemId: "ITEM006",
        make: "Dell",
        model: "Latitude 7420",
        processor: "Intel Core i7",
        generation: "11th Gen",
        ram: "16GB",
        hdd: "512GB SSD",
        displaySize: "14 inch",
        touchscreen: true,
        category: "Business",
        allocatedOrder: null,
        soldOrder: null,
        customer: null,
        soldDate: null,
        productDescription: "Dell Latitude 7420 Notebook",
        productNumber: "DELL7420",
      },
      {
        serialNumber: "SN2003",
        areaId: "US-SOUTH",
        itemId: "ITEM007",
        make: "Dell",
        model: "Latitude 7420",
        processor: "Intel Core i7",
        generation: "11th Gen",
        ram: "16GB",
        hdd: "1TB SSD",
        displaySize: "14 inch",
        touchscreen: true,
        category: "Business",
        allocatedOrder: "ORD2001",
        soldOrder: "SOLD2001",
        customer: "Global Enterprises",
        soldDate: new Date("2024-08-10"),
        productDescription: "Dell Latitude 7420 Notebook",
        productNumber: "DELL7420",
      },
      // Lenovo ThinkPad series
      {
        serialNumber: "SN3001",
        areaId: "US-NORTH",
        itemId: "ITEM008",
        make: "Lenovo",
        model: "ThinkPad X1 Carbon",
        processor: "Intel Core i5",
        generation: "11th Gen",
        ram: "16GB",
        hdd: "512GB SSD",
        displaySize: "14 inch",
        touchscreen: false,
        category: "Business",
        allocatedOrder: null,
        soldOrder: null,
        customer: null,
        soldDate: null,
        productDescription: "Lenovo ThinkPad X1 Carbon Gen 9",
        productNumber: "LENX1C9",
      },
      {
        serialNumber: "SN3002",
        areaId: "US-NORTH",
        itemId: "ITEM009",
        make: "Lenovo",
        model: "ThinkPad X1 Carbon",
        processor: "Intel Core i5",
        generation: "11th Gen",
        ram: "16GB",
        hdd: "512GB SSD",
        displaySize: "14 inch",
        touchscreen: false,
        category: "Business",
        allocatedOrder: "ORD3001",
        soldOrder: "SOLD3001",
        customer: "StartUp Ventures",
        soldDate: new Date("2024-09-05"),
        productDescription: "Lenovo ThinkPad X1 Carbon Gen 9",
        productNumber: "LENX1C9",
      },
      // HP ProBook series
      {
        serialNumber: "SN4001",
        areaId: "US-EAST",
        itemId: "ITEM010",
        make: "HP",
        model: "ProBook 450 G8",
        processor: "Intel Core i3",
        generation: "11th Gen",
        ram: "8GB",
        hdd: "256GB SSD",
        displaySize: "15.6 inch",
        touchscreen: false,
        category: "Standard",
        allocatedOrder: null,
        soldOrder: null,
        customer: null,
        soldDate: null,
        productDescription: "HP ProBook 450 G8 Notebook PC",
        productNumber: "HPPB450G8",
      },
      {
        serialNumber: "SN4002",
        areaId: "US-EAST",
        itemId: "ITEM011",
        make: "HP",
        model: "ProBook 450 G8",
        processor: "Intel Core i3",
        generation: "11th Gen",
        ram: "8GB",
        hdd: "256GB SSD",
        displaySize: "15.6 inch",
        touchscreen: false,
        category: "Standard",
        allocatedOrder: null,
        soldOrder: null,
        customer: null,
        soldDate: null,
        productDescription: "HP ProBook 450 G8 Notebook PC",
        productNumber: "HPPB450G8",
      },
      // Dell Precision series
      {
        serialNumber: "SN5001",
        areaId: "US-WEST",
        itemId: "ITEM012",
        make: "Dell",
        model: "Precision 5560",
        processor: "Intel Core i7",
        generation: "11th Gen",
        ram: "32GB",
        hdd: "1TB SSD",
        displaySize: "15.6 inch",
        touchscreen: false,
        category: "Workstation",
        allocatedOrder: "ORD4001",
        soldOrder: "SOLD4001",
        customer: "Design Studio Co",
        soldDate: new Date("2024-05-12"),
        productDescription: "Dell Precision 5560 Mobile Workstation",
        productNumber: "DELLP5560",
      },
    ];

    const insertedInventory = await db.insert(inventory).values(inventoryData).returning();
    console.log(`Inserted ${insertedInventory.length} inventory items`);

    // Seed warranties
    const warrantyData = insertedInventory.map((item, index) => {
      const startDate = new Date("2024-01-15");
      startDate.setMonth(startDate.getMonth() + (index % 6));
      
      const endDate = new Date(startDate);
      // Vary warranty duration: some 1 year, some 3 years
      const durationMonths = index % 3 === 0 ? 36 : 12;
      endDate.setMonth(endDate.getMonth() + durationMonths);
      
      const durationInDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Make some warranties expiring soon (end date within 30 days)
      if (index % 5 === 0) {
        const now = new Date();
        endDate.setTime(now.getTime() + 20 * 24 * 60 * 60 * 1000); // 20 days from now
      }
      
      // Make some warranties already expired
      const isActive = index % 7 !== 0;
      
      return {
        serialNumber: item.serialNumber,
        areaId: item.areaId,
        itemId: item.itemId,
        warrantyStartDate: startDate,
        warrantyEndDate: endDate,
        warrantyDescription: `Standard warranty for ${item.make} ${item.model}`,
        durationInDays,
        isActive,
      };
    });

    const insertedWarranties = await db.insert(warranty).values(warrantyData).returning();
    console.log(`Inserted ${insertedWarranties.length} warranties`);

    // Seed pool groups
    const poolGroupData = [
      {
        name: "HP EliteBook Pool",
        description: "Pool for HP EliteBook 840 G8 laptops",
        filterCriteria: JSON.stringify({
          make: "HP",
          model: "EliteBook 840 G8",
        }),
      },
      {
        name: "Dell Latitude Premium",
        description: "Pool for Dell Latitude 7420 high-end configurations",
        filterCriteria: JSON.stringify({
          make: "Dell",
          model: "Latitude 7420",
          ram: "16GB",
        }),
      },
      {
        name: "Lenovo ThinkPad X Series",
        description: "Pool for Lenovo ThinkPad X1 Carbon laptops",
        filterCriteria: JSON.stringify({
          make: "Lenovo",
          model: "ThinkPad X1 Carbon",
        }),
      },
      {
        name: "HP ProBook Standard",
        description: "Pool for HP ProBook 450 G8 standard configurations",
        filterCriteria: JSON.stringify({
          make: "HP",
          model: "ProBook 450 G8",
        }),
      },
    ];

    const insertedPoolGroups = await db.insert(poolGroup).values(poolGroupData).returning();
    console.log(`Inserted ${insertedPoolGroups.length} pool groups`);

    console.log("Database seeding completed successfully!");
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
