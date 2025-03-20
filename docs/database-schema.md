# HyphenBox Database Schema

## Tables

### Organizations
- id (PK): UUID
- name: VARCHAR(255) NOT NULL
- billing_email: VARCHAR(255)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()

### Users
- id (PK): UUID
- email: VARCHAR(255) UNIQUE NOT NULL
- name: VARCHAR(255)
- title: VARCHAR(255)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
- role: VARCHAR(50) DEFAULT 'admin'
- organization_id: UUID (FK to Organizations.id)

### TeamInvitations
- id (PK): UUID
- email: VARCHAR(255) NOT NULL
- organization_id: UUID (FK to Organizations.id)
- status: VARCHAR(50) DEFAULT 'pending'
- expires_at: TIMESTAMP NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()
- created_by: UUID (FK to Users.id)

### Audiences
- id (PK): UUID
- name: VARCHAR(255) NOT NULL
- description: TEXT
- organization_id: UUID (FK to Organizations.id)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
- created_by: UUID (FK to Users.id)

### CursorFlows
- id (PK): UUID
- name: VARCHAR(255) NOT NULL
- description: TEXT
- status: VARCHAR(50) DEFAULT 'draft'
- audience_id: UUID (FK to Audiences.id)
- organization_id: UUID (FK to Organizations.id)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
- created_by: UUID (FK to Users.id)
- published_at: TIMESTAMP
- published_by: UUID (FK to Users.id)

### CursorFlowSteps
- id (PK): UUID
- flow_id: UUID (FK to CursorFlows.id)
- position: FLOAT NOT NULL  
  # Position determines step order using large number spacing strategy
  # Initial steps are created with positions: 1000, 2000, 3000, etc.
  # This allows new steps to be inserted between existing steps without reordering:
  # - To add between 1000 and 2000, use 1500
  # - To add between 1500 and 2000, use 1750
  # - When deleting steps, no reordering needed
  # Always retrieve steps using: ORDER BY position ASC
- step_data: JSONB NOT NULL  # Original click/interaction data from chrome extension
- screenshot_url: TEXT       # URL to stored screenshot in bucket/S3
- annotation_text: TEXT      # User-added explanatory text for this step
- is_removed: BOOLEAN DEFAULT FALSE  # Indicates if the step is removed but not deleted
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()

### KnowledgeResources
- id (PK): UUID
- name: VARCHAR(255) NOT NULL
- type: VARCHAR(50) NOT NULL
- file_url: TEXT
- organization_id: UUID (FK to Organizations.id)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
- created_by: UUID (FK to Users.id)

## Relationships

1. CursorFlows.audience_id => Audiences.id (Many-to-One)
2. CursorFlows.created_by => Users.id (Many-to-One)
3. CursorFlows.published_by => Users.id (Many-to-One)
4. Audiences.created_by => Users.id (Many-to-One)
5. KnowledgeResources.created_by => Users.id (Many-to-One)
6. TeamInvitations.created_by => Users.id (Many-to-One)
7. Users.organization_id => Organizations.id (Many-to-One)
8. Audiences.organization_id => Organizations.id (Many-to-One)
9. KnowledgeResources.organization_id => Organizations.id (Many-to-One)

## Indexes

1. Users(email)
2. CursorFlows(audience_id)
3. CursorFlows(status)
4. TeamInvitations(email, status)

## Notes

- Authentication handled through Supabase
- CursorFlowVersions table enables version history and rollback functionality
- Status field in CursorFlows manages the Live/Draft state
- KnowledgeResources table supports different types of knowledge documents
- TeamInvitations table manages the invitation process with magic links

## Additional Implementation Notes

1. Step Ordering Strategy:
   - Initial upload: Position values are 1000, 2000, 3000, etc.
   - New step between 1000-2000: Use average (1500)
   - New step between 1500-2000: Use average (1750)
   - This provides 1000 possible positions between any two steps
   - No need to update other steps when inserting/deleting

2. Example Queries:
   ```sql
   -- Get steps in correct order
   SELECT * FROM cursor_flow_steps 
   WHERE flow_id = '123' 
   ORDER BY position ASC;

   -- Insert new step between positions 1000 and 2000
   INSERT INTO cursor_flow_steps (flow_id, position, ...) 
   VALUES ('123', 1500, ...);
   ```
