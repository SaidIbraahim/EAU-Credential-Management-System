
import { useState } from "react";
import { ClipboardList, Download, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditLog as AuditLogType } from "@/types";
import { MOCK_AUDIT_LOGS } from "@/mock/auditLogs";

// Mock user data to map user_id to username
const mockUsers = {
  1: "admin",
  2: "super_admin",
  3: "faarax.cabdullaahi"
};

const AuditLogPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState<AuditLogType[]>(MOCK_AUDIT_LOGS);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserName = (userId: number) => {
    return mockUsers[userId as keyof typeof mockUsers] || `User ${userId}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto w-full animation-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Audit Log</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search audit logs..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="student">Student Changes</TabsTrigger>
              <TabsTrigger value="import">Imports</TabsTrigger>
              <TabsTrigger value="document">Documents</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500">ID</th>
                    <th className="px-4 py-3 font-medium text-gray-500">User</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Action</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Details</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{log.id}</td>
                        <td className="px-4 py-3 text-gray-900">{getUserName(log.user_id)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.action.includes("Added") || log.action.includes("Import") 
                              ? "bg-green-100 text-green-800" 
                              : log.action.includes("Updated") || log.action.includes("Upload")
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-md truncate">{log.details}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(log.timestamp)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No audit logs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="student" className="p-4 text-center text-gray-500">
            Filter: Student changes only
          </TabsContent>
          
          <TabsContent value="import" className="p-4 text-center text-gray-500">
            Filter: Import actions only
          </TabsContent>
          
          <TabsContent value="document" className="p-4 text-center text-gray-500">
            Filter: Document actions only
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuditLogPage;
