# Bulk Upload API Documentation

## Overview
This API provides bulk upsert endpoints for Azure Data Factory (ADF) integration, allowing you to insert new records or update existing records based on a composite key. This enables **incremental data synchronization** without replacing all data.

**Base URL**: `https://your-app-domain.replit.app` (or your custom domain)

**Upsert Keys**:
- **Spare Units**: Composite key of `serialNumber` + `areaId` + `itemId`
- **Covered Units**: Composite key of `serialNumber` + `areaId` + `itemId` + `orderNumber`

If a record with the same composite key exists, it will be updated. If no matching record exists, a new record will be inserted.

### Performance Optimization

The bulk upload endpoints are optimized for high-performance data ingestion:

**Covered Units Bulk Upload Performance**:
- Uses streamlined validation schema (`bulkInsertCoveredUnitSchema`) that moves expensive validation from Zod layer to storage layer
- Date string conversion and integrity checks happen efficiently during batch processing (500 records per batch)
- For 2000 records, validation time reduced from ~6000ms to <100ms
- Storage layer validates: date format validity, start date <= end date, and recomputes coverage duration

**Key Design Decisions**:
- Standard single-record inserts use full Zod validation with `.refine()` for comprehensive data integrity
- Bulk operations optimize by moving date validation to storage layer where it's faster (single pass with conversion)
- Date strings are converted to Date objects during batch processing with inline integrity checks
- All operations maintain transactional integrity with proper error handling
- Invalid date ranges or formats throw descriptive errors with batch item index for debugging

---

## Endpoints

### 1. Bulk Upsert Spare Units

**Endpoint**: `POST /api/spare-units/bulk`

**Description**: Inserts new spare units or updates existing ones based on the composite key (serialNumber + areaId + itemId). This allows for incremental updates without losing existing data.

**Content-Type**: `application/json`

**Request Body**: Array of spare unit objects

**Maximum Payload Size**: 50 MB

#### Request Schema

```json
[
  {
    "serialNumber": "string (required, max 100 chars)",
    "areaId": "string (required, max 50 chars)",
    "itemId": "string (required, max 50 chars)",
    "make": "string (required, max 100 chars)",
    "model": "string (required, max 100 chars)",
    "processor": "string (optional, max 100 chars)",
    "generation": "string (optional, max 50 chars)",
    "ram": "string (optional, max 50 chars)",
    "hdd": "string (optional, max 50 chars)",
    "displaySize": "string (optional, max 50 chars)",
    "touchscreen": "boolean (optional, default: false)",
    "category": "string (optional, max 50 chars)",
    "reservedForCase": "string (optional, max 100 chars)",
    "retiredOrder": "string (optional, max 100 chars)",
    "currentHolder": "string (optional, max 200 chars)",
    "retiredDate": "string (optional, ISO date format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)",
    "productDescription": "string (optional)",
    "productNumber": "string (optional, max 100 chars)"
  }
]
```

#### Success Response

**Status Code**: `200 OK`

```json
{
  "message": "Spare units upserted successfully",
  "count": 150,
  "processed": 150
}
```

Note: `processed` indicates the total number of records inserted or updated.

#### Error Response

**Status Code**: `400 Bad Request` (validation error)

```json
{
  "error": "Invalid data format",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["0", "serialNumber"],
      "message": "Expected string, received number"
    }
  ]
}
```

**Status Code**: `500 Internal Server Error` (server error)

```json
{
  "error": "Failed to bulk replace spare units"
}
```

#### Example Request

```bash
curl -X POST https://your-app.replit.app/api/spare-units/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "serialNumber": "SN-001",
      "areaId": "US-WEST",
      "itemId": "ITEM-001",
      "make": "HP",
      "model": "EliteBook 840 G8",
      "processor": "Intel Core i7",
      "generation": "11th Gen",
      "ram": "16GB",
      "hdd": "512GB SSD",
      "displaySize": "14 inch",
      "touchscreen": false,
      "category": "Business",
      "productDescription": "High-performance laptop",
      "productNumber": "HP-840-001"
    }
  ]'
```

---

### 2. Bulk Upsert Covered Units

**Endpoint**: `POST /api/covered-units/bulk`

**Description**: Inserts new covered units or updates existing ones based on the composite key (serialNumber + areaId + itemId + orderNumber). This allows for incremental updates without losing existing data.

**Content-Type**: `application/json`

**Request Body**: Array of covered unit objects

**Maximum Payload Size**: 50 MB

#### Request Schema

