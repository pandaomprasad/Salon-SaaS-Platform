// "use client";

// import { useState } from "react";
// import { User } from "@/lib/types";
// import { Input } from "@/components/ui/Input";
// import Button from "@/components/ui/Button";
// import { Mail, Lock, AlertCircle } from "lucide-react";

// import { loginSalon } from "@/api/services/authService";
// import { mapUser } from "@/lib/mapUser";
// import { useRouter } from "next/navigation";
// import { useDispatch } from "react-redux";
// import { loginSuccess } from "@/store/slices/authSlice";
// interface LoginPageProps {
//   onLogin: (user: User) => void;
// }

// export default function LoginPage({ onLogin }: LoginPageProps) {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();
//   const dispatch = useDispatch();

//   async function handleLogin(): Promise<void> {
//     setError("");
//     setLoading(true);
//     if (!email || !password) {
//       setError("Please enter email and password");
//       return;
//     }

//     try {
//       const data = await loginSalon({
//         email: email.trim().toLowerCase(),
//         password,
//       });

//       const backendUser = data.data?.user;
//       const token = data.data?.accessToken;

//       if (!backendUser || !token) {
//         throw new Error("Invalid user data from server");
//       }

//       localStorage.setItem("token", token);

//       const formattedUser = mapUser(backendUser);

//       // 🔥 Redux update
//       dispatch(
//         loginSuccess({
//           user: formattedUser,
//           token,
//         }),
//       );

//       router.push("/dashboard");
//     } catch (err: unknown) {
//       if (err instanceof Error) {
//         setError(err.message);
//       } else {
//         setError("Login failed");
//       }
//     } finally {
//       setLoading(false);
//     }
//   }
//   function handleKeyDown(e: React.KeyboardEvent) {
//     if (e.key === "Enter") handleLogin();
//   }

//   return (
//     <div className="min-h-screen bg-paper flex">
//       {/* Left panel — branding */}
//       <div className="hidden lg:flex w-1/2 bg-ink flex-col justify-between p-12">
//         <div>
//           <p className="text-[11px] tracking-[0.3em] text-silver uppercase mb-2">
//             Management Platform
//           </p>
//           <h1 className="font-display text-4xl text-paper leading-tight">
//             Luxe Salon
//           </h1>
//         </div>

//         <div className="space-y-6">
//           {[
//             {
//               role: "Owner",
//               email: "aria@luxesalon.com",
//               password: "owner123",
//             },
//             {
//               role: "Manager",
//               email: "marco@luxesalon.com",
//               password: "manager123",
//             },
//             {
//               role: "Staff",
//               email: "jade@luxesalon.com",
//               password: "staff123",
//             },
//           ].map((c) => (
//             <div
//               key={c.role}
//               onClick={() => {
//                 setEmail(c.email);
//                 setPassword(c.password);
//                 setError("");
//               }}
//               className="border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/5 transition-colors group"
//             >
//               <div className="flex items-center justify-between mb-1">
//                 <span className="text-xs font-semibold text-silver uppercase tracking-wide">
//                   {c.role}
//                 </span>
//                 <span className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">
//                   Click to fill
//                 </span>
//               </div>
//               <p className="text-sm text-paper/70">{c.email}</p>
//               <p className="text-xs text-silver mt-0.5">
//                 Password: {c.password}
//               </p>
//             </div>
//           ))}
//         </div>

//         <p className="text-xs text-silver/40">
//           © 2026 Luxe Salon. Internal use only.
//         </p>
//       </div>

//       {/* Right panel — login form */}
//       <div className="flex-1 flex items-center justify-center p-8">
//         <div className="w-full max-w-sm">
//           {/* Mobile logo */}
//           <div className="lg:hidden mb-8">
//             <p className="text-[11px] tracking-[0.3em] text-ash uppercase mb-1">
//               Management Platform
//             </p>
//             <h1 className="font-display text-3xl text-ink">Luxe Salon</h1>
//           </div>

//           <h2 className="text-2xl font-display mb-1">Welcome back</h2>
//           <p className="text-sm text-ash mb-8">
//             Sign in to your account to continue.
//           </p>

//           {/* Form */}
//           <div className="space-y-4" onKeyDown={handleKeyDown}>
//             <Input
//               label="Email"
//               type="email"
//               placeholder="you@luxesalon.com"
//               value={email}
//               onChange={(e) => {
//                 setEmail(e.target.value);
//                 setError("");
//               }}
//               icon={<Mail size={14} />}
//             />
//             <Input
//               label="Password"
//               type="password"
//               placeholder="Enter your password"
//               value={password}
//               onChange={(e) => {
//                 setPassword(e.target.value);
//                 setError("");
//               }}
//               icon={<Lock size={14} />}
//             />

//             {/* Error */}
//             {error && (
//               <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-3 py-2.5">
//                 <AlertCircle size={14} className="shrink-0" />
//                 <p className="text-xs">{error}</p>
//               </div>
//             )}

//             <Button
//               className="w-full"
//               size="lg"
//               onClick={handleLogin}
//               loading={loading}
//               disabled={loading}
//             >
//               Sign In
//             </Button>
//           </div>

//           {/* Demo hint on mobile */}
//           <div className="lg:hidden mt-6 border border-smoke rounded-xl p-4 space-y-2">
//             <p className="text-xs font-semibold text-ash mb-2">
//               Demo Credentials
//             </p>
//             {[
//               {
//                 role: "Owner",
//                 email: "aria@luxesalon.com",
//                 password: "owner123",
//               },
//               {
//                 role: "Manager",
//                 email: "marco@luxesalon.com",
//                 password: "manager123",
//               },
//               {
//                 role: "Staff",
//                 email: "jade@luxesalon.com",
//                 password: "staff123",
//               },
//             ].map((c) => (
//               <div
//                 key={c.role}
//                 onClick={() => {
//                   setEmail(c.email);
//                   setPassword(c.password);
//                   setError("");
//                 }}
//                 className="text-xs text-ash cursor-pointer hover:text-ink transition-colors"
//               >
//                 <span className="font-medium">{c.role}:</span> {c.email} /{" "}
//                 {c.password}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
