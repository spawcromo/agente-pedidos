# Roles y Permisos — Avícola Baccaro

El sistema utiliza roles para controlar el acceso a diferentes secciones del dashboard. Los roles están definidos en la tabla `profiles` de Supabase, que se vincula automáticamente con los usuarios de `auth.users`.

## Roles Definidos

| Rol | Descripción | Accesos Permitidos |
| :--- | :--- | :--- |
| `admin` | Administrador total del sistema. | Todas las páginas (Pedidos, Producción, Clientes, Productos, Reparto, Estadísticas). |
| `repartidor` | Usuario enfocado en la logística de entrega. | **Únicamente** la página de Reparto (`/reparto`). |

## Cómo Funciona

1. **Creación Automática**: Cuando un usuario se registra o es creado en Supabase Auth, un disparador (trigger) crea automáticamente un registro en la tabla `public.profiles` con el rol `repartidor` por defecto.
2. **Control en Frontend**: El componente `Sidebar` utiliza el hook `useUser` para obtener el rol del usuario actual y filtrar los ítems del menú de navegación.
3. **Seguridad en Base de Datos**: Las políticas de RLS (Row Level Security) en Supabase pueden configurarse para restringir el acceso a tablas específicas según el rol del usuario (ID de auth).

## Cómo Cambiar el Rol de un Usuario

Actualmente, el cambio de rol se debe realizar manualmente desde el **Supabase Dashboard > SQL Editor**:

```sql
-- Cambiar un usuario a administrador
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'correo-del-admin@ejemplo.com';
```

## Próximos Pasos (Sugeridos)

- **Route Guarding**: Implementar un componente de orden superior (HOC) o un middleware que redireccione a los usuarios si intentan entrar manualmente a una URL para la que no tienen permiso.
- **Gestión de Usuarios**: Crear una pantalla en el dashboard (solo para admins) para gestionar la lista de usuarios y sus roles sin entrar a la base de datos.
