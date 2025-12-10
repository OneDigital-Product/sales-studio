"use client";

import { Plus, Search } from "lucide-react";
import { RecentActivityWidget } from "@/components/activity/recent-activity-widget";
import { MergeClientsDialog } from "@/components/clients/merge-clients-dialog";
import { OutstandingRequestsWidget } from "@/components/info-requests/outstanding-requests-widget";
import { MainNav } from "@/components/navigation/main-nav";
import { QuoteDashboard } from "@/components/quotes/quote-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="mb-6 font-bold text-3xl text-primary md:text-4xl">
          Sales Studio
        </h1>

        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <MainNav />

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                disabled
                placeholder="Search clients..."
                type="search"
              />
            </div>
            <MergeClientsDialog />
            <Button disabled>
              <Plus className="mr-1 h-4 w-4" />
              Add Client
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <OutstandingRequestsWidget />
            <RecentActivityWidget />
          </div>
          <QuoteDashboard />
        </div>
      </div>
    </main>
  );
}
