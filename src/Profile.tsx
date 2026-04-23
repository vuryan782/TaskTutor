import { useState } from "react";

function Profile() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");

  return (
    <div style={{ padding: "2rem" }}>
      <h1>My Profile</h1>
      <p>Update your account information</p>

      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "1rem", 
        maxWidth: "400px",
        marginTop: "1.5rem"
      }}>
        <input
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <input
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="School"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
        />

        <input
          placeholder="Major"
          value={major}
          onChange={(e) => setMajor(e.target.value)}
        />

        <button>Save Profile</button>
      </div>
    </div>
  );
}

export default Profile;