import { describe, expect, it } from "vitest";
import { WORKOUTS } from "@/lib/data";
import { defaultRoutines, exerciseFor, newExerciseId, sanitizeExercise, sanitizeRoutineDay } from "@/lib/routines";
import { DEFAULT_TRAINING_DAYS, planFor, trainingPlan } from "@/lib/routine-plan";

describe("plantilla por defecto", () => {
  it("copia exactamente la rutina de GYMRAT, sin cambiar ejercicios ni ids", () => {
    const r = defaultRoutines();
    for (const [day, exercises] of Object.entries(WORKOUTS)) {
      expect(r[day].exercises.map((e) => e.id)).toEqual(exercises.map((e) => e.id));
      expect(r[day].exercises.map((e) => e.name)).toEqual(exercises.map((e) => e.name));
    }
  });
  it("los ids de ejercicio son únicos en toda la plantilla", () => {
    const ids = Object.values(defaultRoutines()).flatMap((d) => d.exercises.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("reparto de rutinas", () => {
  it("3 días: empuje, tirón y pierna", () => {
    expect(trainingPlan(["Lunes", "Miércoles", "Viernes"]).map((p) => p.focus)).toEqual(["Empuje", "Tirón", "Pierna"]);
  });
  it("cinco días por defecto", () => {
    expect(trainingPlan(DEFAULT_TRAINING_DAYS)).toHaveLength(5);
  });
  it("un día sin entreno devuelve null", () => {
    expect(planFor(["Lunes", "Miércoles"], "Martes")).toBeNull();
  });
  it("si el usuario edita una rutina base, su día la muestra editada", () => {
    const r = defaultRoutines();
    r.Lunes = { ...r.Lunes, focus: "Empuje fuerte", exercises: [r.Lunes.exercises[0]] };
    const plan = trainingPlan(["Lunes", "Martes", "Miércoles"], r);
    expect(plan[0].focus).toBe("Empuje fuerte");
    expect(plan[0].exercises).toHaveLength(1);
  });
  it("sin rutinas guardadas, sigue igual que antes", () => {
    expect(trainingPlan(["Lunes", "Martes", "Miércoles"], null)[0].exercises).toEqual(trainingPlan(["Lunes", "Martes", "Miércoles"])[0].exercises);
  });
});

describe("ejercicios y su validación", () => {
  const base = { id: "u-1", name: "Remo", type: "strength", sets: 4, reps: "10", alt: "Remo con mancuerna" };
  it("un ejercicio válido pasa", () => {
    expect(sanitizeExercise(base)).toMatchObject({ id: "u-1", name: "Remo", sets: 4 });
  });
  it("sin nombre, sin repeticiones o sin id, se descarta", () => {
    expect(sanitizeExercise({ ...base, name: "  " })).toBeNull();
    expect(sanitizeExercise({ ...base, reps: "" })).toBeNull();
    expect(sanitizeExercise({ ...base, id: "" })).toBeNull();
  });
  it("limita las series entre 1 y 10, y el cardio siempre es una sesión", () => {
    expect(sanitizeExercise({ ...base, sets: 99 })?.sets).toBe(10);
    expect(sanitizeExercise({ ...base, sets: 0 })?.sets).toBe(1);
    expect(sanitizeExercise({ ...base, type: "cardio", sets: 4, reps: "30 min" })?.sets).toBe(1);
  });
  it("recorta textos demasiado largos", () => {
    expect(sanitizeExercise({ ...base, name: "x".repeat(200) })?.name).toHaveLength(60);
  });
  it("el sustituto en casa solo se conserva si está completo", () => {
    expect(sanitizeExercise({ ...base, home: { name: "Flexiones", reps: "15" } })?.home).toEqual({ name: "Flexiones", reps: "15" });
    expect(sanitizeExercise({ ...base, home: { name: "Flexiones" } })?.home).toBeUndefined();
  });
  it("no acepta ejercicios repetidos dentro de un día", () => {
    const day = sanitizeRoutineDay({ focus: "Empuje", exercises: [base, base] }, "Lunes");
    expect(day?.exercises).toHaveLength(1);
  });
  it("limita el número de ejercicios por día", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ ...base, id: `u-${i}` }));
    expect(sanitizeRoutineDay({ focus: "Empuje", exercises: many }, "Lunes")?.exercises).toHaveLength(12);
  });
  it("un día sin nombre se descarta", () => {
    expect(sanitizeRoutineDay({ focus: " ", exercises: [base] }, "Lunes")).toBeNull();
  });
});

describe("modo en casa", () => {
  const ex = { id: "a", name: "Press en máquina", type: "strength" as const, sets: 4, reps: "10", alt: "x", home: { name: "Flexiones", reps: "12-15" } };
  it("con el modo casa activo, muestra el sustituto", () => {
    expect(exerciseFor(ex, true)).toEqual({ name: "Flexiones", reps: "12-15" });
  });
  it("sin modo casa, o sin sustituto, muestra el ejercicio normal", () => {
    expect(exerciseFor(ex, false)).toEqual({ name: "Press en máquina", reps: "10" });
    expect(exerciseFor({ ...ex, home: undefined }, true)).toEqual({ name: "Press en máquina", reps: "10" });
  });
});

describe("ids nuevos", () => {
  it("un ejercicio añadido nunca reutiliza un id existente", () => {
    const taken = ["u-1", "u-2"];
    const id = newExerciseId("Lunes", taken);
    expect(taken).not.toContain(id);
    expect(id.startsWith("u-")).toBe(true);
  });
  it("dos ejercicios creados seguidos tienen ids distintos", () => {
    const first = newExerciseId("Lunes", []);
    expect(newExerciseId("Lunes", [first])).not.toBe(first);
  });
});
