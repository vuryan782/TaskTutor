// /frontend/public/sw.js

self.addEventListener("install", (event) => {
  // Activate updated SW immediately (no “waiting”)
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of all open tabs under this origin
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // If a plain string payload is sent
    data = { title: "Task Tutor", body: event.data?.text?.() };
  }

  const title = data.title || "Task Tutor";

  // If your backend sends a target URL, use it. Otherwise default to reminders page.
  const url = data.url || "/";

  const options = {
    body: data.body || "You have a reminder.",
    icon: "/vite.svg", // swap later
    badge: "/vite.svg", // optional
    data: {
      url,
      ...(data.data && typeof data.data === "object" ? data.data : {}),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || "/";

  event.waitUntil(
    (async () => {
      // Try to focus an existing tab first
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        // If already open, focus it and navigate to url
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(url);
          return;
        }
      }

      // Otherwise open a new tab
      if (self.clients.openWindow) {
        await self.clients.openWindow(url);
      }
    })(),
  );
});