```json
[
  {
    "serialNumber": "string (required, max 100 chars)",
    "areaId": "string (required, max 50 chars)",
    "itemId": "string (required, max 50 chars)",
    "make": "string (required, max 100 chars)",
    "model": "string (required, max 100 chars)",
    "processor": "string (optional, max 100 chars)",
    "generation": "string (optional, max 50 chars)",
    "ram": "string (optional, max 50 chars)",
    "hdd": "string (optional, max 50 chars)",
    "displaySize": "string (optional, max 50 chars)",
    "touchscreen": "boolean (optional, default: false)",
    "category": "string (optional, max 50 chars)",
    "coverageStartDate": "string (required, ISO date format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)",
    "coverageEndDate": "string (required, ISO date format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)",
    "coverageDescription": "string (optional)",
    "customerName": "string (optional, max 200 chars)",
    "customerEmail": "string (optional, max 200 chars)",
    "customerPhone": "string (optional, max 50 chars)",
    "orderNumber": "string (optional, max 100 chars)",
    "orderDate": "string (optional, ISO date format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)",
    "currentHolder": "string (optional, max 200 chars)",
    "productDescription": "string (optional)",
    "productNumber": "string (optional, max 100 chars)"
  }
]
```

**Note**: `coverageDurationDays` is automatically calculated from `coverageStartDate` and `coverageEndDate`, so it should NOT be included in the request.

#### Validation Rules

1. **Date Format**: Dates must be valid ISO 8601 strings (e.g., "2024-01-01" or "2024-01-01T00:00:00.000Z")
2. **Date Range**: `coverageStartDate` must be less than or equal to `coverageEndDate`
3. **Invalid Dates**: Malformed date strings (e.g., "invalid-date") are rejected

#### Success Response

**Status Code**: `200 OK`

```json
{
  "message": "Covered units upserted successfully",
  "count": 200,
  "processed": 200
}
```

Note: `processed` indicates the total number of records inserted or updated.

#### Error Responses

**Invalid Date String**

```json
{
  "error": "Invalid data format",
  "details": [
    {
      "code": "custom",
      "message": "Invalid date string",
      "path": ["0", "coverageStartDate"]
    }
  ]
}
```

**Start Date After End Date**

```json
{
  "error": "Invalid data format",
  "details": [
    {
      "code": "custom",
      "message": "Coverage start date must be before or equal to end date",
      "path": ["0", "coverageEndDate"]
    }
  ]
}
```

#### Example Request

```bash
curl -X POST https://your-app.replit.app/api/covered-units/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "serialNumber": "COV-001",
      "areaId": "US-EAST",
      "itemId": "ITEM-COV-001",
      "make": "Dell",
      "model": "Latitude 7420",
      "processor": "Intel Core i5",
      "generation": "11th Gen",
      "ram": "8GB",
      "hdd": "256GB SSD",
      "displaySize": "14 inch",
      "touchscreen": true,
      "category": "Business",
      "coverageStartDate": "2024-01-01",
      "coverageEndDate": "2025-01-01",
      "coverageDescription": "Standard warranty coverage",
      "customerName": "Acme Corporation",
      "customerEmail": "it@acme.com",
      "customerPhone": "+1-555-0100",
      "orderNumber": "ORD-2024-001",
      "orderDate": "2023-12-15",
      "productDescription": "Deployed to sales team",
      "productNumber": "DELL-LAT-001"
    }
  ]'
```

---

## Azure Data Factory Integration Guide

### Prerequisites

1. **API Endpoint URL**: Your deployed application URL (e.g., `https://your-app.replit.app`)
2. **Source Data**: Data must be in JSON format with the correct schema
3. **ADF Linked Service**: HTTP linked service configured

### Step-by-Step Setup

#### 1. Create HTTP Linked Service

1. In Azure Data Factory Studio, go to **Manage** > **Linked services**
2. Click **+ New**
3. Search for and select **HTTP**
4. Configure the linked service:
   - **Name**: `BulkUploadAPI`
   - **Base URL**: `https://your-app.replit.app`
   - **Authentication type**: Anonymous (or configure if you add authentication)
   - Click **Create**

#### 2. Create Source Dataset (JSON)

1. Go to **Author** > **Datasets**
2. Click **+ New dataset**
3. Select **Azure Blob Storage** or **Azure Data Lake Storage Gen2** (where your source data is)
4. Choose **JSON** format
5. Configure:
   - **Name**: `SourceSpareUnitsJSON` (or `SourceCoveredUnitsJSON`)
   - **Linked service**: Your storage account
   - **File path**: Path to your JSON file
   - Click **OK**

#### 3. Create Sink Dataset (REST)

