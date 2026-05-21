import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";

export default function NotificationBell() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch("/notifications/me", { token });
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
  }, [token]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  const unread = items.filter((n) => !n.read_at).length;

  const markRead = async (id, link) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { token, method: "PUT" });
      await load();
      if (link) {
        setOpen(false);
        navigate(link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { token, method: "PUT" });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  if (!token) return null;

  return (
    <div className="notification-bell">
      <button
        type="button"
        className="btn icon-only ghost notification-bell__trigger"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      >
        <FiBell />
        {unread > 0 && (
          <span className="notification-bell__badge">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="notification-bell__backdrop"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="notification-bell__dropdown">
            <div className="notification-bell__header">
              <strong>Notifications</strong>
              {unread > 0 && (
                <button type="button" className="btn sm ghost" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="notification-bell__empty">No notifications</p>
            ) : (
              <ul className="notification-bell__list">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={`notification-bell__item ${n.read_at ? "is-read" : ""}`}
                      onClick={() => markRead(n.id, n.link)}
                    >
                      <span className="notification-bell__title">{n.title}</span>
                      {n.body && (
                        <span className="notification-bell__body">{n.body}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
