"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AdminShell } from "../../components";
import { apiFetch, useRealtimeStream } from "../../lib";

export default function Users() {

  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    apiFetch("/api/admin/users", { cache: "no-store" })
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setUsers(d.users || []);
      })
      .catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeStream(() => {
    load();
  });


  const toggle = async (u:any) => {

    const status =
      u.status === "Active"
        ? "Suspended"
        : "Active";

    const r = await apiFetch(
      `/api/admin/users/${u.id}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          status
        })
      }
    );


    if (r.ok) {

      load();

    } else {

      const d = await r.json();

      setError(
        d.error || "Could not update user"
      );

    }

  };


  const remove = async (u:any) => {

    if (
      !confirm(
        `Delete ${u.name}? This removes the customer account.`
      )
    ) return;


    const r = await apiFetch(
      `/api/admin/users/${u.id}`,
      {
        method: "DELETE"
      }
    );


    if (r.ok) {

      load();

    } else {

      const d = await r.json();

      setError(
        d.error || "Could not delete user"
      );

    }

  };


  const filtered = users.filter(u =>

    (
      u.name +
      u.email +
      (u.username || "") +
      (u.shopName || "")
    )
      .toLowerCase()
      .includes(search.toLowerCase())

  );


  return (

    <AdminShell>

      <div className="topbar">

        <div>

          <span className="eyebrow">
            Management
          </span>

          <h1>
            Users
          </h1>

        </div>


        <input
          className="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email, shop..."
        />

      </div>


      {error && (

        <div className="form-error">
          {error}
        </div>

      )}


      <section className="panel">

        <div className="panel-head">

          <div>

            <span className="eyebrow">
              {filtered.length} visible
            </span>

            <h2>
              Customer Accounts
            </h2>

          </div>


          <span className="admin-chip">
            Database connected
          </span>

        </div>


        <div className="table-wrap">

          <table>

            <thead>

              <tr>

                <th>User</th>
                <th>Shop</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>

              </tr>

            </thead>


            <tbody>

              {filtered.map(u => (

                <tr key={u.id}>

                  <td>

                    <div className="user-cell">

                      <span className="avatar">
                        {u.name?.[0] || "U"}
                      </span>


                      <div>

                        <Link
                          href={`/admin/users/${u.id}`}
                          style={{
                            color: "#27b7ff",
                            fontWeight: 700,
                            textDecoration: "none"
                          }}
                        >
                          {u.name}
                        </Link>


                        <small>
                          {u.email}
                        </small>


                        {u.username && (

                          <small>
                            @{u.username}
                          </small>

                        )}

                      </div>

                    </div>

                  </td>


                  <td>
                    {u.shopName || "-"}
                  </td>


                  <td>

                    <small>
                      {u.country || "-"}
                    </small>

                    <br />

                    <small>
                      {u.phone
                        ? `${u.countryCode || ""} ${u.phone}`
                        : "-"
                      }
                    </small>

                  </td>


                  <td>

                    <span className="status active">
                      {u.role}
                    </span>

                  </td>


                  <td>

                    <span
                      className={`status ${String(
                        u.status || ""
                      ).toLowerCase()}`}
                    >
                      {u.status}
                    </span>

                  </td>


                  <td>

                    {new Date(
                      u.createdAt
                    ).toLocaleDateString()}

                  </td>


                  <td>

                    {u.role === "admin" ? (

                      <span className="table-btn">
                        Admin
                      </span>

                    ) : (

                      <div className="action-row">

                        <Link
                          href={`/admin/users/${u.id}`}
                          className="table-btn"
                          style={{
                            textDecoration: "none"
                          }}
                        >
                          Manage
                        </Link>


                        <button
                          className="table-btn"
                          onClick={() => toggle(u)}
                        >
                          {u.status === "Active"
                            ? "Suspend"
                            : "Activate"
                          }
                        </button>


                        <button
                          className="table-btn danger-btn"
                          onClick={() => remove(u)}
                        >
                          Delete
                        </button>

                      </div>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </section>

    </AdminShell>

  );

}