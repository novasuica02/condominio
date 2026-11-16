import { Suspense } from "react";
import SignUpForm from "./form";

export default function SignUpPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center bg-slate-900 min-h-screen">
      <Suspense fallback={<div className="text-center mt-10 text-slate-400">Carregando formulário...</div>}>
        <SignUpForm />
      </Suspense>
    </div>
  );
}