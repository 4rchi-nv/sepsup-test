import React, { useRef, useState } from "react";
import { type Model, type Param, ParamEditor, type ParamEditorRef } from "./ParamEditor";

const params: Param[] = [
  { id: 1, name: "Название", type: "string" },
  { id: 2, name: "Цвет", type: "string" },
  { id: 3, name: "Размер", type: "string" }
];

const initialModel: Model = {
  paramValues: [
    { paramId: 1, value: "Футболка" },
    { paramId: 3, value: "M" }
  ]
};

export default function App() {
  const ref = useRef<ParamEditorRef>(null);
  const [dump, setDump] = useState<Model | null>(null);

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", padding: 16, fontFamily: "Arial" }}>
      <h2 style={{ marginTop: 0 }}>Редактор параметров</h2>

      <ParamEditor ref={ref} params={params} model={initialModel} />

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          onClick={() => setDump(ref.current?.getModel() ?? null)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}
        >
          getModel()
        </button>
      </div>

      {dump && (
        <pre style={{ marginTop: 16, padding: 12, background: "#f7f7f7", borderRadius: 8 }}>
          {JSON.stringify(dump, null, 2)}
        </pre>
      )}
    </div>
  );
}
