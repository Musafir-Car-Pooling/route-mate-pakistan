import { describe, expect, it } from "vitest";
import { addMemberInterest, memberAlerts, nearbyOffers, removeMemberInterest } from "./ride-alerts";
import { getState, type Post, type User } from "./store";

const now = 100000;
const settings = getState().settings;
const passenger = { id: "passenger", travelMode: "passenger", city: "Lahore", home: "DHA", work: "Gulberg", gender: "male", name: "Ali", org: "Jazz", rating: 4, verified: true } as User;
const ride: Post = { id: "ride", ownerId: "driver", ownerName: "Ahmed", kind: "ride", city: "Lahore", from: "DHA", to: "Gulberg", active: true, createdAt: now, interests: [], notes: "", genderPref: "any" };
describe("interactive route alerts", () => {
  it("shows passengers every open ride in their city, closest route first", () => {
    const posts = [{ ...ride, id: "same-city", from: "Model Town", to: "Johar" }, { ...ride, id: "shares-stop", to: "Johar" }, { ...ride, id: "reverse", from: "Gulberg", to: "DHA" }, ride, { ...ride, id: "other-city", city: "Karachi" }, { ...ride, id: "cancelled", cancelledAt: now }, { ...ride, id: "old", createdAt: now - 25 * 3600000 }, { ...ride, id: "inactive", active: false }];
    expect(nearbyOffers(passenger, posts, settings, now).map((p) => p.id)).toEqual(["ride", "reverse", "shares-stop", "same-city"]);
  });
  it("hides rides reserved for the other gender", () => {
    expect(nearbyOffers(passenger, [{ ...ride, genderPref: "female" }], settings, now)).toHaveLength(0);
  });
  it("also matches a passenger's current posted route instead of only their saved profile", () => {
    const request = { ...ride, id: "request", kind: "request" as const, ownerId: passenger.id, to: "Office" };
    expect(nearbyOffers(passenger, [request, { ...ride, to: "Office" }], settings, now)).toHaveLength(1);
  });
  it("drivers receive newest passenger interest first on their own ride only", () => {
    const driver = { ...passenger, id: "driver", travelMode: "driver" as const };
    const state = { ...getState(), user: passenger, posts: [ride] };
    const withInterest = addMemberInterest(state, "ride", now);
    const first = withInterest.posts[0];
    if (!first) throw new Error("Missing ride");
    const second = { ...first, interests: [...first.interests, { ...first.interests[0], id: "second", at: now + 1 }] } as Post;
    const alerts = memberAlerts(driver, [second, { ...second, id: "other", ownerId: "someone-else" }], settings, now + 1);
    expect(alerts.map((a) => a.person?.id)).toEqual(["second", "passenger"]);
  });
  it("rejects duplicate interest and stale cancelled or expired rides", () => {
    const state = { ...getState(), user: passenger, posts: [ride] };
    const sent = addMemberInterest(state, ride.id, now);
    expect(sent.posts[0]?.interests).toHaveLength(1);
    expect(addMemberInterest(sent, ride.id, now)).toBe(sent);
    const cancelled = { ...state, posts: [{ ...ride, cancelledAt: now }] };
    expect(addMemberInterest(cancelled, ride.id, now)).toBe(cancelled);
    expect(addMemberInterest(state, ride.id, now + 25 * 3600000)).toBe(state);
  });
  it("lets a member cancel only their own interest", () => {
    const state = { ...getState(), user: passenger, posts: [ride] };
    const sent = addMemberInterest(state, ride.id, now);
    const cancelled = removeMemberInterest(sent, ride.id);
    expect(cancelled.posts[0]?.interests).toHaveLength(0);
    expect(removeMemberInterest(cancelled, ride.id)).toBe(cancelled);
    expect(removeMemberInterest(state, ride.id)).toBe(state);
  });
  it("gives drivers matching passenger requests without exposing unrelated cities", () => {
    const driver = { ...passenger, id: "driver", travelMode: "driver" as const };
    const request = { ...ride, kind: "request" as const, ownerId: "passenger" };
    expect(nearbyOffers(driver, [request, { ...request, id: "other", city: "Karachi" }], settings, now).map((p) => p.id)).toEqual(["ride"]);
  });
});