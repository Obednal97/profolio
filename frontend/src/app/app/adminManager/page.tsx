"use client";
import { useUser } from "@/lib/user";
import React, { useState, useEffect } from "react";
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

  const sections = [
    { id: "users", label: "User Management", icon: "fa-users" },
    { id: "groups", label: "Groups", icon: "fa-layer-group" },
    { id: "permissions", label: "Permissions", icon: "fa-lock" },
    { id: "invitations", label: "Invitations", icon: "fa-envelope" },
  ];
}

export default AdminManager;