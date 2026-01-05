import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table"
import { Button } from "@repo/ui/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"

interface GroupedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  groupBy: keyof TData
  onRowClick?: (row: TData) => void
  getRowStyle?: (row: TData) => React.CSSProperties
  defaultOpen?: boolean
  renderGroupHeader?: (groupValue: any, items: TData[]) => React.ReactNode
}

function DataTableGroup<TData, TValue>({
  groupValue,
  items,
  columns,
  onRowClick,
  getRowStyle,
  defaultOpen,
  renderGroupHeader
}: {
  groupValue: any
  items: TData[]
  columns: ColumnDef<TData, TValue>[]
  onRowClick?: (row: TData) => void
  getRowStyle?: (row: TData) => React.CSSProperties
  defaultOpen?: boolean
  renderGroupHeader?: (groupValue: any, items: TData[]) => React.ReactNode
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen ?? false)

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="border rounded-md bg-white overflow-hidden mb-4 shadow-sm">
      <div 
        className="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors border-b"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <div className="flex-1">
          {renderGroupHeader ? renderGroupHeader(groupValue, items) : (
            <span className="font-semibold text-sm">{String(groupValue)} ({items.length})</span>
          )}
        </div>
      </div>

      {isOpen && (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-white border-b-2 border-gray-100">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => onRowClick?.(row.original)}
                className={onRowClick ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}
                style={getRowStyle?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export function GroupedDataTable<TData, TValue>(props: GroupedDataTableProps<TData, TValue>) {
  const { data, groupBy } = props

  // Group data
  const groupedData = React.useMemo(() => {
    const groups: Record<string, TData[]> = {}
    const order: string[] = [] // Keep insertion order

    data.forEach((item) => {
      const key = String(item[groupBy] || "Autres")
      if (!groups[key]) {
        groups[key] = []
        order.push(key)
      }
      groups[key].push(item)
    })

    return order.map(key => ({ key, items: groups[key] }))
  }, [data, groupBy])

  if (data.length === 0) {
    return <div className="p-8 text-center text-gray-500 border rounded-md bg-white">Aucune donnée</div>
  }

  return (
    <div className="space-y-4">
      {groupedData.map((group) => (
        <DataTableGroup
          key={group.key}
          groupValue={group.key}
          items={group.items}
          {...props}
        />
      ))}
    </div>
  )
}
