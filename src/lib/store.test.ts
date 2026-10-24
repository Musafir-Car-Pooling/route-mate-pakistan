import { describe, it, expect } from "vitest";
import { isAdminCreds, validPassword, formatPKR, isExpired, validOfficialEmail, type Post, getState } from "./store";
import { locationsForCity, validRouteLocations, type City } from "./store";
import { validOptionalVehicle } from "./store";

describe("travel sync rules", () => {
  it("allows drivers to register without any vehicle details or vehicle photo", () => {
    expect(validOptionalVehicle({})).toBe(true);
    expect(validOptionalVehicle({ car: "", plate: "", carPhoto: undefined })).toBe(true);
    expect(validOptionalVehicle({ plate: "invalid" })).toBe(false);
    expect(validOptionalVehicle({ plate: "LEA-1234" })).toBe(true);
  });
  const cities: City[] = [
    { id: "lahore", name: "Lahore", locations: ["Johar Town", "FAST Campus"] },
    { id: "karachi", name: "Karachi", locations: ["Gulshan"] },
  ];
  it("shows only locations fed by admin for the selected city", () => {
    expect(locationsForCity(cities, "lahore")).toEqual(["Johar Town", "FAST Campus"]);
    expect(locationsForCity(cities, "karachi")).toEqual(["Gulshan"]);
    expect(locationsForCity(cities, "unknown")).toEqual([]);
  });
  it("only accepts From and To from the admin's selected-city list", () => {
    expect(validRouteLocations(cities, "lahore", "Johar Town", "FAST Campus")).toBe(true);
    expect(validRouteLocations(cities, "lahore", "Typed address", "FAST Campus")).toBe(false);
    expect(validRouteLocations(cities, "lahore", "Johar Town", "Gulshan")).toBe(false);
    expect(validRouteLocations(cities, "lahore", "Johar Town", "")).toBe(false);
    expect(validRouteLocations([], "lahore", "Johar Town", "FAST Campus")).toBe(false);
  });
  it("admin creds", () => { expect(isAdminCreds("pp@gmail.com", "ppllmm")).toBe(true); expect(isAdminCreds("pp@gmail.com", "x")).toBe(false); });
  it("password min 6 alphanumeric", () => { expect(validPassword("abc12")).toBe(false); expect(validPassword("abc123")).toBe(true); });
  it("PKR format", () => expect(formatPKR(8500)).toBe("PKR 8,500"));
  it("student needs edu.pk", () => { expect(validOfficialEmail("a@lums.edu.pk", "student")).toBe(true); expect(validOfficialEmail("a@gmail.com", "jobian")).toBe(false); });
  it("expires after 24h", () => {
    const s = getState().settings;
    const p = { createdAt: 0 } as Post;
    expect(isExpired(p, s, 23 * 3600_000)).toBe(false);
    expect(isExpired(p, s, 25 * 3600_000)).toBe(true);
  });
});
