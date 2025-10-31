# API Documentation

## Overview
This document describes all REST API endpoints for the Coverage Pool Management Application.

**Base URL**: The API is served on the same port as the frontend application (default: port 5000)

**Authentication**: Currently, no authentication is required (assumes trusted internal network)

**Content-Type**: All endpoints accept and return `application/json` unless otherwise specified

---

## Table of Contents
1. [Spare Units (Replacement Pool)](#spare-units-replacement-pool)
2. [Covered Units (Stock Under Warranty)](#covered-units-stock-under-warranty)
3. [Available Stock](#available-stock)
4. [Claims](#claims)
5. [Replacements](#replacements)
6. [Coverage Pools](#coverage-pools)
7. [Analytics](#analytics)
8. [Configuration](#configuration)
9. [Filters](#filters)

---

## Spare Units (Replacement Pool)

### Get Spare Units
Retrieve a list of spare units with pagination and search.

**Endpoint**: `GET /api/spare-units`

**Query Parameters**:
- `search` (optional): Search string to filter by serial number, make, or model
- `offset` (optional): Number of records to skip for pagination (default: 0)
- `limit` (optional): Maximum number of records to return (default: 10,000)

**Response**: Array of spare unit objects
```json
[
  {
    "id": "uuid",
    "serialNumber": "ABC123456",
    "make": "HP",
    "model": "EliteBook 840 G8",
    "processor": "Intel i7-1165G7",
    "ram": "16GB",
    "category": "Business",
    "hdd": "512GB SSD",
    "generation": "11th Gen",
    "customerId": "CUST-001",
    "customerName": "Acme Corp",
    "areaId": "AREA-01",
    "itemId": "ITEM-001",
    "orderNumber": "ORD-12345",
    "retiredOrder": null,
    "reservedForCase": null,
    "createdOn": "2024-01-15T10:30:00Z"
  }
]
```

### Get Spare Units Statistics
Get aggregate statistics for spare units.

**Endpoint**: `GET /api/spare-units/stats`

**Response**:
```json
{
  "total": 1250,
  "unallocated": 850
}
```

### Create Spare Unit
Add a new spare unit to the replacement pool.

**Endpoint**: `POST /api/spare-units`

**Request Body**:
```json
{
  "serialNumber": "ABC123456",
  "make": "HP",
  "model": "EliteBook 840 G8",
  "processor": "Intel i7-1165G7",
  "ram": "16GB",
  "category": "Business",
  "hdd": "512GB SSD",
  "generation": "11th Gen",
  "customerId": "CUST-001",
  "customerName": "Acme Corp",
  "areaId": "AREA-01",
  "itemId": "ITEM-001",
  "orderNumber": "ORD-12345"
}
```

**Response**: Created spare unit object (201 Created)

### Update Spare Unit
Update an existing spare unit.

**Endpoint**: `PATCH /api/spare-units/:id`

**Request Body**: Partial spare unit object with fields to update

**Response**: Updated spare unit object

### Delete Spare Unit
Remove a spare unit from the pool.

**Endpoint**: `DELETE /api/spare-units/:id`

**Response**: 204 No Content

### Bulk Upload Spare Units
**For Azure Data Factory Integration** - Upsert multiple spare units in a single transaction.

**Endpoint**: `POST /api/spare-units/bulk`

**Request Body**: Array of spare unit objects
```json
[
  {
    "serialNumber": "ABC123456",
    "make": "HP",
    "model": "EliteBook 840 G8",
    "processor": "Intel i7-1165G7",
    "ram": "16GB",
    "category": "Business",
    "hdd": "512GB SSD",
    "generation": "11th Gen",
    "customerId": "CUST-001",
    "customerName": "Acme Corp",
    "areaId": "AREA-01",
    "itemId": "ITEM-001",
    "orderNumber": "ORD-12345",
    "retiredOrder": null,
    "reservedForCase": null
  }
]
```

**Features**:
- **Composite Key**: Upserts based on `(serialNumber, areaId, itemId)`
- **Transaction-Wrapped**: All inserts/updates succeed or fail together
- **Batch Processing**: Processes in batches of 500 records
- **Performance**: Optimized for large datasets (tested with 10K+ records)

**Response**:
```json
{
  "message": "Successfully processed 1250 spare units",
  "count": 1250
}
```

---

## Covered Units (Stock Under Warranty)

### Get Covered Units
Retrieve units currently under warranty coverage.

**Endpoint**: `GET /api/covered-units`

**Query Parameters**:
- `search` (optional): Search string to filter by serial number, make, or model
- `offset` (optional): Number of records to skip for pagination (default: 0)
- `limit` (optional): Maximum number of records to return (default: 10,000)

**Response**: Array of covered unit objects
```json
[
  {
    "id": "uuid",
    "serialNumber": "XYZ789012",
    "make": "Dell",
    "model": "Latitude 7420",
    "processor": "Intel i5-1145G7",
    "ram": "8GB",
    "category": "Business",
    "hdd": "256GB SSD",
    "generation": "11th Gen",
    "customerId": "CUST-002",
    "customerName": "TechCo Inc",
    "areaId": "AREA-02",
    "itemId": "ITEM-002",
    "orderNumber": "ORD-67890",
    "coverageStartDate": "2024-01-01",
    "coverageEndDate": "2025-12-31",
    "coverageDurationDays": 730,
    "isCoverageActive": true,
    "createdOn": "2024-01-01T08:00:00Z"
  }
]
```

### Get Covered Units Statistics
Get aggregate statistics for covered units.

**Endpoint**: `GET /api/covered-units/stats`

**Response**:
```json
{
  "total": 5000,
  "active": 4250
}
```

### Create Covered Unit
Add a new unit to warranty coverage tracking.

**Endpoint**: `POST /api/covered-units`

**Request Body**:
```json
{
  "serialNumber": "XYZ789012",
  "make": "Dell",
  "model": "Latitude 7420",
  "processor": "Intel i5-1145G7",
  "ram": "8GB",
  "category": "Business",
  "hdd": "256GB SSD",
  "generation": "11th Gen",
  "customerId": "CUST-002",
  "customerName": "TechCo Inc",
  "areaId": "AREA-02",
  "itemId": "ITEM-002",
  "orderNumber": "ORD-67890",
  "coverageStartDate": "2024-01-01",
  "coverageEndDate": "2025-12-31"
}
```

**Validation**:
- `coverageStartDate` must be a valid date
- `coverageEndDate` must be a valid date
- `coverageStartDate` must be before or equal to `coverageEndDate`

**Response**: Created covered unit object (201 Created)

### Update Covered Unit
Update warranty coverage information.

**Endpoint**: `PATCH /api/covered-units/:id`

**Request Body**: Partial covered unit object with fields to update

**Response**: Updated covered unit object

### Delete Covered Unit
Remove a unit from warranty tracking.

**Endpoint**: `DELETE /api/covered-units/:id`

**Response**: 204 No Content

### Bulk Upload Covered Units
**For Azure Data Factory Integration** - Upsert multiple covered units in a single transaction.

**Endpoint**: `POST /api/covered-units/bulk`

**Request Body**: Array of covered unit objects
```json
[
  {
    "serialNumber": "XYZ789012",
    "make": "Dell",
    "model": "Latitude 7420",
    "processor": "Intel i5-1145G7",
    "ram": "8GB",
    "category": "Business",
    "hdd": "256GB SSD",
    "generation": "11th Gen",
    "customerId": "CUST-002",
    "customerName": "TechCo Inc",
    "areaId": "AREA-02",
    "itemId": "ITEM-002",
    "orderNumber": "ORD-67890",
    "coverageStartDate": "2024-01-01",
    "coverageEndDate": "2025-12-31"
  }
]
```

**Features**:
- **Composite Key**: Upserts based on `(serialNumber, areaId, itemId, orderNumber)`
- **Transaction-Wrapped**: All inserts/updates succeed or fail together
- **Batch Processing**: Processes in batches of 500 records
- **Date Handling**: Accepts ISO date strings (e.g., "2024-01-01" or "2024-01-01T00:00:00Z")
- **Auto-Calculation**: Automatically calculates `coverageDurationDays` and `isCoverageActive`
- **Validation**: Validates date integrity (start ≤ end) during batch processing
- **Performance Optimized**: Streamlined validation for bulk operations (tested with 2K+ records in <100ms)

**Response**:
```json
{
  "message": "Successfully processed 2000 covered units",
  "count": 2000
}
```

**Error Response** (400 Bad Request):
```json
{
  "message": "Invalid date range: Coverage start date must be before or equal to end date"
}
```

---

## Available Stock

### Get Available Stock
Retrieve all available inventory units (not allocated to warranty pools).

**Endpoint**: `GET /api/available-stock`

**Query Parameters**:
- `search` (optional): Search string to filter by serial number, make, or model
- `offset` (optional): Number of records to skip for pagination (default: 0)
- `limit` (optional): Maximum number of records to return (default: 10,000)

**Response**: Array of available stock objects
```json
[
  {
    "id": "uuid",
    "serialNumber": "STK-001234",
    "make": "Lenovo",
    "model": "ThinkPad X1 Carbon Gen 9",
    "processor": "Intel i7-1185G7",
    "ram": "16GB",
    "category": "Premium",
    "hdd": "1TB SSD",
    "generation": "11th Gen",
    "createdOn": "2024-03-15T10:00:00Z"
  }
]
```

### Get Available Stock Statistics
Get aggregate statistics for available stock.

**Endpoint**: `GET /api/available-stock/stats`

**Response**:
```json
{
  "total": 80000
}
```

### Create Available Stock Item
Add a new item to available inventory.

**Endpoint**: `POST /api/available-stock`

**Request Body**:
```json
{
  "serialNumber": "STK-001234",
  "make": "Lenovo",
  "model": "ThinkPad X1 Carbon Gen 9",
  "processor": "Intel i7-1185G7",
  "ram": "16GB",
  "category": "Premium",
  "hdd": "1TB SSD",
  "generation": "11th Gen"
}
```

**Response**: Created available stock object (201 Created)

### Update Available Stock Item
Update an existing available stock item.

**Endpoint**: `PATCH /api/available-stock/:id`

**Request Body**: Partial available stock object with fields to update

**Response**: Updated available stock object

### Delete Available Stock Item
Remove an item from available inventory.

**Endpoint**: `DELETE /api/available-stock/:id`

**Response**: 204 No Content

### Bulk Upload Available Stock
**For Azure Data Factory Integration** - Replace all available stock with new data in a single transaction.

**Endpoint**: `POST /api/available-stock/bulk`

**Request Body**: Array of available stock objects
```json
[
  {
    "serialNumber": "STK-001234",
    "make": "Lenovo",
    "model": "ThinkPad X1 Carbon Gen 9",
    "processor": "Intel i7-1185G7",
    "ram": "16GB",
    "category": "Premium",
    "hdd": "1TB SSD",
    "generation": "11th Gen"
  }
]
```

**Features**:
- **Clear-All Strategy**: Truncates existing data and inserts new records
- **Transaction-Wrapped**: Truncate + insert operations are atomic
- **Batch Processing**: Processes in batches of 500 records
- **Optimized for Large Datasets**: Handles 80K+ records efficiently

**Response**:
```json
{
  "message": "Successfully uploaded 80000 available stock items",
  "count": 80000
}
```

**Note**: This endpoint uses a truncate-and-replace strategy, meaning all existing available stock records are deleted before new records are inserted. This is ideal for daily/weekly full data refreshes from external systems.

---

## Claims

### Get Claims
Retrieve warranty claim records.

**Endpoint**: `GET /api/claims`

**Query Parameters**:
- `search` (optional): Search string to filter by serial number, RMA, make, or model
- `offset` (optional): Number of records to skip for pagination (default: 0)
- `limit` (optional): Maximum number of records to return (default: 10,000)

**Response**: Array of claim objects
```json
[
  {
    "id": "uuid",
    "serialNumber": "CLM-567890",
    "make": "HP",
    "model": "ProBook 450 G8",
    "processor": "Intel i5-1135G7",
    "ram": "8GB",
    "category": "Business",
    "hdd": "256GB SSD",
    "generation": "11th Gen",
    "areaId": "AREA-03",
    "itemId": "ITEM-003",
    "rma": "RMA-2024-001",
    "claimDate": "2024-06-15",
    "createdOn": "2024-06-15T14:30:00Z"
  }
]
```

### Get Claims Statistics
Get aggregate statistics for claims.

**Endpoint**: `GET /api/claims/stats`

**Response**:
```json
{
  "total": 15000
}
```

### Create Claim
Record a new warranty claim.

**Endpoint**: `POST /api/claims`

**Request Body**:
```json
{
  "serialNumber": "CLM-567890",
  "make": "HP",
  "model": "ProBook 450 G8",
  "processor": "Intel i5-1135G7",
  "ram": "8GB",
  "category": "Business",
  "hdd": "256GB SSD",
  "generation": "11th Gen",
  "areaId": "AREA-03",
  "itemId": "ITEM-003",
  "rma": "RMA-2024-001",
  "claimDate": "2024-06-15"
}
```

**Response**: Created claim object (201 Created)

### Update Claim
Update an existing claim record.

**Endpoint**: `PATCH /api/claims/:id`

**Request Body**: Partial claim object with fields to update

**Response**: Updated claim object

### Delete Claim
Remove a claim record.

**Endpoint**: `DELETE /api/claims/:id`

**Response**: 204 No Content

### Bulk Upload Claims
**For Azure Data Factory Integration** - Upsert multiple claim records in a single transaction.

**Endpoint**: `POST /api/claims/bulk`

**Request Body**: Array of claim objects
```json
[
  {
    "serialNumber": "CLM-567890",
    "make": "HP",
    "model": "ProBook 450 G8",
    "processor": "Intel i5-1135G7",
    "ram": "8GB",
    "category": "Business",
    "hdd": "256GB SSD",
    "generation": "11th Gen",
    "areaId": "AREA-03",
    "itemId": "ITEM-003",
    "rma": "RMA-2024-001",
    "claimDate": "2024-06-15"
  }
]
```

**Features**:
- **Composite Key**: Upserts based on `(serialNumber, areaId, itemId, rma)`
- **Transaction-Wrapped**: All inserts/updates succeed or fail together
- **Batch Processing**: Processes in batches of 500 records
- **Date Handling**: Accepts ISO date strings for claimDate

**Response**:
```json
{
  "message": "Successfully processed 15000 claims",
  "count": 15000
}
```

---

## Replacements

### Get Replacements
Retrieve replacement unit records.

**Endpoint**: `GET /api/replacements`

**Query Parameters**:
- `search` (optional): Search string to filter by serial number, RMA, make, or model
- `offset` (optional): Number of records to skip for pagination (default: 0)
- `limit` (optional): Maximum number of records to return (default: 10,000)

**Response**: Array of replacement objects
```json
[
  {
    "id": "uuid",
    "serialNumber": "RPL-987654",
    "make": "Dell",
    "model": "Latitude 5420",
    "processor": "Intel i5-1145G7",
    "ram": "8GB",
    "category": "Business",
    "hdd": "256GB SSD",
    "generation": "11th Gen",
    "areaId": "AREA-04",
    "itemId": "ITEM-004",
    "rma": "RMA-2024-002",
    "replacementDate": "2024-06-20",
    "createdOn": "2024-06-20T09:15:00Z"
  }
]
```

### Get Replacements Statistics
Get aggregate statistics for replacements.

**Endpoint**: `GET /api/replacements/stats`

**Response**:
```json
{
  "total": 15000
}
```

### Create Replacement
Record a new replacement unit.

**Endpoint**: `POST /api/replacements`

**Request Body**:
```json
{
  "serialNumber": "RPL-987654",
  "make": "Dell",
  "model": "Latitude 5420",
  "processor": "Intel i5-1145G7",
  "ram": "8GB",
  "category": "Business",
  "hdd": "256GB SSD",
  "generation": "11th Gen",
  "areaId": "AREA-04",
  "itemId": "ITEM-004",
  "rma": "RMA-2024-002",
  "replacementDate": "2024-06-20"
}
```

**Response**: Created replacement object (201 Created)

### Update Replacement
Update an existing replacement record.

**Endpoint**: `PATCH /api/replacements/:id`

**Request Body**: Partial replacement object with fields to update

**Response**: Updated replacement object

### Delete Replacement
Remove a replacement record.

**Endpoint**: `DELETE /api/replacements/:id`

**Response**: 204 No Content

### Bulk Upload Replacements
**For Azure Data Factory Integration** - Upsert multiple replacement records in a single transaction.

**Endpoint**: `POST /api/replacements/bulk`

**Request Body**: Array of replacement objects
```json
[
  {
    "serialNumber": "RPL-987654",
    "make": "Dell",
    "model": "Latitude 5420",
    "processor": "Intel i5-1145G7",
    "ram": "8GB",
    "category": "Business",
    "hdd": "256GB SSD",
    "generation": "11th Gen",
    "areaId": "AREA-04",
    "itemId": "ITEM-004",
    "rma": "RMA-2024-002",
    "replacementDate": "2024-06-20"
  }
]
```

**Features**:
- **Composite Key**: Upserts based on `(serialNumber, areaId, itemId, rma)`
- **Transaction-Wrapped**: All inserts/updates succeed or fail together
- **Batch Processing**: Processes in batches of 500 records
- **Date Handling**: Accepts ISO date strings for replacementDate

**Response**:
```json
{
  "message": "Successfully processed 15000 replacements",
  "count": 15000
}
```

---

## Coverage Pools

### Get Coverage Pools
Retrieve all configured coverage pools.

**Endpoint**: `GET /api/coverage-pools`

**Response**: Array of coverage pool objects
```json
[
  {
    "id": "uuid",
    "name": "HP EliteBook Series",
    "description": "All HP EliteBook models",
    "filterCriteria": "{\"make\":[\"HP\"],\"model\":[\"EliteBook 840 G8\",\"EliteBook 850 G8\"]}",
    "createdOn": "2024-01-10T10:00:00Z",
    "updatedOn": "2024-01-10T10:00:00Z"
  }
]
```

### Get Coverage Pools with Statistics
Retrieve coverage pools with calculated statistics including coverage ratios, available stock counts, claims history, and run rates.

**Endpoint**: `GET /api/coverage-pools-with-stats`

**Response**: Array of coverage pool objects with statistics
```json
[
  {
    "id": "uuid",
    "name": "HP EliteBook Series",
    "description": "All HP EliteBook models",
    "filterCriteria": "{\"make\":[\"HP\"],\"model\":[\"EliteBook 840 G8\",\"EliteBook 850 G8\"]}",
    "createdOn": "2024-01-10T10:00:00Z",
    "updatedOn": "2024-01-10T10:00:00Z",
    "spareCount": 45,
    "coveredCount": 320,
    "coverageRatio": 14.06,
    "availableStockCount": 1200,
    "claimsLast6Months": 18,
    "runRate": 3.0
  }
]
```

**Calculated Fields**:
- `spareCount`: Number of spare units matching pool criteria (not retired, not reserved)
- `coveredCount`: Number of covered units matching pool criteria (active coverage only)
- `coverageRatio`: (spareCount / coveredCount) × 100
- `availableStockCount`: Number of available stock items matching pool specifications
- `claimsLast6Months`: Number of claims matching pool specifications in the configured run rate period
- `runRate`: Claims per month (claimsLast6Months / runRatePeriodMonths)

**Note**: The run rate period is configurable via the Configuration endpoint (default: 6 months)

### Create Coverage Pool
Define a new coverage pool with filter criteria.

**Endpoint**: `POST /api/coverage-pools`

**Request Body**:
```json
{
  "name": "HP EliteBook Series",
  "description": "All HP EliteBook models",
  "filterCriteria": "{\"make\":[\"HP\"],\"model\":[\"EliteBook 840 G8\",\"EliteBook 850 G8\"]}"
}
```

**Filter Criteria Format** (JSON string):
```json
{
  "make": ["HP", "Dell"],
  "model": ["EliteBook 840 G8"],
  "processor": ["Intel i7-1165G7"],
  "ram": ["16GB"],
  "category": ["Business"],
  "hdd": ["512GB SSD"],
  "generation": ["11th Gen"]
}
```

**Response**: Created coverage pool object (201 Created)

### Update Coverage Pool
Update pool name, description, or filter criteria.

**Endpoint**: `PATCH /api/coverage-pools/:id`

**Request Body**: Partial coverage pool object with fields to update

**Response**: Updated coverage pool object

### Delete Coverage Pool
Remove a coverage pool configuration.

**Endpoint**: `DELETE /api/coverage-pools/:id`

**Response**: 204 No Content

---

## Analytics

### Get Analytics Summary
Retrieve comprehensive analytics data for the dashboard.

**Endpoint**: `GET /api/analytics`

**Response**:
```json
{
  "totalSpareUnits": 1250,
  "totalCoveredUnits": 5000,
  "activeCoverage": 4250,
  "expiringCoverage": 320,
  "unallocatedSpareUnits": 850,
  "averageCoverageRatio": 12.5,
  "lowCoverageThresholdPercent": 10.0,
  "expiringCoverageDays": 30
}
```

**Field Descriptions**:
- `totalSpareUnits`: Total number of spare units in replacement pool
- `totalCoveredUnits`: Total number of units under warranty (all)
- `activeCoverage`: Number of units with non-expired warranty coverage
- `expiringCoverage`: Number of units with coverage expiring within configured days
- `unallocatedSpareUnits`: Spare units not reserved for specific cases
- `averageCoverageRatio`: Average coverage ratio across all pools
- `lowCoverageThresholdPercent`: Configured threshold for low coverage alerts
- `expiringCoverageDays`: Configured number of days for "expiring soon" alerts

---

## Configuration

### Get Configuration
Retrieve current system configuration settings.

**Endpoint**: `GET /api/configuration`

**Response**:
```json
{
  "id": "system",
  "lowCoverageThresholdPercent": 10.0,
  "expiringCoverageDays": 30,
  "poolInactivityDays": 90,
  "runRatePeriodMonths": 6,
  "enableLowCoverageAlerts": true,
  "enableExpiringAlerts": true,
  "dashboardRefreshMinutes": 5,
  "createdOn": "2024-01-01T00:00:00Z",
  "updatedOn": "2024-10-31T12:00:00Z"
}
```

### Update Configuration
Modify system configuration settings.

**Endpoint**: `PATCH /api/configuration`

**Request Body**: Partial configuration object with fields to update
```json
{
  "lowCoverageThresholdPercent": 15.0,
  "expiringCoverageDays": 45,
  "runRatePeriodMonths": 12,
  "enableLowCoverageAlerts": true
}
```

**Validation Rules**:
- `lowCoverageThresholdPercent`: 0-100
- `expiringCoverageDays`: 1-365
- `poolInactivityDays`: 1-365
- `runRatePeriodMonths`: 1-24
- `dashboardRefreshMinutes`: 1-60

**Response**: Updated configuration object

---

## Filters

### Get Filter Options
Retrieve all unique values for filter fields across spare units and covered units.

**Endpoint**: `GET /api/filters`

**Response**:
```json
{
  "makes": ["HP", "Dell", "Lenovo", "Apple"],
  "models": ["EliteBook 840 G8", "Latitude 7420", "ThinkPad X1 Carbon"],
  "processors": ["Intel i5-1135G7", "Intel i7-1165G7", "AMD Ryzen 7"],
  "rams": ["8GB", "16GB", "32GB"],
  "categories": ["Business", "Premium", "Standard"],
  "storageSizes": ["256GB SSD", "512GB SSD", "1TB SSD"],
  "generations": ["10th Gen", "11th Gen", "12th Gen"]
}
```

**Use Case**: Populate dropdown filters and multi-select options in the UI

---

## Error Responses

### Standard Error Format
All endpoints return errors in a consistent format:

```json
{
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

### HTTP Status Codes
- `200 OK`: Successful GET/PATCH request
- `201 Created`: Successful POST request creating a resource
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid request data or validation failure
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

---

## Bulk Upload Best Practices

### Data Format
- All bulk endpoints accept JSON arrays
- Date fields accept ISO 8601 format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`
- All text fields are case-sensitive for matching but stored as-is

### Performance Considerations
- **Batch Size**: All bulk endpoints process in batches of 500 records internally
- **Transaction Safety**: Each bulk upload is wrapped in a database transaction
- **Timeout**: Configure appropriate timeout values for large uploads (e.g., 80K records may take 10-15 seconds)
- **Memory**: The API has a 50MB JSON body size limit

### Azure Data Factory Integration
All bulk endpoints are designed for integration with Azure Data Factory:

1. **Spare Units**: Use `POST /api/spare-units/bulk` for daily/weekly pool updates
2. **Covered Units**: Use `POST /api/covered-units/bulk` for warranty coverage sync
3. **Available Stock**: Use `POST /api/available-stock/bulk` for full inventory refresh
4. **Claims**: Use `POST /api/claims/bulk` for claims data sync
5. **Replacements**: Use `POST /api/replacements/bulk` for replacement tracking

### Example Azure Data Factory Pipeline
```json
{
  "name": "SyncWarrantyData",
  "activities": [
    {
      "name": "UploadSpareUnits",
      "type": "Copy",
      "source": { "type": "AzureSqlSource" },
      "sink": {
        "type": "RestSink",
        "httpRequestMethod": "POST",
        "requestBody": "@activity('PrepareSpareUnitsJson').output"
      },
      "endpoint": "https://your-app.replit.app/api/spare-units/bulk"
    }
  ]
}
```

---

## Rate Limiting
Currently, no rate limiting is implemented. For production deployments, consider implementing rate limiting at the reverse proxy level.

---

## Support
For issues or questions about the API, please contact the development team or refer to the application documentation in `replit.md`.
