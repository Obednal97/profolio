"use client";
import React, { useState, useEffect } from "react";
import { useUser } from "@/lib/user";
import { HeaderLayout } from "@/components/layout/headerLayout";
import { FooterLayout } from "@/components/layout/footerLayout";
import type { User, Group, Permission, Invitation } from "@/types/global";

function AdminManager() {
  const [activeSection, setActiveSection] = useState("users");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { data: user } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, groupsRes, permissionsRes, invitationsRes] =
        await Promise.all([
          fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ method: "READ" }),
          }),
          fetch("/api/admin/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ method: "READ" }),
          }),
          fetch("/api/admin/permissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ method: "READ" }),
          }),
          fetch("/api/admin/invitations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ method: "READ" }),
          }),
        ]);

      const [usersData, groupsData, permissionsData, invitationsData] =
        await Promise.all([
          usersRes.json(),
          groupsRes.json(),
          permissionsRes.json(),
          invitationsRes.json(),
        ]);

      setUsers(usersData.users || []);
      setGroups(groupsData.groups || []);
      setPermissions(permissionsData.permissions || []);
      setInvitations(invitationsData.invitations || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load admin data");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.target as HTMLFormElement);
    const groupData = {
      method: "CREATE",
      name: formData.get("name"),
      description: formData.get("description"),
    };

    try {
      const response = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSuccess("Group created successfully");
      fetchData();
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create group");
      } else {
        setError("Failed to create group");
      }
    }
  };

  const handleUpdateUserRole = async (userId: string, role: string) => {
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "UPDATE",
          userId,
          role,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSuccess("User role updated successfully");
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to update user role");
      } else {
        setError("Failed to update user role");
      }
    }
  };

  const handleSendInvitation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.target as HTMLFormElement);
    const invitationData = {
      method: "CREATE",
      email: formData.get("email"),
      role: formData.get("role"),
    };

    try {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invitationData),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSuccess("Invitation sent successfully");
      fetchData();
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to send invitation");
      } else {
        setError("Failed to send invitation");
      }
    }
  };

  if (!user) {
    return (
      <HeaderLayout>
        <FooterLayout>
          <div className="min-h-screen bg-white dark:bg-gray-900">
            <div className="text-gray-900 dark:text-white p-6 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">
                  Admin Access Required
                </h2>
                <a
                  href="/account/signin"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In as Admin
                </a>
              </div>
            </div>
          </div>
        </FooterLayout>
      </HeaderLayout>
    );
  }

  if (loading) {
    return (
      <HeaderLayout>
        <FooterLayout>
          <div className="min-h-screen bg-white dark:bg-gray-900">
            <div className="text-gray-900 dark:text-white p-6 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        </FooterLayout>
      </HeaderLayout>
    );
  }

  const sections = [
    { id: "users", label: "User Management", icon: "fa-users" },
    { id: "groups", label: "Groups", icon: "fa-layer-group" },
    { id: "permissions", label: "Permissions", icon: "fa-lock" },
    { id: "invitations", label: "Invitations", icon: "fa-envelope" },
  ];

  return (
    <HeaderLayout>
      <FooterLayout>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          <div className="text-gray-900 dark:text-white p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-semibold mb-8">Admin Dashboard</h1>

              {error && (
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <p className="text-green-600 dark:text-green-400">{success}</p>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-64 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center ${
                        activeSection === section.id
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      <i className={`fas ${section.icon} w-6`}></i>
                      <span>{section.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
                  {activeSection === "users" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold mb-4">
                        User Management
                      </h2>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left">
                              <th className="pb-4">Name</th>
                              <th className="pb-4">Email</th>
                              <th className="pb-4">Role</th>
                              <th className="pb-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((user) => (
                              <tr
                                key={user.id}
                                className="border-t dark:border-gray-700"
                              >
                                <td className="py-4">{user.name}</td>
                                <td className="py-4">{user.email}</td>
                                <td className="py-4">{user.role}</td>
                                <td className="py-4">
                                  <select
                                    onChange={(e) =>
                                      handleUpdateUserRole(user.id, e.target.value)
                                    }
                                    value={user.role}
                                    className="bg-white dark:bg-gray-700 rounded px-2 py-1"
                                  >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeSection === "groups" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold mb-4">
                        Groups Management
                      </h2>
                      <form onSubmit={handleCreateGroup} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Group Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            className="w-full p-3 bg-white dark:bg-gray-700 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Description
                          </label>
                          <textarea
                            name="description"
                            className="w-full p-3 bg-white dark:bg-gray-700 rounded-lg"
                            rows={3}
                          ></textarea>
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Create Group
                        </button>
                      </form>
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">
                          Existing Groups
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groups.map((group) => (
                            <div
                              key={group.id}
                              className="bg-white dark:bg-gray-700 p-4 rounded-lg"
                            >
                              <h4 className="font-semibold">{group.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {group.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === "permissions" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold mb-4">
                        Page Permissions
                      </h2>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left">
                              <th className="pb-4">Page</th>
                              <th className="pb-4">User</th>
                              <th className="pb-4">Admin</th>
                              <th className="pb-4">Super Admin</th>
                            </tr>
                          </thead>
                          <tbody>
                            {permissions.map((permission) => (
                              <tr
                                key={permission.id}
                                className="border-t dark:border-gray-700"
                              >
                                <td className="py-4">{permission.page}</td>
                                <td className="py-4">
                                  <input
                                    type="checkbox"
                                    checked={permission.user}
                                    readOnly
                                  />
                                </td>
                                <td className="py-4">
                                  <input
                                    type="checkbox"
                                    checked={permission.admin}
                                    readOnly
                                  />
                                </td>
                                <td className="py-4">
                                  <input
                                    type="checkbox"
                                    checked={permission.super_admin}
                                    readOnly
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeSection === "invitations" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold mb-4">
                        Send Invitations
                      </h2>
                      <form onSubmit={handleSendInvitation} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            className="w-full p-3 bg-white dark:bg-gray-700 rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Role
                          </label>
                          <select
                            name="role"
                            className="w-full p-3 bg-white dark:bg-gray-700 rounded-lg"
                            required
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Send Invitation
                        </button>
                      </form>
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">
                          Pending Invitations
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="text-left">
                                <th className="pb-4">Email</th>
                                <th className="pb-4">Role</th>
                                <th className="pb-4">Status</th>
                                <th className="pb-4">Sent At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invitations.map((invitation) => (
                                <tr
                                  key={invitation.id}
                                  className="border-t dark:border-gray-700"
                                >
                                  <td className="py-4">{invitation.email}</td>
                                  <td className="py-4">{invitation.role}</td>
                                  <td className="py-4">{invitation.status}</td>
                                  <td className="py-4">
                                    {new Date(
                                      invitation.sent_at
                                    ).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FooterLayout>
    </HeaderLayout>
  );
}

export default AdminManager;