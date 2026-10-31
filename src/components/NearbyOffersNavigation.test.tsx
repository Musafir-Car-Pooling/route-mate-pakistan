import { render, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NearbyOffersNavigation } from "./NearbyOffersNavigation";
import { getState, setRemote, type Post, type User } from "@/lib/store";

const routing = vi.hoisted(() => ({ path: "/", navigate: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => routing.navigate,
  useLocation: ({ select }: { select: (value: { pathname: string }) => string }) => select({ pathname: routing.path }),
}));
const initial = getState();
const ride: Post = { id: "auto-ride", kind: "ride", ownerId: "driver", ownerName: "Driver", city: "Lahore", from: "DHA", to: "Gulberg", active: true, interests: [], createdAt: Date.now(), notes: "", genderPref: "any" };
function member(id: string, travelMode: "driver" | "passenger") {
  return { id, travelMode, city: "Lahore", home: "DHA", work: "Gulberg", gender: "male" } as User;
}
afterEach(() => { cleanup(); setRemote(() => initial); routing.navigate.mockClear(); routing.path = "/"; });
describe("automatic nearby screens", () => {
  it("opens a passenger's separate screen when a new matching ride arrives live", async () => {
    setRemote((s) => ({ ...s, user: member("auto-passenger", "passenger"), posts: [] }));
    const screen = render(<NearbyOffersNavigation />);
    expect(routing.navigate).not.toHaveBeenCalled();
    setRemote((s) => ({ ...s, posts: [ride] }));
    await waitFor(() => expect(routing.navigate).toHaveBeenCalledWith({ to: "/nearby-rides" }));
    screen.unmount();
    routing.navigate.mockClear();
    render(<NearbyOffersNavigation />);
    expect(routing.navigate).not.toHaveBeenCalled();
  });
  it("opens a driver's separate screen for matching passenger requests", async () => {
    setRemote((s) => ({ ...s, user: member("auto-driver", "driver"), posts: [{ ...ride, id: "auto-request", ownerId: "passenger", kind: "request" }] }));
    render(<NearbyOffersNavigation />);
    await waitFor(() => expect(routing.navigate).toHaveBeenCalledWith({ to: "/nearby-requests" }));
  });
  it("does not interrupt reviews with incoming offers", () => {
    routing.path = "/reviews/ride/member";
    setRemote((s) => ({ ...s, user: member("review-passenger", "passenger"), posts: [ride] }));
    render(<NearbyOffersNavigation />);
    expect(routing.navigate).not.toHaveBeenCalled();
  });
});