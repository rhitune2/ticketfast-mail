"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ticket } from "@/db-schema";
import { useCompletion } from "@ai-sdk/react";
import { format } from "date-fns";

interface AISummaryProps {
  ticket: typeof ticket.$inferSelect;
}

export function AISummary({ ticket }: AISummaryProps) {
  const [expanded, setExpanded] = useState(true);
  const [summaryPoints, setSummaryPoints] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const { completion, complete } = useCompletion({
    api: "/api/ai/summarize",
    body: {
      ticketId: ticket.id,
    },
  });

  const handleRefresh = () => {};

  useEffect(() => {
    (async () => {
      await complete("");
    })();
  }, []);

  return (
    <Card className="border border-primary/10 bg-primary/5 overflow-hidden shadow-sm mt-2">
      <CardContent className="p-0">
        <div
          className="flex items-center justify-between px-3 py-2 bg-primary/10 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-primary" />
            <h3 className="text-sm font-medium text-primary">AI Summary</h3>
          </div>
          <div className="flex items-center gap-1">
            {!expanded && (
              <span className="text-xs text-muted-foreground">
                View AI insights
              </span>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {expanded ? (
                <ChevronUp size={12} className="text-primary" />
              ) : (
                <ChevronDown size={12} className="text-primary" />
              )}
              <span className="sr-only">
                {expanded ? "Collapse" : "Expand"}
              </span>
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 text-xs space-y-3">
                <div className="flex items-start gap-2">
                  <div className="bg-primary/20 text-primary p-0.5 rounded-full mt-0.5">
                    <Sparkles size={12} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium">
                      Ticket Summary:
                    </p>
                    <span className="space-y-1.5 text-[14px]">{completion}</span>
                    <div className="pt-1 text-[12px] text-muted-foreground">
                      <p>
                        This is an AI-generated summary and may not be perfectly
                        accurate.
                      </p>
                      <p>Last updated: {format(new Date(), "HH:mm")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
