import SEO from "../components/SEO/SEO";
import CertificateVerification from "../components/CertificateVerification/CertificateVerification";

const CertificateVerificationPage = () => {
  return (
    <>
      <SEO
        title="Certificate Verification"
        description="Verify the authenticity of any certificate issued by NCA IT Solution. Enter the certificate number or verification ID to check validity instantly."
        path="/certificate-verification"
      />
      <CertificateVerification />
    </>
  );
};

export default CertificateVerificationPage;