1. Click **+ New dataset**
2. Search for and select **REST**
3. Configure:
   - **Name**: `SpareUnitsBulkAPI`
   - **Linked service**: Select the `BulkUploadAPI` linked service created earlier
   - **Relative URL**: `/api/spare-units/bulk`
   - **Request method**: POST
   - Click **OK**

Repeat for covered units with:
- **Name**: `CoveredUnitsBulkAPI`
- **Relative URL**: `/api/covered-units/bulk`

#### 4. Create Pipeline

1. Go to **Author** > **Pipelines**
2. Click **+ New pipeline**
3. Name it `BulkUploadSpareUnits`

#### 5. Add Copy Activity

1. From the **Activities** toolbox, drag **Copy data** activity to the canvas
2. Configure the **Source** tab:
   - **Source dataset**: Select `SourceSpareUnitsJSON`
   - **File format settings**: Ensure JSON format is selected
3. Configure the **Sink** tab:
   - **Sink dataset**: Select `SpareUnitsBulkAPI`
   - **Request method**: POST
   - **Additional headers**:
     ```
     Content-Type: application/json
     ```
   - **Request body**: Leave empty (data from source will be used)
4. Configure the **Mapping** tab:
   - Ensure column mappings match the API schema
   - Map source columns to the required fields

#### 6. Pipeline Configuration for Error Handling

Add error handling to your pipeline:

1. Add a **Set Variable** activity after the Copy activity
2. Configure it to capture the copy activity output
3. Add a **Web** activity for error notifications (optional)

**Example Pipeline JSON** (simplified):

```json
{
  "name": "BulkUploadSpareUnits",
  "properties": {
    "activities": [
      {
        "name": "CopySpareUnits",
        "type": "Copy",
        "inputs": [
          {
            "referenceName": "SourceSpareUnitsJSON",
            "type": "DatasetReference"
          }
        ],
        "outputs": [
          {
            "referenceName": "SpareUnitsBulkAPI",
            "type": "DatasetReference"
          }
        ],
        "typeProperties": {
          "source": {
            "type": "JsonSource",
            "storeSettings": {
              "type": "AzureBlobStorageReadSettings"
            }
          },
          "sink": {
            "type": "RestSink",
            "httpRequestTimeout": "00:10:00",
            "requestMethod": "POST",
            "additionalHeaders": "Content-Type: application/json"
          }
        }
      }
    ]
  }
}
```

### Data Preparation in ADF

Before sending to the API, ensure your data matches the schema. Use **Data Flow** if transformation is needed:

#### Example: Prepare Covered Units Data

1. Create a **Data Flow**
2. Add a **Source** transformation pointing to your raw data
3. Add a **Derived Column** transformation to format dates:
   ```
   coverageStartDate: toString(coverageStartDate, 'yyyy-MM-dd')
   coverageEndDate: toString(coverageEndDate, 'yyyy-MM-dd')
   orderDate: toString(orderDate, 'yyyy-MM-dd')
   ```
4. Add a **Select** transformation to map column names to API schema
5. Add a **Sink** transformation to output as JSON

### Alternative: Web Activity Method

If you prefer more control, use the **Web Activity** instead of Copy Activity:

1. Add a **Web Activity** to your pipeline
2. Configure:
   - **URL**: `https://your-app.replit.app/api/spare-units/bulk`
   - **Method**: POST
   - **Headers**:
     ```json
     {
       "Content-Type": "application/json"
     }
     ```
   - **Body**: 
     ```json
     @activity('GetSourceData').output.value
     ```
3. This gives you more control over request formatting and error handling

### Best Practices

1. **Batch Size**: The API handles up to 50MB per request. For very large datasets (>10,000 records), consider splitting into multiple files and running the pipeline sequentially.

2. **Transaction Safety**: Each bulk upload is atomic. If you're uploading both spare units and covered units, run them as separate activities. If one fails, the other will still succeed.

3. **Validation Before Upload**: 
   - Use ADF Data Flow to validate date formats
   - Check for required fields
   - Ensure start dates are before end dates for covered units

4. **Error Handling**:
   - Configure retry policies in ADF (2-3 retries with exponential backoff)
   - Set up email notifications for failures
   - Log the API response for troubleshooting

5. **Scheduling**:
   - Run during off-peak hours if possible
   - Use ADF triggers to schedule daily/weekly uploads
   - Consider setting up a tumbling window trigger for incremental processing

6. **Testing**:
   - Start with a small sample dataset (10-20 records)
   - Verify data appears correctly in the application UI
   - Check the dashboard analytics to confirm counts

### Monitoring

Monitor your pipeline runs in ADF:

