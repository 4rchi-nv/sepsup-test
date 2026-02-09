import React, { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type Model, type Param, ParamEditor, type ParamEditorRef } from "./ParamEditor";

describe("ParamEditor", () => {
    it("renders fields based on params", () => {
        const params: Param[] = [
            { id: 1, name: "Name", type: "string" },
            { id: 2, name: "Color", type: "string" },
            { id: 3, name: "Size", type: "string" },
        ];
        const model: Model = { paramValues: [] };

        render(<ParamEditor params={params} model={model} />);

        expect(screen.getByTestId("param-1")).toBeInTheDocument();
        expect(screen.getByTestId("param-2")).toBeInTheDocument();
        expect(screen.getByTestId("param-3")).toBeInTheDocument();
    });

    it("initializes inputs from model.paramValues", () => {
        const params: Param[] = [
            { id: 1, name: "Name", type: "string" },
            { id: 2, name: "Color", type: "string" },
        ];
        const model: Model = {
            paramValues: [
                { paramId: 1, value: "T-Shirt" },
                { paramId: 2, value: "Black" },
            ],
        };

        render(<ParamEditor params={params} model={model} />);

        expect((screen.getByTestId("param-1") as HTMLInputElement).value).toBe("T-Shirt");
        expect((screen.getByTestId("param-2") as HTMLInputElement).value).toBe("Black");
    });

    it("getModel() returns updated model after edits (includes all params)", async () => {
        const user = userEvent.setup();
        const params: Param[] = [
            { id: 1, name: "Name", type: "string" },
            { id: 2, name: "Color", type: "string" },
            { id: 3, name: "Size", type: "string" },
        ];
        const model: Model = {
            paramValues: [
                { paramId: 1, value: "T-Shirt" },
                // 2 отсутствует в исходном model — должен вернуться пустой, если не вводили
                { paramId: 3, value: "M" },
            ],
        };

        const ref = createRef<ParamEditorRef>();
        render(<ParamEditor ref={ref} params={params} model={model} />);

        // edit Color and Size
        const color = screen.getByTestId("param-2");
        await user.type(color, "Red"); // было пусто → "Red"

        const size = screen.getByTestId("param-3");
        await user.clear(size);
        await user.type(size, "L");

        const result = ref.current!.getModel();

        // Должны быть ВСЕ параметры из params
        expect(result.paramValues).toHaveLength(3);

        const map = new Map(result.paramValues.map((x) => [x.paramId, x.value]));
        expect(map.get(1)).toBe("T-Shirt");
        expect(map.get(2)).toBe("Red");
        expect(map.get(3)).toBe("L");
    });
});
