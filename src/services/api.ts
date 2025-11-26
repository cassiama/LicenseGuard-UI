const API_URL = `${import.meta.env.VITE_API_HOST}:${import.meta.env.VITE_API_PORT}`;
const AGENT_URL = `${import.meta.env.VITE_AI_AGENT_HOST}:${import.meta.env.VITE_AI_AGENT_PORT}`

// const getAuthHeaders = () => {
//   const token = localStorage.getItem("authToken");
//   return {
//     "Authorization": `Bearer ${token}`,
//   };
// };

// calls "POST /users/token"
export const loginUser = async (email: string, password: string) => {
  const formData = new URLSearchParams();
  // TODO: change this to expect a username instead of a email
  // "POST /users/token" route expects a field named "username", so we need to pass the
  // "email" from the UI as the "username"
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_URL}/users/token`, {
    method: "POST",
    // thankfully, we don't have to set the content type because the browser will automatically 
    // set it to "Content-Type: application/x-www-form-urlencoded"
    body: formData,
  });
  if (!response.ok) throw new Error("Login failed");
  return response.json();
};

// calls "POST /users"
export const registerUser = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // TODO: change this to expect a username instead of a email
    // "POST /users" route expects a field named "username", so we need to pass the
    // "email" from the UI as the "username"
    body: JSON.stringify({ username: email, password: password }),
  });
  if (!response.ok) throw new Error("Registration failed");
  return response.json();
};

// calls the AI agent's analysis streaming endpoint ("POST /generate/report")
export const getAnalysisStream = async (
  projectName: string, 
  file: File, 
  onChunk: (chunk: string) => void
) => {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Not authenticated. Please log in.");
  // TODO: add logic that forces the user to log in again IF the token has expired

  const formData = new FormData();
  formData.append("project_name", projectName);
  formData.append("requirements_file", file);

  const response = await fetch(`${AGENT_URL}/generate/report`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "text/plain"
    },
    body: formData,
  });


  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Analysis request failed: ${errorText}`);
  }
  if (!response.body) {
    throw new Error("No response body from stream");
  }

  // handle the stream
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    onChunk(value); // pass the decoded text chunk
  }
};