1. Go to **Monitor** > **Pipeline runs**
2. Check the status of each activity
3. View the **Input** and **Output** of the Copy/Web activity to see:
   - Request payload sent
   - Response received from API
   - Error messages if validation fails

### Troubleshooting

| Issue | Solution |
|-------|----------|
| 400 Bad Request | Check the error details in ADF output. Verify date formats and required fields. |
| 500 Internal Server Error | Contact support. Check server logs for transaction rollback issues. |
| Timeout | Reduce batch size. Increase timeout in Web Activity settings. |
| Date validation errors | Ensure dates are in ISO format (YYYY-MM-DD). Use Data Flow to format dates. |
| Start > End date error | Add validation in Data Flow to filter/fix invalid date ranges before upload. |

### Sample ADF Pipeline with Full Error Handling

```json
{
  "name": "BulkUploadWithErrorHandling",
  "properties": {
    "activities": [
      {
        "name": "ValidateAndUploadSpareUnits",
        "type": "Copy",
        "dependsOn": [],
        "policy": {
          "timeout": "0.00:10:00",
          "retry": 2,
          "retryIntervalInSeconds": 30
        },
        "typeProperties": {
          "source": {
            "type": "JsonSource"
          },
          "sink": {
            "type": "RestSink",
            "httpRequestTimeout": "00:10:00",
            "requestMethod": "POST"
          },
          "enableStaging": false
        },
        "inputs": [
          {
            "referenceName": "SourceSpareUnitsJSON",
            "type": "DatasetReference"
          }
        ],
        "outputs": [
          {
            "referenceName": "SpareUnitsBulkAPI",
            "type": "DatasetReference"
          }
        ]
      },
      {
        "name": "LogSuccess",
        "type": "SetVariable",
        "dependsOn": [
          {
            "activity": "ValidateAndUploadSpareUnits",
            "dependencyConditions": ["Succeeded"]
          }
        ],
        "typeProperties": {
          "variableName": "uploadStatus",
          "value": {
            "value": "@activity('ValidateAndUploadSpareUnits').output",
            "type": "Expression"
          }
        }
      },
      {
        "name": "NotifyOnFailure",
        "type": "WebHook",
        "dependsOn": [
          {
            "activity": "ValidateAndUploadSpareUnits",
            "dependencyConditions": ["Failed"]
          }
        ],
        "typeProperties": {
          "url": "https://your-notification-webhook-url",
          "method": "POST",
          "body": {
            "error": "@activity('ValidateAndUploadSpareUnits').error",
            "pipeline": "@pipeline().Pipeline",
            "runId": "@pipeline().RunId"
          }
        }
      }
    ]
  }
}
```

---

## Testing Your Integration

### Test with Sample Data

Create a test JSON file with 2-3 records:

**spare-units-test.json**:
```json
[
  {
    "serialNumber": "TEST-001",
    "areaId": "TEST-AREA",
    "itemId": "TEST-ITEM-001",
    "make": "HP",
    "model": "EliteBook 840",
    "processor": "Intel Core i7",
    "generation": "11th Gen",
    "ram": "16GB",
    "hdd": "512GB SSD",
    "displaySize": "14 inch",
    "touchscreen": false,
    "category": "Business",
    "productDescription": "Test spare unit",
    "productNumber": "HP-TEST-001"
  }
]
```

Upload this file to your blob storage and run your ADF pipeline. Check:
1. Pipeline run succeeds
2. API returns 200 with correct count
3. Data appears in the application UI

---

## Support

For issues or questions:
1. Check the error response details for specific validation errors
2. Review ADF pipeline activity outputs
3. Verify your JSON data matches the schema exactly
4. Test with a small sample dataset first

### Common Schema Mapping

If your source data has different column names, map them in ADF:

| Source Column | API Field |
|---------------|-----------|
| SN | serialNumber |
| Area | areaId |
| Item | itemId |
| Manufacturer | make |
| ModelName | model |
| CPU | processor |
| CPUGen | generation |
| Memory | ram |
| Storage | hdd |
| ScreenSize | displaySize |
| IsTouchscreen | touchscreen |
| Type | category |
| Description | productDescription |
| PartNumber | productNumber |
| StartDate | coverageStartDate |
| EndDate | coverageEndDate |
| Customer | customerName |
| Email | customerEmail |
| Phone | customerPhone |
| OrderNo | orderNumber |
| OrderDt | orderDate |

---

## API Rate Limits

Current limits:
- **Payload Size**: 50 MB per request
- **Concurrent Requests**: No enforced limit (but use reasonable concurrency)
- **Timeout**: 10 minutes per request

For datasets larger than 50MB, split into multiple files and run sequentially.
