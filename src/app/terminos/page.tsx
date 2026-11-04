import type { Metadata } from "next";
import { CONTACT_EMAIL, LEGAL_NAME, LegalLayout } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Términos de uso · GYMRAT",
  description: "Las reglas de uso de GYMRAT: quién puede usarlo, qué esperar de las estimaciones y cuáles son tus responsabilidades.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Términos de uso" other={{ href: "/privacidad", label: "Política de privacidad" }}>
      <p>
        Estos términos regulan el uso de GYMRAT, ofrecido por {LEGAL_NAME}. Al crear una cuenta y usar la aplicación aceptas lo que sigue. Si no estás de acuerdo, no la uses.
      </p>

      <h2>1. Quién puede usar GYMRAT</h2>
      <p>Debes tener 18 años o más y proporcionar datos veraces. Eres responsable de mantener segura tu cuenta y de lo que ocurra con ella.</p>

      <h2>2. No es consejo médico</h2>
      <p>
        GYMRAT ofrece estimaciones orientativas de calorías, proteína, agua y progreso a partir de los datos que introduces. <strong>No sustituye el consejo de un médico, nutricionista o entrenador.</strong> Si tienes una condición médica, estás embarazada, tomas medicación o tienes dudas, consúltalo con un profesional antes de cambiar tu alimentación o tu entrenamiento. Entrenas y comes bajo tu propia responsabilidad.
      </p>

      <h2>3. Tus datos</h2>
      <p>
        Tus datos son tuyos. Nos autorizas únicamente a guardarlos y procesarlos para prestarte el servicio, como explica la Política de privacidad. Puedes descargarlos, borrarlos o eliminar tu cuenta en cualquier momento desde la aplicación.
      </p>

      <h2>4. Uso aceptable</h2>
      <ul>
        <li>No intentes acceder a datos de otras personas ni vulnerar la seguridad del servicio.</li>
        <li>No uses el servicio para fines ilegales ni para sobrecargarlo de forma abusiva.</li>
        <li>No hagas copias del servicio ni lo ofrezcas a terceros sin permiso.</li>
      </ul>

      <h2>5. Disponibilidad</h2>
      <p>
        Hacemos lo posible por que GYMRAT funcione siempre, pero se ofrece «tal cual». Puede haber interrupciones, errores o cambios en las funciones. Te recomendamos descargar copias de seguridad de vez en cuando.
      </p>

      <h2>6. Limitación de responsabilidad</h2>
      <p>
        En la medida que permita la ley, no somos responsables de daños indirectos ni de decisiones que tomes basándote en las estimaciones de la aplicación, ni de pérdidas de datos que no se deban a nuestra negligencia.
      </p>

      <h2>7. Suspensión y eliminación</h2>
      <p>
        Puedes dejar de usar GYMRAT y eliminar tu cuenta cuando quieras. Podemos suspender cuentas que incumplan estos términos o pongan en riesgo la seguridad del servicio.
      </p>

      <h2>8. Cambios</h2>
      <p>Podemos actualizar estos términos. Si el cambio es importante, te avisaremos dentro de la aplicación. Seguir usando GYMRAT después significa que aceptas la nueva versión.</p>

      <h2>9. Contacto</h2>
      <p>
        {CONTACT_EMAIL ? (
          <>
            Para dudas sobre estos términos escríbenos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </>
        ) : (
          <>Para dudas sobre estos términos, usa las opciones de la aplicación o contacta con quien administra el servicio.</>
        )}
      </p>
    </LegalLayout>
  );
}
