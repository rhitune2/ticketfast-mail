"use client"

import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { format } from "date-fns"
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  MoreHorizontal, 
  Search 
} from "lucide-react"
import { 
  FilterConfig, 
  SortConfig, 
  TicketPriority, 
  TicketStatus, 
  TicketTableProps, 
  TicketWithDetails 
} from "./ticket-table-types"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function TicketTable({ tickets, pageSize = 10 }: TicketTableProps) {
  // State for sorting, filtering, and pagination
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: "createdAt",
    direction: "desc"
  })
  
  const [filters, setFilters] = useState<FilterConfig>({
    status: "ALL",
    priority: "ALL",
    search: ""
  })
  
  const [currentPage, setCurrentPage] = useState(1)
  
  // Status and Priority options for filters
  const statusOptions: (TicketStatus | "ALL")[] = ["ALL", "ASSIGNED", "UNASSIGNED", "WAITING", "CLOSED"]
  const priorityOptions: (TicketPriority | "ALL")[] = ["ALL", "LOW", "NORMAL", "MEDIUM", "HIGH"]
  
  // Handle sorting changes
  const handleSort = useCallback((column: string) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === "asc" ? "desc" : "asc"
    }))
  }, [])
  
  // Sort and filter the tickets
  const filteredAndSortedTickets = useMemo(() => {
    let result = [...tickets]
    
    // Apply filters
    if (filters.status !== "ALL") {
      result = result.filter(ticket => ticket.status === filters.status)
    }
    
    if (filters.priority !== "ALL") {
      result = result.filter(ticket => ticket.priority === filters.priority)
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      result = result.filter(
        ticket => 
          ticket.subject.toLowerCase().includes(searchTerm) ||
          ticket.fromEmail?.toLowerCase().includes(searchTerm) ||
          ticket.fromName?.toLowerCase().includes(searchTerm) ||
          ticket.contactName?.toLowerCase().includes(searchTerm)
      )
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const column = sortConfig.column as keyof TicketWithDetails
      
      // Handle special cases for dates
      if (column === "createdAt" || column === "updatedAt") {
        const dateA = a[column] ? new Date(a[column] as unknown as string).getTime() : 0
        const dateB = b[column] ? new Date(b[column] as unknown as string).getTime() : 0
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA
      }
      
      // Handle normal string/number cases
      const valueA = (a[column] || "") as string
      const valueB = (b[column] || "") as string
      
      if (sortConfig.direction === "asc") {
        return valueA.localeCompare(valueB)
      } else {
        return valueB.localeCompare(valueA)
      }
    })
    
    return result
  }, [tickets, sortConfig, filters])
  
  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedTickets.length / pageSize)
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredAndSortedTickets.slice(startIndex, endIndex)
  }, [filteredAndSortedTickets, currentPage, pageSize])
  
  // Render pagination numbers
  const renderPaginationNumbers = () => {
    const pages = []
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink 
              isActive={currentPage === i}
              onClick={() => setCurrentPage(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }
    } else {
      // First page
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink 
            isActive={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      )
      
      // Handle ellipsis and middle pages
      if (currentPage > 3) {
        pages.push(<PaginationEllipsis key="ellipsis-1" />)
      }
      
      // Pages around current
      const startPage = Math.max(2, currentPage - 1)
      const endPage = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink 
              isActive={currentPage === i}
              onClick={() => setCurrentPage(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }
      
      // Handle ellipsis and last page
      if (currentPage < totalPages - 2) {
        pages.push(<PaginationEllipsis key="ellipsis-2" />)
      }
      
      // Last page
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink 
            isActive={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }
    
    return pages
  }
  
  // Render the status badge with appropriate colors
  const renderStatusBadge = (status: TicketStatus) => {
    const statusConfig = {
      ASSIGNED: { variant: "secondary", label: "Assigned" },
      UNASSIGNED: { variant: "outline", label: "Unassigned" },
      WAITING: { variant: "default", label: "Waiting" },
      CLOSED: { variant: "destructive", label: "Closed" },
    }
    
    const config = statusConfig[status]
    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    )
  }
  
  // Render the priority badge with appropriate colors
  const renderPriorityBadge = (priority: TicketPriority) => {
    const priorityConfig = {
      LOW: { className: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300", label: "Low" },
      NORMAL: { className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", label: "Normal" },
      MEDIUM: { className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300", label: "Medium" },
      HIGH: { className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", label: "High" }
    }
    
    const config = priorityConfig[priority]
    return (
      <Badge className={config.className} variant="outline">
        {config.label}
      </Badge>
    )
  }
  
  // Helper to render sort icons
  const renderSortIcon = (column: string) => {
    if (sortConfig.column !== column) {
      return null
    }
    
    return sortConfig.direction === "asc" ? 
      <ChevronUp className="ml-1 h-4 w-4" /> : 
      <ChevronDown className="ml-1 h-4 w-4" />
  }
  
  // Empty state component
  const EmptyState = () => (
    <TableRow>
      <TableCell colSpan={6} className="h-24 text-center">
        <div className="flex flex-col items-center justify-center space-y-2 p-6">
          <div className="text-muted-foreground">No tickets found</div>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search criteria.
          </p>
        </div>
      </TableCell>
    </TableRow>
  )
  
  return (
    <div className="space-y-4">
      {/* Filters and search */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as TicketStatus | "ALL" }))}
            >
              <SelectTrigger className="w-[130px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Status</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>
                    {status === "ALL" ? "All Statuses" : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select
              value={filters.priority}
              onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value as TicketPriority | "ALL" }))}
            >
              <SelectTrigger className="w-[130px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Priority</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map(priority => (
                  <SelectItem key={priority} value={priority}>
                    {priority === "ALL" ? "All Priorities" : priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            className="pl-8"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
      </div>
      
      {/* Tickets table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="w-[300px] cursor-pointer"
                onClick={() => handleSort("subject")}
              >
                <div className="flex items-center">
                  Subject {renderSortIcon("subject")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Status {renderSortIcon("status")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("priority")}
              >
                <div className="flex items-center">
                  Priority {renderSortIcon("priority")}
                </div>
              </TableHead>
              <TableHead 
                className="hidden cursor-pointer md:table-cell"
                onClick={() => handleSort("fromEmail")}
              >
                <div className="flex items-center">
                  From {renderSortIcon("fromEmail")}
                </div>
              </TableHead>
              <TableHead 
                className="hidden cursor-pointer md:table-cell"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center">
                  Created {renderSortIcon("createdAt")}
                </div>
              </TableHead>
              <TableHead className="w-[70px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((ticket) => (
                <TableRow key={ticket.id} className="group">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="truncate max-w-[280px]">{ticket.subject}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[280px]">
                        {ticket.contactName || ticket.fromName || ticket.fromEmail}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{renderStatusBadge(ticket.status as TicketStatus)}</TableCell>
                  <TableCell>{renderPriorityBadge(ticket.priority as TicketPriority)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="truncate max-w-[150px] block">
                      {ticket.fromEmail}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {ticket.createdAt ? format(new Date(ticket.createdAt), "MMM d, yyyy") : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100"
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Assign ticket</DropdownMenuItem>
                        <DropdownMenuItem>Change status</DropdownMenuItem>
                        <DropdownMenuItem>Change priority</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyState />
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mx-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                aria-disabled={currentPage === 1}
                className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            
            {renderPaginationNumbers()}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                aria-disabled={currentPage === totalPages}
                className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
