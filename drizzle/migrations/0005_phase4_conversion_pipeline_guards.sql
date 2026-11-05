ALTER TABLE public.pipeline_stages ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
CREATE OR REPLACE FUNCTION public.guard_pipeline_stage() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE org uuid := COALESCE(NEW.organization_id, OLD.organization_id);
BEGIN
IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id=org) THEN RETURN COALESCE(NEW,OLD); END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(org::text, 0));
IF auth.uid() IS NOT NULL AND NOT public.is_org_admin(org) THEN RAISE EXCEPTION 'Somente administradores podem configurar etapas'; END IF;
IF TG_OP='DELETE' OR (TG_OP='UPDATE' AND (NEW.key<>OLD.key OR NOT NEW.active)) THEN
IF EXISTS (SELECT 1 FROM public.leads WHERE organization_id=org AND stage=OLD.key) THEN RAISE EXCEPTION 'Mova os leads desta etapa antes de removê-la ou desativá-la'; END IF;
END IF;
IF TG_OP<>'DELETE' THEN
IF NEW.is_won AND NEW.is_lost THEN RAISE EXCEPTION 'Uma etapa não pode ser ganha e perdida ao mesmo tempo'; END IF;
IF length(trim(NEW.name)) NOT BETWEEN 1 AND 120 OR NEW.color !~ '^#[0-9a-fA-F]{6}$' THEN RAISE EXCEPTION 'Nome ou cor da etapa inválidos'; END IF;
END IF;
RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER guard_pipeline_stage BEFORE INSERT OR UPDATE OR DELETE ON public.pipeline_stages FOR EACH ROW EXECUTE FUNCTION public.guard_pipeline_stage();
CREATE OR REPLACE FUNCTION public.guard_lead_stage() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
PERFORM pg_advisory_xact_lock(hashtextextended(NEW.organization_id::text,0));
IF NOT EXISTS (SELECT 1 FROM public.pipeline_stages WHERE organization_id=NEW.organization_id AND key=NEW.stage AND active) THEN RAISE EXCEPTION 'Escolha uma etapa ativa da empresa'; END IF;
RETURN NEW;
END $$;
CREATE TRIGGER guard_lead_stage BEFORE INSERT OR UPDATE OF stage ON public.leads FOR EACH ROW EXECUTE FUNCTION public.guard_lead_stage();
CREATE OR REPLACE FUNCTION public.convert_lead_to_client(_lead uuid) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE l public.leads; c uuid; won public.lead_stage;
BEGIN
SELECT * INTO l FROM public.leads WHERE id=_lead FOR UPDATE;
IF l.id IS NULL OR NOT public.is_org_member(l.organization_id) THEN RAISE EXCEPTION 'Lead não encontrado ou acesso negado'; END IF;
SELECT id INTO c FROM public.clients WHERE lead_id=l.id;
IF c IS NOT NULL THEN RETURN c; END IF;
SELECT key INTO won FROM public.pipeline_stages WHERE organization_id=l.organization_id AND active AND is_won ORDER BY position LIMIT 1;
IF won IS NULL THEN RAISE EXCEPTION 'Configure uma etapa ativa de venda concluída antes de converter'; END IF;
INSERT INTO public.clients(organization_id,lead_id,name,phone,email,notes,assigned_to) VALUES(l.organization_id,l.id,l.name,l.phone,l.email,concat_ws(E'\n',l.description,l.notes),CASE WHEN public.is_active_member(l.organization_id,l.assigned_to) THEN l.assigned_to ELSE NULL END) RETURNING id INTO c;
UPDATE public.leads SET stage=won WHERE id=l.id;
UPDATE public.budgets SET client_id=c WHERE lead_id=l.id AND client_id IS NULL;
UPDATE public.tasks SET client_id=c WHERE lead_id=l.id AND client_id IS NULL;
UPDATE public.interactions SET client_id=c WHERE lead_id=l.id AND client_id IS NULL;
RETURN c;
END $$;
REVOKE ALL ON FUNCTION public.convert_lead_to_client(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convert_lead_to_client(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.guard_pipeline_stage(), public.guard_lead_stage() FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS interactions_org_client_idx ON public.interactions(organization_id,client_id,created_at);