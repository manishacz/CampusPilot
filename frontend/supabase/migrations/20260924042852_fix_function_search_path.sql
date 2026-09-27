/*
# Fix function search path warning

Sets an explicit search_path on the update_updated_at_column() function
to resolve the Supabase security advisor warning about mutable search paths.
This is a security hardening step — the function behavior is unchanged.
*/

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
