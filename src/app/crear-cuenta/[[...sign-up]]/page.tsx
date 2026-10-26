import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-semibold">Creación de cuenta no configurada</h1>
        <p className="mt-3 text-sm text-muted">Configura NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY en las variables de entorno para activar el registro con Clerk.</p>
      </main>
    );
  }

  return <main className="flex min-h-screen items-center justify-center px-4 py-10"><SignUp routing="path" path="/crear-cuenta" signInUrl="/iniciar-sesion" forceRedirectUrl="/panel" /></main>;
}
