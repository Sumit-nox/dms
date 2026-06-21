"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const signIn = async () => {
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    const userId = data.user.id;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", userId)
      .single();

    if (profileError) {
      setMessage(profileError.message);
      return;
    }

    if (profile.role === "distributor") {
      router.push("/distributor");
      return;
    }

    if (profile.role === "salesman") {
      router.push("/salesman");
      return;
    }

    setMessage(
      `Welcome ${profile.full_name}! Your role is ${profile.role}.`
    );
  };

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Distribution Management System
      </h1>

      <div className="space-y-4">
        <input
          className="border p-2 w-full"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={signIn}
        >
          Login
        </button>

        {message && <p>{message}</p>}
      </div>
    </main>
  );
}