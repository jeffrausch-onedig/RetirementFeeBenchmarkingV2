# Domo API Integration Guide

This guide walks you through the process of obtaining Domo API credentials and connecting your benchmark dataset to the application.

## Prerequisites

- Access to your Domo instance with admin privileges
- A dataset containing retirement plan benchmark data

## Step 1: Access Domo Admin Settings

1. Log into your Domo instance at `https://[your-company].domo.com`
2. Click on the **waffle menu** (9 dots) in the top left
3. Select **Admin** from the menu
4. Navigate to **Authentication** in the left sidebar

## Step 2: Create OAuth Client

1. In the Authentication section, click on **Access Tokens**
2. Click **+ New Client** button
3. Fill in the client details:
   - **Name**: `Retirement Fee Benchmarking App`
   - **Description**: `API access for retirement fee benchmarking application`
   - **Scope**: Select `data` (this allows read access to datasets)
4. Click **Create**

## Step 3: Save Credentials

After creating the client, you'll see:
- **Client ID**: A long string like `a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6`
- **Client Secret**: A long string like `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t`

**IMPORTANT**:
- Save these credentials immediately - the Client Secret will only be shown once!
- Store them securely (password manager, secure notes, etc.)
- Never commit these to version control

## Step 4: Get Dataset ID

1. Navigate to the dataset that contains your benchmark data
2. Look at the URL in your browser - it will look like:
   ```
   https://[your-company].domo.com/datasources/[dataset-id]/details/overview
   ```
3. The `dataset-id` is the string between `/datasources/` and `/details/`
4. Copy this ID - you'll need it for the application configuration

Example:
- URL: `https://mycompany.domo.com/datasources/abc123-def456/details/overview`
- Dataset ID: `abc123-def456`

## Step 5: Configure Application

Create a `.env.local` file in the root of your project:

```env
DOMO_CLIENT_ID=your_client_id_from_step_3
DOMO_CLIENT_SECRET=your_client_secret_from_step_3
DOMO_DATASET_ID=your_dataset_id_from_step_4
DOMO_API_HOST=https://api.domo.com
```

Replace the placeholder values with your actual credentials.

## Step 6: Verify Dataset Schema

Your Domo dataset must have these columns (column names should match exactly):

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| ClientID | Text | Client identifier | "Benchmark" |
| SalesforceAccountID | Text | Salesforce account ID | "Benchmark" |
| D365AccountID | Text | Dynamics 365 account ID | "Benchmark" |
| ReportID | Text | Report identifier | "Benchmark" |
| CreationDate | Date | Date of data creation | "2024-01-01" |
| ClientName | Text | Client name | "" |
| SIC | Text | Industry code | "" |
| BenchmarkSource | Text | Source of benchmark | "FDI 2024" |
| Type | Text | Fee type | "Advisor Fee" |
| BMAssets | Text | AUM bucket | "$10-20m" |
| BMAvgBalance | Text | Avg balance bucket | "All" |
| RetirementFee25th | Decimal | 25th percentile fee (%) | 0.0019 |
| RetirementFee50th | Decimal | 50th percentile fee (%) | 0.0025 |
| RetirementFee75th | Decimal | 75th percentile fee (%) | 0.0027 |
| Assets | Decimal | (Optional) | |
| AvgBalance | Decimal | (Optional) | |
| RecordKeeperFeePrcnt | Decimal | (Optional) | |
| AdvisorFeePrcnt | Decimal | (Optional) | |
| InvestmentManagerFeePrcnt | Decimal | (Optional) | |
| TPAFeePrcnt | Decimal | (Optional) | |
| TotalPlanFeePrcnt | Decimal | (Optional) | |

### Important Notes on Data Format:

1. **Fee Types**: The `Type` column should contain one of:
   - "Advisor Fee"
   - "Record Keeper Fee"
   - "TPA Fee"
   - "Audit Fee"
   - "Total Plan Fee"

2. **AUM Buckets**: The `BMAssets` column should use this format:
   - "$0-250k"
   - "$250-500k"
   - "$500k-1m"
   - "$1-3m"
   - "$3-5m"
   - "$5-10m"
   - "$10-20m"
   - "$20-30m"
   - "$30-50m"
   - "$50-100m"
   - "$100-250m"
   - "$250m+"

3. **Percentile Values**: Should be decimal percentages
   - Example: 0.0025 = 0.25% = 25 basis points
   - NOT: 0.25 or 25

## Step 7: Test the Connection

1. Start your development server:
```bash
npm run dev
```

2. Open your browser to `http://localhost:3000`

3. Fill out the form and submit

4. Check the browser console and terminal for any API errors

## Troubleshooting

### Authentication Error (401)
- Verify your Client ID and Client Secret are correct
- Check that the OAuth client has `data` scope enabled
- Ensure credentials are in the `.env.local` file (not `.env`)

### Dataset Not Found (404)
- Verify the Dataset ID is correct
- Check that the OAuth client has permission to access this dataset
- In Domo Admin, go to the dataset and ensure it's not restricted

### Missing Data
- Verify your dataset has the required columns
- Check column names match exactly (case-sensitive)
- Ensure data is in the correct format (especially percentile values)

### CORS Errors
- If deploying to production, you may need to configure CORS settings in Domo
- Contact Domo support for help with CORS configuration

## Alternative: Using Domo Embed

If you have trouble with the API approach, consider using Domo Embed:

1. Create a Domo card/dashboard with your benchmark visualization
2. Use Domo's embed functionality to iframe the card
3. Update the application to display the Domo embed instead of custom charts

## Security Best Practices

1. **Never commit credentials**: Always use environment variables
2. **Rotate credentials periodically**: Create new OAuth clients every 90 days
3. **Limit scope**: Only grant the minimum permissions needed (`data` read access)
4. **Monitor usage**: Regularly check OAuth client usage in Domo Admin
5. **Use HTTPS**: Always use HTTPS in production

## Need Help?

Contact your Domo account representative or Domo support:
- Domo Support: https://domo.support.domo.com
- Domo Developer Portal: https://developer.domo.com
