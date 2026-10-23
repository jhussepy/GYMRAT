# GYMRAT — Preparación de Supabase

Esta fase prepara el esquema de persistencia, pero **no conecta todavía la aplicación a Supabase**. Hasta que se integre y pruebe el cliente, GYMRAT sigue guardando los datos en el navegador.

## 1. Crear el proyecto

1. Entra en [supabase.com](https://supabase.com/) e inicia sesión.
2. Crea una organización si la web te lo solicita y selecciona **New project**.
3. Nombre sugerido: `gymrat`.
4. Selecciona una contraseña de base de datos fuerte y guárdala en un gestor de contraseñas. No la publiques ni la guardes en GitHub.
5. Elige una región cercana a donde usarás la aplicación y crea el proyecto.
6. Espera a que el proyecto termine de aprovisionarse.

No compartas contraseñas, tokens ni capturas que muestren secretos.

## 2. Aplicar el esquema

1. Abre el proyecto y entra en **SQL Editor**.
2. Abre el archivo `supabase/migrations/20261023130000_create_user_app_state.sql` de este repositorio.
3. Revisa el SQL y ejecútalo en el SQL Editor de tu proyecto.
4. En **Table Editor**, confirma que aparece `public.user_app_state`.

La tabla está diseñada para guardar un documento JSON por usuario autenticado. RLS está habilitado y las políticas limitan las operaciones al usuario cuyo ID coincide con `auth.uid()`. No desactives RLS para solucionar errores.

## 3. Obtener las variables públicas

En el panel del proyecto, abre **Project Settings → API** (la ubicación exacta puede variar con la interfaz de Supabase) y copia:

- Project URL.
- Publishable key del proyecto (prefijo habitual `sb_publishable_`). Si tu proyecto solo muestra la clave heredada `anon`, usa esa clave pública.

Estas dos variables están diseñadas para usarse desde el cliente, siempre que RLS y las políticas estén bien configuradas. **Nunca uses ni expongas una `service_role` o secret key en el navegador, en un archivo `.env.example`, ni en GitHub.**

## 4. Configurar los entornos (cuando se abra la integración)

El archivo `.env.example` solo documenta los nombres; no contiene credenciales reales.

- En Vercel → proyecto GYMRAT → **Settings → Environment Variables**, añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para Preview y Production según corresponda.
- Para desarrollo local, crea `.env.local` a partir de `.env.example` y completa los valores en tu ordenador. No subas `.env.local` a GitHub.
- Tras cambiar variables en Vercel, genera un nuevo despliegue.

No se deben solicitar ni incluir credenciales en una Pull Request. La conexión de la app, el inicio de sesión y la migración de los datos de `localStorage` se harán en una siguiente fase después de confirmar que el proyecto Supabase existe y que la migración se aplicó correctamente.

## 5. Verificación antes de conectar la aplicación

- [ ] El proyecto Supabase está activo.
- [ ] La tabla `public.user_app_state` existe.
- [ ] RLS está habilitado.
- [ ] Las políticas solo permiten acceso al propietario autenticado.
- [ ] La URL y la publishable/anon key están configuradas en los entornos correctos.
- [ ] No se ha añadido ninguna contraseña ni clave secreta al repositorio.

**Importante:** esta primera fase no modifica el comportamiento actual ni borra datos locales. Antes de activar sincronización, la integración deberá incluir una migración controlada de los datos existentes, manejo de errores y pruebas de aislamiento entre usuarios.
