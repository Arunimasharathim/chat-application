import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { applyActionCode } from "firebase/auth";
import { auth } from "../config/firebase";
import { toast } from "react-toastify";

const VerifyRedirect = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const oobCode = params.get("oobCode");

    const verifyEmail = async () => {
      try {
        if (oobCode) {
          await applyActionCode(auth, oobCode);
          toast.success("Email verified! Please login.");
        } else {
          toast.error("Invalid or missing verification code.");
        }
        navigate("/"); // Redirect to login
      } catch (err) {
        toast.error("Verification failed or expired.");
        navigate("/");
      }
    };

    verifyEmail();
  }, [params, navigate]);

  return <p>Verifying your email...</p>;
};

export default VerifyRedirect;
