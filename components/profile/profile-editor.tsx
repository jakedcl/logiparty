"use client";

import { useState } from "react";
import {
  DetailFields,
  EditFormActions,
  ViewEdit,
} from "@/components/ui/view-edit";
import {
  changeOwnPassword,
  updateProfileName,
} from "@/lib/actions/profile";

type Profile = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  hasPassword: boolean;
};

function displayName(p: Profile) {
  const n = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return n || "—";
}

export function ProfileEditor({ profile }: { profile: Profile }) {
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordOk, setPasswordOk] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  return (
    <div className="space-y-8 max-w-md">
      <ViewEdit
        view={
          <DetailFields
            rows={[
              { label: "Name", value: displayName(profile) },
              { label: "Email", value: profile.email },
            ]}
          />
        }
        edit={({ onCancel }) => (
          <form
            action={async (formData) => {
              setNameError(null);
              const result = await updateProfileName(formData);
              if (!result.ok) {
                setNameError(result.error);
                return;
              }
              onCancel();
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium mb-1"
              >
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                defaultValue={profile.firstName ?? ""}
                className="w-full border rounded px-3 py-2 text-sm"
                autoComplete="given-name"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium mb-1"
              >
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                defaultValue={profile.lastName ?? ""}
                className="w-full border rounded px-3 py-2 text-sm"
                autoComplete="family-name"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Email</p>
              <p className="text-sm text-neutral-600">{profile.email}</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Email can’t be changed here.
              </p>
            </div>
            {nameError ? (
              <p className="text-sm text-red-600">{nameError}</p>
            ) : null}
            <EditFormActions onCancel={onCancel} />
          </form>
        )}
      />

      {profile.hasPassword ? (
        <section className="border-t border-neutral-200 pt-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-medium text-neutral-900">Password</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Change the password you use to sign in.
              </p>
            </div>
            {!changingPassword ? (
              <button
                type="button"
                onClick={() => {
                  setChangingPassword(true);
                  setPasswordError(null);
                  setPasswordOk(false);
                }}
                className="shrink-0 rounded px-2.5 py-1 text-sm font-medium text-neutral-700 border border-neutral-300 hover:bg-neutral-50"
              >
                Change
              </button>
            ) : null}
          </div>

          {passwordOk && !changingPassword ? (
            <p className="text-sm text-green-700">Password updated.</p>
          ) : null}

          {changingPassword ? (
            <form
              action={async (formData) => {
                setPasswordError(null);
                setPasswordOk(false);
                const result = await changeOwnPassword(formData);
                if (!result.ok) {
                  setPasswordError(result.error);
                  return;
                }
                setPasswordOk(true);
                setChangingPassword(false);
              }}
              className="space-y-3"
            >
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium mb-1"
                >
                  Current password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium mb-1"
                >
                  New password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium mb-1"
                >
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              {passwordError ? (
                <p className="text-sm text-red-600">{passwordError}</p>
              ) : null}
              <EditFormActions
                onCancel={() => {
                  setChangingPassword(false);
                  setPasswordError(null);
                }}
                saveLabel="Update password"
              />
            </form>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
