import { useState } from "react";
import "./App.css";

type EventResponse = {
  accepted: boolean;
  warning?: string;
};

function App() {
  const [eventName, setEventName] = useState("demo.action.v1");
  const [userId, setUserId] = useState("");
  const [forceDuplicate, setForceDuplicate] = useState(false);
  const [forceDelay, setForceDelay] = useState(false);
  const [delayMs, setDelayMs] = useState(3000);

  const [response, setResponse] = useState<EventResponse | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendEvent = async () => {
    setError(null);
    setResponse(null);
    setStatus(null);

    try {
      const res = await fetch("http://localhost:3000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event: eventName,
          userId: userId || undefined,
          forceDuplicate,
          forceDelayMs: forceDelay ? delayMs : undefined
        })
      });

      setStatus(res.status);
      const json = await res.json();
      setResponse(json);
    } catch (e: any) {
      setError(e.message ?? "Request failed");
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", textAlign: "left" }}>
      <h1>Analytics Instrumentation Control Panel</h1>

	<p>
	  This page is an analytics instrumentation control panel. It exists to make
	  analytics behavior observable, not to model a product UI. Events can be sent
	  with explicit semantic meaning under conditions that degrade data quality, to
	  demonstrate how analytics systems can succeed while producing misleading data.
	</p>

    <hr />

	<label>
	  Event name (analytics semantic identifier)
	  <input
		type="text"
		value={eventName}
		onChange={(e) => setEventName(e.target.value)}
		style={{ width: "100%", marginBottom: 6 }}
		placeholder="checkout.completed.v1"
	  />
	</label>

	<p style={{ fontSize: 13, color: "#555", marginTop: 0, marginBottom: 12 }}>
	  Any string is accepted. Recommended format: <code>{"<domain>.<action>.<version>"}</code>. Example:{" "}
	  <code>checkout.completed.v1</code>.
	</p>

      <label>
        User ID (optional)
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        />
      </label>

      <label>
        <input
          type="checkbox"
          checked={forceDuplicate}
          onChange={(e) => setForceDuplicate(e.target.checked)}
        />
        Force duplicate event
      </label>

      <br />

      <label>
        <input
          type="checkbox"
          checked={forceDelay}
          onChange={(e) => setForceDelay(e.target.checked)}
        />
        Force delayed delivery
      </label>

      {forceDelay && (
        <div style={{ marginTop: 8 }}>
          Delay (ms):{" "}
          <input
            type="number"
            value={delayMs}
            onChange={(e) => setDelayMs(Number(e.target.value))}
          />
        </div>
      )}

      <br />
      <button onClick={sendEvent}>Send event</button>

      <hr />

	<h3>Result</h3>

	<p style={{ color: "#555", fontSize: 14 }}>
	  A successful HTTP response indicates only that the event was accepted for
	  ingestion. It does not imply that the event is correct, unique, timely, or
	  safe to use for decision-making. This control panel intentionally surfaces
	  that gap.
	</p>

	{status && <div>Status: {status}</div>}

	{response && (
	  <pre style={{ background: "#f4f4f4", padding: 12 }}>
		{JSON.stringify(response, null, 2)}
	  </pre>
	)}

	{error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}

export default App;
