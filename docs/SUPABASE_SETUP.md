# GYMRAT — Preparación de Supabase

La primera fase prepara el esquema y esta segunda fase añade el formulario de registro/inicio de sesión en `/cuenta`. La sincronización del progreso todavía no está activada: los datos de entrenamiento siguen guardándose en el navegador hasta completar y validar la siguiente parte.

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

No se deben solicitar ni incluir credenciales en una Pull Request. La ruta `/cuenta` implementa el registro y el inicio/cierre de sesión; la migración de los datos de `localStorage` y la sincronización con la tabla se implementarán y validarán por separado.

## 5. Verificación de autenticación

- [ ] El proyecto Supabase está activo.
- [ ] La tabla `public.user_app_state` existe.
- [ ] RLS está habilitado.
- [ ] Las políticas solo permiten acceso al propietario autenticado.
- [ ] La URL y la publishable/anon key están configuradas en los entornos correctos.
- [ ] No se ha añadido ninguna contraseña ni clave secreta al repositorio.
- [ ] La ruta `/cuenta` permite crear una cuenta e iniciar/cerrar sesión.
- [ ] En Authentication → URL Configuration, configura la URL de tu despliegue y las redirecciones permitidas para confirmación de correo si tu proyecto las exige.

La pantalla de cuenta usa la URL y la clave pública del proyecto. No borra ni importa automáticamente el progreso local. **La sincronización cloud y la migración controlada de datos son pasos pendientes**: antes de activarlas se deben resolver los casos en los que ya existen datos locales, datos en la nube o ambos.
