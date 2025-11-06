# Guidewire CDA Table ID Research and Findings

## Research Question
Why are there multiple claim, policy, and invoicing tables with different numeric IDs (e.g., claim_401000005, claim_501000001, etc.)?

## Summary of Findings

**The table IDs represent different entity instances or datasets within each entity type**, each with:
- Different schemas (different column counts and structures)
- Different data volumes (ranging from 650 to 75,000 records)
- Different time periods (last updated between May 2023 and February 2026)
- Separate tracking in the CDA manifest.json file

## Evidence Collected

### 1. Schema Analysis

**Finding**: Tables with different IDs have **different schemas**

**Example - Claim Tables**:

`claim_401000005` (6 columns):
- claimNumber
- policyNumber
- claimAmount
- claimStatus
- claimantFirstName
- claimantLastName

`claim_501000001` (13 columns):
- All 6 columns from claim_401000005, PLUS:
- incidentDate
- reportedDate
- claimType
- adjusterId
- severity
- estimatedAmount
- state

**Conclusion**: The 401 series has a simplified schema, while the 501 series has an extended schema with additional fields.

---

### 2. Manifest Analysis

**Finding**: Each table is registered in `s3://sumanmisra/cda/manifest.json` with unique metadata

**Complete Manifest Data**:

#### CLAIM Tables (5 tables)

| Table ID | Last Updated | Records | Schema ID |
|----------|-------------|---------|-----------|
| claim_401000005 | 2026-02-05 | 10,000 | 401000005 |
| claim_501000001 | 2023-05-03 | 1,600 | 501000001 |
| claim_501000002 | 2023-05-05 | 18,000 | 501000002 |
| claim_501000003 | 2023-05-07 | 50,000 | 501000003 |
| claim_501000004 | 2023-05-09 | 8,400 | 501000004 |

#### INVOICING Tables (3 tables)

| Table ID | Last Updated | Records | Schema ID |
|----------|-------------|---------|-----------|
| invoicing_401000005 | 2026-02-05 | 10,000 | 401000005 |
| invoicing_601000001 | 2023-05-03 | 2,200 | 601000001 |
| invoicing_601000002 | 2023-05-05 | 26,400 | 601000002 |

#### POLICY_HOLDERS Tables (5 tables)

| Table ID | Last Updated | Records | Schema ID |
|----------|-------------|---------|-----------|
| policy_holders_401000001 | 2023-05-03 | 650 | 401000001 |
| policy_holders_401000002 | 2023-05-05 | 13,600 | 401000002 |
| policy_holders_401000003 | 2023-05-07 | 75,000 | 401000003 |
| policy_holders_401000004 | 2023-05-09 | 13,000 | 401000004 |
| policy_holders_401000005 | 2026-02-05 | 10,000 | 401000005 |

---

### 3. Data Volume Analysis

**Finding**: Each table ID has significantly different data volumes

**Key Observations**:
- **501 series claims**: Range from 1,600 to 50,000 records
- **601 series invoicing**: Range from 2,200 to 26,400 records
- **401 series**: Consistent 10,000 records across all entity types (likely test data)

---

### 4. Temporal Analysis

**Finding**: Tables have different update timestamps

**Time Groupings**:
- **May 2023 batch**: Most 501/601 series tables (May 3-9, 2023)
- **Future date (Feb 2026)**: All 401000005 tables (likely placeholder or test data)

**Pattern**: The 501/601 series tables were created within a 6-day window in May 2023, suggesting they represent a specific processing batch or data migration event.

---

### 5. Storage Pattern Analysis

**Finding**: All tables share common data file locations by entity type

From manifest.json:
- All claim tables: `s3://sumanmisra/cda/claim/`
- All invoicing tables: `s3://sumanmisra/cda/invoicing/`
- All policy_holders tables: `s3://sumanmisra/cda/policy_holders/`

**But**: Each table has a subdirectory matching its ID:
- `s3://sumanmisra/cda/claim/401000005/`
- `s3://sumanmisra/cda/claim/501000001/`
- etc.

---

## Interpretation and Conclusions

### What the Table IDs Represent

Based on the evidence, the table IDs represent **different entity instances or datasets**, NOT time-based snapshots. Here's why:

1. **Different Schemas**: Time-based snapshots would have the same schema. These have different column structures.

2. **Parallel Existence**: All tables coexist and are independently maintained. They're not versions of each other.

3. **Schema History Tracking**: Each table has its own `schemaHistory` entry in the manifest with a unique schema ID matching the table ID.

4. **Independent Record Counts**: Vastly different record counts (650 to 75,000) suggest different datasets, not temporal versions.

### Table ID Prefix Meanings

#### 401 Series
- **Appears in**: All entity types (claim, invoicing, policy_holders)
- **Pattern**: Only one table per entity type (401000005)
- **Characteristics**:
  - Simple schema (6 columns for claims)
  - Consistent 10,000 records
  - Future timestamp (2026-02-05) - likely test data
- **Conclusion**: **Test/reference dataset** used across all entity types

