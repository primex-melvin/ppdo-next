import { useMemo } from "react";

export function useCurrencyFormatter() {
    return useMemo(
        () =>
            new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
                maximumFractionDigits: 0,
            }),
        []
    );
}
