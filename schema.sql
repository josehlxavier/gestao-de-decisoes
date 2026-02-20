-- ============================================================
-- SCHEMA: Sistema de Gestão de Decisões e Conhecimento
-- Execute este script no SQL Editor do seu painel Supabase
-- ============================================================

-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: users (perfis de usuário, complementa auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver todos os perfis"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem editar apenas o próprio perfil"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir o próprio perfil"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABELA: working_groups (Grupos de Trabalho)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.working_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: working_groups
ALTER TABLE public.working_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ler grupos de trabalho"
  ON public.working_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar grupos de trabalho"
  ON public.working_groups FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar grupos de trabalho"
  ON public.working_groups FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar grupos de trabalho"
  ON public.working_groups FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABELA: meetings (Atas de Reunião)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  working_group_id UUID NOT NULL REFERENCES public.working_groups(id) ON DELETE CASCADE,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: meetings
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ler atas"
  ON public.meetings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar atas"
  ON public.meetings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar atas"
  ON public.meetings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar atas"
  ON public.meetings FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABELA: decisions (Decisões vinculadas às atas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  context TEXT,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: decisions
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ler decisões"
  ON public.decisions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar decisões"
  ON public.decisions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar decisões"
  ON public.decisions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar decisões"
  ON public.decisions FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABELA: tasks (Planos de Ação / Tarefas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Andamento', 'Concluído')),
  assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ler tarefas"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar tarefas"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar tarefas"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar tarefas"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TABELA: issues (Matriz GUT)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  working_group_id UUID NOT NULL REFERENCES public.working_groups(id) ON DELETE CASCADE,
  gravity INTEGER NOT NULL DEFAULT 1 CHECK (gravity BETWEEN 1 AND 5),
  urgency INTEGER NOT NULL DEFAULT 1 CHECK (urgency BETWEEN 1 AND 5),
  tendency INTEGER NOT NULL DEFAULT 1 CHECK (tendency BETWEEN 1 AND 5),
  score INTEGER GENERATED ALWAYS AS (gravity * urgency * tendency) STORED,
  status TEXT NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Em Análise', 'Resolvido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: issues
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ler issues"
  ON public.issues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar issues"
  ON public.issues FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar issues"
  ON public.issues FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar issues"
  ON public.issues FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- TRIGGER: Criar perfil de usuário automaticamente no cadastro
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'member'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ÍNDICES para performance de busca
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_decisions_meeting_id ON public.decisions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_decisions_tags ON public.decisions USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_meetings_working_group_id ON public.meetings(working_group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_meeting_id ON public.tasks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_issues_working_group_id ON public.issues(working_group_id);
CREATE INDEX IF NOT EXISTS idx_issues_score ON public.issues(score DESC);

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
