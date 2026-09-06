-- 1. Super admin registry
CREATE TABLE public.super_admin (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.super_admin TO authenticated;
GRANT SELECT ON public.super_admin TO anon;
GRANT SELECT ON public.super_admin TO service_role;

ALTER TABLE public.super_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read super admin" ON public.super_admin
  FOR SELECT USING (true);

INSERT INTO public.super_admin (singleton, user_id)
VALUES (true, '8505bc1a-a005-4b9c-817f-218b759f7680');

-- Immutable: block any write, including service_role
CREATE OR REPLACE FUNCTION public.protect_super_admin_row()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'The Super Admin designation is immutable';
END;
$$;

CREATE TRIGGER super_admin_immutable
BEFORE INSERT OR UPDATE OR DELETE ON public.super_admin
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_row();

-- 2. Helper
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.super_admin WHERE user_id = _user_id);
$$;

REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM anon;

-- 3. Enforce role-change rules at the database level
CREATE OR REPLACE FUNCTION public.enforce_admin_role_protection()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_target uuid := COALESCE(NEW.user_id, OLD.user_id);
  v_role app_role := COALESCE(NEW.role, OLD.role);
  v_any_admin boolean;
BEGIN
  -- The super admin's own role rows are untouchable by anyone.
  IF public.is_super_admin(v_target) THEN
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE'
       OR (TG_OP = 'INSERT' AND v_role <> 'admin') THEN
      IF NOT (TG_OP = 'INSERT') THEN
        RAISE EXCEPTION 'The Super Admin role cannot be modified or removed';
      END IF;
    END IF;
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

CREATE TRIGGER user_roles_admin_protection
BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_role_protection();

-- 4. Allow the super admin to manage roles through normal (RLS) access
CREATE POLICY "Super admin can grant roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin can revoke roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 5. Protect the super admin's profile from other accounts
CREATE OR REPLACE FUNCTION public.protect_super_admin_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_target uuid := COALESCE(NEW.id, OLD.id);
BEGIN
  IF public.is_super_admin(v_target) AND COALESCE(v_actor, '00000000-0000-0000-0000-000000000000'::uuid) <> v_target THEN
    RAISE EXCEPTION 'The Super Admin account can only be modified by the Super Admin';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_protect_super_admin
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_profile();
