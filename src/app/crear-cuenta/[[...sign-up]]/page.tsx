import Link from "next/link";
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 py-10">
      <SignUp routing="path" path="/crear-cuenta" signInUrl="/iniciar-sesion" forceRedirectUrl="/panel" />
      <p className="max-w-sm text-center text-xs leading-5 text-muted">
        Al crear tu cuenta aceptas los{" "}
        <Link href="/terminos" className="underline underline-offset-2 hover:text-chalk">Términos de uso</Link> y la{" "}
        <Link href="/privacidad" className="underline underline-offset-2 hover:text-chalk">Política de privacidad</Link>.
      </p>
    </main>
  );
}
