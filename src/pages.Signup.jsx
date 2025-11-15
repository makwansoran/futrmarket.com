import React from "react";
import { EmailForm } from "./pages.Login.jsx";

export default function SignupPage({ onLogin }){
  return (
    <main className="max-w-md mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-4">Create account</h1>
      <EmailForm label="Create account" onDone={onLogin}/>
    </main>
  );
}
