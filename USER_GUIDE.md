# Sales Studio User Guide

Welcome to **Sales Studio**—your centralized platform for managing client relationships and health insurance quotes. This guide walks you through all major features and user flows.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [The Dashboard](#the-dashboard)
3. [Managing Clients](#managing-clients)
4. [Working with Quotes](#working-with-quotes)
5. [Uploading & Managing Files](#uploading--managing-files)
6. [Processing Census Data](#processing-census-data)
7. [Team Collaboration](#team-collaboration)
8. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

When you log into Sales Studio, you land on the **Dashboard**—your central hub for managing all clients and quotes.

### What You Can Do Here
- View all your clients at a glance
- Add new clients
- Search for specific clients
- Bookmark your most important clients
- Dive into detailed client work

---

## The Dashboard

### Main Client Table

The dashboard displays a comprehensive table of all clients with the following columns:

| Column | What It Shows |
|--------|---------------|
| **Client Name** | The company or individual you're quoting |
| **Email** | Primary contact email address |
| **Quote Status** | Combined status showing progress on both PEO and ACA quotes (e.g., "Intake" or "Proposal Ready") |
| **Documents** | Completeness percentage of required files uploaded |
| **Actions** | Button to manage the client |

### Searching & Sorting

- **Search**: Type in the search box to find clients by name or email (real-time filtering)
- **Sort**: Click column headers to sort:
  - **Name**: A-Z or Z-A
  - **Status**: Latest updates first
  - **Documents**: Highest to lowest completeness
  - **Recent**: Newest clients first

### Bookmarking Clients

Click the **star icon** next to any client name to bookmark them. Bookmarked clients appear in a pinned section at the top for quick access.

### Quick Client Info

Click anywhere on a client row to expand and see:
- Quote status details for PEO and ACA
- Document completeness percentage
- Recent activity snippets
- Last modified date

---

## Managing Clients

### Adding a New Client

1. Click the **"+ Add Client"** button at the top of the dashboard
2. Fill in the client information:
   - **Name** (required): Company or individual name
   - **Email** (optional): Primary contact email
   - **Notes** (optional): Any initial notes (scope, contact person, etc.)
3. Click **"Create Client"**
4. The new client appears in your table and is ready for quote work

### Editing Client Information

From the client detail page:
1. Click the **pencil icon** in the client header
2. Edit the name, email, or notes
3. Click **"Save Changes"**

### Archiving or Deleting Clients

From the client detail page:
1. Click the **three-dot menu** in the client header
2. Select **"Archive Client"** (soft delete—data preserved) or **"Delete Client"** (permanent)
3. Confirm the action

### Bookmarking Clients

- Click the **star icon** anywhere (dashboard or client detail page) to bookmark
- Bookmarked clients appear in a pinned section on the dashboard
- Useful for your most active or priority clients

---

## Working with Quotes

Each client has **two independent quotes**: one for **PEO** and one for **ACA**. You manage them separately but in the same client workspace.

### Understanding the Quote Pipeline

Both PEO and ACA quotes move through a **7-stage pipeline**:

1. **Not Started**: Initial state; no work has begun
2. **Intake**: Gathering client information and requirements
3. **Underwriting**: Analyzing census data and risk
4. **Proposal Ready**: Quote proposal prepared and reviewed
5. **Presented**: Quote shown to client
6. **Accepted**: Client approved the quote
7. **Declined**: Client rejected; opportunity closed

### Creating a Quote

1. Navigate to the client detail page
2. Find the **PEO Quote** or **ACA Quote** card
3. Click **"Start Quote"**
4. The quote status is set to "Not Started" and ready for movement through the pipeline

### Updating Quote Status

1. Click the quote status card (e.g., "Not Started")
2. A dialog appears showing the current status
3. Click on the next status in the pipeline
4. (Optional) Add a note explaining the status change (e.g., "Client provided employee roster")
5. Click **"Update Status"**
6. The quote moves forward and a timestamp is recorded

### Blocking a Quote

If a quote can't progress due to missing information or external dependencies:

1. Click the quote status card
2. Toggle **"Block This Quote"**
3. Enter a reason (e.g., "Awaiting final payroll data from client")
4. Click **"Save"**
5. The quote card displays a red "Blocked" badge until unblocked

### Assigning Quotes to Team Members

1. Click the quote status card
2. In the **"Assigned Analyst"** field, type the team member's name
3. Their name appears on the card so everyone knows who owns this quote

### Viewing Quote History

1. Click the quote status card
2. Scroll down to see **"Status History"**
3. View every status change with:
   - Who made the change
   - When it happened
   - Any notes added
   - The specific statuses involved

---

## Uploading & Managing Files

The **Document Center** is where you upload and organize all supporting files for the client—census data, contracts, plan summaries, and more.

### Uploading Files

#### Drag-and-Drop Method
1. Scroll to the **Document Center** section
2. Drag files directly onto the **upload zone** (or click to browse)
3. Select one or multiple files
4. Files begin uploading with a progress indicator

#### After Upload
1. Each file appears in the file list
2. System auto-detects the **category** based on filename:
   - Census data (e.g., "census.xlsx")
   - Plan summaries
   - Claims history
   - Renewal letters
   - Proposals
   - Contracts
   - Other
3. If a file matches census data patterns (contains columns like "DOB," "Salary," "Zip," "Plan Tier," "Coverage"), it's flagged for census processing

### File Organization

Files are organized in **two tabs**:

#### Files Tab
- List of all uploaded documents
- Shows name, upload date, uploader, category, and team badges

#### Requirements Checklist Tab
- View all required vs. optional documents
- Track which documents are still needed
- Specific requirements vary by quote type (PEO vs. ACA)

### Filtering & Finding Files

Use the filter dropdowns to find specific files:

- **Category Filter**: All | Census | Plan Summary | Claims History | Renewal Letter | Proposal | Contract | Other
- **Team Filter**: All | PEO | ACA

Example: Filter to "Category: Plan Summary" to see all plan documents in one place.

### Working with Files

Each file has the following actions available:

| Action | Purpose |
|--------|---------|
| **Verify** | Mark file as reviewed and approved (your name is recorded as verifier) |
| **Comment** | Add a note or question about the file |
| **Download** | Download the file to your computer |
| **Delete** | Remove the file (permanent) |

### File Metadata

Each file shows:
- **Name**: Click to download
- **Category**: Auto-detected or manually set
- **Date Uploaded**: When the file was added
- **Uploader**: Team member who uploaded
- **Team Badges**: Which teams need it (PEO, ACA, or both)
- **Required Badge**: Shows if file is required (not optional)
- **Verified Badge**: Green checkmark if approved by a team member

---

## Processing Census Data

Census data (employee rosters) is the most critical component. Sales Studio automatically detects and processes census files with sophisticated validation.

### What is Census Data?

Census data is an **employee roster file** (Excel or CSV) containing employee information such as:
- Employee names
- Dates of birth
- Zip codes
- Salary information
- Hire dates
- Hours per week
- Coverage tiers

### Uploading Census Data

1. Upload your census file via the **Document Center**
2. System checks the file for census indicators (column headers like "DOB," "Salary," "Plan Tier," "Coverage")
3. If detected as census, a dialog appears: **"This looks like census data. Would you like to process it?"**
4. Click **"Yes, Import"** to proceed

### Previewing Before Import

Before committing census data:

1. **Column Mapping Preview** shows detected columns:
   - System lists all detected fields
   - Columns marked with ✓ match expected fields
   - Columns marked with ⚠ may need review
2. **Sample Data** shows first few employee rows
3. Review the data for accuracy, then click **"Confirm Import"**

### Understanding Census Validation

Once imported, census data is automatically validated against **two standards**:

#### PEO Requirements
The employee data must have:
- Employee Name ✓
- Date of Birth ✓
- Zip Code ✓
- Salary ✓
- Coverage Tier ✓

#### ACA Requirements
In addition to PEO requirements, must also have:
- Hire Date ✓
- Hours Per Week ✓

### Viewing Validation Results

The **Census Tab** in the right panel shows a **Validation Summary** with:

- **PEO Quality Score**: 0-100% (percentage of rows meeting PEO requirements)
- **ACA Quality Score**: 0-100% (percentage of rows meeting ACA requirements)
- **Issues Found**: Count by type:
  - Missing columns (fields not in the file at all)
  - Missing values (fields present but empty for some rows)
  - Invalid values (data in wrong format)
- **Affected Rows**: How many rows have issues

### Exploring the Census Table

Below the validation summary is an **interactive census table** displaying all employee records:

#### Row Colors
- **Green rows**: All data valid ✓
- **Yellow rows**: Has one or more data issues ⚠

#### Cell Colors
- **Red cells**: Missing value (empty field)
- **Yellow cells**: Invalid format (e.g., birthdate in wrong format)
- **White cells**: Valid data ✓

#### Navigation & Filtering

- **Page Through Data**: Use pagination controls to view all rows (shown 50 per page)
- **Filter by Status**: Dropdown to filter:
  - "All Rows": See everything
  - "Valid Rows Only": Green rows only
  - "Rows with Issues": Yellow rows only
- **Hover for Details**: Hover over a red or yellow cell to see the specific issue in a tooltip

### Requesting Missing Information

When you find census issues, you can quickly notify the client:

1. Click **"Request Missing Info"** button (in the validation summary)
2. A dialog opens pre-populated with detected issues:
   - Lists specific fields that are missing or invalid
   - Identifies which rows are affected
   - Pre-populates a request template
3. Customize the request if needed
4. Click **"Send Request"** to notify the client
5. Client receives a list of exactly what you need and can provide corrections

### Managing Multiple Census Versions

#### Census History Tab

Clients often send updated census data multiple times. Track all versions:

1. Click the **"Census History"** tab
2. View a list of all census uploads with:
   - Upload date and time
   - File name
   - Row count
   - Current status (is this the active version?)
3. Click to expand any version and see its validation details

#### Switching Between Versions

- Use the **dropdown menu** at the top of the Active Census section to select a different version
- The census table updates to show that version's data
- Only one census can be "active" at a time

#### Comparing Two Versions

1. Click the **"Compare"** button in the Census History tab
2. Select two versions from the dropdown menus
3. View their validation scores side-by-side
4. See what changed between versions

#### Cloning Census to Another Client

If two clients have very similar employee data:

1. Open the **census detail** for the source client
2. Click **"Clone Census"**
3. Select the destination client
4. Click **"Clone"**
5. The destination client gets a copy of this census version (marked as "Cloned from [source client]")

### Quality Trends

As you collect multiple census versions over time, track improvement:

1. Click the **"Quality Trend"** tab
2. View a **chart** showing PEO and ACA quality scores across all versions
3. See a **data table** with:
   - Version number
   - Upload date
   - File name
   - Row count
   - Quality scores (color-coded)

This helps you see if the client is providing cleaner data over time.

### Best Practices for Census Data

- **Upload often**: New versions create a trail of progress
- **Compare versions**: Use the comparison feature to track what changed
- **Request early**: Use "Request Missing Info" as soon as you spot issues
- **Review regularly**: Check quality scores as new versions arrive
- **Document issues**: Leave comments on census to explain what you need from client

---

## Team Collaboration

### Comments & Activity Feed

The **Activity Feed** on the right side shows all client activity and allows team collaboration.

#### Viewing Comments

1. Scroll to the **Comments** section on the right panel
2. See all comments in chronological order (newest first)
3. Each comment shows:
   - Author name and team (PEO, ACA, or Sales)
   - Comment text
   - Timestamp
   - "Resolved" status (checked or unchecked)

#### Filtering Comments

- **By Team**: Click tabs to show only comments from PEO, ACA, Sales, or all teams
- **Search**: Use the search box to find comments by keyword

#### Adding a Comment

1. Click the **"Add Comment"** button at the bottom
2. Enter your comment text
3. Select your team (PEO, ACA, or Sales) from the dropdown
4. Click **"Post"**
5. Your comment appears in the feed with your name and team
6. Other team members can see and respond

#### Marking Comments as Resolved

Once you've addressed a comment:

1. Hover over the comment
2. Click the **checkbox** to mark as resolved
3. Resolved comments are visually distinguished (grayed out)
4. Click again to unresolve if needed

### Information Requests

Formal way to request specific information from a client.

#### Creating a Request

1. Click **"Create Request"** in the Outstanding Requests panel
2. Select which quotes need information:
   - PEO Quote
   - ACA Quote
   - Both
3. Add specific items requested:
   - Type in each item (e.g., "Updated payroll for 2024")
   - Mark if item has been received
4. (Optional) Add notes for context
5. Click **"Send Request"**

#### Automatic Pre-Population

When you click **"Request Missing Info"** from the census validation summary, the dialog is pre-populated with:
- Detected missing or invalid fields
- Affected row counts
- Suggested request text

#### Tracking Request Status

1. View **Outstanding Requests** panel at top of client detail
2. Each request shows:
   - Date requested
   - Quote type(s)
   - Status: Pending | Received | Cancelled
   - List of items with checkmarks for received items
3. Click to expand and see notes
4. Mark items as received as client provides them

#### Sending Reminders

1. Click on a request
2. If it's past due, click **"Send Reminder"**
3. Client receives notification that you're waiting

---

## Tips & Best Practices

### For PEO Teams

- **Focus on PEO quality scores** in the census validation
- **Request in order**: Employee name → DOB → Zip → Salary → Coverage Tier
- **Use comparison mode** to see if client data is improving
- **Filter census to "Issues Only"** to focus on what needs fixing
- **Leave detailed comments** explaining what format you need (e.g., "DOB in MM/DD/YYYY format")

### For ACA Teams

- **Check ACA quality scores** (which include PEO requirements plus Hire Date and Hours)
- **Coordinate with PEO team** on missing data—they often work on the same client
- **Request hire dates and hours early** since client may not track these regularly
- **Flag hiring date issues** as these determine eligibility

### For Sales Teams

- **Bookmark key accounts** for fast access on the dashboard
- **Upload all supporting documents** promptly (plans, claims history, contracts)
- **Mark documents as verified** once reviewed
- **Use the Requirements Checklist** to ensure nothing is missing before presenting quote
- **Leave comments in Sales context** to keep the audit trail clear
- **Monitor quote status** to ensure both PEO and ACA are progressing together

### For Everyone

- **Use status notes**: When updating quote status, add context (e.g., "Waiting for client payroll data")
- **Check history regularly**: View status history to see who did what and when
- **Create requests proactively**: Don't wait until you're blocked—ask early
- **Comment on files**: Use file comments for specific document questions (not general comments)
- **Filter & search**: Use filters to focus on what you need right now
- **Track multiple versions**: Keep census history clean; it's your proof of progress
- **Respond to comments**: Even just an emoji reaction helps team communication
- **Archive old clients**: Clean up your dashboard by archiving closed deals

---

## Keyboard Shortcuts & Quick Tips

- **Search on Dashboard**: Ctrl/Cmd + K to focus search box
- **Expand Client Row**: Click anywhere on the row (except buttons)
- **Filter Tabs**: Quickly switch between Files | Requirements Checklist tabs
- **Pagination**: Use arrow buttons to navigate large census tables
- **Cell Details**: Hover over red/yellow cells in census to see issue details
- **Download Files**: Click file name to download
- **Quick Add**: "+ Add Client" button is always at the top of dashboard

---

## Troubleshooting

### Census Not Detected as Data
**Problem**: Uploaded a file but system didn't recognize it as census data.

**Solution**:
- Ensure file has standard column headers (DOB, Date of Birth, Salary, Zip Code, Hire Date, Hours, Coverage Tier, Plan Tier, etc.)
- System uses keyword matching; non-standard header names may not trigger detection
- You can manually flag it as census in the file properties

### Quality Scores Not Improving
**Problem**: Sent request to client, but new census still has low quality scores.

**Solution**:
- Review the specific issues in the census table (filter to "Rows with Issues")
- Use cell-level details (hover over red/yellow cells) to see exact problem
- Be specific in your request—include examples of correct format
- Follow up with phone call if multiple requests haven't moved the needle

### Can't Find a Client
**Problem**: Client doesn't appear in dashboard.

**Solution**:
- Check if client is archived (look in a filtered view showing archived clients, if available)
- Try searching by email if name search returns nothing
- If recently deleted, check with admin if it can be restored

### File Upload Failed
**Problem**: Drag-and-drop didn't work.

**Solution**:
- Try clicking the upload zone to browse files instead
- Check file size isn't too large
- Try a different file format (e.g., rename .xls to .xlsx)
- Refresh page and try again

### Comments Not Showing
**Problem**: You added a comment but don't see it.

**Solution**:
- Check the team filter—you may have filtered out your team
- Try searching for your comment text
- Refresh the page if it's not updating
- Make sure you clicked "Post" (not just typed)

---

## Support & Feedback

Have questions or found a bug? Contact your Sales Studio administrator or submit feedback through the app's built-in feedback feature.

---

**Happy quoting! Sales Studio is here to keep your team aligned and your clients' data organized.**
