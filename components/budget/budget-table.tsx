import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface BudgetLineItem {
  id: string
  category: string
  amount: number
  notes: string | null
  sort_order: number
}

interface BudgetTableProps {
  lineItems: BudgetLineItem[]
}

export function BudgetTable({ lineItems }: BudgetTableProps) {
  const total = lineItems.reduce((sum, item) => sum + item.amount, 0)

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)

  if (lineItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No line items in this budget.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead className="text-right w-36">Planned Amount</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lineItems.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.category}</TableCell>
            <TableCell className="text-right tabular-nums">
              {fmt(item.amount)}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {item.notes ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="font-semibold">Total</TableCell>
          <TableCell className="text-right font-semibold tabular-nums">
            {fmt(total)}
          </TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  )
}
