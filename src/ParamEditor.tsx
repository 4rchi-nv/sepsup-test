import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from "react";

/** ===== Types ===== */

export type ParamType = "string"; // легко расширять: | "number" | "select" ...

export type Param = {
    id: number;
    name: string;
    type: ParamType;
};

export type ParamValue = {
    paramId: number;
    value: string;
};

export type Model = {
    paramValues: ParamValue[];
};

export type ParamEditorRef = {
    /** Возвращает полную структуру Model со всеми параметрами из params */
    getModel: () => Model;
};

export type ParamEditorProps = {
    params: Param[];
    model: Model;
    /** опционально: можно отлавливать изменения */
    onChange?: (model: Model) => void;
    /** опционально: префикс для data-testid */
    testIdPrefix?: string;
};

/** ===== Internals ===== */

/** Индексация значений из model.paramValues */
function indexModelValues(model: Model): Map<number, string> {
    const map = new Map<number, string>();
    for (const pv of model.paramValues ?? []) {
        map.set(pv.paramId, pv.value ?? "");
    }
    return map;
}

/** Нормализуем state: гарантируем, что есть запись для каждого param */
function buildInitialValues(params: Param[], model: Model): Record<number, string> {
    const map = indexModelValues(model);
    const out: Record<number, string> = {};
    for (const p of params) {
        out[p.id] = map.get(p.id) ?? "";
    }
    return out;
}

/** ===== Field components (extendable) ===== */

type FieldPropsBase = {
    param: Param;
    value: string;
    onChange: (next: string) => void;
    testId?: string;
};

/** Пока поддерживаем только string */
const StringField: React.FC<FieldPropsBase> = ({ param, value, onChange, testId }) => {
    return (
        <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>{param.name}</span>
            <input
                data-testid={testId}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    outline: "none",
                }}
            />
        </label>
    );
};

/** Registry: добавление нового типа = добавить компонент сюда */
const FIELD_REGISTRY: Record<ParamType, React.FC<FieldPropsBase>> = {
    string: StringField,
};

/** ===== Main component ===== */

export const ParamEditor = forwardRef<ParamEditorRef, ParamEditorProps>(
    ({ params, model, onChange, testIdPrefix = "param" }, ref) => {
        /** values[paramId] = string */
        const [values, setValues] = useState<Record<number, string>>(() =>
            buildInitialValues(params, model)
        );

        /**
         * Если снаружи пришли новые params/model — обновляем state аккуратно:
         * - сохраняем уже введённые значения для существующих paramId
         * - добавляем новые paramId со значениями из model (или пусто)
         * - удаляем значения для параметров, которых больше нет
         */
        useEffect(() => {
            const nextFromModel = buildInitialValues(params, model);
            setValues((prev) => {
                const next: Record<number, string> = {};
                for (const p of params) {
                    // приоритет: текущее введённое значение, иначе значение из model
                    next[p.id] = Object.prototype.hasOwnProperty.call(prev, p.id)
                        ? prev[p.id]
                        : nextFromModel[p.id] ?? "";
                }
                return next;
            });
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [params, model]);

        const setValue = (paramId: number, next: string) => {
            setValues((prev) => {
                const updated = { ...prev, [paramId]: next };
                return updated;
            });
        };

        const currentModel: Model = useMemo(() => {
            // Возвращаем полную структуру: для каждого param из params есть запись
            return {
                paramValues: params.map((p) => ({
                    paramId: p.id,
                    value: values[p.id] ?? "",
                })),
            };
        }, [params, values]);

        useEffect(() => {
            onChange?.(currentModel);
        }, [currentModel, onChange]);

        useImperativeHandle(
            ref,
            () => ({
                getModel: () => currentModel,
            }),
            [currentModel]
        );

        return (
            <div style={{ display: "grid", gap: 14 }}>
                {params.map((p) => {
                    const Field = FIELD_REGISTRY[p.type];
                    if (!Field) {
                        return (
                            <div key={p.id} style={{ padding: 12, border: "1px dashed #f0b" }}>
                                Unsupported param type: <b>{p.type}</b> (paramId={p.id})
                            </div>
                        );
                    }

                    return (
                        <Field
                            key={p.id}
                            param={p}
                            value={values[p.id] ?? ""}
                            onChange={(next) => setValue(p.id, next)}
                            testId={`${testIdPrefix}-${p.id}`}
                        />
                    );
                })}
            </div>
        );
    }
);

ParamEditor.displayName = "ParamEditor";
