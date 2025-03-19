# HyphenBox Database Schema

## Tables

### Users
- id (PK): UUID
- email: VARCHAR(255) UNIQUE NOT NULL
- name: VARCHAR(255)
- title: VARCHAR(255)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
- role: VARCHAR(50) DEFAULT 'admin'

### Audiences
- id (PK): UUID
- name: VARCHAR(255) NOT NULL
- description: TEXT
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
- created_by: UUID (FK to Users.id)

### CursorFlows
- id (PK): UUID
- name: VARCHAR(255) NOT NULL
- json_data: JSONB NOT NULL
- status: VARCHAR(50) DEFAULT 'draft' (enum: 'draft', 'live')
- audience_id: UUID (FK to Audiences.id)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
- created_by: UUID (FK to Users.id)
- published_at: TIMESTAMP NULL
- published_by: UUID (FK to Users.id) NULL

### CursorFlowVersions
- id (PK): UUID
- cursor_flow_id: UUID (FK to CursorFlows.id)
- json_data: JSONB NOT NULL
- version_number: INTEGER NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()
- created_by: UUID (FK to Users.id)

### KnowledgeResources
- id (PK): UUID
- name: VARCHAR(255) NOT NULL
- type: VARCHAR(50) NOT NULL (enum: 'pdf', 'markdown', 'txt', 'link')
- content: TEXT or FILE_PATH (for documents) or URL (for links)
- created_at: TIMESTAMP DEFAULT NOW()
- updated_at: TIMESTAMP DEFAULT NOW()
- created_by: UUID (FK to Users.id)

### TeamInvitations
- id (PK): UUID
- email: VARCHAR(255) NOT NULL
- status: VARCHAR(50) DEFAULT 'pending' (enum: 'pending', 'accepted')
- magic_link: VARCHAR(255) UNIQUE
- expires_at: TIMESTAMP NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()
- created_by: UUID (FK to Users.id)

## Relationships

1. CursorFlows.audience_id => Audiences.id (Many-to-One)
2. CursorFlowVersions.cursor_flow_id => CursorFlows.id (Many-to-One)
3. CursorFlows.created_by => Users.id (Many-to-One)
4. CursorFlows.published_by => Users.id (Many-to-One)
5. Audiences.created_by => Users.id (Many-to-One)
6. KnowledgeResources.created_by => Users.id (Many-to-One)
7. TeamInvitations.created_by => Users.id (Many-to-One)

## Indexes

1. Users(email)
2. CursorFlows(audience_id)
3. CursorFlowVersions(cursor_flow_id, version_number)
4. TeamInvitations(email, status)

## Notes

- Authentication handled through Supabase
- CursorFlowVersions table enables version history and rollback functionality
- Status field in CursorFlows manages the Live/Draft state
- KnowledgeResources table supports different types of knowledge documents
- TeamInvitations table manages the invitation process with magic links
