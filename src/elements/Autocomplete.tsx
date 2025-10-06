import * as React from "react";
import { FormElementProps, FormElementRegistration } from "@vertigis/workflow";
import useAutocomplete from "@mui/material/useAutocomplete";

// Accept only a simple JSON array of primitives (string | number)
type Primitive = string | number;

interface AutocompleteProps extends FormElementProps<Primitive | Primitive[] | null> {
    /** The list of options as a simple JSON array of strings or numbers. */
    options?: Primitive[];

    // Behavior
    multiple?: boolean;
    freeSolo?: boolean;
    openOnFocus?: boolean;
    clearable?: boolean;

    // Optional helpers (passed through to the MUI hook)
    /** Custom filter; by default a case-insensitive substring match is used. */
    filterOptions?: (options: Primitive[], state: { inputValue: string }) => Primitive[];
    /** Disable specific options. */
    getOptionDisabled?: (option: Primitive) => boolean;
    /** Group header generator (optional). */
    groupBy?: (option: Primitive) => string | null | undefined;

    // UX
    placeholder?: string;
    label?: string;
    helperText?: string;
    autoFocus?: boolean;
    readOnly?: boolean;
    disabled?: boolean;

    // Listbox sizing
    listboxMaxHeight?: number;
    listboxWidth?: number;

