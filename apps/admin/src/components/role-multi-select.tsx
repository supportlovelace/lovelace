import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover"

export interface RoleOption {
  id: string
  name: string
  platformSlug: string
  platformName: string
}

interface RoleMultiSelectProps {
  roles: RoleOption[]
  selectedRoleIds: string[]
  onSelectionChange: (ids: string[]) => void
  placeholder?: string
}

export function RoleMultiSelect({
  roles,
  selectedRoleIds,
  onSelectionChange,
  placeholder = "Ajouter des rôles..."
}: RoleMultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  // Récupérer les objets rôles sélectionnés pour l'affichage
  const selectedRoles = roles.filter(r => selectedRoleIds.includes(r.id))

  const toggleRole = (roleId: string) => {
    if (selectedRoleIds.includes(roleId)) {
      onSelectionChange(selectedRoleIds.filter(id => id !== roleId))
    } else {
      onSelectionChange([...selectedRoleIds, roleId])
    }
  }

  const removeRole = (e: React.MouseEvent, roleId: string) => {
    e.stopPropagation()
    onSelectionChange(selectedRoleIds.filter(id => id !== roleId))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedRoles.map(role => (
          <Badge key={role.id} variant="secondary" className="pl-2 pr-1 py-1 h-7 flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">{role.platformName}</span>
            {role.name}
            <button
              onClick={(e) => removeRole(e, role.id)}
              className="ml-1 hover:bg-slate-200 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-9 text-xs"
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Chercher un rôle..." className="h-9 text-xs" />
            <CommandList>
              <CommandEmpty>Aucun rôle trouvé.</CommandEmpty>
              <CommandGroup className="max-h-[200px] overflow-auto">
                {roles.map((role) => {
                  const isSelected = selectedRoleIds.includes(role.id)
                  return (
                    <CommandItem
                      key={role.id}
                      value={`${role.platformName} ${role.name}`}
                      onSelect={() => toggleRole(role.id)}
                      className="text-xs"
                    >
                      <div className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                      )}>
                        <Check className={cn("h-3 w-3")} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase w-16 truncate mr-2">{role.platformName}</span>
                      <span className="font-medium truncate flex-1">{role.name}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
