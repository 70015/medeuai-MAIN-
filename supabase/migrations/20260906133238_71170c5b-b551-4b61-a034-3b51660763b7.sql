REVOKE ALL ON FUNCTION public.protect_super_admin_row() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_super_admin_profile() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_admin_role_protection() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM anon;

CREATE OR REPLACE FUNCTION public.enforce_admin_role_protection()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_target uuid := COALESCE(NEW.user_id, OLD.user_id);
  v_role app_role := COALESCE(NEW.role, OLD.role);
  v_any_admin boolean;
BEGIN
  -- The super admin's role rows are untouchable by anyone, in any operation.
  IF public.is_super_admin(v_target) THEN
    RAISE EXCEPTION 'The Super Admin role cannot be modified or removed';
  END IF;

  -- Admin role grants/revokes are reserved for the super admin.
  IF v_role = 'admin' OR (TG_OP = 'UPDATE' AND OLD.role = 'admin') THEN
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO v_any_admin;
    IF v_any_admin AND NOT public.is_super_admin(v_actor) THEN
      RAISE EXCEPTION 'Only the Super Admin can manage admin roles';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
