-- =====================================================
-- AVÍCOLA BACCARO — Roles y Perfiles
-- =====================================================

-- 1. TIPO DE ROL
CREATE TYPE user_role AS ENUM ('admin', 'repartidor');

-- 2. TABLA DE PERFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'repartidor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfiles públicos para autenticados" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 4. TRIGGER PARA CREACION AUTOMATICA
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'repartidor'); -- Por defecto todos son repartidores hasta que se cambien a admin
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. TRIGGER updated_at (reutilizando la funcion del setup inicial si existe, sino la creamos)
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Nota: El primer usuario creado deberá ser cambiado a 'admin' manualmente en la DB
-- UPDATE profiles SET role = 'admin' WHERE email = 'tu-email@ejemplo.com';
