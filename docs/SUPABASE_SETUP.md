# GYMRAT — Configuración de Supabase y sincronización

GYMRAT usa Clerk para identificar al usuario y una API de Next.js (/api/user-state) para leer y guardar su estado en Supabase. El navegador conserva además una copia local separada por usuario. La sincronización en la nube solo funciona si se completa la configuración descrita abajo; el hecho de iniciar sesión no demuestra por sí solo que la nube esté operativa.

## 1. Crear o seleccionar el proyecto correcto

1. Entra en https://supabase.com/ y abre el proyecto que utilizará GYMRAT.
2. Confirma que estás en el proyecto correcto antes de ejecutar SQL.
3. No compartas contraseñas, tokens ni capturas que muestren secretos.

## 2. Aplicar la migración usada por la API actual

1. Abre SQL Editor en Supabase.
2. Copia y ejecuta el contenido de supabase/migrations/202610260001_gymrat_user_state.sql.
3. En Table Editor, confirma que existe public.gymrat_user_state y que su columna user_id es de tipo texto.
4. No sustituyas esta migración por las migraciones históricas de user_app_state: la API actual consulta la tabla gymrat_user_state.

La API utiliza una clave de servicio exclusivamente en el servidor y obtiene el identificador del usuario desde la sesión verificada de Clerk. No añadas políticas para acceso anónimo ni expongas la clave de servicio en el cliente.

## 3. Configurar variables de entorno

En Vercel → proyecto GYMRAT → Settings → Environment Variables, configura para cada entorno que vayas a utilizar:

- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- SUPABASE_URL (también se acepta NEXT_PUBLIC_SUPABASE_URL como URL de respaldo).
- SUPABASE_SERVICE_ROLE_KEY

La SUPABASE_SERVICE_ROLE_KEY debe existir únicamente en el entorno de servidor: nunca uses el prefijo NEXT_PUBLIC_ para esta clave, no la incluyas en el navegador y no la guardes en GitHub. No incluyas valores reales en una Pull Request ni en documentación.

Para desarrollo local, utiliza un archivo .env.local ignorado por Git. Después de cambiar las variables de Vercel, vuelve a desplegar la aplicación.

## 4. Cómo funciona el guardado actual

- El estado local se guarda en localStorage bajo una clave asociada al ID de Clerk.
- Al iniciar, la aplicación intenta leer /api/user-state. Si la respuesta se valida para el usuario actual, usa el estado de la nube cuando existe; si la lectura no está disponible, conserva la copia local.
- Los cambios se guardan localmente y, cuando la lectura inicial de la nube tuvo éxito, se envían a la API para guardarse en Supabase.
- La API escribe únicamente la fila cuyo user_id corresponde a la sesión de Clerk verificada.
- La clave antigua global coach_pro_v5 no se migra automáticamente a una cuenta: exporta un JSON y verifica a qué usuario pertenece antes de importar o transferir datos.

**Importante:** la aplicación puede seguir funcionando con almacenamiento local aunque la sincronización falle. Los errores de guardado en segundo plano no siempre se muestran claramente en la interfaz. Por eso, no consideres confirmada la sincronización entre dispositivos hasta completar las pruebas de la sección siguiente.

## 5. Comprobaciones manuales

- [ ] Las cuatro variables necesarias están configuradas en el entorno de Vercel que estás probando.
- [ ] La migración 202610260001_gymrat_user_state.sql se ejecutó en el proyecto Supabase correcto.
- [ ] La tabla public.gymrat_user_state existe.
- [ ] El despliegue se realizó después de configurar las variables.
- [ ] Al iniciar sesión con el usuario A, cambia un dato de prueba y espera a que se guarde.
- [ ] En Supabase, comprueba que existe una fila con el ID de Clerk del usuario A y que su campo state contiene el cambio de prueba.
- [ ] Abre GYMRAT en otro navegador/dispositivo con el mismo usuario A y verifica que el cambio se recupera.
- [ ] Inicia sesión con un usuario B y comprueba que no recibe los datos del usuario A.
- [ ] Si alguna comprobación falla, exporta una copia JSON antes de seguir probando y no borres los datos locales.

## Solución de problemas: "Guardado solo en este dispositivo"

El aviso muestra el motivo exacto que devuelve el servidor. Los más habituales:

| Mensaje | Qué hacer |
|---|---|
| Falta configurar SUPABASE_SERVICE_ROLE_KEY | Añádela en Vercel (sin `NEXT_PUBLIC_`), para el entorno que estés usando, y vuelve a desplegar. Las variables públicas (`NEXT_PUBLIC_SUPABASE_…`) no la reemplazan. |
| contiene la clave pública | Pegaste la clave publicable o `anon`. Usa la secreta (`sb_secret_…`) o `service_role`. |
| contiene caracteres no válidos | Copiaste la clave truncada con «…». Cópiala completa. |
| SUPABASE_URL debe empezar por https:// | Usa la «Project URL» de Supabase → Settings → API. |
| relation "gymrat_user_state" does not exist | Falta ejecutar la migración de la sección 2. |

Las variables nuevas solo se aplican a despliegues hechos **después** de guardarlas.

## Nota sobre migraciones anteriores

El repositorio conserva migraciones históricas relacionadas con public.user_app_state y Supabase Auth. La API actual de Clerk utiliza public.gymrat_user_state; no ejecutes migraciones antiguas como sustituto de la migración actual. Si ya aplicaste migraciones anteriores en tu base de datos, no las reviertas ni elimines tablas sin revisar primero los datos existentes.
