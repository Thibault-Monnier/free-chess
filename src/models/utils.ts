import { ColumnRow } from './types'

export function squareNbToColumnRow(squareNb: number): ColumnRow {
    return {
        column: squareNb % 8,
        row: Math.floor(squareNb / 8),
    }
}

export function columnRowToSquareNb({ column, row }: ColumnRow): number {
    return row * 8 + column
}
