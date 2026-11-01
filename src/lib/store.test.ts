import { describe, it, expect } from "vitest";
import { isAdminCreds, validPassword, formatPKR, isExpired, validOfficialEmail, type Post, getState } from "./store";
import { locationsForCity, validRouteLocations, type City } from "./store";
import { validOptionalVehicle, validRegistrationCatalog, cancelOwnPost, canContactPost, switchTravelMode, deleteOwnPost, type State } from "./store";

describe("travel sync rules", () => {
  const ownPost: Post = { id: "own", kind: "request", ownerId: "member", ownerName: "Member", from: "Home", to: "Office", notes: "", genderPref: "any", createdAt: 1000, active: true, interests: [] };
  const ownerState = { ...getState(), user: { id: "member" }, posts: [ownPost] } as State;
  it("switches a registered passenger to driver and updates their saved profile", () => {
    const user = { ...ownerState.user, travelMode: "passenger" } as State["users"][number];
    const result = switchTravelMode({ ...ownerState, user, users: [user] });
    expect(result.user?.travelMode).toBe("driver");
    expect(result.users[0]?.travelMode).toBe("driver");
  });
  it("switches a registered driver to passenger without changing professional role", () => {
    const user = { ...ownerState.user, travelMode: "driver", role: "jobian" } as State["users"][number];
    const result = switchTravelMode({ ...ownerState, user });
    expect(result.user?.travelMode).toBe("passenger");
    expect(result.user?.role).toBe("jobian");
  });
  it("users can cancel their own request", () => {
    const result = cancelOwnPost(ownerState, "own", 2000);
    expect(result.posts[0]?.active).toBe(false);
    expect(result.posts[0]?.cancelledAt).toBe(2000);
  });
  it("users can cancel their own ride", () => {
    const result = cancelOwnPost({ ...ownerState, posts: [{ ...ownPost, kind: "ride" }] }, "own", 2000);
    expect(result.posts[0]?.active).toBe(false);
    expect(result.posts[0]?.kind).toBe("ride");
  });
  it("users cannot cancel another member's offer", () => {
    const other = { ...ownerState, posts: [{ ...ownPost, ownerId: "other" }] };
    expect(cancelOwnPost(other, "own", 2000)).toBe(other);
  });
  it("cancelled offers do not permit matching or new contact payments", () => {
    expect(canContactPost(ownPost, ownerState.settings, "member", 2000)).toBe(true);
    expect(canContactPost({ ...ownPost, active: false, cancelledAt: 2000 }, ownerState.settings, "member", 3000)).toBe(false);
    expect(canContactPost(ownPost, ownerState.settings, "other", 2000)).toBe(false);
  });
  it("users can delete their own cancelled request along with its unlocks", () => {
    const cancelled = cancelOwnPost(ownerState, "own", 2000);
    const withUnlock = { ...cancelled, unlocks: [{ id: "u1", postId: "own", interestId: "i1", userId: "member", method: "easypaisa", txn: "t", amount: 150, status: "pending", at: 1 }] } as State;
    const result = deleteOwnPost(withUnlock, "own");
    expect(result.posts).toHaveLength(0);
    expect(result.unlocks).toHaveLength(0);
  });
  it("users cannot delete an active offer or another member's offer", () => {
    expect(deleteOwnPost(ownerState, "own")).toBe(ownerState);
    const other = cancelOwnPost({ ...ownerState, posts: [{ ...ownPost, ownerId: "other" }] }, "own", 2000);
    expect(deleteOwnPost({ ...other, posts: [{ ...ownPost, ownerId: "other", active: false, cancelledAt: 2000 }] }, "own").posts).toHaveLength(1);
  });
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
  const catalog = { ...getState().settings, cities, departments: ["IT"] };
  const organizations = [{ id: "company", name: "Systems Ltd", approved: true }, { id: "institute", name: "FAST NUCES", approved: true }, { id: "pending", name: "Pending Company", approved: false }];
  const selection = { cityId: "lahore", org: "Systems Ltd", dept: "IT", role: "jobian" as const, home: "Johar Town", work: "FAST Campus" };
  it("registration accepts only admin-approved companies and institutes", () => {
    expect(validRegistrationCatalog(catalog, organizations, selection)).toBe(true);
    expect(validRegistrationCatalog(catalog, organizations, { ...selection, org: "Typed Company" })).toBe(false);
    expect(validRegistrationCatalog(catalog, organizations, { ...selection, org: "Pending Company" })).toBe(false);
    expect(validRegistrationCatalog(catalog, organizations, { ...selection, role: "student", org: "FAST NUCES", dept: "student-123" })).toBe(true);
  });
  it("registration jobian department must come from the admin list", () => {
    expect(validRegistrationCatalog(catalog, organizations, selection)).toBe(true);
    expect(validRegistrationCatalog(catalog, organizations, { ...selection, dept: "Typed department" })).toBe(false);
    expect(validRegistrationCatalog(catalog, organizations, { ...selection, dept: "" })).toBe(false);
  });
  it("registration addresses must belong to the selected admin city", () => {
    expect(validRegistrationCatalog(catalog, organizations, selection)).toBe(true);
    expect(validRegistrationCatalog(catalog, organizations, { ...selection, home: "Typed address" })).toBe(false);
    expect(validRegistrationCatalog(catalog, organizations, { ...selection, work: "Gulshan" })).toBe(false);
    expect(validRegistrationCatalog(catalog, organizations, { ...selection, cityId: "unknown" })).toBe(false);
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

import { matchingPosts as mp } from "./store";
describe("matchingPosts", () => {
  const base = { ownerName: "A", city: "Lahore", from: "DHA", to: "Gulberg", notes: "", genderPref: "any" as const, createdAt: Date.now(), active: true, interests: [] };
  const settings = { autoCancel: true, hours: 24 } as never;
  it("shows only opposite-kind offers by others on the same route", () => {
    const mine = { ...base, id: "1", kind: "request" as const, ownerId: "me" };
    const ride = { ...base, id: "2", kind: "ride" as const, ownerId: "x" };
    const otherRoute = { ...ride, id: "3", to: "Johar" };
    const sameKind = { ...base, id: "4", kind: "request" as const, ownerId: "y" };
    expect(mp(mine, [mine, ride, otherRoute, sameKind], settings).map((p) => p.id)).toEqual(["2"]);
  });
});


import { pickDemoInterests as pickDemo } from "./store";
describe("demo interests", () => {
  const base = { id: "p", kind: "request", ownerId: "o", ownerName: "O", from: "A", to: "B", notes: "", genderPref: "any", createdAt: 0, active: true, interests: [] } as never;
  const users = Array.from({ length: 8 }, (_, i) => ({ id: "d" + i, name: "N" + i, org: "X", gender: i < 3 ? "female" : "male", rating: 5, reviews: [] })) as never;
  it("gives 5 unique demo members in demo mode", () => {
    const r = pickDemo(base, { demoMode: true, demoUsers: users } as never, 0);
    expect(r).toHaveLength(5);
    expect(new Set(r.map((i) => i.id)).size).toBe(5);
    expect(r.every((i) => i.id.startsWith("demo_") && i.at > 0)).toBe(true);
  });
  it("follows the gender rule", () => {
    const r = pickDemo({ ...(base as object), genderPref: "female" } as never, { demoMode: true, demoUsers: users } as never, 0);
    expect(r).toHaveLength(3);
    expect(r.every((i) => i.gender === "female")).toBe(true);
  });
  it("gives none in real mode", () => {
    expect(pickDemo(base, { demoMode: false, demoUsers: users } as never, 0)).toHaveLength(0);
  });
});
