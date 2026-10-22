# GYMRAT · Coach Pro

Plan diario de gimnasio, nutrición, agua, estudio de trading y peso. Next.js 14 (App Router) + TypeScript + Tailwind. Sin backend: todo se guarda en tu navegador.

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

Para publicarlo, importa el repo en Vercel (no necesita variables de entorno).

## Dónde cambiar cosas

| Quieres cambiar | Archivo |
|---|---|
| Peso, meta, calorías, proteína, agua, hora de cafeína | `src/lib/config.ts` |
| Horario, rutinas, comidas, tápers, compras, trading | `src/lib/data.ts` |
| Colores | `tailwind.config.ts` |

## Qué cambió respecto al HTML v4.5

- Navegación inferior en móvil: ya se llega a las 6 secciones.
- Todo se guarda (agua por día, series, pesos, compras) en `localStorage`, con copia de seguridad en JSON (exportar e importar).
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
- Los datos no se sincronizan entre dispositivos: usa la copia JSON para moverlos.
