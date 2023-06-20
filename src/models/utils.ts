import { ColumnRow } from "./types";

export function squareNbToColumnRow(squareNb: number): ColumnRow{
    return {
        column: squareNb % 8,
        row: Math.floor(squareNb / 8),
    }
}