#### 501 Series
- **Appears in**: Claims only
- **Pattern**: 4 sequential tables (501000001-501000004)
- **Characteristics**:
  - Extended schema (13 columns)
  - Variable record counts (1.6K - 50K)
  - May 2023 timestamps
- **Conclusion**: **Production claim data batch** from a specific time period or source system

#### 601 Series
- **Appears in**: Invoicing only
- **Pattern**: 2 sequential tables (601000001-601000002)
- **Characteristics**:
  - May 2023 timestamps
  - Variable record counts (2.2K - 26.4K)
- **Conclusion**: **Production invoicing data batch** from a specific time period or source system

### Most Likely Scenario

The table IDs represent **different source systems, environments, or entity instances** within Guidewire:

**Possible Interpretations**:

1. **Different Guidewire Instances**:
   - 401 = Development/Test environment
   - 501 = Production environment (Claims Center)
   - 601 = Production environment (Billing Center)

2. **Different Business Units**:
   - Each ID could represent a different business unit, region, or product line
   - Example: 501000001 = Auto Claims, 501000002 = Home Claims, etc.

3. **Different Data Migration Batches**:
   - Each ID represents a batch of data migrated from a legacy system
   - The May 2023 timestamps suggest a one-time migration event

4. **Different Entity Instances**:
   - In Guidewire terminology, these could be different "policy centers" or "claim centers"
   - Each center operates independently with its own data and schema

---

## Architecture Implications

### How the System Works

1. **Guidewire CDA Export**:
   - Exports data to `s3://sumanmisra/cda/{entity}/{id}/`
   - Creates parquet files with timestamps for each export
   - Updates `cda/manifest.json` with metadata

2. **Your Processing Pipeline**:
   - Reads `cda/manifest.json` to discover available tables
   - Processes each table independently (using Ray parallel processing)
   - Creates Delta tables in `s3://sumanmisra/target/{entity}_{id}/`

3. **Delta Lake Storage**:
   - Each table ID gets its own Delta table
   - Transaction logs track changes independently
   - Tables can be queried separately or unioned if needed

### Why This Design?

**Benefits**:
- **Isolation**: Issues in one dataset don't affect others
- **Parallel Processing**: Can process multiple tables simultaneously
- **Schema Flexibility**: Different schemas for different use cases
- **Independent Evolution**: Each table can evolve independently
- **Audit Trail**: Separate transaction history for each dataset

---

## Recommendations

### For Data Analysis

1. **Understand Your Data Sources**: Clarify with your Guidewire team what each ID series represents

2. **Union Carefully**: When combining tables:
   ```sql
   -- Only union tables with identical schemas
   SELECT * FROM delta.`s3://sumanmisra/target/claim_501000001/`
   UNION ALL
   SELECT * FROM delta.`s3://sumanmisra/target/claim_501000002/`
   -- Note: claim_401000005 has different schema!
   ```

3. **Document Mappings**: Create a reference document mapping table IDs to:
   - Source system
   - Business unit
   - Environment (dev/test/prod)
   - Purpose

### For Delta Inspector

Consider adding features to:
1. Display manifest metadata in the UI
2. Group tables by ID prefix
3. Show schema differences between related tables
4. Highlight test vs production tables

### For Future Research

Questions to investigate:
1. What Guidewire product/center does each ID represent?
2. Are new IDs created over time, or is this a static set?
3. Should the 401 series (test data) be processed differently?
4. Can/should tables with different schemas be unified?

---

## Technical Details

### Manifest File Structure

Location: `s3://sumanmisra/cda/manifest.json`

Format:
```json
{
  "claim_401000005": {
    "lastSuccessfulWriteTimestamp": "1770313600000",
    "totalProcessedRecordsCount": 10000,
    "dataFilesPath": "s3://sumanmisra/cda/claim/",
    "schemaHistory": {
      "401000005": "1770313600000"
    }
  }
}
```

### Guidewire Processor Behavior

Based on the `guidewire_cda_delta_clone` package:

1. Reads `{manifest_location}/manifest.json`
2. Filters to requested table_names (or processes all)
3. For each table:
   - Reads parquet files from `{dataFilesPath}/{table_id}/`
   - Applies schema from schemaHistory
   - Writes to Delta table at `{target_location}/{entity}_{id}/`
4. Updates watermarks and processing metadata

### Schema Evolution

The `schemaHistory` field tracks when schemas change:
```json
"schemaHistory": {
  "401000005": "1770313600000"
}
```

This suggests the system supports schema evolution, allowing columns to be added/removed over time while maintaining compatibility.

---

## Conclusion

**The multiple tables for each entity type exist because they represent different datasets, not temporal versions.** Each table ID corresponds to:

- A different data source or system
- Different schema requirements
- Independent data volumes and update schedules
- Separate tracking in the manifest

The 401 series appears to be test/reference data (same structure across entities, future dates), while the 501/601 series represent production data from specific systems or business units.

**To definitively answer "what do these IDs mean"**, you need to consult:
1. Your Guidewire implementation documentation
2. The team that configured the CDA export process
3. Business requirements that drove this multi-table architecture

---

*Research completed: 2025-10-15*
*Data sources: S3 bucket analysis, Delta table inspection, manifest.json parsing, Guidewire package examination*
