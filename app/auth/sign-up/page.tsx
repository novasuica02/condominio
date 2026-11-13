import { Suspense } from "react";
import SignUpForm from "./form";

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="text-center mt-10">Carregando formulário...</div>}>
      <SignUpForm />
    </Suspense>
  );
}