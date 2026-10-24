import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, GraduationCap, BadgeCheck, Upload } from "lucide-react";
import { Logo } from "@/components/AppShell";
import { setState, getState, uid, validPassword, validOfficialEmail, validPlate, compressImage, type Role, type Gender } from "@/lib/store";

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

const PREFS = ["Smoking allowed", "No smoking", "AC", "Music", "Quiet ride"];

function Register() {
  const nav = useNavigate();
  const [role, setRole] = useState<Role>("jobian");
  const [f, setF] = useState({ name: "", gender: "male" as Gender, city: "Lahore", org: "", dept: "", email: "", phone: "", home: "", work: "", password: "", car: "", plate: "" });
  const [prefs, setPrefs] = useState<string[]>(["No smoking", "AC"]);
  const [otpSent, setOtpSent] = useState<string>();
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [carPhoto, setCarPhoto] = useState<string>();
  const [err, setErr] = useState("");
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const sendOtp = () => {
    if (!validOfficialEmail(f.email, role)) return setErr(role === "student" ? "Use your university @edu.pk email" : "Use your official company email (not Gmail/Yahoo)");
    setErr(""); setOtpSent(String(Math.floor(100000 + Math.random() * 900000)));
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const req = ["name", "org", "email", "phone", "home", "work"] as const;
    if (req.some((k) => !f[k].trim())) return setErr("Please fill all required fields");
    if (!verified) return setErr("Verify your official email with OTP");
    if (!validPassword(f.password)) return setErr("Password: minimum 6 letters/numbers only");
    if (f.plate && !validPlate(f.plate)) return setErr("Number plate format looks invalid (e.g. LEA-1234)");
    const email = f.email.trim().toLowerCase();
    if (getState().users.some((u) => u.email === email)) return setErr("Email already registered");
    const user = { id: uid(), ...f, email, role, prefs, verified: true, active: true, phonePublic: false, carPhoto, rating: 5 };
    setState((s) => ({ ...s, users: [...s.users, user], user, seenIntro: true }));
    nav({ to: "/" });
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-3 px-5 py-8">
      <Logo size="text-5xl" />
      <h1 className="font-display text-3xl text-muted-foreground">Create Account</h1>
      <div className="grid grid-cols-2 gap-2">
        {([["jobian", "Jobian", Briefcase], ["student", "Student", GraduationCap]] as const).map(([k, l, I]) => (
          <button type="button" key={k} onClick={() => { setRole(k); setVerified(false); setOtpSent(undefined); }} className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-4 font-display text-2xl ${role === k ? "border-primary bg-primary/15" : "border-border bg-secondary"}`}><I />{l}</button>
        ))}
      </div>
      <input className="field" placeholder="Full name (as on CNIC)" value={f.name} onChange={up("name")} />
      <div className="grid grid-cols-2 gap-2">
        <select className="field" value={f.gender} onChange={up("gender")} aria-label="Gender"><option value="male">Male</option><option value="female">Female</option></select>
        <select className="field" value={f.city} onChange={up("city")} aria-label="City">{["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar"].map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <input className="field" placeholder={role === "jobian" ? "Company name" : "Institute name"} value={f.org} onChange={up("org")} />
      <input className="field" placeholder={role === "jobian" ? "Department" : "Student ID"} value={f.dept} onChange={up("dept")} />
      <div className="flex gap-2">
        <input className="field" type="email" placeholder={role === "jobian" ? "Work email @company.com" : "Student email @edu.pk"} value={f.email} onChange={(e) => { up("email")(e); setVerified(false); }} />
        <button type="button" onClick={sendOtp} className="shrink-0 rounded-xl bg-secondary px-4 font-bold text-primary">OTP</button>
      </div>
      {otpSent && !verified && (
        <div className="card-box space-y-2 p-3">
          <p className="text-sm text-muted-foreground">Demo OTP: <b className="text-foreground">{otpSent}</b></p>
          <div className="flex gap-2"><input className="field" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
            <button type="button" onClick={() => (otp === otpSent ? setVerified(true) : setErr("Wrong OTP"))} className="shrink-0 rounded-xl bg-primary px-4 font-bold text-primary-foreground">Verify</button></div>
        </div>
      )}
      {verified && <p className="flex items-center gap-2 font-semibold text-success"><BadgeCheck />Verified Official Email</p>}
      <input className="field" placeholder="Phone (03xx-xxxxxxx)" value={f.phone} onChange={up("phone")} />
      <input className="field" placeholder="Home address" value={f.home} onChange={up("home")} />
      <input className="field" placeholder={role === "jobian" ? "Workplace address" : "Campus address"} value={f.work} onChange={up("work")} />
      <input className="field" type="password" placeholder="Password (min 6 letters/numbers)" value={f.password} onChange={up("password")} />
      <p className="pt-2 font-display text-xl text-muted-foreground">Ride Preferences</p>
      <div className="flex flex-wrap gap-2">
        {PREFS.map((p) => (
          <button type="button" key={p} onClick={() => setPrefs(prefs.includes(p) ? prefs.filter((x) => x !== p) : [...prefs, p])} className={`rounded-full px-4 py-2 font-semibold ${prefs.includes(p) ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{p}</button>
        ))}
      </div>
      <p className="pt-2 font-display text-xl text-muted-foreground">Vehicle (drivers only)</p>
      <div className="grid grid-cols-2 gap-2">
        <input className="field" placeholder="Car model" value={f.car} onChange={up("car")} />
        <input className="field uppercase" placeholder="Plate LEA-1234" value={f.plate} onChange={up("plate")} />
      </div>
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed p-4 text-muted-foreground">
        {carPhoto ? <img src={carPhoto} alt="Vehicle" className="h-12 w-16 rounded object-cover" /> : <Upload />} Vehicle photo (auto-compressed)
        <input type="file" accept="image/*" hidden onChange={async (e) => { const x = e.target.files?.[0]; if (x) setCarPhoto(await compressImage(x)); }} />
      </label>
      {err && <p className="font-semibold text-destructive">{err}</p>}
      <button className="btn-big">Register</button>
      <Link to="/login" className="block py-2 text-center font-bold text-primary">Already have an account? Login</Link>
    </form>
  );
}