    // Styling passthroughs
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Autocomplete form element (MUI hook + VertiGIS/Calcite styling) that accepts a simple JSON array.
 * @displayName Autocomplete
 * @description Autocomplete using MUI's headless `useAutocomplete` while matching VertiGIS Web (Calcite) styling. Supports single/multiple selection, free text, and emits standard Workflow events.
 * @supportedApps GWV
 * @param props The props that will be provided by the Workflow runtime.
 */
function Autocomplete(props: AutocompleteProps): React.ReactElement {
    const {
        // Workflow
        value,
        setValue,
        raiseEvent,
        disabled = false,

        // Data
        options = [],

        // Behavior
        multiple = false,
        freeSolo = false,
        openOnFocus = false,
        clearable = true,

        // Extras
        filterOptions,
        getOptionDisabled,
        groupBy,

        // UX
        placeholder = "",
        label,
        helperText,
        autoFocus = false,
        readOnly = false,

        // Layout
        listboxMaxHeight = 220,
        listboxWidth,

        // Styling
        className,
        style,
    } = props;

    // ---- styles (Calcite/VertiGIS tokens, with fallbacks) ----
    const theme = {
        surface: "var(--calcite-color-foreground-1, #fff)",
        surfaceElevated: "var(--calcite-color-foreground-2, #fff)",
        border: "var(--calcite-color-border-3, #e0e0e0)",
        text: "var(--calcite-color-text-1, #1a1a1a)",
        textMuted: "var(--calcite-color-text-3, #6a6a6a)",
        brand: "var(--calcite-color-brand, #1976d2)",
        radius: "var(--calcite-border-radius, 8px)",
        shadow: "var(--calcite-shadow-1, 0 8px 24px rgba(0,0,0,0.08))",
    } as const;

    const styles: Record<string, React.CSSProperties> = {
        root: { position: "relative", fontFamily: "inherit", color: theme.text },
        labelRow: { marginBottom: 4, fontSize: 12, color: theme.textMuted },
        inputWrap: {
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius as any,
            padding: "6px 10px",
            background: disabled ? "var(--calcite-color-foreground-3, #f5f5f5)" : theme.surface,
            outline: `2px solid transparent`,
            transition: "outline 120ms ease, background 120ms ease, border-color 120ms ease",
        },
        inputWrapFocused: {
            outline: `2px solid ${theme.brand}`,
        },
        input: {
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14,
            padding: 0,
            minWidth: 60,
            color: theme.text,
        },
        clearBtn: { border: "none", background: "transparent", fontSize: 16, cursor: "pointer", color: theme.textMuted },
        listbox: {
            position: "absolute",
            zIndex: 10,
            marginTop: 6,
            left: 0,
            right: 0,
            maxHeight: listboxMaxHeight,
            width: listboxWidth,
            overflow: "auto",
            background: theme.surfaceElevated,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius as any,
            boxShadow: theme.shadow as any,
            // remove default bullets/margins on <ul>
            listStyle: "none",
            padding: 0,
            margin: 0,
        },
        option: { padding: "8px 10px", cursor: "pointer", color: theme.text, display: "flex", alignItems: "center", gap: 8 },
        optionDisabled: { padding: "8px 10px", color: "var(--calcite-color-text-4, #aaa)", cursor: "not-allowed", display: "flex", alignItems: "center", gap: 8 },
        helper: { marginTop: 4, fontSize: 12, color: theme.textMuted },
        tag: {
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 999,
            border: `1px solid ${theme.border}`,
            padding: "2px 8px",
            fontSize: 12,
            background: "var(--calcite-color-foreground-2, #fafafa)",
            color: theme.text,
            marginRight: 6,
            marginBottom: 6,
        },
        tagBtn: { cursor: "pointer", border: "none", background: "transparent", fontSize: 14, lineHeight: 1, color: theme.textMuted },
        check: { width: 16, display: "inline-block", textAlign: "center" },
    };

    // Unified event emitter
    const emit = React.useCallback((name: string, payload?: any) => {
        (raiseEvent as any)?.(name as any, payload as any);
    }, [raiseEvent]);

    // Controlled value mapping for the hook
    const hookValue = React.useMemo(() => {
        if (multiple) {
            if (Array.isArray(value)) return value as Primitive[];
            if (value == null) return [] as Primitive[];
            return [value as Primitive];
        }
        return Array.isArray(value) ? ((value[0] as Primitive) ?? null) : (value as Primitive | null);
    }, [value, multiple]);

    // We control popup open state so clicks always open
    const [open, setOpen] = React.useState<boolean>(false);

    // 🔧 control the input value ourselves to avoid depending on MUI's setInputValue
    const [input, setInput] = React.useState<string>("");

    const {
        getRootProps,
        getInputProps,
        getListboxProps,
        getOptionProps,
        getTagProps,
        groupedOptions,
        value: uaValue,
        focused,
        setAnchorEl,
    } = (useAutocomplete as any)({
        multiple,
        freeSolo,
        options,
        getOptionLabel: (o: Primitive) => String(o),
        filterOptions: filterOptions as any,
        groupBy: groupBy as any,
        value: hookValue as any,
        inputValue: input,
        onChange: (_e: any, newVal: any) => {
            const out = multiple ? (newVal as Primitive[]) : ((newVal as Primitive) ?? null);
            setValue(out as any);
            emit("change", { value: out });
            // If selecting from the list, clear input to make repeated picks easy
            setInput("");
        },
        onInputChange: (_e: any, newInput: string) => {
            setInput(newInput);
            emit("input", { value: newInput });
        },
        open,
        onOpen: () => {
            setOpen(true);
            emit("open", { input });
        },
        onClose: () => {
            setOpen(false);
            emit("close", { input });
        },
        disabled,
        readOnly,
    });

    const onClickInput = () => {
        if (!disabled && !readOnly) setOpen(true);
    };

    const inputProps = getInputProps();

    const readOnlyOrDisabled = disabled || readOnly;

    return (
        <div {...getRootProps()} className={className} style={{ ...styles.root, ...style }} aria-disabled={readOnlyOrDisabled}>
            {label && <div style={styles.labelRow}>{label}</div>}

            <div ref={setAnchorEl} style={{ ...styles.inputWrap, ...(focused ? styles.inputWrapFocused : {}) }}>
                {multiple && Array.isArray(uaValue) && uaValue.length > 0 &&
                    (uaValue as Primitive[]).map((opt: Primitive, index: number) => {
                        const { key, ...tagProps } = (getTagProps as any)({ index });
                        return (
                            <span key={key} {...tagProps} style={styles.tag}>
                {String(opt)}
                                {!readOnlyOrDisabled && (
                                    <button
                                        type="button"
                                        style={styles.tagBtn}
                                        onClick={tagProps.onDelete}
                                        aria-label={`Remove ${String(opt)}`}
                                        title={`Remove ${String(opt)}`}
                                    >
                                        ×
                                    </button>
                                )}
              </span>
                        );
                    })}

                <input
                    {...inputProps}
                    style={styles.input}
                    placeholder={placeholder}
                    disabled={readOnlyOrDisabled}
                    autoFocus={autoFocus}
                    value={input}
                    onChange={(e) => {
                        inputProps.onChange?.(e as any);
                        setInput((e.target as HTMLInputElement).value);
                    }}
                    onFocus={(e) => {
                        inputProps.onFocus?.(e);
                        if (openOnFocus && !open) setOpen(true);
                    }}
                    onClick={(e) => {
                        (inputProps as any).onClick?.(e);
                        onClickInput();
                    }}
                />

                {clearable && !readOnlyOrDisabled && (
                    <button
                        type="button"
                        title="Clear"
                        aria-label="Clear"
                        onClick={() => {
                            const cleared = multiple ? [] : null;
                            setValue(cleared as any);
                            setInput("");
                            emit("clear", { value: cleared });
                            emit("change", { value: cleared });
                        }}
                        style={styles.clearBtn}
                    >
                        ×
                    </button>
                )}
            </div>

            {open && (groupedOptions as Primitive[]).length > 0 && (
                <ul {...getListboxProps()} style={styles.listbox} role="listbox">
                    {(groupedOptions as Primitive[]).map((opt, index) => {
                        const { key, ...optionProps } = getOptionProps({ option: opt, index });
                        const disabledOpt = getOptionDisabled?.(opt) ?? false;
                        const selected = multiple
                            ? (Array.isArray(uaValue) && (uaValue as Primitive[]).includes(opt))
                            : (uaValue === opt);
                        return (
                            <li
                                key={key}
                                {...optionProps}
                                style={disabledOpt ? styles.optionDisabled : styles.option}
                                aria-disabled={disabledOpt}
                            >
                                <span style={{ ...styles.check, opacity: selected ? 1 : 0 }}>✓</span>
                                <span>{String(opt)}</span>
                            </li>
                        );
                    })}
                </ul>
            )}

            {helperText && <div style={styles.helper}>{helperText}</div>}
        </div>
    );
}

const AutocompleteElementRegistration: FormElementRegistration<AutocompleteProps> = {
    component: Autocomplete,
    getInitialProperties: () => ({
        value: null,
        options: [],

        multiple: false,
        freeSolo: false,
        placeholder: "",
        openOnFocus: false,
        clearable: true,

        label: "Select…",
        helperText: "",
        autoFocus: false,
        readOnly: false,
        listboxMaxHeight: 220,
    }),
    id: "Autocomplete",
};

export default AutocompleteElementRegistration;
