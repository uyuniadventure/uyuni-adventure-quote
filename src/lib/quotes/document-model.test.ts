import { describe, expect, it } from "vitest";
import { splitDescriptiveLodging } from "./document-model";

describe("alojamiento descriptivo importado", () => {
  it("prioriza las comidas separadas y limpia el texto del hotel", () => {
    expect(
      splitDescriptiveLodging(
        "Hotel Luna Salada Comidas incluidas: texto combinado anterior.",
        "Desayuno, almuerzo y cena.",
      ),
    ).toEqual({
      accommodation: "Hotel Luna Salada",
      meals: "Desayuno, almuerzo y cena.",
    });
  });

  it("extrae las comidas del texto combinado solo cuando no hay campo separado", () => {
    expect(
      splitDescriptiveLodging("Hotel Luna Salada Comidas incluidas: Almuerzo.", null),
    ).toEqual({ accommodation: "Hotel Luna Salada", meals: "Almuerzo." });
  });

  it("conserva hotel sin comidas y alojamiento no incluido", () => {
    expect(splitDescriptiveLodging("Hotel Tayka del Desierto", null)).toEqual({
      accommodation: "Hotel Tayka del Desierto",
      meals: "",
    });
    expect(
      splitDescriptiveLodging(
        "No incluído Comidas incluidas: Desayuno, Almuerzo y Cocktail",
        "Desayuno, Almuerzo y Cocktail",
      ),
    ).toEqual({
      accommodation: "No incluído",
      meals: "Desayuno, Almuerzo y Cocktail",
    });
  });

  it("conserva íntegro un texto sin separador reconocible", () => {
    expect(splitDescriptiveLodging("Posada con desayuno según programa", null)).toEqual({
      accommodation: "Posada con desayuno según programa",
      meals: "",
    });
  });
});
