import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/format";
import { Spinner } from "@/components/ui";

const EMPTY = { currentPassword: "", newPassword: "", confirm: "" };

function check(values) {
  const errors = {};
  if (!values.currentPassword) errors.currentPassword = "Enter your current password";
  if (values.newPassword.length < 10) errors.newPassword = "Use at least 10 characters";
  else if (!/[a-zA-Z]/.test(values.newPassword) || !/\d/.test(values.newPassword))
    errors.newPassword = "Use letters and at least one number";
  if (values.confirm !== values.newPassword) errors.confirm = "The two new passwords don't match";
  return errors;
}

export default function Settings() {
  const { admin, replaceSession } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const field = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: (e) => setValues((v) => ({ ...v, [name]: e.target.value })),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    className: "input",
    type: "password",
  });

  const submit = async (e) => {
    e.preventDefault();
    const found = check(values);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setSaving(true);
    try {
      const session = await api("/api/auth/change-password", {
        method: "POST",
        body: { currentPassword: values.currentPassword, newPassword: values.newPassword },
      });
      replaceSession(session);
      setValues(EMPTY);
      toast.success("Password changed", { description: "You were signed out everywhere else." });
    } catch (err) {
      if (Object.keys(err.fields).length) setErrors(err.fields);
      else toast.error("Couldn't change the password", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="font-display text-4xl font-semibold">Settings</h1>
        <p className="mt-1 text-ivory-muted">Your admin account.</p>
      </div>

      {admin && (
        <section className="card grid gap-4 p-5 sm:grid-cols-2 md:p-6">
          <div>
            <p className="text-sm font-semibold text-ivory-muted">Username</p>
            <p className="mt-0.5">{admin.username}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ivory-muted">Signed in</p>
            <p className="mt-0.5">{admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : "Now"}</p>
          </div>
        </section>
      )}

      <form onSubmit={submit} noValidate className="card flex flex-col gap-5 p-5 md:p-6">
        <div>
          <h2 className="font-display text-2xl font-semibold">Change password</h2>
          <p className="mt-1 text-sm text-ivory-muted">At least 10 characters, with letters and a number.</p>
        </div>
        {/* lets password managers attach the new password to the right account */}
        <input type="text" name="username" autoComplete="username" value={admin?.username ?? ""} readOnly hidden />
        <Field label="Current password" name="currentPassword" error={errors.currentPassword}>
          <input {...field("currentPassword")} autoComplete="current-password" />
        </Field>
        <Field label="New password" name="newPassword" error={errors.newPassword}>
          <input {...field("newPassword")} autoComplete="new-password" />
        </Field>
        <Field label="Repeat new password" name="confirm" error={errors.confirm}>
          <input {...field("confirm")} autoComplete="new-password" />
        </Field>
        <button type="submit" className="btn-gold self-start" disabled={saving}>
          {saving && <Spinner />} Change password
        </button>
      </form>
    </div>
  );
}

function Field({ label, name, error, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="label">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
