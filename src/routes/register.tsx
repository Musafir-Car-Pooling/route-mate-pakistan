import { PasswordInput } from "@/components/PasswordInput";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, GraduationCap, BadgeCheck, Upload, Car, Users, Home, Building2 } from "lucide-react";
import { AuthLogo } from "@/components/AppShell";
import { getState, useStore, locationsForCity, validRegistrationCatalog, validPassword, validOfficialEmail, validOptionalVehicle, compressImage, type Role, type Gender, type TravelMode } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/LocationPicker";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — Travel Sync" },
      { name: "description", content: "Join Travel Sync with your official work or university email." },
      { property: "og:title", content: "Register — Travel Sync" },
      { property: "og:description", content: "Verified registration for Jobians and students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Register,
});


function Register() {
  const nav = useNavigate();
  const settings = useStore((s) => s.settings);
  const companies = useStore((s) => s.companies);
  const [cityId, setCityId] = useState("");
  const [travelMode, setTravelMode] = useState<TravelMode>();
  const [role, setRole] = useState<Role>("jobian");
  const [f, setF] = useState({ name: "", gender: "male" as Gender, org: "", dept: "", email: "", phone: "", home: "", work: "", password: "", car: "", plate: "" });
  const [prefs, setPrefs] = useState<string[]>(["No smoking", "AC"]);
  const [otpSent, setOtpSent] = useState<string>();
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState<string>();
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [carPhoto, setCarPhoto] = useState<string>();
  const [profilePhoto, setProfilePhoto] = useState<string>();
  const [err, setErr] = useState("");
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const city = settings.cities.find((c) => c.id === cityId);
  const locations = locationsForCity(settings.cities, cityId);
  const organizations = companies.filter((c) => c.approved);
  const org = organizations.some((c) => c.name === f.org) ? f.org : "";
  const dept = role === "student" || settings.departments.includes(f.dept) ? f.dept : "";
  const home = locations.includes(f.home) ? f.home : "";
  const work = locations.includes(f.work) ? f.work : "";

  const sendOtp = () => {
    if (!validOfficialEmail(f.email, role)) return setErr(role === "student" ? "Use your university @edu.pk email" : "Use your official company email (not Gmail/Yahoo)");
    setErr(""); setOtpSent(String(Math.floor(100000 + Math.random() * 900000)));
  };
  const sendPhoneOtp = () => {
    if (!/^03\d{2}-?\d{7}$/.test(f.phone.trim())) return setErr("Enter a valid mobile number (03xx-xxxxxxx)");
    setErr(""); setPhoneOtpSent(String(Math.floor(100000 + Math.random() * 900000)));
  };
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelMode) return setErr("Choose whether you have a car or need a ride");
    const req = ["name", "org", "email", "phone", "home", "work"] as const;
    if (req.some((k) => !f[k].trim())) return setErr("Please fill all required fields");
    if (!city || !validRegistrationCatalog(getState().settings, getState().companies, { cityId, org: f.org, dept: f.dept, role, home: f.home, work: f.work })) return setErr("Select a city, organization, department and addresses from the available lists.");
    if (!verified) return setErr("Verify your official email with OTP");
    if (!phoneVerified) return setErr("Verify your mobile number with OTP");
    if (!validPassword(f.password)) return setErr("Password: minimum 6 letters/numbers only");
    if (travelMode === "driver" && !validOptionalVehicle(f)) return setErr("Number plate format looks invalid (e.g. LEA-1234)");
    const email = f.email.trim().toLowerCase();
    const user = { ...f, city: city.name, email, role, travelMode, prefs, verified: true, active: true, phonePublic: false, profilePhoto, car: travelMode === "driver" ? f.car : "", plate: travelMode === "driver" ? f.plate : "", carPhoto: travelMode === "driver" ? carPhoto : undefined, rating: 5 };
    setBusy(true); setErr("");
    try {
      const { registerAccount } = await import("@/lib/cloud");
      await registerAccount(user);
      nav({ to: "/" });
    } catch (x) {
      const code = (x as { code?: string }).code;
      setErr(code === "auth/email-already-in-use" ? "Email already registered" : "Could not create account. Please try again.");
    } finally { setBusy(false); }
  };
  const uploadPhoto = async (file: File | undefined, setPhoto: (photo: string) => void) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErr("Please choose an image");
    try { setPhoto(await compressImage(file)); setErr(""); }
    catch { setErr("Photo could not be uploaded. Please try another image."); }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-3 px-5 py-8">
      <AuthLogo imgSize="h-20 w-20" textSize="text-5xl" />
      <h1 className="font-display text-3xl text-muted-foreground">Create Account</h1>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Travel choice">
        {([["driver", "I've a car", Car], ["passenger", "Need a ride", Users]] as const).map(([k, label, Icon]) => (
          <Button type="button" key={k} variant="secondary" aria-pressed={travelMode === k} onClick={() => setTravelMode(k)} className={`h-24 flex-col gap-2 whitespace-normal border-2 font-display text-2xl ${travelMode === k ? "border-primary bg-primary/15" : "border-border"}`}><Icon className="size-7" />{label}</Button>
        ))}
      </div>
      {travelMode && <>
      <h2 className="pt-2 font-display text-2xl">Jobian or Student?</h2>
      <div className="grid grid-cols-2 gap-2">
        {([["jobian", "Jobian", Briefcase], ["student", "Student", GraduationCap]] as const).map(([k, l, I]) => (
          <Button type="button" key={k} variant="secondary" aria-pressed={role === k} onClick={() => { setRole(k); setF({ ...f, org: "", dept: "" }); setVerified(false); setOtpSent(undefined); }} className={`h-auto flex-col gap-1 border-2 p-4 font-display text-2xl ${role === k ? "border-primary bg-primary/15" : "border-border"}`}><I />{l}</Button>
        ))}
      </div>
      <input className="field" placeholder="Full name (as on CNIC)" value={f.name} onChange={up("name")} />
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-4 text-muted-foreground">
        {profilePhoto ? <img src={profilePhoto} alt="Profile preview" className="h-12 w-12 rounded-full object-cover" /> : <Upload className="shrink-0" />} Profile picture (optional)
        <input type="file" aria-label="Profile picture (optional)" accept="image/*" hidden onChange={(e) => uploadPhoto(e.target.files?.[0], setProfilePhoto)} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <select className="field" value={f.gender} onChange={up("gender")} aria-label="Gender"><option value="male">Male</option><option value="female">Female</option></select>
        <select className="field min-w-0" value={city?.id ?? ""} onChange={(e) => { setCityId(e.target.value); setF({ ...f, home: "", work: "" }); }} aria-label="City"><option value="">Select city</option>{settings.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </div>
      <LocationPicker label={role === "jobian" ? "Company name" : "Institute name"} value={org} locations={organizations.map((c) => c.name)} icon={<Building2 className="size-5" />} searchLabel="Search organizations" onChange={(value) => setF({ ...f, org: value })} />
      {role === "jobian" ? <LocationPicker label="Department" value={dept} locations={settings.departments} icon={<Briefcase className="size-5" />} searchLabel="Search departments" onChange={(value) => setF({ ...f, dept: value })} /> : <input className="field" placeholder="Student ID" value={f.dept} onChange={up("dept")} />}
      <div className="flex gap-2">
        <input className="field" type="email" placeholder={role === "jobian" ? "Work email @company.com" : "Student email @edu.pk"} value={f.email} onChange={(e) => { up("email")(e); setVerified(false); }} />
        <Button type="button" variant="secondary" onClick={sendOtp} className="h-auto shrink-0 px-4 font-bold text-primary">OTP</Button>
      </div>
      {otpSent && !verified && (
        <div className="card-box space-y-2 p-3">
          <p className="text-sm text-muted-foreground">Demo OTP: <b className="text-foreground">{otpSent}</b></p>
          <div className="flex gap-2"><input className="field" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
            <Button type="button" onClick={() => (otp === otpSent ? (setVerified(true), setErr("")) : setErr("Wrong OTP"))} className="h-auto shrink-0 px-4 font-bold">Verify</Button></div>
        </div>
      )}
      {verified && <p className="flex items-center gap-2 font-semibold text-success"><BadgeCheck />Verified Official Email</p>}
      <div className="flex gap-2">
        <input className="field" placeholder="Phone (03xx-xxxxxxx)" value={f.phone} onChange={(e) => { up("phone")(e); setPhoneVerified(false); }} />
        <Button type="button" variant="secondary" onClick={sendPhoneOtp} className="h-auto shrink-0 px-4 font-bold text-primary">OTP</Button>
      </div>
      {phoneOtpSent && !phoneVerified && (
        <div className="card-box space-y-2 p-3">
          <p className="text-sm text-muted-foreground">Demo OTP sent to your mobile: <b className="text-foreground">{phoneOtpSent}</b></p>
          <div className="flex gap-2"><input className="field" placeholder="Enter mobile OTP" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} />
            <Button type="button" onClick={() => (phoneOtp === phoneOtpSent ? (setPhoneVerified(true), setErr("")) : setErr("Wrong mobile OTP"))} className="h-auto shrink-0 px-4 font-bold">Verify</Button></div>
        </div>
      )}
      {phoneVerified && <p className="flex items-center gap-2 font-semibold text-success"><BadgeCheck />Verified Mobile Number</p>}
      <LocationPicker label="Home address" value={home} locations={locations} city={city?.name} icon={<Home className="h-5 w-5" />} onChange={(value) => setF({ ...f, home: value })} />
      <LocationPicker label={role === "jobian" ? "Workplace address" : "Campus address"} value={work} locations={locations} city={city?.name} icon={<Building2 className="h-5 w-5" />} onChange={(value) => setF({ ...f, work: value })} />
      {!settings.cities.length && <p className="text-sm text-muted-foreground">No cities available yet.</p>}
      {city && !locations.length && <p className="text-sm text-muted-foreground">No locations available in this city yet.</p>}
      <PasswordInput placeholder="Password (min 6 letters/numbers)" value={f.password} onChange={up("password")} />
      <p className="pt-2 font-display text-xl text-muted-foreground">Ride Preferences</p>
      <div className="flex flex-wrap gap-2">
        {PREFS.map((p) => (
          <Button type="button" key={p} variant={prefs.includes(p) ? "default" : "secondary"} aria-pressed={prefs.includes(p)} onClick={() => setPrefs(prefs.includes(p) ? prefs.filter((x) => x !== p) : [...prefs, p])} className="h-auto px-4 py-2 font-semibold">{p}</Button>
        ))}
      </div>
      {travelMode === "driver" && <>
      <p className="pt-2 font-display text-xl">Vehicle information (optional)</p>
      <p className="text-sm text-muted-foreground">Car model, number plate and vehicle picture are all optional.</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="min-w-0 text-sm text-muted-foreground">Car model (optional)<input className="field mt-1" placeholder="Car model" value={f.car} onChange={up("car")} /></label>
        <label className="min-w-0 text-sm text-muted-foreground">Number plate (optional)<input className="field mt-1 uppercase" placeholder="LEA-1234" value={f.plate} onChange={up("plate")} /></label>
      </div>
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed p-4 text-muted-foreground">
        {carPhoto ? <img src={carPhoto} alt="Vehicle" className="h-12 w-16 rounded object-cover" /> : <Upload className="shrink-0" />} Vehicle picture (optional)
        <input type="file" aria-label="Vehicle picture (optional)" accept="image/*" hidden onChange={(e) => uploadPhoto(e.target.files?.[0], setCarPhoto)} />
      </label>
      </>}
      {err && <p className="font-semibold text-destructive">{err}</p>}
      <Button type="submit" size="connection" disabled={busy}>{busy ? "Creating account…" : "Register"}</Button>
      </>}
      <Link to="/login" className="block py-2 text-center font-bold text-primary">Already have an account? Login</Link>
    </form>
  );
}
