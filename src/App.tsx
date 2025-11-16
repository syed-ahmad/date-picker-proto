import React from "react";
import { AccessibleDatePicker } from "./components/AccessibleDatePicker";
function App() {
  return (
    <div style={{ padding: 32 }}>
      <h1>Date Picker Demo</h1>
      <AccessibleDatePicker dateFormat="DD.MM.YYYY" locale="en-US" />
    </div>
  );
}

export default App;
