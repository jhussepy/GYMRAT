# GYMRAT · Coach Pro

Aplicación personal de entrenamiento y seguimiento de progreso. Next.js 15 (App Router) + TypeScript + Tailwind. La portada pública vive en `/`; el panel privado vive en `/panel`, con autenticación Clerk y persistencia de estado por usuario en Supabase.

## Arrancar

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # compilación de producción
```

## Subir a tu repositorio

```bash
git clone https://github.com/jhussepy/GYMRAT.git
# copia aquí el contenido de este proyecto (sin node_modules ni .next)
cd GYMRAT
git add .
git commit -m "Coach Pro v5: Next.js + TypeScript"
git push origin main
```

Para publicarlo, importa el repo en Vercel y configura las variables de entorno indicadas abajo.

## Dónde cambiar cosas

| Quieres cambiar | Archivo |
|---|---|
| Peso, meta, calorías, proteína, agua, hora de cafeína | `src/lib/config.ts` |
| Horario, rutinas, comidas, tápers, compras, trading | `src/lib/data.ts` |
| Colores | `tailwind.config.ts` |

## Qué cambió respecto al HTML v4.5

- Navegación inferior en móvil: ya se llega a las 6 secciones.
- El estado se guarda localmente en `localStorage` por usuario, con copia de seguridad en JSON (exportar e importar). Cuando Clerk y Supabase están configurados y la lectura inicial en la nube funciona, el estado también se sincroniza con Supabase.
- Reloj de 24 h real: bloque actual, tiempo restante, cafeína permitida o cortada y marcador de la hora, calculados desde tu horario.
- Cronómetro funcional: inicia al tocar el botón de cada serie, pausa, reinicia, y avisa con sonido y vibración.
- Registro por serie (kg y reps) con la referencia de la última sesión como sugerencia.
- Calorías y proteína calculadas por día a partir de cada comida, comparadas con tu meta.
- Horario sin huecos (se añadieron 15:15 comida, 17:20 libre y 21:00 ducha) y sueño total calculado.
- Gráfico de peso con meta, sin dependencias externas (sin CDN, sin imágenes remotas).

## Calendario de entrenamientos (Progreso)

- Un día cuenta como entrenado si registraste al menos una serie (o minutos de cardio) en **Rutina**, si lo marcas a mano, o si anotas calorías reales.
- **Racha:** días de entreno seguidos de lunes a sábado. El domingo es descanso y no la rompe.
- **Calorías estimadas** = MET × peso × horas. Fuerza 4.5 MET (≈2.25 min por serie más 8 min de calentamiento) y cardio 6 MET, con tu último peso registrado. Margen de error de ±20 a 30 %. Si escribes las calorías reales de un reloj, se usan esas.
- Constantes en `src/lib/training.ts`.

## Notas

- Las calorías y la proteína de cada comida son **estimaciones** con porciones cocidas. Con el menú actual quedas por debajo de tu meta de calorías en todos los días; la app te muestra la diferencia.
- La sincronización entre dispositivos depende de que Supabase esté configurado correctamente en Vercel y de que se haya aplicado la migración `supabase/migrations/202610260001_gymrat_user_state.sql`. Si no está configurado o la API no puede leer la nube, la app conserva los datos locales; no des por confirmada la sincronización sin probarla.


## Arquitectura pública, autenticación y datos

- `/`: landing page pública de GYMRAT.
- `/iniciar-sesion` y `/crear-cuenta`: autenticación administrada por Clerk.
- `/panel`: panel privado, protegido por Clerk.
- `/cuenta`: perfil y seguridad de Clerk.
- `/api/user-state`: API de servidor; obtiene la identidad desde la sesión verificada de Clerk y lee/escribe únicamente la fila de ese usuario en Supabase.
- El estado local se guarda bajo una clave namespaced por Clerk user ID. No se migra automáticamente la antigua clave global del navegador para evitar que otro usuario del mismo dispositivo herede datos personales.

### Configuración necesaria en Vercel

Mantén las variables de Clerk ya configuradas y añade estas variables **solo en el entorno de servidor**:

- `SUPABASE_URL` (o reutiliza `NEXT_PUBLIC_SUPABASE_URL` si ya existe).
- `SUPABASE_SERVICE_ROLE_KEY` — clave secreta de servidor; nunca debe llevar el prefijo `NEXT_PUBLIC_` ni usarse en el navegador.

Para habilitar la sincronización, ejecuta `supabase/migrations/202610260001_gymrat_user_state.sql` en el SQL Editor del proyecto Supabase correcto y configura las variables de servidor en Vercel. Consulta `docs/SUPABASE_SETUP.md` para los pasos y límites actuales. La tabla nueva usa el ID de Clerk como texto y no requiere mezclar identidades con Supabase Auth. El endpoint solo acepta el ID de usuario de la sesión verificada; no confía en un ID enviado por el cliente.

**Importante sobre datos existentes:** los registros antiguos guardados en la clave global `coach_pro_v5` del navegador no se copian automáticamente. Antes de migrarlos, exporta una copia JSON desde la app y revisa el proceso para asociarlos explícitamente a la cuenta correcta.

## Solución de problemas: Clerk

**Error 500 `Handshake token verification failed … code=401`**

`CLERK_SECRET_KEY` no corresponde a la instancia de la clave pública (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`). Revisa en Vercel (Settings → Environment Variables):

1. Las dos claves salen de la **misma** aplicación e instancia de Clerk (`pk_test_…` con `sk_test_…`, o `pk_live_…` con `sk_live_…`).
2. Pégalas sin comillas, espacios ni saltos de línea.
3. Están marcadas para **Production** (y Preview si la usas).
4. Después de cambiarlas, haz **Redeploy**: Vercel no aplica variables nuevas a despliegues ya hechos.

Mientras tanto, la portada pública sigue funcionando: el middleware solo corre en `/panel`, `/cuenta` y `/api`.
