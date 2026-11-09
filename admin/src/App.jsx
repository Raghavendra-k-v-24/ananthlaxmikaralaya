import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { Toaster } from "sonner";
import AuthProvider from "@/components/AuthProvider";
import Layout from "@/components/Layout";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import Login from "@/pages/Login";
import Enquiries from "@/pages/Enquiries";
import EnquiryDetail from "@/pages/EnquiryDetail";
import Settings from "@/pages/Settings";

// Everything except /login needs a signed-in admin
function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "checking") {
    return (
      <div className="grid min-h-svh place-items-center text-ivory-muted" aria-busy="true">
        <Spinner className="size-6" />
      </div>
    );
  }
  if (status === "signedOut") return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Enquiries />} />
            <Route path="enquiries/:id" element={<EnquiryDetail />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster theme="dark" position="top-center" richColors closeButton />
    </AuthProvider>
  );
}
