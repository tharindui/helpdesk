import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Helpdesk</h1>
        <p className="mt-2 text-gray-500">AI-Powered Ticket Management</p>
        {status && (
          <p className={`mt-4 text-sm font-medium ${status === "ok" ? "text-green-600" : "text-red-600"}`}>
            Server status: {status}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
