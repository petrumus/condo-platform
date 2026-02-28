-- F11: Document Repository
-- Creates document_folders and documents tables with RLS

-- ─── document_folders ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS document_folders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id      uuid NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  parent_folder_id    uuid REFERENCES document_folders(id) ON DELETE CASCADE,
  name                text NOT NULL,
  default_visibility  text NOT NULL DEFAULT 'members' CHECK (default_visibility IN ('public', 'members', 'admin-only')),
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_folders_condominium_id_idx ON document_folders(condominium_id);
CREATE INDEX IF NOT EXISTS document_folders_parent_folder_id_idx ON document_folders(parent_folder_id);

ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;

-- Helper: get effective visibility for a folder considering parent chain
-- (for simplicity we use folder's own default_visibility)

-- Admins: full access
CREATE POLICY "admins_all_document_folders"
  ON document_folders
  FOR ALL
  TO authenticated
  USING (
    condominium_id IN (
      SELECT condominium_id FROM condominium_members
      WHERE user_id = auth.uid() AND system_role = 'admin'
    )
  )
  WITH CHECK (
    condominium_id IN (
      SELECT condominium_id FROM condominium_members
      WHERE user_id = auth.uid() AND system_role = 'admin'
    )
  );

-- Members: see 'members' and 'public' folders
CREATE POLICY "members_select_document_folders"
  ON document_folders
  FOR SELECT
  TO authenticated
  USING (
    default_visibility IN ('members', 'public')
    AND condominium_id IN (
      SELECT condominium_id FROM condominium_members
      WHERE user_id = auth.uid()
    )
  );

-- Public (anon): see only 'public' folders
CREATE POLICY "public_select_document_folders"
  ON document_folders
  FOR SELECT
  TO anon
  USING (default_visibility = 'public');

-- ─── documents ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id      uuid NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  folder_id           uuid REFERENCES document_folders(id) ON DELETE CASCADE,
  name                text NOT NULL,
  storage_path        text NOT NULL,
  file_size_bytes     bigint,
  mime_type           text,
  visibility_override text CHECK (visibility_override IN ('public', 'members', 'admin-only')),
  uploaded_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_condominium_id_idx ON documents(condominium_id);
CREATE INDEX IF NOT EXISTS documents_folder_id_idx ON documents(folder_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- DB function: resolve effective visibility of a document
CREATE OR REPLACE FUNCTION effective_doc_visibility(
  p_visibility_override text,
  p_folder_id           uuid
) RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    p_visibility_override,
    (SELECT default_visibility FROM document_folders WHERE id = p_folder_id),
    'members'
  )
$$;

-- Admins: full access
CREATE POLICY "admins_all_documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (
    condominium_id IN (
      SELECT condominium_id FROM condominium_members
      WHERE user_id = auth.uid() AND system_role = 'admin'
    )
  )
  WITH CHECK (
    condominium_id IN (
      SELECT condominium_id FROM condominium_members
      WHERE user_id = auth.uid() AND system_role = 'admin'
    )
  );

-- Members: see documents with effective visibility 'members' or 'public'
CREATE POLICY "members_select_documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    effective_doc_visibility(visibility_override, folder_id) IN ('members', 'public')
    AND condominium_id IN (
      SELECT condominium_id FROM condominium_members
      WHERE user_id = auth.uid()
    )
  );

-- Public (anon): see only 'public' effective visibility documents
CREATE POLICY "public_select_documents"
  ON documents
  FOR SELECT
  TO anon
  USING (
    effective_doc_visibility(visibility_override, folder_id) = 'public'
  );
